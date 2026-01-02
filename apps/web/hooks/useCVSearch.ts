import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CVSearchRequest,
  CVSearchResponse,
  CVSearchResult,
  MatchExplanation,
  SearchMetadata,
} from '@/lib/validations/cv-search';
import type {
  V4SearchResponse,
  V4SearchResult,
  ParsedQuery,
  AgenticExplanation,
  Verdict,
  PipelineStats,
} from '@lighthouse/ai';

// ============================================================================
// TYPES
// ============================================================================

export interface CVSearchParams {
  query: string;
  filters?: CVSearchRequest['filters'];
  limit?: number;
  offset?: number;
  mode?: 'hybrid' | 'semantic' | 'keyword';
  useRerank?: boolean;
  includeSnippets?: boolean;
}

// V4 Search Params (simplified - filters are extracted from natural language)
export interface V4SearchParams {
  query: string;
  limit?: number;
}

export interface CVSearchState {
  results: CVSearchResult[];
  totalCount: number;
  processingTimeMs: number;
  searchMode: string;
  rerankUsed: boolean;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// API FUNCTION
// ============================================================================

async function searchCVs(params: CVSearchParams): Promise<CVSearchResponse> {
  const response = await fetch('/api/search/cv', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query,
      filters: params.filters,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      mode: params.mode ?? 'hybrid',
      use_rerank: params.useRerank ?? true,
      include_snippets: params.includeSnippets ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'CV search failed');
  }

  return response.json();
}

// ============================================================================
// QUERY HOOK (for search-as-you-type or debounced search)
// ============================================================================

/**
 * React Query hook for CV search
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCVSearch({
 *   query: searchTerm,
 *   filters: { require_stcw: true },
 *   limit: 20,
 * });
 * ```
 */
export function useCVSearch(params: CVSearchParams | null) {
  return useQuery({
    queryKey: ['cv-search', params],
    queryFn: () => (params ? searchCVs(params) : Promise.resolve(null)),
    enabled: !!params?.query && params.query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

// ============================================================================
// MUTATION HOOK (for explicit search button clicks)
// ============================================================================

/**
 * Mutation hook for explicit CV search (e.g., search button click)
 *
 * @example
 * ```tsx
 * const { mutate: search, data, isPending } = useCVSearchMutation();
 *
 * const handleSearch = () => {
 *   search({ query: 'Chief Stewardess UHNW experience' });
 * };
 * ```
 */
export function useCVSearchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchCVs,
    onSuccess: (data, variables) => {
      // Cache the result for the query hook
      queryClient.setQueryData(['cv-search', variables], data);
    },
  });
}

// ============================================================================
// PAGINATED HOOK
// ============================================================================

interface UseCVSearchPaginatedParams extends Omit<CVSearchParams, 'offset'> {
  page?: number;
  pageSize?: number;
}

/**
 * Hook for paginated CV search results
 *
 * @example
 * ```tsx
 * const { data, page, setPage, hasNextPage } = useCVSearchPaginated({
 *   query: 'stewardess',
 *   pageSize: 20,
 * });
 * ```
 */
