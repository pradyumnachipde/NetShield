
from pathlib import Path
import argparse
import json
import random

import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"

SEED = 42


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=256)
    args = parser.parse_args()

    if args.epochs < 1 or args.batch_size < 1:
        parser.error("Epochs and batch size must be positive.")

    random.seed(SEED)
    np.random.seed(SEED)
    tf.random.set_seed(SEED)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    with np.load(DATA_DIR / "train.npz") as data:
        X = data["X"]
        y = data["y"]

    with open(MODEL_DIR / "metadata.json", encoding="utf-8") as file:
        metadata = json.load(file)

    num_classes = len(metadata["class_names"])
    num_features = X.shape[1]

    if num_classes < 2:
        raise ValueError("At least two classes are required.")

    # Keep the original test set untouched.
    # Create validation data from the training set.
    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=SEED,
        stratify=y,
    )

    classes = np.unique(y_train)

    weights = compute_class_weight(
        class_weight="balanced",
        classes=classes,
        y=y_train,
    )

    class_weights = {
        int(label): float(weight)
        for label, weight in zip(classes, weights)
    }

    model = keras.Sequential([
        keras.layers.Input(shape=(num_features,)),

        keras.layers.Dense(128, activation="relu"),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),

        keras.layers.Dense(64, activation="relu"),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),

        keras.layers.Dense(32, activation="relu"),

        keras.layers.Dense(
            num_classes,
            activation="softmax",
        ),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(
            learning_rate=0.001
        ),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=0.00001,
        ),
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1,
    )

    model_path = MODEL_DIR / "netshield_mlp.keras"
    model.save(model_path)

    history_data = {
        key: [float(value) for value in values]
        for key, values in history.history.items()
    }

    with open(
        REPORT_DIR / "training_history.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(history_data, file, indent=4)

    print("\nTraining completed successfully!")
    print(f"Model saved: {model_path}")
    print(f"Training samples: {len(y_train):,}")
    print(f"Validation samples: {len(y_val):,}")
    print(f"Epochs completed: {len(history.history['loss'])}")


if __name__ == "__main__":
    main()
