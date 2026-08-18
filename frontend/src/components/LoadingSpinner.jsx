export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-secondary">
      <span className="loading loading-spinner loading-sm" />
      {label}
    </span>
  );
}

