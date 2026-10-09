/**
 * Catalog test helpers: a catalog API response fixture and a mock of the catalog API serving it.
 */
import { mockHttpClient } from '@src/testUtils';
import type { PermissionValidationRequest } from '@src/types';
import { VIEW_TEAM_ACTIONS } from './constants';

const buildCatalogPermission = (id: string, categoryId: string, scopeType: string) => ({
  id, display_name: id, description: '', icon: null, category_id: categoryId, scope_types: [scopeType],
});

const buildCatalogRole = (role: string, displayName: string, permissions: string[]) => ({
  role, display_name: displayName, description: '', icon: null, definition_kind: 'static', permissions,
});

/** A catalog API response with the course and library roles, as the backend sends it. */
export const authzCatalogResponse = {
  categories: [
    { id: 'course', display_name: 'Course', description: '', icon: 'BookOpen' },
    { id: 'library', display_name: 'Library', description: '', icon: 'CollectionsBookmark' },
  ],
  permissions: [
    buildCatalogPermission('content_libraries.edit_library_content', 'library', 'lib'),
    buildCatalogPermission('content_libraries.manage_library_team', 'library', 'lib'),
    buildCatalogPermission('content_libraries.view_library', 'library', 'lib'),
    buildCatalogPermission('courses.edit_course_content', 'course', 'course-v1'),
    buildCatalogPermission('courses.manage_course_team', 'course', 'course-v1'),
    buildCatalogPermission('courses.view_course', 'course', 'course-v1'),
  ],
  results: [
    buildCatalogRole('course_admin', 'Course Admin', [
      'courses.edit_course_content', 'courses.manage_course_team', 'courses.view_course',
    ]),
    buildCatalogRole('course_staff', 'Course Staff', ['courses.edit_course_content', 'courses.view_course']),
    buildCatalogRole('library_admin', 'Library Admin', [
      'content_libraries.edit_library_content', 'content_libraries.manage_library_team', 'content_libraries.view_library',
    ]),
    buildCatalogRole('library_author', 'Library Author', [
      'content_libraries.edit_library_content', 'content_libraries.view_library',
    ]),
    buildCatalogRole('library_contributor', 'Library Contributor', [
      'content_libraries.edit_library_content', 'content_libraries.view_library',
    ]),
    buildCatalogRole('library_user', 'Library User', ['content_libraries.view_library']),
  ],
};

/**
 * Answers the catalog API (`useAuthzCatalog`) with `catalog`, keeping only what applies to the
 * requested scope types, as the backend does, and lets the user view the teams of every scope type.
 * Only meaningful in suites that `jest.mock('@openedx/frontend-base', ...)`. Returns the mocked `get`.
 */
export const mockAuthzCatalog = (catalog = authzCatalogResponse) => {
  const get = jest.fn((url: URL) => {
    const scopeTypes = url.searchParams.get('scope_types')?.split(',') ?? [];
    const permissions = catalog.permissions.filter(
      (permission) => permission.scope_types.some((scopeType) => scopeTypes.includes(scopeType)),
    );
    const permissionIds = new Set(permissions.map(({ id }) => id));
    const categoryIds = new Set(permissions.map(({ category_id: categoryId }) => categoryId));
    const results = catalog.results
      .map((role) => ({ ...role, permissions: role.permissions.filter((id) => permissionIds.has(id)) }))
      .filter((role) => role.permissions.length > 0);

    return Promise.resolve({
      data: {
        count: results.length,
        next: null,
        previous: null,
        scope_types: scopeTypes,
        categories: catalog.categories.filter(({ id }) => categoryIds.has(id)),
        permissions,
        results,
      },
    });
  });
  const viewTeamActions = Object.values(VIEW_TEAM_ACTIONS);
  const post = jest.fn((_url: string, validations: PermissionValidationRequest[]) => Promise.resolve({
    data: validations.map((validation) => ({ ...validation, allowed: viewTeamActions.includes(validation.action) })),
  }));
  mockHttpClient().mockReturnValue({ get, post });
  return get;
};
