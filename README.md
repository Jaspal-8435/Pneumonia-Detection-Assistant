# Pneumonia Detection & Diagnosis Assistant

Full-stack project for chest X-ray pneumonia screening. The app lets a user upload a chest X-ray, stores the image in Cloudinary, sends it to a Flask ML service, receives a prediction plus Grad-CAM heatmap, and saves the scan history in MongoDB.

## Folder Structure

```text
minor_project/
  ml-model/        TensorFlow/Keras training code, Grad-CAM, Flask ML API
  backend/         Node.js + Express API, MongoDB models, JWT auth, Cloudinary
  frontend/        React + Tailwind CSS + DaisyUI user interface
  NOTES.md         Viva-focused explanation of recall and Grad-CAM
```

## 1. ML Model Setup

Download the Kaggle dataset "Chest X-Ray Images (Pneumonia)" by Paul Mooney and keep its `chest_xray` folder outside git. This project uses `ml-model/datasets/chest_xray` as the default dataset path:

```text
ml-model/datasets/chest_xray/
  train/
    NORMAL/
    PNEUMONIA/
  test/
    NORMAL/
    PNEUMONIA/
```

Install Python dependencies:

```bash
cd ml-model
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
```

Train the model:

```bash
python train.py --epochs 15 --fine-tune-epochs 5
```

If your dataset is somewhere else, pass it manually:

```bash
python train.py --data-dir C:/datasets/chest_xray --epochs 15 --fine-tune-epochs 5
```

The script saves:

```text
ml-model/model.h5
ml-model/metrics.json
ml-model/threshold.json
```

Run the Flask ML API:

```bash
python app.py
```

Health check:

```bash
curl http://localhost:5001/health
```

Live ML health check:

```bash
curl https://pneumonia-detection-diagnosis-assistant-1.onrender.com/health
```

## 2. Backend Setup

Create `backend/.env` from `backend/.env.example`, then install and run:

```bash
cd backend
npm install
npm run dev
```

Important environment variables:

```text
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ML_API_URL=http://localhost:5001
```

For the deployed backend, use:

```text
CLIENT_URL=https://pneumonia-detection-diagnosis-assistant-tf5j.onrender.com
ML_API_URL=https://pneumonia-detection-diagnosis-assistant-1.onrender.com
```

The backend runs on `http://localhost:5000`.

## 3. Frontend Setup

Create `frontend/.env` from `frontend/.env.example`, then install and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite URL printed in the terminal, usually `http://localhost:5173`.

For the deployed frontend, use:

```text
VITE_API_BASE_URL=https://pneumonia-detection-diagnosis-assistant.onrender.com/api
```

## 4. Render Deployment

This repository includes `render.yaml`, so the easiest deployment path is:

1. Push the complete project to GitHub.
2. In Render, choose New > Blueprint and select this repository.
3. Render will create three services:

```text
pneumonia-detection-diagnosis-assistant-1      Python Flask/Gunicorn ML API
pneumonia-detection-diagnosis-assistant        Node.js/Express backend API
pneumonia-detection-diagnosis-assistant-tf5j   React/Vite static site
```

Important deployment values:

```text
Backend MONGO_URI=your MongoDB Atlas connection string
Backend CLOUDINARY_CLOUD_NAME=your Cloudinary cloud name
Backend CLOUDINARY_API_KEY=your Cloudinary API key
Backend CLOUDINARY_API_SECRET=your Cloudinary API secret
Backend ML_API_URL=https://pneumonia-detection-diagnosis-assistant-1.onrender.com
Backend CLIENT_URL=https://pneumonia-detection-diagnosis-assistant-tf5j.onrender.com
Frontend VITE_API_BASE_URL=https://pneumonia-detection-diagnosis-assistant.onrender.com/api
```

After deploying, check these URLs:

```text
Backend root:   https://pneumonia-detection-diagnosis-assistant.onrender.com/
Backend health: https://pneumonia-detection-diagnosis-assistant.onrender.com/api/health
ML health:      https://pneumonia-detection-diagnosis-assistant-1.onrender.com/health
Frontend app:   https://pneumonia-detection-diagnosis-assistant-tf5j.onrender.com
```

The frontend service includes a React Router rewrite rule, so refreshing routes
such as `/dashboard` and `/history` should still load the app.

The trained model file `ml-model/model.h5` is required in production. It is
intentionally allowed through `.gitignore`, so make sure it is committed before
deploying:

```bash
git add ml-model/model.h5
git commit -m "Add trained model for deployment"
git push
```

## How The Parts Work Together

1. React sends the uploaded X-ray to `POST /api/scans/upload`.
2. Express verifies the JWT and validates the image.
3. Express uploads the original X-ray to Cloudinary.
4. Express forwards the image buffer to Flask at `POST /predict`.
5. Flask loads `model.h5`, predicts `NORMAL` or `PNEUMONIA`, and generates a Grad-CAM overlay.
6. Express uploads the heatmap to Cloudinary and stores the final scan result in MongoDB.
7. React displays the original X-ray, Grad-CAM heatmap, confidence score, and scan history.

## Main API Endpoints

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me

POST /api/scans/upload
GET  /api/scans/history
GET  /api/scans/:id
PATCH /api/scans/:id/note
GET  /api/scans/:id/report

GET  /api/admin/stats
```

Doctors can see all scan history and stats. Patients can only see their own scans.

## Important Disclaimer

This is an educational screening assistant, not a certified medical diagnostic device. A real diagnosis must be confirmed by a qualified clinician.
