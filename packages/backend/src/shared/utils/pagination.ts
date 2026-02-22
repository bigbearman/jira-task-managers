export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / options.limit);
  return {
    data,
    meta: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
}

export function getDefaultPagination(page?: number, limit?: number): PaginationOptions {
  return {
    page: Math.max(1, page || 1),
    limit: Math.min(100, Math.max(1, limit || 20)),
  };
}
