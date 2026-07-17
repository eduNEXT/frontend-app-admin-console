import { useEffect, useMemo, useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert,
  DataTable,
  TextFilter,
} from '@openedx/paragon';

import { useToastManager } from '@src/components/ToastManager/ToastManagerContext';
import { LIBRARY_ROLE_KEYS } from '@src/authz-module/roles-permissions';
import { useViewTeamPermissions } from '@src/authz-module/hooks/useViewTeamPermissions';
import { useCourseAuthoringFlag } from '@src/authz-module/hooks/useCourseAuthoringFlag';
import OrgFilter from '@src/authz-module/components/TableControlBar/OrgFilter';
import RolesFilter from '@src/authz-module/components/TableControlBar/RolesFilter';
import ScopesFilter from '@src/authz-module/components/TableControlBar/ScopesFilter';
import TableControlBar from '@src/authz-module/components/TableControlBar/TableControlBar';
import { getCellHeader } from '@src/authz-module/utils';
import {
  ViewActionCell, NameCell, OrgCell, RoleCell, ScopeCell,
} from '@src/authz-module/components/TableCells';
import { useAllRoleAssignments } from '@src/authz-module/data/hooks';
import { TABLE_DEFAULT_PAGE_SIZE, TABLE_MAX_SUPPORTED_RECORDS } from '@src/authz-module/constants';
import baseMessages from '@src/authz-module/messages';
import type { UserRole } from '@src/types';
import messages from './messages';
import TableFooter from '../components/TableFooter/TableFooter';

interface TeamMembersTableProps {
  presetScope?: string;
}

// Stable fallback while the query has no data yet: a fresh object here would give
// react-table a new `data` identity on every render, retriggering its auto-reset
// effects in an endless render loop.
const EMPTY_ASSIGNMENTS = { results: [], count: 0 };

// Keep active filters and sorting when the assignments list is refetched
// (e.g. after a role assignment or revocation invalidates the query).
const TABLE_OPTIONS = { autoResetFilters: false, autoResetSortBy: false };

// Client-side filter for the Name column: matches username, full name, or email,
// mirroring the fields the old server-side `search` parameter covered.
const filterByUserText = (
  rows: Array<{ original: UserRole }>,
  _columnIds: string[],
  filterValue: string,
) => {
  const search = String(filterValue).toLowerCase();
  return rows.filter(({ original }) => [original.username, original.fullName, original.email]
    .some((value) => value?.toLowerCase().includes(search)));
};

const TeamMembersTable = ({ presetScope }: TeamMembersTableProps) => {
  const intl = useIntl();
  const { showErrorToast } = useToastManager();
  const [columnsWithFiltersApplied, setColumnsWithFiltersApplied] = useState<string[]>([]);

  const { isCourseViewAllowed, isLibraryViewAllowed } = useViewTeamPermissions();
  const { isCourseEnabled } = useCourseAuthoringFlag();

  const {
    data: { results, count } = EMPTY_ASSIGNMENTS,
    isLoading: isLoadingAllRoleAssignments,
    error,
    refetch,
  } = useAllRoleAssignments(
    isCourseViewAllowed ? undefined : LIBRARY_ROLE_KEYS,
    isCourseViewAllowed || isLibraryViewAllowed,
  );

  // Hide course rows whose course-authoring flag is disabled; libraries and
  // Django-managed roles are never flag-gated.
  const roleAssignments = useMemo(
    () => results.filter((assignment) => !assignment.scope?.startsWith('course') || isCourseEnabled(assignment.scope)),
    [results, isCourseEnabled],
  );

  const initialFilters = presetScope ? [{ id: 'scope', value: [presetScope] }] : [];

  useEffect(() => {
    if (error) {
      showErrorToast(error, refetch);
    }
  }, [error, showErrorToast, refetch]);

  return (
    <div className="authz-module">
      {count > TABLE_MAX_SUPPORTED_RECORDS && (
        <Alert variant="warning">
          {intl.formatMessage(baseMessages['authz.table.max.records.warning'], {
            maxRecords: TABLE_MAX_SUPPORTED_RECORDS,
            count,
          })}
        </Alert>
      )}
      <DataTable
        isFilterable
        isPaginated
        isSortable
        numBreakoutFilters={4}
        data={roleAssignments}
        itemCount={roleAssignments.length}
        initialState={{ pageSize: TABLE_DEFAULT_PAGE_SIZE, filters: initialFilters }}
        initialTableOptions={TABLE_OPTIONS}
        isLoading={isLoadingAllRoleAssignments}
        additionalColumns={[
          {
            id: 'action',
            Header: intl.formatMessage(messages['authz.team.members.table.column.actions.title']),
            Cell: ViewActionCell,
          },
        ]}
        columns={
            [
              {
                id: 'username',
                Header: intl.formatMessage(messages['authz.team.members.table.column.name.title']),
                accessor: 'username',
                Cell: NameCell,
                filter: filterByUserText,
                Filter: TextFilter,
                filterOrder: 1,
              },
              {
                Header: intl.formatMessage(messages['authz.team.members.table.column.email.title']),
                accessor: 'email',
                disableFilters: true,
                filter: 'text',
                Filter: TextFilter,
              },
              {
                Header: getCellHeader('org', intl.formatMessage(messages['authz.team.members.table.column.organization.title']), columnsWithFiltersApplied),
                accessor: 'org',
                Cell: OrgCell,
                filter: 'includesValue',
                Filter: OrgFilter,
                filterButtonText: intl.formatMessage(messages['authz.team.members.table.column.organization.title']),
                filterOrder: 2,
              },
              {
                Header: getCellHeader('scope', intl.formatMessage(messages['authz.team.members.table.column.scope.title']), columnsWithFiltersApplied),
                accessor: 'scope',
                Cell: ScopeCell,
                filter: 'includesValue',
                Filter: ScopesFilter,
                filterButtonText: intl.formatMessage(messages['authz.team.members.table.column.scope.title']),
                filterOrder: 4,
              },
              {
                Header: getCellHeader('role', intl.formatMessage(messages['authz.team.members.table.column.role.title']), columnsWithFiltersApplied),
                accessor: 'role',
                filter: 'includesValue',
                Cell: RoleCell,
                Filter: RolesFilter,
                filterButtonText: intl.formatMessage(messages['authz.team.members.table.column.role.title']),
                filterOrder: 3,
              },
            ]
        }
      >
        <TableControlBar onFilterChange={setColumnsWithFiltersApplied} />
        <DataTable.Table />
        <TableFooter />
      </DataTable>
    </div>
  );
};

export default TeamMembersTable;
