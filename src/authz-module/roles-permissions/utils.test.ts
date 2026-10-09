import type {
  Category, Permission, Role, ScopeCatalog,
} from '@src/authz-module/catalog';
import { buildPermissionMatrix } from './utils';

const buildCategory = (id: string): Category => ({
  id, displayName: id, description: '', icon: null,
});

const buildPermission = (id: string, categoryId: string | null): Permission => ({
  id, displayName: id, description: '', icon: null, categoryId, scopeTypes: ['lib'],
});

const buildRole = (role: string, permissions: string[]): Role => ({
  role, displayName: role, description: '', icon: null, definitionKind: 'static', permissions,
});

const otherCategory = buildCategory('other');

const scopeCatalog: ScopeCatalog = {
  scopeType: 'lib',
  categories: [buildCategory('library'), buildCategory('team')],
  permissions: [
    buildPermission('content_libraries.view_library', 'library'),
    buildPermission('content_libraries.manage_library_team', 'team'),
    buildPermission('content_libraries.edit_library_content', 'library'),
  ],
  roles: [
    buildRole('library_admin', [
      'content_libraries.view_library', 'content_libraries.manage_library_team', 'content_libraries.edit_library_content',
    ]),
    buildRole('library_user', ['content_libraries.view_library']),
  ],
};

const permissionIdsByCategory = (matrix: ReturnType<typeof buildPermissionMatrix>) => matrix.map(
  ({ category, permissions }) => [category.id, permissions.map(({ permission }) => permission.id)],
);

describe('buildPermissionMatrix', () => {
  it('groups the permissions by category, in catalog order', () => {
    const matrix = buildPermissionMatrix(scopeCatalog, otherCategory);

    expect(permissionIdsByCategory(matrix)).toEqual([
      ['library', ['content_libraries.view_library', 'content_libraries.edit_library_content']],
      ['team', ['content_libraries.manage_library_team']],
    ]);
  });

  it('shows which roles grant each permission', () => {
    const [libraryCategory] = buildPermissionMatrix(scopeCatalog, otherCategory);

    expect(libraryCategory.permissions.map(({ grantedTo }) => grantedTo)).toEqual([
      { library_admin: true, library_user: true },
      { library_admin: true, library_user: false },
    ]);
  });

  it('groups the permissions without a category in a final "other" category', () => {
    const matrix = buildPermissionMatrix({
      ...scopeCatalog,
      permissions: [...scopeCatalog.permissions, buildPermission('content_libraries.export_library', null)],
    }, otherCategory);

    expect(permissionIdsByCategory(matrix).at(-1)).toEqual(['other', ['content_libraries.export_library']]);
  });

  it('leaves out the "other" category when every permission has a category', () => {
    const matrix = buildPermissionMatrix(scopeCatalog, otherCategory);

    expect(matrix.map(({ category }) => category.id)).not.toContain('other');
  });
});
