"""
Grad-CAM utilities for explaining CNN predictions.

Grad-CAM highlights the image regions that strongly influenced the model's
decision. This is useful in medical imaging projects because the output is not
just a class label; it also gives a visual explanation for the prediction.
"""

from __future__ import annotations

import base64
from io import BytesIO

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow import keras


IMAGE_SIZE = (224, 224)
_GRADCAM_MODEL_CACHE = {}


def load_image_bytes(image_bytes: bytes, target_size=IMAGE_SIZE):
    """
    Convert uploaded bytes into a model-ready batch and a display image.

    The CNN expects RGB input. Chest X-rays are often grayscale, so converting
    to RGB simply copies the gray channel into three channels.
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    resized = image.resize(target_size)
    display_image = np.asarray(resized).astype("uint8")
    model_batch = np.expand_dims(display_image.astype("float32"), axis=0)
    return model_batch, display_image


def _find_backbone(model: keras.Model) -> keras.Model:
    """Find the nested pretrained CNN backbone inside the saved model."""
    for layer in model.layers:
        if isinstance(layer, keras.Model) and "backbone" in layer.name.lower():
            return layer
    raise ValueError("Could not find pretrained backbone in model.")


def _find_last_conv_layer(backbone: keras.Model) -> str:
    """Pick the final convolutional layer because Grad-CAM needs feature maps."""
    for layer in reversed(backbone.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name

    for layer in reversed(backbone.layers):
        if hasattr(layer, "output") and len(layer.output.shape) == 4:
            return layer.name

    raise ValueError("Could not find a convolutional layer for Grad-CAM.")


def _apply_pre_backbone_layers(model: keras.Model, image_batch, backbone_name: str):
    """
    Run model layers that appear before the CNN backbone.

    This keeps Grad-CAM preprocessing identical to normal model prediction.
    """
    x = image_batch
    for layer in model.layers[1:]:
        if layer.name == backbone_name:
            break
        try:
            x = layer(x, training=False)
        except TypeError:
            x = layer(x)
    return x


def _build_classifier_head(model: keras.Model, backbone_name: str) -> keras.Model:
    """
    Build a small model from backbone output to final probability.

    This lets us compute gradients from the class score back to the selected
    convolutional feature maps inside the nested backbone.
    """
    backbone = model.get_layer(backbone_name)
    classifier_input = keras.Input(shape=backbone.output.shape[1:])
    x = classifier_input
    use_layer = False

    for layer in model.layers:
        if use_layer:
            try:
                x = layer(x, training=False)
            except TypeError:
                x = layer(x)
        if layer.name == backbone_name:
            use_layer = True

    return keras.Model(classifier_input, x, name="gradcam_classifier_head")


def _get_gradcam_models(model: keras.Model):
    """Build and cache the small helper models used by Grad-CAM."""
    cache_key = id(model)
    if cache_key in _GRADCAM_MODEL_CACHE:
        return _GRADCAM_MODEL_CACHE[cache_key]

    backbone = _find_backbone(model)
    last_conv_name = _find_last_conv_layer(backbone)
    last_conv_layer = backbone.get_layer(last_conv_name)
    conv_model = keras.Model(
        backbone.input,
        [last_conv_layer.output, backbone.output],
        name="gradcam_backbone_reader",
    )
    classifier_head = _build_classifier_head(model, backbone.name)
    cached_models = (backbone.name, conv_model, classifier_head)
    _GRADCAM_MODEL_CACHE[cache_key] = cached_models
    return cached_models


def make_gradcam_heatmap(
    model: keras.Model,
    image_batch,
    class_index: int | None = None,
) -> np.ndarray:
    """
    Generate a Grad-CAM heatmap for the predicted class.

    For this binary model, class 1 is PNEUMONIA and class 0 is NORMAL.
    """
    backbone_name, conv_model, classifier_head = _get_gradcam_models(model)

    preprocessed_batch = _apply_pre_backbone_layers(
        model,
        image_batch,
        backbone_name,
    )

    with tf.GradientTape() as tape:
        conv_outputs, backbone_outputs = conv_model(preprocessed_batch)
        tape.watch(conv_outputs)
        predictions = classifier_head(backbone_outputs)
        pneumonia_score = predictions[:, 0]

        if class_index is None:
            class_index = 1 if float(pneumonia_score[0]) >= 0.5 else 0

        # A binary sigmoid has one output. NORMAL confidence is represented by
        # 1 - pneumonia probability.
        class_score = pneumonia_score if class_index == 1 else 1.0 - pneumonia_score

    gradients = tape.gradient(class_score, conv_outputs)
    pooled_gradients = tf.reduce_mean(gradients, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]

    heatmap = tf.reduce_sum(conv_outputs * pooled_gradients, axis=-1)
    heatmap = tf.maximum(heatmap, 0)

    max_value = tf.reduce_max(heatmap)
    if float(max_value) == 0.0:
        return np.zeros(heatmap.shape, dtype=np.float32)

    heatmap = heatmap / max_value
    return heatmap.numpy()


def overlay_heatmap(display_image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.42):
    """Overlay a colored Grad-CAM map on top of the resized X-ray image."""
    heatmap_resized = cv2.resize(heatmap, (display_image.shape[1], display_image.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    color_map = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    color_map = cv2.cvtColor(color_map, cv2.COLOR_BGR2RGB)

    overlay = color_map * alpha + display_image * (1 - alpha)
    return np.clip(overlay, 0, 255).astype("uint8")


def image_to_base64_png(image_array: np.ndarray, include_prefix: bool = True) -> str:
    """Encode a NumPy RGB image as a base64 PNG string for JSON transport."""
    image = Image.fromarray(image_array)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

    if include_prefix:
        return f"data:image/png;base64,{encoded}"
    return encoded
