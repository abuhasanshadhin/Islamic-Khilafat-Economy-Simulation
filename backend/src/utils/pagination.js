// Structured pagination helper for TypeORM repositories and query builders.
// Usage: const result = await paginate(repo, { where, order, page, limit, select })
// Returns: { items, total, page, limit, meta }

function normalizeInt(v, def) {
  const n = parseInt(String(v || ''), 10)
  if (Number.isNaN(n)) return def
  return n
}

function buildPaginationMeta(page, limit, total) {
  const safeLimit = Math.max(1, limit)
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  return {
    page,
    limit: safeLimit,
    total,
    totalPages,
    offset: (page - 1) * safeLimit,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  }
}

function parsePaginationParams(query = {}, opts = {}) {
  const defaultPage = opts.defaultPage || 1
  const defaultLimit = opts.defaultLimit || 20
  const minLimit = opts.minLimit || 5
  const maxLimit = opts.maxLimit || 100

  const page = Math.max(1, normalizeInt(query.page, defaultPage))
  const limit = Math.min(maxLimit, Math.max(minLimit, normalizeInt(query.limit, defaultLimit)))
  return { page, limit }
}

async function paginate(repository, opts = {}) {
  const page = Math.max(1, normalizeInt(opts.page, 1))
  const limit = Math.min(100, Math.max(1, normalizeInt(opts.limit, 20)))
  const skip = (page - 1) * limit

  const findOpts = {
    where: opts.where || {},
    order: opts.order || {},
    skip,
    take: limit,
  }

  if (opts.select) findOpts.select = opts.select

  const [items, total] = await repository.findAndCount(findOpts)
  return { items, total, page, limit, meta: buildPaginationMeta(page, limit, total) }
}

async function paginateQueryBuilder(queryBuilder, opts = {}) {
  const page = Math.max(1, normalizeInt(opts.page, 1))
  const limit = Math.min(100, Math.max(1, normalizeInt(opts.limit, 20)))
  const offset = (page - 1) * limit

  queryBuilder.skip(offset)
  queryBuilder.take(limit)

  const [items, total] = await queryBuilder.getManyAndCount()
  return { items, total, page, limit, meta: buildPaginationMeta(page, limit, total) }
}

module.exports = { paginate, paginateQueryBuilder, parsePaginationParams, buildPaginationMeta }