export function useCVSearchPaginated(params: UseCVSearchPaginatedParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const query = useCVSearch(
    params.query
      ? {
          ...params,
          limit: pageSize,
          offset,
        }
      : null
  );

  const totalPages = query.data
    ? Math.ceil(query.data.total_count / pageSize)
    : 0;

  return {
    ...query,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ============================================================================
// INFINITE SCROLL HOOK
// ============================================================================

/**
 * Hook for infinite scroll CV search (load more pattern)
 *
 * @example
 * ```tsx
 * const { results, loadMore, isLoadingMore, hasMore } = useCVSearchInfinite({
 *   query: 'captain',
 *   pageSize: 20,
 * });
 * ```
 */
export function useCVSearchInfinite(params: UseCVSearchPaginatedParams) {
  const queryClient = useQueryClient();
  const pageSize = params.pageSize ?? 20;

  // Track loaded pages
  const { data: pagesData } = useQuery<{
    pages: CVSearchResponse[];
    totalCount: number;
  }>({
    queryKey: ['cv-search-infinite', params.query, params.filters, params.mode],
    queryFn: () => ({ pages: [], totalCount: 0 }),
    enabled: false,
    staleTime: Infinity,
  });

  // Load first page
  const firstPageQuery = useCVSearch(
    params.query
      ? {
          ...params,
          limit: pageSize,
          offset: 0,
        }
      : null
  );

  // Set first page data
  if (firstPageQuery.data && (!pagesData || pagesData.pages.length === 0)) {
    queryClient.setQueryData(
      ['cv-search-infinite', params.query, params.filters, params.mode],
      {
        pages: [firstPageQuery.data],
        totalCount: firstPageQuery.data.total_count,
      }
    );
  }

  // Load more mutation
  const loadMoreMutation = useMutation({
    mutationFn: async () => {
      const currentPages = pagesData?.pages.length ?? 1;
      const offset = currentPages * pageSize;

      return searchCVs({
        ...params,
        limit: pageSize,
        offset,
      });
    },
    onSuccess: (newPage) => {
      const currentData = queryClient.getQueryData<{
        pages: CVSearchResponse[];
        totalCount: number;
      }>(['cv-search-infinite', params.query, params.filters, params.mode]);

      if (currentData) {
        queryClient.setQueryData(
          ['cv-search-infinite', params.query, params.filters, params.mode],
          {
            pages: [...currentData.pages, newPage],
            totalCount: newPage.total_count,
          }
        );
      }
    },
  });

  // Flatten all results
  const allResults = pagesData?.pages.flatMap((p) => p.results) ?? [];
  const totalCount = pagesData?.totalCount ?? firstPageQuery.data?.total_count ?? 0;
  const hasMore = allResults.length < totalCount;

  return {
    results: allResults,
    totalCount,
    isLoading: firstPageQuery.isLoading,
    isLoadingMore: loadMoreMutation.isPending,
    error: firstPageQuery.error || loadMoreMutation.error,
    hasMore,
    loadMore: () => loadMoreMutation.mutate(),
    processingTimeMs: firstPageQuery.data?.processing_time_ms ?? 0,
    searchMode: firstPageQuery.data?.search_mode ?? 'hybrid',
    rerankUsed: firstPageQuery.data?.rerank_used ?? false,
  };
}

// ============================================================================
// V4 AGENTIC SEARCH API FUNCTION
// ============================================================================

async function searchV4(params: V4SearchParams): Promise<V4SearchResponse> {
  console.log('[V4 Search Client] Making request:', params);
  const response = await fetch('/api/search/v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query,
      limit: params.limit ?? 20,
    }),
  });

  console.log('[V4 Search Client] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('[V4 Search Client] Error:', error);
    throw new Error(error.error || 'V4 search failed');
  }

  const data = await response.json();
  console.log('[V4 Search Client] Results:', data.total_count, 'candidates');
  return data;
}

// ============================================================================
// V4 QUERY HOOK
// ============================================================================

/**
 * React Query hook for V4 Agentic Search
 *
 * V4 uses:
 * - gpt-4o-mini for query parsing (extracts requirements from natural language)
 * - Claude Haiku for agentic evaluation (REAL reasoning explanations)
 * - NO manual filters needed - AI extracts everything from the query
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useV4Search({
 *   query: "Chief Stewardess with STCW and 5+ years for Med season",
 * });
 *
 * // Access agentic explanations
 * data?.results.forEach(r => {
 *   console.log(r.agenticExplanation.summary);
 *   console.log(r.agenticExplanation.strengths);
 * });
 * ```
 */
export function useV4Search(params: V4SearchParams | null) {
  return useQuery({
    queryKey: ['v4-search', params],
    queryFn: () => (params ? searchV4(params) : Promise.resolve(null)),
    enabled: !!params?.query && params.query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

// ============================================================================
// V4 MUTATION HOOK
// ============================================================================

/**
 * Mutation hook for explicit V4 search (e.g., search button click)
 *
 * @example
 * ```tsx
 * const { mutate: search, data, isPending } = useV4SearchMutation();
 *
 * const handleSearch = () => {
 *   search({ query: 'Senior Deckhand with STCW available in Med' });
 * };
 * ```
 */
export function useV4SearchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchV4,
    onSuccess: (data, variables) => {
      console.log('[V4 Search Mutation] Success:', data.total_count, 'results');
      // Cache the result for the query hook
      queryClient.setQueryData(['v4-search', variables], data);
    },
    onError: (error) => {
      console.error('[V4 Search Mutation] Error:', error);
    },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { CVSearchResult, CVSearchResponse, MatchExplanation, SearchMetadata };
export type {
  V4SearchResponse,
  V4SearchResult,
  ParsedQuery,
  AgenticExplanation,
  Verdict,
  PipelineStats,
};
