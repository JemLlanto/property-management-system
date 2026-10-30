// Shared pagination + search helpers.
//
// Every list endpoint that grows without bound uses these so the query
// params behave the same way everywhere:
//
//   ?page=2&pageSize=50&search=smith&sort=name&order=asc

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// Parse the pagination parameters from a request query object.
// page is 1-based. pageSize is clamped to MAX_PAGE_SIZE so a client
// cannot ask for the entire table by passing pageSize=1000000.
function parsePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const rawSize = Number(query.pageSize) || DEFAULT_PAGE_SIZE;

  const pageSize = Math.min(Math.max(rawSize, 1), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

// Build the Prisma `where` clause for a free-text search across the
// given columns. The search term is matched as a substring.
//
// MySQL's default collation makes `contains`/`startsWith` case-
// insensitive, so no extra mode flag is needed (and `mode:
// "insensitive"` is a PostgreSQL-only argument that MySQL rejects).
function buildSearchWhere(search, columns) {
  const term = String(search ?? "").trim();

  if (!term || !Object.keys(columns).length) {
    return {};
  }

  const filters = Object.entries(columns).map(([field, mode]) => ({
    [field]: {
      [mode === "startsWith" ? "startsWith" : "contains"]: term,
    },
  }));

  return { OR: filters };
}

// Wrap a Prisma query with the total count, returning the rows plus the
// pagination metadata the client needs.
async function paginate(query, countQuery) {
  const [rows, total] = await Promise.all([query, countQuery]);

  return {
    rows,
    total,
  };
}

// The standard pagination envelope returned to the client.
function paginationMeta({ page, pageSize, total }) {
  return {
    page,
    pageSize,
    total,
    total_pages: Math.ceil(total / pageSize),
    has_more: page * pageSize < total,
  };
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePagination,
  buildSearchWhere,
  paginate,
  paginationMeta,
};
