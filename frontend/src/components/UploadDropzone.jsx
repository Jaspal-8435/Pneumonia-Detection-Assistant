import { Image, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export default function UploadDropzone({ disabled, onUpload }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (candidate) => {
    if (!candidate) {
      return;
    }

    if (!allowedTypes.includes(candidate.type)) {
      setError("Use a JPG, PNG, or WEBP X-ray image.");
      setFile(null);
      return;
    }

    setError("");
    setFile(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Select an X-ray image first.");
      return;
    }
    Promise.resolve(onUpload(file)).catch(() => undefined);
  };

  return (
    <section className="app-surface rounded-lg p-4 sm:p-5">
      <div
        className={[
          "flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition",
          dragging ? "border-primary bg-base-200" : "border-base-300 bg-white",
        ].join(" ")}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="grid w-full gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <div className="xray-frame">
              <img src={previewUrl} alt="Selected chest X-ray preview" />
            </div>
            <div className="text-left">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-base-200 text-primary">
                <Image size={20} />
              </div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn btn-primary btn-sm gap-2 rounded-md"
                  disabled={disabled}
                  onClick={handleSubmit}
                >
                  <UploadCloud size={16} />
                  Run Prediction
                </button>
                <button
                  className="btn btn-ghost btn-sm gap-2 rounded-md"
                  disabled={disabled}
                  onClick={() => setFile(null)}
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-base-200 text-primary">
              <UploadCloud size={24} />
            </div>
            <p className="text-base font-medium">Drop chest X-ray here</p>
            <p className="mt-1 text-sm text-secondary">JPG, PNG, or WEBP up to 8 MB</p>
            <button
              className="btn btn-primary btn-sm mt-5 gap-2 rounded-md"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Image size={16} />
              Choose Image
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => chooseFile(event.target.files?.[0])}
      />

      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </section>
  );
}
