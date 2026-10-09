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

// Maximum page size accepted by the catalog API.
export const CATALOG_PAGE_SIZE = 100;
