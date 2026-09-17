/** Renders up to five page buttons around the current page. */
function pageWindow(currentPage, totalPages, size = 5) {
  if (totalPages <= size) return Array.from({ length: totalPages }, (_, i) => i + 1);
  let start = Math.max(1, currentPage - Math.floor(size / 2));
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({ currentPage, totalPages, totalItems, limit, itemLabel = "items", onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return (
      <div className="pagination">
        <span className="pagination__info">
          {totalItems || 0} {itemLabel}
        </span>
      </div>
    );
  }

  const first = (currentPage - 1) * limit + 1;
  const last = Math.min(currentPage * limit, totalItems);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__info">
        Showing {first}-{last} of {totalItems} {itemLabel}
      </span>
      <div className="pagination__pages">
        <button
          type="button"
          className="pagination__button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        {pageWindow(currentPage, totalPages).map((page) => (
          <button
            key={page}
            type="button"
            className={`pagination__button${page === currentPage ? " is-active" : ""}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="pagination__button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
