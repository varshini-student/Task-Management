/** Inline error banner. Only ever shows server-provided, user-safe messages. */
export default function ErrorMessage({ message, fieldErrors, onRetry }) {
  if (!message && !fieldErrors) return null;
  const fields = fieldErrors ? Object.entries(fieldErrors) : [];

  return (
    <div className="alert alert--error" role="alert">
      <div style={{ flex: 1 }}>
        <div>{message || "Please correct the highlighted fields."}</div>
        {fields.length > 0 && (
          <ul>
            {fields.map(([field, text]) => (
              <li key={field}>{text}</li>
            ))}
          </ul>
        )}
      </div>
      {onRetry && (
        <button type="button" className="button button--secondary button--sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
