import type { AuthzCatalog, Role, ScopeCatalog } from './types';

/**
 * Orders roles from the one with most permissions to the one with fewest. Roles with the same
 * number of permissions keep their catalog order, so the order does not depend on the language.
 */
export const sortRolesByPermissionCount = (roles: Role[]): Role[] => [...roles].sort((a, b) => (
  b.permissions.length - a.permissions.length
));

/**
 * Returns the part of the catalog that applies to one scope type.
 *
 * A role belongs to every scope type its permissions are granted in, so a role spanning several
 * scope types appears in each of them, listing only the permissions of that scope type.
 *
 * @param catalog - The complete catalog.
 * @param scopeType - The scope type to slice (e.g. `course-v1`).
 *
 * @returns The scope type's catalog:
 * - `permissions`: those granted in the scope type, in catalog order.
 * - `categories`: those used by the scope type's permissions, in catalog order.
 * - `roles`: those with at least one of the scope type's permissions, holding only those, and
 *   ordered from most to fewest permissions, ties in catalog order.
 */
export const getScopeCatalog = (catalog: AuthzCatalog, scopeType: string): ScopeCatalog => {
  const permissions = catalog.permissions.filter((permission) => permission.scopeTypes.includes(scopeType));
  const permissionIds = new Set(permissions.map(({ id }) => id));
  const categoryIds = new Set(permissions.map(({ categoryId }) => categoryId));

  const categories = catalog.categories.filter(({ id }) => categoryIds.has(id));
  const roles = catalog.roles
    .map((role) => ({ ...role, permissions: role.permissions.filter((id) => permissionIds.has(id)) }))
    .filter((role) => role.permissions.length > 0);

  return {
    scopeType,
    categories,
    permissions,
    roles: sortRolesByPermissionCount(roles),
  };
};
