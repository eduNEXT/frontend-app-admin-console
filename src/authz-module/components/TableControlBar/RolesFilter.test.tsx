import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAllProviders } from '@src/testUtils';
import { mockAuthzCatalog } from '@src/authz-module/catalog/testUtils';
import { useValidateUserPermissionsNonSuspense } from '@src/data/hooks';
import { useCourseAuthoringFlag } from '@src/authz-module/hooks/useCourseAuthoringFlag';
import { CONTENT_COURSE_PERMISSIONS, CONTENT_LIBRARY_PERMISSIONS } from '@src/authz-module/roles-permissions';
import RolesFilter from './RolesFilter';

jest.mock('@openedx/frontend-base', () => ({
  ...jest.requireActual('@openedx/frontend-base'),
  getAuthenticatedHttpClient: jest.fn(),
}));

jest.mock('@src/data/hooks', () => ({
  useValidateUserPermissionsNonSuspense: jest.fn(),
}));

jest.mock('@src/authz-module/hooks/useCourseAuthoringFlag', () => ({
  useCourseAuthoringFlag: jest.fn(),
}));

const mockUsePermissions = useValidateUserPermissionsNonSuspense as jest.Mock;
const mockUseCourseAuthoringFlag = useCourseAuthoringFlag as jest.Mock;

const permissionsData = ({ library, course }: { library?: boolean; course?: boolean }) => [
  { action: CONTENT_LIBRARY_PERMISSIONS.VIEW_LIBRARY_TEAM, allowed: !!library },
  { action: CONTENT_COURSE_PERMISSIONS.VIEW_COURSE_TEAM, allowed: !!course },
];

describe('RolesFilter', () => {
  const defaultProps = {
    filterButtonText: 'Roles',
    filterValue: [],
    setFilter: jest.fn(),
    disabled: false,
  };

  const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /Roles/i }));
    return within(await screen.findByRole('group', { name: 'Roles' }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthzCatalog();
    mockUsePermissions.mockReturnValue({ data: permissionsData({ library: true, course: true }) });
    mockUseCourseAuthoringFlag.mockReturnValue({
      isCourseAuthoringEnabled: true,
      isCourseEnabled: () => true,
      isLoading: false,
    });
  });

  it('renders the filter toggle', () => {
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    renderWithAllProviders(<RolesFilter {...defaultProps} disabled />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('displays filter button text', () => {
    renderWithAllProviders(<RolesFilter {...defaultProps} filterButtonText="Select Roles" />);
    expect(screen.getByText('Select Roles')).toBeInTheDocument();
  });

  it('calls setFilter with the selected role when a role is checked', async () => {
    const user = userEvent.setup();
    const setFilter = jest.fn();
    renderWithAllProviders(<RolesFilter {...defaultProps} setFilter={setFilter} />);
    const menu = await openDropdown(user);
    await user.click(await menu.findByLabelText('Course Admin'));
    expect(setFilter).toHaveBeenCalledWith(
      ['course_admin'],
      expect.objectContaining({ value: 'course_admin', displayName: 'Course Admin' }),
    );
  });

  it('shows only library roles when the user can view the library scope only', async () => {
    const user = userEvent.setup();
    mockUsePermissions.mockReturnValue({ data: permissionsData({ library: true }) });
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(await menu.findByText('Libraries')).toBeInTheDocument();
    expect(menu.getByLabelText('Library Admin')).toBeInTheDocument();
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByLabelText('Course Admin')).not.toBeInTheDocument();
  });

  it('shows both course and library roles when the user can view both scopes', async () => {
    const user = userEvent.setup();
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(await menu.findByText('Courses')).toBeInTheDocument();
    expect(menu.getByText('Libraries')).toBeInTheDocument();
  });

  it('lists the roles of each scope type from most to fewest permissions', async () => {
    const user = userEvent.setup();
    mockUsePermissions.mockReturnValue({ data: permissionsData({ library: true }) });
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    await menu.findByLabelText('Library Admin');
    expect(menu.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))).toEqual([
      'Library Admin', 'Library Author', 'Library Contributor', 'Library User',
    ]);
  });

  it('shows no role options when the user cannot view any scope', async () => {
    const user = userEvent.setup();
    mockUsePermissions.mockReturnValue({ data: permissionsData({}) });
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByText('Libraries')).not.toBeInTheDocument();
  });

  it('shows no role options while permissions are still loading', async () => {
    const user = userEvent.setup();
    mockUsePermissions.mockReturnValue({ data: undefined, isLoading: true });
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByText('Libraries')).not.toBeInTheDocument();
  });

  it('hides course roles when the course-authoring flag is disabled', async () => {
    const user = userEvent.setup();
    mockUseCourseAuthoringFlag.mockReturnValue({
      isCourseAuthoringEnabled: false,
      isCourseEnabled: () => false,
      isLoading: false,
    });
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(await menu.findByText('Libraries')).toBeInTheDocument();
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByLabelText('Course Admin')).not.toBeInTheDocument();
  });

  it('shows no role options while the course-authoring flag is still loading', async () => {
    const user = userEvent.setup();
    mockUseCourseAuthoringFlag.mockReturnValue({
      isCourseAuthoringEnabled: false,
      isCourseEnabled: () => false,
      isLoading: true,
    });
    renderWithAllProviders(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByText('Libraries')).not.toBeInTheDocument();
  });
});
