// Scope types as the catalog API names them (the namespace of the scope keys).
export const SCOPE_TYPES = {
  COURSE: 'course-v1',
  LIBRARY: 'lib',
} as const;

// Permission the user needs to view the teams of each scope type, and so its catalog.
export const VIEW_TEAM_ACTIONS: Record<string, string> = {
  [SCOPE_TYPES.COURSE]: 'courses.view_course_team',
  [SCOPE_TYPES.LIBRARY]: 'content_libraries.view_library_team',
};

// Permission the user needs to manage the teams of each scope type, and so assign its roles.
export const MANAGE_TEAM_ACTIONS: Record<string, string> = {
  [SCOPE_TYPES.COURSE]: 'courses.manage_course_team',
  [SCOPE_TYPES.LIBRARY]: 'content_libraries.manage_library_team',
};

// Validate/me requests for those permissions. Every consumer sends them in the same order
// (libraries first), so they share one query.
export const VIEW_TEAM_PERMISSIONS: { action: string }[] = [
  { action: VIEW_TEAM_ACTIONS[SCOPE_TYPES.LIBRARY] },
  { action: VIEW_TEAM_ACTIONS[SCOPE_TYPES.COURSE] },
];

export const MANAGE_TEAM_PERMISSIONS: { action: string }[] = [
  { action: MANAGE_TEAM_ACTIONS[SCOPE_TYPES.LIBRARY] },
  { action: MANAGE_TEAM_ACTIONS[SCOPE_TYPES.COURSE] },
];

// Maximum page size accepted by the catalog API.
export const CATALOG_PAGE_SIZE = 100;
