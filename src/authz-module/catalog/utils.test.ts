import { SCOPE_TYPES } from './constants';
import type {
  AuthzCatalog, Category, Permission, Role,
} from './types';
import { getScopeCatalog, sortRolesByPermissionCount } from './utils';

const buildCategory = (id: string): Category => ({
  id, displayName: id, description: '', icon: null,
});

const buildPermission = (id: string, categoryId: string, scopeTypes: string[]): Permission => ({
  id, displayName: id, description: '', icon: null, categoryId, scopeTypes,
});

const buildRole = (role: string, permissions: string[], displayName = role): Role => ({
  role, displayName, description: '', icon: null, definitionKind: 'static', permissions,
});

const catalog: AuthzCatalog = {
  scopeTypes: [SCOPE_TYPES.COURSE, SCOPE_TYPES.LIBRARY],
  categories: [buildCategory('course'), buildCategory('library'), buildCategory('team')],
  permissions: [
    buildPermission('courses.view_course', 'course', [SCOPE_TYPES.COURSE]),
    buildPermission('courses.edit_course_content', 'course', [SCOPE_TYPES.COURSE]),
    buildPermission('content_libraries.view_library', 'library', [SCOPE_TYPES.LIBRARY]),
    buildPermission('team.view_team', 'team', [SCOPE_TYPES.COURSE, SCOPE_TYPES.LIBRARY]),
  ],
  roles: [
    buildRole('course_staff', ['courses.view_course']),
    buildRole('course_admin', ['courses.view_course', 'courses.edit_course_content']),
    buildRole('library_user', ['content_libraries.view_library']),
    buildRole('team_viewer', ['team.view_team', 'content_libraries.view_library']),
  ],
};

const roleNames = (roles: Role[]) => roles.map(({ role }) => role);

describe('getScopeCatalog', () => {
  it('keeps only the permissions granted in the scope type', () => {
    const { permissions } = getScopeCatalog(catalog, SCOPE_TYPES.LIBRARY);

    expect(permissions.map(({ id }) => id)).toEqual(['content_libraries.view_library', 'team.view_team']);
  });

  it('keeps only the categories used by the scope type permissions', () => {
    const { categories } = getScopeCatalog(catalog, SCOPE_TYPES.LIBRARY);

    expect(categories.map(({ id }) => id)).toEqual(['library', 'team']);
  });

  it('leaves out the roles without permissions in the scope type', () => {
    const { roles } = getScopeCatalog(catalog, SCOPE_TYPES.LIBRARY);

    expect(roleNames(roles)).not.toContain('course_staff');
    expect(roleNames(roles)).not.toContain('course_admin');
  });

  it('lists a role spanning several scope types in each, with only that scope type permissions', () => {
    const courseRole = getScopeCatalog(catalog, SCOPE_TYPES.COURSE).roles.find(({ role }) => role === 'team_viewer');
    const libraryRole = getScopeCatalog(catalog, SCOPE_TYPES.LIBRARY).roles.find(({ role }) => role === 'team_viewer');

    expect(courseRole?.permissions).toEqual(['team.view_team']);
    expect(libraryRole?.permissions).toEqual(['team.view_team', 'content_libraries.view_library']);
  });

  it('orders the roles from most to fewest permissions in the scope type', () => {
    const { roles } = getScopeCatalog(catalog, SCOPE_TYPES.COURSE);

    expect(roleNames(roles)).toEqual(['course_admin', 'course_staff', 'team_viewer']);
  });
});

describe('sortRolesByPermissionCount', () => {
  it('keeps the catalog order of roles with the same number of permissions', () => {
    const roles = [
      buildRole('b', ['one'], 'Bravo'),
      buildRole('c', ['one', 'two'], 'Charlie'),
      buildRole('a', ['one'], 'Alpha'),
    ];

    expect(roleNames(sortRolesByPermissionCount(roles))).toEqual(['c', 'b', 'a']);
  });
});
