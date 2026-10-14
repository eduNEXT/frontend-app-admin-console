import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Category, Permission, Role } from '@src/authz-module/catalog';
import type { MatrixCategory } from '@src/authz-module/roles-permissions';
import { renderWrapper } from '@src/testUtils';
import PermissionTable from './PermissionTable';

const buildRole = (role: string, displayName: string): Role => ({
  role, displayName, description: '', icon: null, definitionKind: 'static', permissions: [], scopeTypes: ['lib'],
});

const buildCategory = (id: string, displayName: string, description = ''): Category => ({
  id, displayName, description, icon: null,
});

const buildPermission = (id: string, displayName: string, description = ''): Permission => ({
  id, displayName, description, icon: null, categoryId: null, scopeTypes: ['lib'],
});

const roles = [
  buildRole('library_admin', 'Library Admin'),
  buildRole('library_author', 'Library Author'),
  buildRole('library_user', 'Library User'),
];

const matrix: MatrixCategory[] = [
  {
    category: buildCategory('library', 'Library', 'Permissions related to the library.'),
    permissions: [
      {
        permission: buildPermission('content_libraries.view_library', 'View', 'See the library.'),
        grantedTo: { library_admin: true, library_author: true, library_user: true },
      },
      {
        permission: buildPermission('content_libraries.delete_library', 'Delete', 'Delete the library.'),
        grantedTo: { library_admin: true, library_author: false, library_user: false },
      },
    ],
  },
  {
    category: buildCategory('library_team', 'Team'),
    permissions: [
      {
        permission: buildPermission('content_libraries.manage_library_team', 'Manage'),
        grantedTo: { library_admin: true, library_author: false, library_user: false },
      },
    ],
  },
];

const getPermissionRow = (displayName: string) => screen.getByText(displayName).closest('tr') as HTMLElement;

describe('PermissionTable', () => {
  it('shows the title and a column per role', () => {
    renderWrapper(<PermissionTable roles={roles} matrix={matrix} title="Library Roles" />);

    expect(screen.getByRole('columnheader', { name: 'Library Roles' })).toBeInTheDocument();
    roles.forEach(({ displayName }) => {
      expect(screen.getByRole('columnheader', { name: displayName })).toBeInTheDocument();
    });
  });

  it('shows each category with its permissions', () => {
    renderWrapper(<PermissionTable roles={roles} matrix={matrix} />);

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('marks which roles grant each permission', () => {
    renderWrapper(<PermissionTable roles={roles} matrix={matrix} />);

    const deleteRow = within(getPermissionRow('Delete'));
    expect(deleteRow.getByLabelText('Permission granted in Library Admin role')).toBeInTheDocument();
    expect(deleteRow.getByLabelText('Permission not granted in Library Author role')).toBeInTheDocument();
    expect(deleteRow.getByLabelText('Permission not granted in Library User role')).toBeInTheDocument();
  });

  it('describes a category and its permissions on its info icon', async () => {
    const user = userEvent.setup();
    renderWrapper(<PermissionTable roles={roles} matrix={matrix} />);

    // The info icon follows the category label.
    const infoIcon = screen.getByText('Library').parentElement?.nextElementSibling as HTMLElement;
    await user.hover(infoIcon);

    const popover = await screen.findByRole('tooltip');
    expect(within(popover).getByText('Permissions related to the library.')).toBeInTheDocument();
    expect(within(popover).getByText('See the library.')).toBeInTheDocument();
    expect(within(popover).getByText('Delete the library.')).toBeInTheDocument();
  });

  it('shows the categories without role columns when there are no roles', () => {
    renderWrapper(<PermissionTable roles={[]} matrix={matrix} />);

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Library Admin' })).not.toBeInTheDocument();
  });

  it('shows the role columns when there are no permissions', () => {
    renderWrapper(<PermissionTable roles={roles} matrix={[]} />);

    roles.forEach(({ displayName }) => {
      expect(screen.getByRole('columnheader', { name: displayName })).toBeInTheDocument();
    });
  });
});
