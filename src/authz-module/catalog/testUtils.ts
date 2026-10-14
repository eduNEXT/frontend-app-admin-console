/**
 * Catalog test helpers: a catalog fixture, builders for it, and a mock of `useAuthzCatalog` serving it.
 *
 * Suites calling `mockAuthzCatalog` must mock the hook module:
 * `jest.mock('@src/authz-module/catalog/data/hooks', () => ({ useAuthzCatalog: jest.fn() }));`
 */
import { SCOPE_TYPES } from './constants';
import { useAuthzCatalog } from './data/hooks';
import type {
  AuthzCatalog, Category, Permission, Role,
} from './types';
import { getScopeCatalog } from './utils';

export const buildCatalogCategory = (id: string, displayName = id, icon: string | null = null): Category => ({
  id, displayName, description: '', icon,
});

export const buildCatalogPermission = (id: string, categoryId: string | null, scopeType: string): Permission => ({
  id, displayName: id, description: '', icon: null, categoryId, scopeTypes: [scopeType],
});

export const buildCatalogRole = (
  role: string,
  displayName: string,
  permissions: string[],
  scopeTypes: string[],
): Role => ({
  role, displayName, description: '', icon: null, definitionKind: 'static', permissions, scopeTypes,
});

/** A catalog with the course and library roles. */
export const authzCatalog: AuthzCatalog = {
  scopeTypes: [SCOPE_TYPES.COURSE, SCOPE_TYPES.LIBRARY],
  categories: [
    buildCatalogCategory('course', 'Course', 'BookOpen'),
    buildCatalogCategory('library', 'Library', 'CollectionsBookmark'),
  ],
  permissions: [
    buildCatalogPermission('content_libraries.edit_library_content', 'library', SCOPE_TYPES.LIBRARY),
    buildCatalogPermission('content_libraries.manage_library_team', 'library', SCOPE_TYPES.LIBRARY),
    buildCatalogPermission('content_libraries.view_library', 'library', SCOPE_TYPES.LIBRARY),
    buildCatalogPermission('courses.edit_course_content', 'course', SCOPE_TYPES.COURSE),
    buildCatalogPermission('courses.manage_course_team', 'course', SCOPE_TYPES.COURSE),
    buildCatalogPermission('courses.view_course', 'course', SCOPE_TYPES.COURSE),
  ],
  roles: [
    buildCatalogRole('course_admin', 'Course Admin', [
      'courses.edit_course_content', 'courses.manage_course_team', 'courses.view_course',
    ], [SCOPE_TYPES.COURSE]),
    buildCatalogRole('course_staff', 'Course Staff', [
      'courses.edit_course_content', 'courses.view_course',
    ], [SCOPE_TYPES.COURSE]),
    buildCatalogRole('library_admin', 'Library Admin', [
      'content_libraries.edit_library_content', 'content_libraries.manage_library_team', 'content_libraries.view_library',
    ], [SCOPE_TYPES.LIBRARY]),
    buildCatalogRole('library_author', 'Library Author', [
      'content_libraries.edit_library_content', 'content_libraries.view_library',
    ], [SCOPE_TYPES.LIBRARY]),
    buildCatalogRole('library_contributor', 'Library Contributor', [
      'content_libraries.edit_library_content', 'content_libraries.view_library',
    ], [SCOPE_TYPES.LIBRARY]),
    buildCatalogRole('library_user', 'Library User', ['content_libraries.view_library'], [SCOPE_TYPES.LIBRARY]),
  ],
};

// The part of the `useAuthzCatalog` result its consumers read.
type AuthzCatalogResult = Pick<ReturnType<typeof useAuthzCatalog>, 'scopeTypes' | 'getScopeCatalog' | 'isLoading' | 'isError'>;

interface MockAuthzCatalogOptions {
  catalog?: AuthzCatalog;
  // The scope types the user can view; the catalog's by default.
  scopeTypes?: string[];
  isLoading?: boolean;
  isError?: boolean;
}

/**
 * Makes `useAuthzCatalog` return `catalog`, limited to the scope types the user can view. Nothing is
 * loaded while `isLoading` or on `isError`. Each scope type's catalog is built once, with the real
 * `getScopeCatalog`, so it keeps its identity between renders as the hook's does.
 */
export const mockAuthzCatalog = ({
  catalog = authzCatalog, scopeTypes = catalog.scopeTypes, isLoading = false, isError = false,
}: MockAuthzCatalogOptions = {}) => {
  const loadedScopeTypes = isLoading || isError ? [] : scopeTypes;
  const scopeCatalogs = new Map(loadedScopeTypes.map((scopeType) => [scopeType, getScopeCatalog(catalog, scopeType)]));

  // Typed as the hook's result, so the mock fails to compile if the hook's API changes.
  const result: AuthzCatalogResult = {
    isLoading,
    isError,
    scopeTypes: loadedScopeTypes,
    getScopeCatalog: (scopeType) => scopeCatalogs.get(scopeType),
  };
  (useAuthzCatalog as jest.Mock).mockReturnValue(result);
};
