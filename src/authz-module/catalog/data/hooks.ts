import { useQuery } from '@tanstack/react-query';
import { appId } from '@src/constants';
import { useValidateUserPermissionsNonSuspense } from '@src/data/hooks';
import { getAuthzCatalog } from './api';
import { SCOPE_TYPES, VIEW_TEAM_ACTIONS } from '../constants';
import type { AuthzCatalog } from '../types';

const catalogQueryKeys = {
  all: [appId, 'authz', 'catalog'] as const,
  byScopeTypes: (scopeTypes: string[]) => [...catalogQueryKeys.all, scopeTypes] as const,
};

// Requested in the same order as useViewTeamPermissions (libraries first), so both share one
// validate/me query.
const VIEW_TEAM_PERMISSIONS = [SCOPE_TYPES.LIBRARY, SCOPE_TYPES.COURSE].map((scopeType) => ({
  action: VIEW_TEAM_ACTIONS[scopeType],
}));

/**
 * React Query hook to fetch the roles, permissions and categories catalog of the scope types the
 * user can view, in a single request.
 *
 * The scope types come from the user's view-team permissions (validate/me), so the query waits
 * for them and is skipped when the user can't view any scope type. `isLoading` covers both.
 * The catalog comes from the authz schema and doesn't change while the app runs, so it never
 * goes stale.
 *
 * @example
 * ```tsx
 * const { data: catalog, isLoading } = useAuthzCatalog();
 * ```
 */
export const useAuthzCatalog = () => {
  const {
    data: permissions, isLoading: isLoadingPermissions,
  } = useValidateUserPermissionsNonSuspense(VIEW_TEAM_PERMISSIONS);

  const scopeTypes: string[] = [SCOPE_TYPES.COURSE, SCOPE_TYPES.LIBRARY].filter((scopeType) => (
    permissions?.some(({ action, allowed }) => allowed && action === VIEW_TEAM_ACTIONS[scopeType])
  ));

  const query = useQuery<AuthzCatalog, Error>({
    queryKey: catalogQueryKeys.byScopeTypes(scopeTypes),
    queryFn: () => getAuthzCatalog(scopeTypes),
    enabled: scopeTypes.length > 0,
    staleTime: Infinity,
  });

  return { ...query, isLoading: isLoadingPermissions || query.isLoading };
};
