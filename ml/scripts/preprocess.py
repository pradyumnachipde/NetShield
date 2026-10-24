
from pathlib import Path
import argparse
import json
import re

import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder


BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"

RANDOM_STATE = 42

# Exclude identifiers and potentially leakage-prone metadata.
EXCLUDED_COLUMNS = {
    "flow id",
    "source ip",
    "destination ip",
    "src ip",
    "dst ip",
    "source port",
    "src port",
    "destination port",
    "dst port",
    "timestamp",
    "simillarhttp",
    "inbound",
    "unnamed: 0",
}


def normalize_column(column):
    return re.sub(r"\s+", " ", str(column).strip()).lower()


def load_dataset(max_rows_per_file):
    csv_files = sorted(DATA_DIR.glob("*.csv"))

    if not csv_files:
        raise FileNotFoundError(
            "No CSV files found in ml/data/. "
            "Download and extract CIC-IDS2017 CSV files first."
        )

    frames = []

    for file_path in csv_files:
        print(f"Reading: {file_path.name}")

        # Read in chunks to avoid loading huge source files at once.
        chunks = []
        remaining = max_rows_per_file

        for chunk in pd.read_csv(
            file_path,
            chunksize=50000,
            low_memory=False,
            on_bad_lines="skip",
            encoding="utf-8-sig",
        ):
            chunk.columns = [
                normalize_column(column)
                for column in chunk.columns
            ]

            if "label" not in chunk.columns:
                raise ValueError(
                    f"Missing Label column: {file_path.name}"
                )

            chunk = chunk.dropna(subset=["label"])

            # Deterministic sampling within each source chunk.
            if len(chunk) > remaining:
                chunk = chunk.sample(
                    n=remaining,
                    random_state=RANDOM_STATE,
                )

            chunks.append(chunk)
            remaining -= len(chunk)

            if remaining <= 0:
                break

        if chunks:
            frames.append(pd.concat(chunks, ignore_index=True))

    if not frames:
        raise ValueError("No valid dataset rows were found.")

    dataset = pd.concat(frames, ignore_index=True)
    dataset.columns = [
        normalize_column(column)
        for column in dataset.columns
    ]

    return dataset


def clean_dataset(dataset):
    dataset = dataset.copy()

    dataset["label"] = (
        dataset["label"]
        .astype(str)
        .str.strip()
    )

    dataset = dataset[
        dataset["label"].str.lower().ne("nan")
    ]

    dataset = dataset.drop_duplicates()

    feature_columns = [
        column
        for column in dataset.columns
        if column != "label"
        and column not in EXCLUDED_COLUMNS
    ]

    # Keep the numeric CICFlowMeter feature columns.
    features = dataset[feature_columns].apply(
        pd.to_numeric,
        errors="coerce",
    )

    features = features.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    # Remove columns with no usable numeric values.
    features = features.dropna(axis=1, how="all")

    # Remove constant columns.
    features = features.loc[
        :,
        features.nunique(dropna=True) > 1,
    ]

    labels = dataset["label"].reset_index(drop=True)
    features = features.reset_index(drop=True)

    return features, labels


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--max-rows-per-file",
        type=int,
        default=100000,
    )

    args = parser.parse_args()

    if args.max_rows_per_file < 1:
        parser.error("--max-rows-per-file must be positive")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading CIC-IDS2017 dataset...")

    dataset = load_dataset(args.max_rows_per_file)

    print(f"Loaded rows: {len(dataset):,}")

    features, labels = clean_dataset(dataset)

    print(f"Cleaned rows: {len(features):,}")
    print(f"Feature count: {features.shape[1]}")

    if features.empty or features.shape[1] == 0:
        raise ValueError("No usable features found.")

    if labels.nunique() < 2:
        raise ValueError(
            "At least two traffic classes are required."
        )

    label_counts = labels.value_counts()

    if label_counts.min() < 2:
        raise ValueError(
            "Every class needs at least two samples. "
            "Increase --max-rows-per-file."
        )

    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(labels)

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        encoded_labels,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=encoded_labels,
    )

    # Fit imputation and scaling on training data only.
    train_medians = X_train.median().fillna(0.0)

    X_train = X_train.fillna(train_medians)
    X_test = X_test.fillna(train_medians)

    scaler = StandardScaler()

    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Save compressed NumPy datasets.
    np.savez_compressed(
        PROCESSED_DIR / "train.npz",
        X=X_train.astype(np.float32),
        y=y_train.astype(np.int32),
    )

    np.savez_compressed(
        PROCESSED_DIR / "test.npz",
        X=X_test.astype(np.float32),
        y=y_test.astype(np.int32),
    )

    joblib.dump(
        scaler,
        MODEL_DIR / "scaler.joblib",
    )

    joblib.dump(
        label_encoder,
        MODEL_DIR / "label_encoder.joblib",
    )

    joblib.dump(
        train_medians,
        MODEL_DIR / "feature_medians.joblib",
    )

    metadata = {
        "dataset": "CIC-IDS2017",
        "task": "multiclass_intrusion_detection",
        "feature_columns": features.columns.tolist(),
        "class_names": label_encoder.classes_.tolist(),
        "class_mapping": {
            str(index): str(name)
            for index, name in enumerate(
                label_encoder.classes_
            )
        },
        "training_samples": int(len(y_train)),
        "testing_samples": int(len(y_test)),
        "feature_count": int(features.shape[1]),
        "random_state": RANDOM_STATE,
    }

    with open(
        MODEL_DIR / "metadata.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(metadata, file, indent=4)

    report = {
        "total_samples": int(len(labels)),
        "training_samples": int(len(y_train)),
        "testing_samples": int(len(y_test)),
        "class_distribution": {
            str(name): int(count)
            for name, count in labels.value_counts().items()
        },
    }

    with open(
        REPORT_DIR / "dataset_summary.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(report, file, indent=4)

    print("\nPreprocessing completed successfully!")
    print(f"Training samples: {len(y_train):,}")
    print(f"Testing samples: {len(y_test):,}")
    print(f"Number of classes: {len(label_encoder.classes_)}")
    print(f"Number of features: {features.shape[1]}")
    print("\nClasses:")

    for index, name in enumerate(label_encoder.classes_):
        print(f"  {index}: {name}")


if __name__ == "__main__":
    main()
