import { PAGINATION } from "../config/constants.js";

/** Normalises page/limit query values into safe integers. */
export function resolvePagination({ page, limit } = {}) {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  const safePage =
    Number.isNaN(parsedPage) || parsedPage < 1 ? PAGINATION.DEFAULT_PAGE : parsedPage;

  let safeLimit =
    Number.isNaN(parsedLimit) || parsedLimit < 1 ? PAGINATION.DEFAULT_LIMIT : parsedLimit;
  if (safeLimit > PAGINATION.MAX_LIMIT) safeLimit = PAGINATION.MAX_LIMIT;

  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export function buildPaginationMeta({ page, limit, total }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { currentPage: page, totalPages, limit, total };
}
