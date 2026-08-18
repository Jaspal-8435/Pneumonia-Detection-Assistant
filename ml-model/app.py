"""
Flask ML API.

The Node/Express backend calls this service internally. The frontend never calls
Flask directly, which keeps authentication and scan storage centralized in the
Node backend.
"""

from __future__ import annotations

import os
import json
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import UnidentifiedImageError
from tensorflow import keras

from gradcam import image_to_base64_png, load_image_bytes, make_gradcam_heatmap, overlay_heatmap


load_dotenv()

MODEL_PATH = Path(os.getenv("MODEL_PATH", "model.h5"))
THRESHOLD_PATH = Path(os.getenv("THRESHOLD_PATH", "threshold.json"))
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

app = Flask(__name__)
CORS(app)


def allowed_file(filename: str) -> bool:
    """Validate basic image extensions before trying to open the file."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def load_model():
    """Load model once during service startup."""
    if not MODEL_PATH.exists():
        print(f"Model file not found at {MODEL_PATH.resolve()}. Train the model first.")
        return None

    print(f"Loading model from {MODEL_PATH.resolve()}")
    return keras.models.load_model(MODEL_PATH)


def load_prediction_threshold() -> float:
    """
    Load the validation-selected threshold saved by train.py.

    If the file is missing, the API falls back to 0.5 so older trained models
    still work.
    """
    env_threshold = os.getenv("PREDICTION_THRESHOLD")
    if env_threshold:
        return float(env_threshold)

    if THRESHOLD_PATH.exists():
        with THRESHOLD_PATH.open("r", encoding="utf-8") as f:
            return float(json.load(f).get("threshold", 0.5))

    return 0.5


model = load_model()
prediction_threshold = load_prediction_threshold()


def warm_up_model():
    """
    Run one small prediction when the service starts.

    TensorFlow can spend noticeable time compiling/loading kernels on the first
    prediction. On Render free instances, doing this during startup keeps the
    first user upload from timing out.
    """
    if model is None or os.getenv("WARM_UP_MODEL", "1") != "1":
        return

    try:
        dummy_batch = np.zeros((1, 224, 224, 3), dtype=np.float32)
        model.predict(dummy_batch, verbose=0)
        if os.getenv("WARM_UP_GRADCAM", "1") == "1":
            make_gradcam_heatmap(model, dummy_batch, class_index=1)
        print("Model warm-up completed")
    except Exception as exc:
        print(f"Model warm-up failed: {exc}")


warm_up_model()


@app.get("/health")
def health():
    """Small endpoint for checking whether Flask and the model are ready."""
    return jsonify(
        {
            "status": "ok",
            "model_loaded": model is not None,
            "model_path": str(MODEL_PATH),
            "prediction_threshold": prediction_threshold,
        }
    )


@app.post("/predict")
def predict():
    """
    Predict pneumonia from an uploaded image.

    Request:
      multipart/form-data with field name "image"

    Response:
      {
        "prediction": "PNEUMONIA" | "NORMAL",
        "confidence": 0.97,
        "heatmap_image": "data:image/png;base64,..."
      }
    """
    if model is None:
        return jsonify({"message": "ML model is not loaded. Train model.h5 first."}), 503

    if "image" not in request.files:
        return jsonify({"message": "Image file is required in field 'image'."}), 400

    image_file = request.files["image"]

    if image_file.filename == "" or not allowed_file(image_file.filename):
        return jsonify({"message": "Invalid image format. Use JPG, JPEG, PNG, or WEBP."}), 400

    try:
        image_bytes = image_file.read()
        image_batch, display_image = load_image_bytes(image_bytes)

        probability = float(model.predict(image_batch, verbose=0)[0][0])
        prediction = "PNEUMONIA" if probability >= prediction_threshold else "NORMAL"
        confidence = probability if prediction == "PNEUMONIA" else 1.0 - probability

        class_index = 1 if prediction == "PNEUMONIA" else 0
        heatmap = make_gradcam_heatmap(model, image_batch, class_index=class_index)
        heatmap_overlay = overlay_heatmap(display_image, heatmap)
        heatmap_image = image_to_base64_png(heatmap_overlay, include_prefix=True)

        return jsonify(
            {
                "prediction": prediction,
                "confidence": round(float(confidence), 4),
                "raw_pneumonia_probability": round(probability, 4),
                "threshold": prediction_threshold,
                "heatmap_image": heatmap_image,
            }
        )
    except UnidentifiedImageError:
        return jsonify({"message": "The uploaded file is not a readable image."}), 400
    except Exception as exc:
        # The API returns a controlled error instead of exposing stack traces to
        # the Node backend or frontend.
        return jsonify({"message": "Prediction failed.", "error": str(exc)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
