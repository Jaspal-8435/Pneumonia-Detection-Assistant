# Viva Notes

## Why Recall Matters More Than Accuracy

Accuracy counts how many total predictions are correct, but it can hide dangerous mistakes. In pneumonia screening, a false negative means the system says "NORMAL" even though the patient may have pneumonia. That can delay treatment and create medical risk.

Recall measures how many real pneumonia cases were correctly detected:

```text
Recall = True Positives / (True Positives + False Negatives)
```

For this use case, high recall is important because missing pneumonia is usually more harmful than sending a patient for an extra checkup. Precision is still useful because too many false alarms waste time, but recall gets special attention because it directly reduces missed disease cases.

## Why Grad-CAM Is Used

CNNs can make strong image predictions, but their internal reasoning is not easy to see. Grad-CAM creates a heatmap over the input X-ray by using gradients from the model's final convolutional feature maps. The warmer regions show where the model focused most when making its prediction.

Grad-CAM helps in a viva because it explains that the project is not only giving a label. It also gives a visual clue about the lung region that influenced the decision, which makes the AI result easier for doctors, teachers, and patients to inspect.

## Project Boundary

The app is a college minor project and educational assistant. It should not be presented as a replacement for radiologists or laboratory confirmation.

