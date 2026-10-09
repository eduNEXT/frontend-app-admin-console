import { act, screen, waitFor } from '@testing-library/react';
import { useValidateUserPermissionsNonSuspense } from '@src/data/hooks';
import { CONTENT_COURSE_PERMISSIONS, CONTENT_LIBRARY_PERMISSIONS } from '@src/authz-module/roles-permissions';
import { renderWithAllProviders } from '@src/testUtils';
import { authzCatalogResponse, mockAuthzCatalog } from '@src/authz-module/catalog/testUtils';
import UserPermissions from './UserPermissions';

jest.mock('@openedx/frontend-base', () => ({
  ...jest.requireActual('@openedx/frontend-base'),
  getAuthenticatedHttpClient: jest.fn(),
}));

jest.mock('@src/data/hooks', () => ({
  useValidateUserPermissionsNonSuspense: jest.fn(),
}));

const buildPermission = (id: string, categoryId: string | null, scopeType: string) => ({
  id, display_name: id, description: '', icon: null, category_id: categoryId, scope_types: [scopeType],
});

const buildCategory = (id: string) => ({
  id, display_name: id, description: '', icon: null,
});

const renderUserPermissions = (original: { role: string; scope?: string }) => renderWithAllProviders(
  <UserPermissions row={{ original }} />,
);

describe('UserPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthzCatalog();
    (useValidateUserPermissionsNonSuspense as jest.Mock).mockReturnValue({
      data: [
        { action: CONTENT_COURSE_PERMISSIONS.VIEW_COURSE_TEAM, allowed: true },
        { action: CONTENT_LIBRARY_PERMISSIONS.VIEW_LIBRARY_TEAM, allowed: true },
      ],
      isLoading: false,
    });
  });

  it('describes the Django managed roles', () => {
    const { container } = renderUserPermissions({ role: 'django.superuser' });

    expect(container).not.toBeEmptyDOMElement();
  });

  it('shows the permissions the role grants, grouped by category', async () => {
    renderUserPermissions({ role: 'library_user', scope: 'lib:OpenedX:CSPROB' });

    expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByText('content_libraries.view_library')).toBeInTheDocument();
    expect(screen.queryByText('content_libraries.edit_library_content')).not.toBeInTheDocument();
  });

  it('shows the permissions of the assignment scope type for a role in several scope types', async () => {
    mockAuthzCatalog({
      categories: [buildCategory('course'), buildCategory('library')],
      permissions: [
        buildPermission('courses.view_course_team', 'course', 'course-v1'),
        buildPermission('content_libraries.view_library_team', 'library', 'lib'),
      ],
      results: [{
        role: 'team_viewer',
        display_name: 'Team Viewer',
        description: '',
        icon: null,
        definition_kind: 'static',
        permissions: ['courses.view_course_team', 'content_libraries.view_library_team'],
      }],
    });

    renderUserPermissions({ role: 'team_viewer', scope: 'lib:OpenedX:CSPROB' });

    expect(await screen.findByText('content_libraries.view_library_team')).toBeInTheDocument();
    expect(screen.queryByText('courses.view_course_team')).not.toBeInTheDocument();
  });

  it('groups the permissions without a category under "Other"', async () => {
    mockAuthzCatalog({
      ...authzCatalogResponse,
      permissions: [...authzCatalogResponse.permissions, buildPermission('content_libraries.export_library', null, 'lib')],
      results: authzCatalogResponse.results.map((role) => (role.role === 'library_user'
        ? { ...role, permissions: [...role.permissions, 'content_libraries.export_library'] }
        : role)),
    });

    renderUserPermissions({ role: 'library_user', scope: 'lib:OpenedX:CSPROB' });

    expect(await screen.findByRole('heading', { name: 'Other' })).toBeInTheDocument();
    expect(screen.getByText('content_libraries.export_library')).toBeInTheDocument();
  });

  it('splits the categories in two columns when there are more than three', async () => {
    const categoryIds = ['one', 'two', 'three', 'four'];
    mockAuthzCatalog({
      categories: categoryIds.map(buildCategory),
      permissions: categoryIds.map((id) => buildPermission(`courses.${id}`, id, 'course-v1')),
      results: [{
        role: 'course_admin',
        display_name: 'Course Admin',
        description: '',
        icon: null,
        definition_kind: 'static',
        permissions: categoryIds.map((id) => `courses.${id}`),
      }],
    });

    renderUserPermissions({ role: 'course_admin', scope: 'course-v1:OpenedX+DemoX+Demo' });

    await screen.findByRole('heading', { name: 'one' });
    expect(screen.getAllByRole('list')).toHaveLength(4);
  });

  it('shows nothing for a role the catalog does not have', async () => {
    const get = mockAuthzCatalog();
    const { container } = renderUserPermissions({ role: 'unknown_role', scope: 'lib:OpenedX:CSPROB' });

    await waitFor(() => expect(get).toHaveBeenCalled());
    await act(() => get.mock.results[0].value);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing without a role', () => {
    const { container } = renderUserPermissions({ role: '' });

    expect(container).toBeEmptyDOMElement();
  });
});
