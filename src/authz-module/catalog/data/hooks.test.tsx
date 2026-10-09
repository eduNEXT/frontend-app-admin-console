import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClientWrapper, mockHttpClient } from '@src/testUtils';
import { CATALOG_PAGE_SIZE, SCOPE_TYPES, VIEW_TEAM_ACTIONS } from '../constants';
import { useAuthzCatalog } from './hooks';

jest.mock('@openedx/frontend-base', () => ({
  ...jest.requireActual('@openedx/frontend-base'),
  getAuthenticatedHttpClient: jest.fn(),
}));

interface MockApiOptions {
  course?: boolean;
  library?: boolean;
  isPermissionsPending?: boolean;
}

// Answers validate/me with the given view-team permissions, and the catalog endpoint with an
// empty catalog of the scope types that were requested.
const mockApi = ({ course = false, library = false, isPermissionsPending = false }: MockApiOptions) => {
  const post = jest.fn(() => (isPermissionsPending ? new Promise(() => {}) : Promise.resolve({
    data: [
      { action: VIEW_TEAM_ACTIONS[SCOPE_TYPES.COURSE], allowed: course },
      { action: VIEW_TEAM_ACTIONS[SCOPE_TYPES.LIBRARY], allowed: library },
    ],
  })));
  const get = jest.fn((url: URL) => Promise.resolve({
    data: {
      count: 0,
      next: null,
      previous: null,
      scope_types: url.searchParams.get('scope_types')?.split(','),
      categories: [],
      permissions: [],
      results: [],
    },
  }));
  mockHttpClient().mockReturnValue({ get, post });
  return { get, post };
};

const renderUseAuthzCatalog = () => renderHook(() => useAuthzCatalog(), { wrapper: createQueryClientWrapper() });

describe('useAuthzCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the catalog of every scope type the user can view', async () => {
    mockApi({ course: true, library: true });

    const { result } = renderUseAuthzCatalog();

    await waitFor(() => expect(result.current.data?.scopeTypes).toEqual(['course-v1', 'lib']));
  });

  it('fetches only the library catalog when the user can only view library teams', async () => {
    mockApi({ library: true });

    const { result } = renderUseAuthzCatalog();

    await waitFor(() => expect(result.current.data?.scopeTypes).toEqual(['lib']));
  });

  it('is loading while the view permissions are being resolved', () => {
    const { get } = mockApi({ isPermissionsPending: true });

    const { result } = renderUseAuthzCatalog();

    expect(result.current.isLoading).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it('does not fetch a catalog when the user cannot view any team', async () => {
    const { get } = mockApi({});

    const { result } = renderUseAuthzCatalog();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });

  it('lists the roles of every page, in order, when they do not fit in one page', async () => {
    const { post } = mockApi({ library: true });
    // Three pages of roles, one role in each.
    const get = jest.fn((url: URL) => {
      const page = Number(url.searchParams.get('page'));
      return Promise.resolve({
        data: {
          count: CATALOG_PAGE_SIZE * 2 + 1,
          next: page < 3 ? 'next-page' : null,
          previous: null,
          scope_types: ['lib'],
          categories: [],
          permissions: [],
          results: [{
            role: `role_page_${page}`, display_name: '', description: '', icon: null, definition_kind: 'static', permissions: [],
          }],
        },
      });
    });
    mockHttpClient().mockReturnValue({ get, post });

    const { result } = renderUseAuthzCatalog();

    await waitFor(() => expect(
      result.current.data?.roles.map(({ role }) => role),
    ).toEqual(['role_page_1', 'role_page_2', 'role_page_3']));
  });
});
