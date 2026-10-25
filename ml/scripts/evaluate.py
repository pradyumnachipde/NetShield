
from pathlib import Path
import json

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from tensorflow import keras

from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    ConfusionMatrixDisplay,
)

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    with np.load(DATA_DIR / "test.npz") as data:
        X_test = data["X"]
        y_test = data["y"]

    with open(
        MODEL_DIR / "metadata.json",
        encoding="utf-8",
    ) as file:
        metadata = json.load(file)

    class_names = metadata["class_names"]
    labels = list(range(len(class_names)))

    model = keras.models.load_model(
        MODEL_DIR / "netshield_mlp.keras"
    )

    probabilities = model.predict(
        X_test,
        batch_size=512,
        verbose=1,
    )

    predictions = np.argmax(
        probabilities,
        axis=1,
    )

    accuracy = accuracy_score(y_test, predictions)
    balanced_accuracy = balanced_accuracy_score(
        y_test,
        predictions,
    )

    precision, recall, f1, _ = (
        precision_recall_fscore_support(
            y_test,
            predictions,
            average="weighted",
            zero_division=0,
        )
    )

    report = classification_report(
        y_test,
        predictions,
        labels=labels,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=labels,
    )

    results = {
        "accuracy": float(accuracy),
        "balanced_accuracy": float(balanced_accuracy),
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1_score": float(f1),
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
        "class_names": class_names,
        "test_samples": int(len(y_test)),
    }

    with open(
        REPORT_DIR / "evaluation_metrics.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(results, file, indent=4)

    figure, axis = plt.subplots(
        figsize=(max(10, len(class_names)), max(8, len(class_names)))
    )

    display = ConfusionMatrixDisplay(
        confusion_matrix=matrix,
        display_labels=class_names,
    )

    display.plot(
        ax=axis,
        cmap="Blues",
        xticks_rotation=90,
        values_format="d",
        colorbar=False,
    )

    axis.set_title("NetShield MLP — Confusion Matrix")
    figure.tight_layout()

    figure.savefig(
        REPORT_DIR / "confusion_matrix.png",
        dpi=160,
        bbox_inches="tight",
    )

    plt.close(figure)

    history_path = REPORT_DIR / "training_history.json"

    if history_path.exists():
        with open(history_path, encoding="utf-8") as file:
            history = json.load(file)

        figure, axes = plt.subplots(1, 2, figsize=(12, 5))

        axes[0].plot(
            history["accuracy"],
            label="Training",
        )
        axes[0].plot(
            history["val_accuracy"],
            label="Validation",
        )
        axes[0].set_title("Model Accuracy")
        axes[0].set_xlabel("Epoch")
        axes[0].set_ylabel("Accuracy")
        axes[0].legend()

        axes[1].plot(
            history["loss"],
            label="Training",
        )
        axes[1].plot(
            history["val_loss"],
            label="Validation",
        )
        axes[1].set_title("Model Loss")
        axes[1].set_xlabel("Epoch")
        axes[1].set_ylabel("Loss")
        axes[1].legend()

        figure.tight_layout()
        figure.savefig(
            REPORT_DIR / "training_curves.png",
            dpi=160,
        )
        plt.close(figure)

    print("\n========== NETSHIELD EVALUATION ==========")
    print(f"Accuracy:          {accuracy:.4f}")
    print(f"Balanced Accuracy: {balanced_accuracy:.4f}")
    print(f"Weighted Precision:{precision:.4f}")
    print(f"Weighted Recall:   {recall:.4f}")
    print(f"Weighted F1-Score: {f1:.4f}")
    print("==========================================")
    print(f"\nReports saved in: {REPORT_DIR}")


if __name__ == "__main__":
    main()
