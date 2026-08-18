"""
Training script for the Pneumonia Detection & Diagnosis Assistant.

This file trains a binary chest X-ray classifier with transfer learning.
It is intentionally written in clear stages so each part can be explained
during a viva:

1. Load images from the Kaggle chest_xray folder.
2. Apply data augmentation to reduce overfitting on the small dataset.
3. Train a lightweight pretrained CNN backbone.
4. Fine-tune the final convolutional layers.
5. Evaluate accuracy, precision, recall, F1-score, and confusion matrix.
6. Save the final Keras model as model.h5.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.utils.class_weight import compute_class_weight
from tensorflow import keras
from tensorflow.keras import layers


IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 42
DEFAULT_DATA_DIR = Path(__file__).resolve().parent / "datasets" / "chest_xray"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train pneumonia X-ray classifier")
    parser.add_argument(
        "--data-dir",
        default=str(DEFAULT_DATA_DIR),
        help=(
            "Path to Kaggle chest_xray folder containing train/ and optional test/. "
            f"Default: {DEFAULT_DATA_DIR}"
        ),
    )
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--fine-tune-epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument(
        "--weights",
        default="imagenet",
        help=(
            "MobileNetV2 weights: use 'imagenet', 'none', or a local .h5 weights file. "
            "Use 'none' if internet download keeps failing."
        ),
    )
    parser.add_argument("--model-path", default="model.h5")
    parser.add_argument("--metrics-path", default="metrics.json")
    parser.add_argument("--threshold-path", default="threshold.json")
    parser.add_argument(
        "--target-recall",
        type=float,
        default=0.9,
        help=(
            "Choose a prediction threshold with at least this pneumonia recall "
            "when possible, then maximize F1-score."
        ),
    )
    return parser.parse_args()


def load_datasets(data_dir: Path, batch_size: int):
    """
    Load images using Keras' directory loader.

    The Kaggle dataset already has train/test folders. We create our validation
    split from the train folder, as requested in the project prompt.
    """
    train_dir = data_dir / "train"
    test_dir = data_dir / "test"

    if not train_dir.exists():
        raise FileNotFoundError(f"Could not find train folder: {train_dir}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        validation_split=0.2,
        subset="training",
        seed=SEED,
        image_size=IMAGE_SIZE,
        batch_size=batch_size,
        label_mode="binary",
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        validation_split=0.2,
        subset="validation",
        seed=SEED,
        image_size=IMAGE_SIZE,
        batch_size=batch_size,
        label_mode="binary",
    )

    # The dataset loader sorts class folders alphabetically:
    # class 0 = NORMAL, class 1 = PNEUMONIA.
    print(f"Class names: {train_ds.class_names}")

    test_ds = None
    if test_dir.exists():
        test_ds = tf.keras.utils.image_dataset_from_directory(
            test_dir,
            image_size=IMAGE_SIZE,
            batch_size=batch_size,
            label_mode="binary",
            shuffle=False,
        )

    return train_ds, val_ds, test_ds


def compute_balanced_class_weights(dataset) -> dict[int, float]:
    """
    Compute class weights so the model does not ignore the smaller class.

    Medical datasets are often imbalanced. Class weights make mistakes on the
    minority class more costly during training.
    """
    labels: list[int] = []
    for _, batch_labels in dataset:
        labels.extend(batch_labels.numpy().reshape(-1).astype(int).tolist())

    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.array([0, 1]),
        y=np.array(labels),
    )
    return {0: float(weights[0]), 1: float(weights[1])}


def prepare_for_training(train_ds, val_ds):
    """Use caching and prefetching so GPU/CPU training is smoother."""
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000, seed=SEED).prefetch(autotune)
    val_ds = val_ds.cache().prefetch(autotune)
    return train_ds, val_ds


def resolve_weights(weights_arg: str):
    """Convert CLI weights value into the format expected by MobileNetV2."""
    if weights_arg.lower() in {"none", "random"}:
        return None
    return weights_arg


def build_model(weights="imagenet") -> keras.Model:
    """
    Build a transfer-learning model.

    MobileNetV2 is used because it is much lighter than VGG16 while still being
    a strong pretrained CNN. The model accepts 224x224 RGB images. X-rays are
    converted to RGB by the data loader/API even if the original file is gray.
    """
    inputs = keras.Input(shape=(*IMAGE_SIZE, 3), name="xray_image")

    # Data augmentation runs only during training. It helps the model generalize
    # when the dataset is small or images vary slightly in position.
    x = keras.Sequential(
        [
            layers.RandomRotation(0.08),
            layers.RandomZoom(0.12),
            layers.RandomFlip("horizontal"),
        ],
        name="data_augmentation",
    )(inputs)

    # MobileNetV2 expects pixels in [-1, 1]. Rescaling is saved inside the model
    # so the Flask API can pass normal 0-255 image arrays safely.
    x = layers.Rescaling(1.0 / 127.5, offset=-1, name="mobilenet_rescale")(x)

    try:
        backbone = keras.applications.MobileNetV2(
            input_shape=(*IMAGE_SIZE, 3),
            include_top=False,
            weights=weights,
            name="mobilenetv2_backbone",
        )
        using_pretrained_weights = weights is not None
    except Exception as exc:
        print("\nCould not load/download pretrained MobileNetV2 weights.")
        print(f"Reason: {exc}")
        print("Continuing with random weights so training can run offline.")
        print("For final project quality, download the weights or rerun with internet.\n")
        backbone = keras.applications.MobileNetV2(
            input_shape=(*IMAGE_SIZE, 3),
            include_top=False,
            weights=None,
            name="mobilenetv2_backbone",
        )
        using_pretrained_weights = False

    # If pretrained ImageNet weights are available, freeze the backbone for
    # transfer learning. If not, keep it trainable because frozen random filters
    # cannot learn useful X-ray features.
    backbone.trainable = not using_pretrained_weights

    x = backbone(x, training=not using_pretrained_weights)
    x = layers.GlobalAveragePooling2D(name="global_average_pooling")(x)
    x = layers.Dropout(0.3, name="dropout_regularization")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="pneumonia_probability")(x)

    model = keras.Model(inputs, outputs, name="pneumonia_classifier")
    compile_model(model, learning_rate=1e-3)
    return model


def compile_model(model: keras.Model, learning_rate: float) -> None:
    """Compile with recall included as a first-class metric."""
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss="binary_crossentropy",
        metrics=[
            keras.metrics.BinaryAccuracy(name="accuracy"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
        ],
    )


def fine_tune_backbone(model: keras.Model, fine_tune_layers: int = 30) -> None:
    """
    Unfreeze the last layers of the pretrained backbone for gentle fine-tuning.

    Batch normalization layers are kept frozen because updating their internal
    statistics on a small medical dataset can make training unstable.
    """
    backbone = model.get_layer("mobilenetv2_backbone")
    backbone.trainable = True

    for layer in backbone.layers[:-fine_tune_layers]:
        layer.trainable = False

    for layer in backbone.layers[-fine_tune_layers:]:
        if isinstance(layer, layers.BatchNormalization):
            layer.trainable = False

    compile_model(model, learning_rate=1e-5)


def collect_predictions(model: keras.Model, dataset):
    """Collect true labels and pneumonia probabilities from a dataset."""
    y_true: list[int] = []
    y_prob: list[float] = []

    for images, labels in dataset:
        probabilities = model.predict(images, verbose=0).reshape(-1)
        y_prob.extend(probabilities.tolist())
        y_true.extend(labels.numpy().reshape(-1).astype(int).tolist())

    return np.array(y_true), np.array(y_prob)


def choose_threshold(model: keras.Model, val_ds, target_recall: float) -> dict:
    """
    Pick a threshold from validation predictions.

    A fixed 0.5 threshold can be poor when the model is not well calibrated.
    We first try to keep pneumonia recall high, then choose the best F1-score
    among those high-recall thresholds.
    """
    y_true, y_prob = collect_predictions(model, val_ds)
    thresholds = np.round(np.arange(0.05, 0.96, 0.01), 2)
    scored_thresholds = []

    for threshold in thresholds:
        y_pred = (y_prob >= threshold).astype(int)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        scored_thresholds.append(
            {
                "threshold": float(threshold),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
            }
        )

    candidates = [
        item for item in scored_thresholds if item["recall"] >= target_recall
    ]
    if not candidates:
        candidates = scored_thresholds

    best = max(candidates, key=lambda item: (item["f1_score"], item["recall"]))
    best["target_recall"] = target_recall
    best["note"] = (
        "Threshold selected on validation set. PNEUMONIA is predicted when "
        "raw_pneumonia_probability >= threshold."
    )
    return best


def evaluate_model(
    model: keras.Model,
    dataset,
    split_name: str,
    threshold: float,
) -> dict:
    """Evaluate model predictions and return viva-friendly metrics."""
    y_true_arr, y_prob_arr = collect_predictions(model, dataset)
    y_pred = (y_prob_arr >= threshold).astype(int)

    metrics = {
        "split": split_name,
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true_arr, y_pred)),
        "precision": float(precision_score(y_true_arr, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true_arr, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_true_arr, y_pred, zero_division=0)),
        "confusion_matrix": confusion_matrix(y_true_arr, y_pred).tolist(),
        "class_order": ["NORMAL", "PNEUMONIA"],
    }

    print("\nEvaluation metrics")
    print(json.dumps(metrics, indent=2))
    print(
        "\nRecall is emphasized because a false negative means a pneumonia case "
        "was missed, which is more dangerous than a false alarm."
    )
    return metrics


def main() -> None:
    args = parse_args()
    data_dir = Path(args.data_dir).expanduser()
    model_path = Path(args.model_path)
    metrics_path = Path(args.metrics_path)
    threshold_path = Path(args.threshold_path)

    train_ds_raw, val_ds_raw, test_ds = load_datasets(data_dir, args.batch_size)
    class_weights = compute_balanced_class_weights(train_ds_raw)
    print(f"Class weights: {class_weights}")

    train_ds, val_ds = prepare_for_training(train_ds_raw, val_ds_raw)

    model = build_model(weights=resolve_weights(args.weights))
    model.summary()

    callbacks = [
        keras.callbacks.EarlyStopping(
            # val_recall alone can reward a bad model that predicts every image
            # as PNEUMONIA. val_loss keeps training balanced while we still
            # report recall after training.
            monitor="val_loss",
            mode="min",
            patience=4,
            restore_best_weights=True,
        ),
        keras.callbacks.ModelCheckpoint(
            model_path,
            monitor="val_loss",
            mode="min",
            save_best_only=True,
        ),
    ]

    print("\nStage 1: training classifier head")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        class_weight=class_weights,
        callbacks=callbacks,
    )

    if args.fine_tune_epochs > 0:
        print("\nStage 2: fine-tuning final backbone layers")
        fine_tune_backbone(model)
        model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=args.fine_tune_epochs,
            class_weight=class_weights,
            callbacks=callbacks,
        )

    # Reload the best checkpoint before final evaluation.
    model = keras.models.load_model(model_path)
    threshold_info = choose_threshold(model, val_ds, args.target_recall)
    threshold = threshold_info["threshold"]

    with threshold_path.open("w", encoding="utf-8") as f:
        json.dump(threshold_info, f, indent=2)

    evaluation_ds = test_ds.cache().prefetch(tf.data.AUTOTUNE) if test_ds else val_ds
    split_name = "test" if test_ds else "validation"
    metrics = evaluate_model(model, evaluation_ds, split_name, threshold)

    with metrics_path.open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved model to: {model_path.resolve()}")
    print(f"Saved metrics to: {metrics_path.resolve()}")
    print(f"Saved prediction threshold to: {threshold_path.resolve()}")


if __name__ == "__main__":
    main()
