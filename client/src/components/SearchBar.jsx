/** Controlled search input. The query is sent to the backend, never used to filter locally. */
export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  label = "Search",
}) {
  return (
    <div className="search-bar">
      <div className="search-bar__input">
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
        {value && (
          <button type="button" className="search-bar__clear" onClick={onClear} aria-label="Clear search">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
