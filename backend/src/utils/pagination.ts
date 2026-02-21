export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
  total: number;
}

export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  return { page, limit };
}

export function paginationResult(params: PaginationParams, total: number): PaginationResult {
  return {
    page: params.page,
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
    total,
  };
}
