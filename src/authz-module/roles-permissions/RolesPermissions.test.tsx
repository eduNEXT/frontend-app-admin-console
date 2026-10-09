import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useValidateUserPermissionsNonSuspense } from '@src/data/hooks';
import { mockHttpClient, renderWithAllProviders } from '@src/testUtils';
import { mockAuthzCatalog } from '@src/authz-module/catalog/testUtils';
import { CONTENT_COURSE_PERMISSIONS } from './course/constants';
import { CONTENT_LIBRARY_PERMISSIONS } from './library/constants';
import RolesPermissions from './RolesPermissions';

jest.mock('@openedx/frontend-base', () => ({
  ...jest.requireActual('@openedx/frontend-base'),
  getAuthenticatedHttpClient: jest.fn(),
}));

jest.mock('@src/data/hooks', () => ({
  useValidateUserPermissionsNonSuspense: jest.fn(),
}));

jest.mock('../components/AnchorButton', () => function MockAnchorButton() {
  return <div data-testid="anchor-button" />;
});

const mockUsePermissions = useValidateUserPermissionsNonSuspense as jest.Mock;

const mockViewPermissions = ({ course = false, library = false }) => {
  mockUsePermissions.mockReturnValue({
    data: [
      { action: CONTENT_COURSE_PERMISSIONS.VIEW_COURSE_TEAM, allowed: course },
      { action: CONTENT_LIBRARY_PERMISSIONS.VIEW_LIBRARY_TEAM, allowed: library },
    ],
    isLoading: false,
  });
};

const roleColumns = () => screen.getAllByRole('columnheader').slice(1).map(({ textContent }) => textContent);

describe('RolesPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthzCatalog();
    mockViewPermissions({ course: true, library: true });
  });

  it('shows a button per scope type the user can view, with courses active by default', async () => {
    renderWithAllProviders(<RolesPermissions />);

    const coursesButton = await screen.findByRole('button', { name: 'Courses' });
    expect(coursesButton).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: 'Libraries' })).toHaveClass('btn-outline-primary');
    expect(screen.getByRole('columnheader', { name: 'Course Roles' })).toBeInTheDocument();
    expect(roleColumns()).toEqual(['Course Admin', 'Course Staff']);
  });

  it('switches to the matrix of the selected scope type', async () => {
    const user = userEvent.setup();
    renderWithAllProviders(<RolesPermissions />);

    await user.click(await screen.findByRole('button', { name: 'Libraries' }));

    expect(screen.getByRole('button', { name: 'Libraries' })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: 'Courses' })).toHaveClass('btn-outline-primary');
    expect(screen.getByRole('columnheader', { name: 'Library Roles' })).toBeInTheDocument();
  });

  it('orders the roles from most to fewest permissions', async () => {
    mockViewPermissions({ library: true });
    renderWithAllProviders(<RolesPermissions />);

    await screen.findByRole('columnheader', { name: 'Library Roles' });

    expect(roleColumns()).toEqual(['Library Admin', 'Library Author', 'Library Contributor', 'Library User']);
  });

  it('shows only the scope type the user can view', async () => {
    mockViewPermissions({ library: true });
    renderWithAllProviders(<RolesPermissions />);

    expect(await screen.findByRole('button', { name: 'Libraries' })).toHaveClass('btn-primary');
    expect(screen.queryByRole('button', { name: 'Courses' })).not.toBeInTheDocument();
    expect(screen.queryByText('Course Admin')).not.toBeInTheDocument();
  });

  it('shows the course roles note only for courses', async () => {
    const user = userEvent.setup();
    renderWithAllProviders(<RolesPermissions />);

    expect(await screen.findByText('See full documentation')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Libraries' }));

    expect(screen.queryByText('See full documentation')).not.toBeInTheDocument();
  });

  it('shows a loading indicator while the catalog loads', () => {
    mockUsePermissions.mockReturnValue({ data: undefined, isLoading: true });
    renderWithAllProviders(<RolesPermissions />);

    expect(screen.getByText('Loading roles and permissions')).toBeInTheDocument();
  });

  it('shows an error when the catalog cannot be loaded', async () => {
    mockHttpClient().mockReturnValue({ get: jest.fn().mockRejectedValue(new Error('Server error')) });
    renderWithAllProviders(<RolesPermissions />);

    expect(await screen.findByText('The roles and permissions could not be loaded. Please try again later.')).toBeInTheDocument();
  });
});
