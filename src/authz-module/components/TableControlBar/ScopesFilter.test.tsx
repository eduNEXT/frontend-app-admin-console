import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapper } from '@src/setupTest';
import ScopesFilter from './ScopesFilter';

const rowsWithScopes = (scopes: string[]) => scopes.map((scope) => ({ values: { scope } }));

describe('ScopesFilter', () => {
  const defaultProps = {
    filterButtonText: 'Scopes',
    filterValue: [],
    setFilter: jest.fn(),
    disabled: false,
    id: 'scope',
    preFilteredRows: rowsWithScopes(['course-v1:org+course+run', 'lib:org:library']),
  };

  const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /Scopes/i }));
    return within(await screen.findByRole('group', { name: 'Scopes' }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWrapper(<ScopesFilter {...defaultProps} />);
    expect(screen.getByText('Scopes')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    renderWrapper(<ScopesFilter {...defaultProps} disabled />);
    expect(screen.getByText('Scopes')).toBeInTheDocument();
  });

  it('displays filter button text', () => {
    renderWrapper(<ScopesFilter {...defaultProps} filterButtonText="Select Scopes" />);
    expect(screen.getByText('Select Scopes')).toBeInTheDocument();
  });

  it('lists the scopes present in the table rows grouped by type', async () => {
    const user = userEvent.setup();
    renderWrapper(<ScopesFilter {...defaultProps} />);
    const menu = await openDropdown(user);
    expect(menu.getByText('Courses')).toBeInTheDocument();
    expect(menu.getByText('Libraries')).toBeInTheDocument();
    expect(menu.getByLabelText('course-v1:org+course+run')).toBeInTheDocument();
    expect(menu.getByLabelText('lib:org:library')).toBeInTheDocument();
  });

  it('excludes global (non course/library) scopes from the choices', async () => {
    const user = userEvent.setup();
    renderWrapper(
      <ScopesFilter {...defaultProps} preFilteredRows={rowsWithScopes(['lib:org:library', 'global'])} />,
    );
    const menu = await openDropdown(user);
    expect(menu.getByLabelText('lib:org:library')).toBeInTheDocument();
    expect(menu.queryByLabelText('global')).not.toBeInTheDocument();
  });

  it('deduplicates scopes that appear in several rows', async () => {
    const user = userEvent.setup();
    renderWrapper(
      <ScopesFilter {...defaultProps} preFilteredRows={rowsWithScopes(['lib:org:library', 'lib:org:library'])} />,
    );
    const menu = await openDropdown(user);
    expect(menu.getAllByLabelText('lib:org:library')).toHaveLength(1);
  });

  it('filters the choices with the search input', async () => {
    const user = userEvent.setup();
    renderWrapper(<ScopesFilter {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Scopes/i }));
    const searchInput = screen.getAllByRole('textbox')[0];
    await user.type(searchInput, 'lib:');
    const menu = within(await screen.findByRole('group', { name: 'Scopes' }));
    expect(menu.getByLabelText('lib:org:library')).toBeInTheDocument();
    expect(menu.queryByLabelText('course-v1:org+course+run')).not.toBeInTheDocument();
  });

  it('calls setFilter with the selected scope when a scope is checked', async () => {
    const user = userEvent.setup();
    const setFilter = jest.fn();
    renderWrapper(<ScopesFilter {...defaultProps} setFilter={setFilter} />);
    const menu = await openDropdown(user);
    await user.click(menu.getByLabelText('lib:org:library'));
    expect(setFilter).toHaveBeenCalledWith(
      ['lib:org:library'],
      expect.objectContaining({ value: 'lib:org:library' }),
    );
  });

  it('renders safely when preFilteredRows is not provided', async () => {
    const user = userEvent.setup();
    const { preFilteredRows, ...standaloneProps } = defaultProps;
    renderWrapper(<ScopesFilter {...standaloneProps} />);
    const menu = await openDropdown(user);
    expect(menu.queryByText('Courses')).not.toBeInTheDocument();
    expect(menu.queryByText('Libraries')).not.toBeInTheDocument();
  });
});
