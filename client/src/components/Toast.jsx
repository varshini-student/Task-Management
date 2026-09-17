export default function Toast({ id, message, variant = "info", onDismiss }) {
  return (
    <div className={`toast toast--${variant}`}>
      <span style={{ flex: 1 }}>{message}</span>
      <button type="button" className="toast__close" onClick={() => onDismiss(id)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
