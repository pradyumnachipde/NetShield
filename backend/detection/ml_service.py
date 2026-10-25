
from functools import lru_cache
from pathlib import Path
import json
import re

import joblib
import numpy as np
import pandas as pd
from django.conf import settings
from tensorflow import keras


MODEL_DIR = Path(settings.BASE_DIR).parent / "ml" / "models"

MAX_ROWS = 10000
BATCH_SIZE = 512


def normalize_column(column):
    return re.sub(
        r"\s+",
        " ",
        str(column).strip(),
    ).lower()


@lru_cache(maxsize=1)
def load_ml_artifacts():
    with open(
        MODEL_DIR / "metadata.json",
        encoding="utf-8",
    ) as file:
        metadata = json.load(file)

    model = keras.models.load_model(
        MODEL_DIR / "netshield_mlp.keras",
        compile=False,
    )

    scaler = joblib.load(
        MODEL_DIR / "scaler.joblib"
    )

    medians = joblib.load(
        MODEL_DIR / "feature_medians.joblib"
    )

    encoder = joblib.load(
        MODEL_DIR / "label_encoder.joblib"
    )

    if list(encoder.classes_) != metadata["class_names"]:
        raise ValueError(
            "Model labels do not match metadata."
        )

    if scaler.n_features_in_ != len(
        metadata["feature_columns"]
    ):
        raise ValueError(
            "Scaler and feature metadata do not match."
        )

    return model, scaler, medians, encoder, metadata


def predict_csv(uploaded_file):
    try:
        dataframe = pd.read_csv(
            uploaded_file,
            encoding="utf-8-sig",
            low_memory=False,
            nrows=MAX_ROWS + 1,
            on_bad_lines="error",
        )
    except (
        pd.errors.ParserError,
        pd.errors.EmptyDataError,
        UnicodeError,
        ValueError,
    ) as error:
        raise ValueError(
            f"Invalid CSV file: {error}"
        ) from error

    if dataframe.empty:
        raise ValueError(
            "CSV file contains no flow records."
        )

    if len(dataframe) > MAX_ROWS:
        raise ValueError(
            f"Maximum {MAX_ROWS} flow records per upload."
        )

    dataframe.columns = [
        normalize_column(column)
        for column in dataframe.columns
    ]

    if dataframe.columns.duplicated().any():
        raise ValueError(
            "CSV contains duplicate feature columns."
        )

    model, scaler, medians, encoder, metadata = (
        load_ml_artifacts()
    )

    required_columns = metadata["feature_columns"]

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing required features: "
            + ", ".join(missing_columns[:15])
        )

    features = dataframe[required_columns].apply(
        pd.to_numeric,
        errors="coerce",
    )

    features = features.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    features = features.fillna(medians)

    if features.isna().any().any():
        raise ValueError(
            "Some features could not be cleaned."
        )

    scaled_features = scaler.transform(features)

    scaled_features = scaled_features.astype(
        np.float32
    )

    probabilities = model.predict(
        scaled_features,
        batch_size=BATCH_SIZE,
        verbose=0,
    )

    predicted_indices = np.argmax(
        probabilities,
        axis=1,
    )

    confidence_scores = np.max(
        probabilities,
        axis=1,
    )

    predicted_labels = encoder.inverse_transform(
        predicted_indices
    )

    results = []

    for index, (label, confidence) in enumerate(
        zip(predicted_labels, confidence_scores)
    ):
        label = str(label)

        is_suspicious = (
            label.strip().upper() != "BENIGN"
        )

        results.append({
            "flow_index": index + 1,
            "predicted_label": label,
            "confidence": round(
                float(confidence),
                6,
            ),
            "is_suspicious": is_suspicious,
        })

    return results
