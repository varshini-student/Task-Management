export default function LoadingSpinner({ label = "Loading...", inline = false }) {
  if (inline) return <span className="spinner spinner--sm" aria-label={label} />;
  return (
    <div className="state-block" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
