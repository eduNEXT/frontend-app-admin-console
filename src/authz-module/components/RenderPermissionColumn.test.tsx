import { screen, within } from '@testing-library/react';
import type { CategoryPermissions, Permission } from '@src/authz-module/catalog';
import { renderWrapper } from '@src/testUtils';
import RenderPermissionColumn from './RenderPermissionColumn';

const buildPermission = (id: string, displayName: string, categoryId: string): Permission => ({
  id, displayName, description: '', icon: null, categoryId, scopeTypes: ['course-v1'],
});

const items: CategoryPermissions[] = [
  {
    category: {
      id: 'course', displayName: 'Course access & content', description: '', icon: null,
    },
    permissions: [
      buildPermission('courses.view_course', 'View course', 'course'),
      buildPermission('courses.edit_course_content', 'Edit content', 'course'),
    ],
  },
  {
    category: {
      id: 'course_team', displayName: 'Team', description: '', icon: null,
    },
    permissions: [buildPermission('courses.view_course_team', 'View team', 'course_team')],
  },
];

describe('RenderPermissionColumn', () => {
  it('shows each category with its permissions', () => {
    renderWrapper(<RenderPermissionColumn items={items} />);

    const [courseList, teamList] = screen.getAllByRole('list');
    expect(screen.getByRole('heading', { name: 'Course access & content' })).toBeInTheDocument();
    expect(within(courseList).getAllByRole('listitem').map(({ textContent }) => textContent)).toEqual([
      'View course', 'Edit content',
    ]);
    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument();
    expect(within(teamList).getByText('View team')).toBeInTheDocument();
  });

  it('shows nothing when there are no categories', () => {
    renderWrapper(<RenderPermissionColumn items={[]} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
