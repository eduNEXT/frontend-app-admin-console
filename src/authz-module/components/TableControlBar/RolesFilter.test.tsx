import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapper } from '@src/setupTest';
import RolesFilter from './RolesFilter';

const rowsWithRoles = (roles: string[]) => roles.map((role) => ({ values: { role } }));

describe('RolesFilter', () => {
  const defaultProps = {
    filterButtonText: 'Roles',
    filterValue: [],
    setFilter: jest.fn(),
    disabled: false,
    id: 'role',
    preFilteredRows: rowsWithRoles(['course_admin', 'course_staff', 'library_admin']),
  };

  const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /Roles/i }));
    return within(await screen.findByRole('group', { name: 'Roles' }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the filter toggle', () => {
    renderWrapper(<RolesFilter {...defaultProps} />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    renderWrapper(<RolesFilter {...defaultProps} disabled />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('displays filter button text', () => {
    renderWrapper(<RolesFilter {...defaultProps} filterButtonText="Select Roles" />);
    expect(screen.getByText('Select Roles')).toBeInTheDocument();
  });

  it('calls setFilter with the selected role when a role is checked', async () => {
    const user = userEvent.setup();
    const setFilter = jest.fn();
    renderWrapper(<RolesFilter {...defaultProps} setFilter={setFilter} />);
    const menu = await openDropdown(user);
    await user.click(menu.getByLabelText('Course Admin'));
    expect(setFilter).toHaveBeenCalledWith(
      ['course_admin'],
      expect.objectContaining({ value: 'course_admin', displayName: 'Course Admin' }),
    );
  });

  it('shows only the roles present in the table rows', async () => {
    const user = userEvent.setup();
    renderWrapper(<RolesFilter {...defaultProps} preFilteredRows={rowsWithRoles(['library_admin', 'library_user'])} />);
    const menu = await openDropdown(user);
    expect(menu.getByText('Libraries')).toBeInTheDocument();
    expect(menu.getByLabelText('Library Admin')).toBeInTheDocument();
    expect(menu.getByLabelText('Library User')).toBeInTheDocument();
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByLabelText('Course Admin')).not.toBeInTheDocument();
  });

  it('shows both course and library groups when both role types are present', async () => {
    const user = userEvent.setup();
    renderWrapper(<RolesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(menu.getByText('Courses')).toBeInTheDocument();
    expect(menu.getByText('Libraries')).toBeInTheDocument();
  });

  it('shows no role options when there are no rows', async () => {
    const user = userEvent.setup();
    renderWrapper(<RolesFilter {...defaultProps} preFilteredRows={[]} />);
    const menu = await openDropdown(user);
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByText('Libraries')).not.toBeInTheDocument();
  });

  it('renders safely when preFilteredRows is not provided', async () => {
    const user = userEvent.setup();
    const { preFilteredRows, ...standaloneProps } = defaultProps;
    renderWrapper(<RolesFilter {...standaloneProps} />);
    const menu = await openDropdown(user);
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByText('Libraries')).not.toBeInTheDocument();
  });
});
