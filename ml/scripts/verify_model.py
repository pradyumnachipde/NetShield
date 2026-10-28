
from pathlib import Path
import json

import joblib
import numpy as np
import tensorflow as tf


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data" / "processed"


def main():
    print("Verifying NetShield ML artifacts...")

    with open(
        MODEL_DIR / "metadata.json",
        encoding="utf-8",
    ) as file:
        metadata = json.load(file)

    model = tf.keras.models.load_model(
        MODEL_DIR / "netshield_mlp.keras",
        compile=False,
    )

    scaler = joblib.load(
        MODEL_DIR / "scaler.joblib"
    )

    encoder = joblib.load(
        MODEL_DIR / "label_encoder.joblib"
    )

    medians = joblib.load(
        MODEL_DIR / "feature_medians.joblib"
    )

    with np.load(DATA_DIR / "test.npz") as data:
        features = data["X"][:10]

    assert len(features) == 10
    assert features.shape[1] == len(
        metadata["feature_columns"]
    )

    assert scaler.n_features_in_ == features.shape[1]

    assert len(medians) == features.shape[1]

    assert list(encoder.classes_) == (
        metadata["class_names"]
    )

    probabilities = model.predict(
        features,
        verbose=0,
    )

    assert probabilities.shape == (
        10,
        len(encoder.classes_),
    )

    assert np.isfinite(probabilities).all()

    assert np.allclose(
        probabilities.sum(axis=1),
        1.0,
        atol=1e-4,
    )

    predictions = np.argmax(
        probabilities,
        axis=1,
    )

    labels = encoder.inverse_transform(
        predictions
    )

    print("\nSample predictions:")

    for index, label in enumerate(labels):
        confidence = probabilities[index].max()

        print(
            f"Flow {index + 1}: "
            f"{label} "
            f"({confidence:.2%})"
        )

    print("\nAll ML artifact checks passed!")


if __name__ == "__main__":
    main()
