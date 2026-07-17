import {
  useCallback,
  useContext, useEffect, useMemo, useState,
} from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';
import {
  Alert, Container, DataTable,
} from '@openedx/paragon';
import TableFooter from '@src/authz-module/components/TableFooter/TableFooter';
import {
  AUTHZ_HOME_PATH, TABLE_DEFAULT_PAGE_SIZE, TABLE_MAX_SUPPORTED_RECORDS,
} from '@src/authz-module/constants';
import AuthZLayout from '@src/authz-module/components/AuthZLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserAccount, useValidateUserPermissionsNonSuspense } from '@src/data/hooks';
import { LIBRARY_ROLE_KEYS } from '@src/authz-module/roles-permissions';
import { useViewTeamPermissions } from '@src/authz-module/hooks/useViewTeamPermissions';
import baseMessages from '@src/authz-module/messages';
import AddRoleButton from '@src/authz-module/components/AddRoleButton';
import {
  OrgCell, RoleCell, ScopeCell, PermissionsCell, ViewAllPermissionsCell,
  createActionsCell,
} from '@src/authz-module/components/TableCells';
import { useCourseAuthoringFlag } from '@src/authz-module/hooks/useCourseAuthoringFlag';
import { useRevokeUserRoles, useUserAssignedRoles } from '@src/authz-module/data/hooks';
import { RoleToDelete } from '@src/types';
import { useToastManager } from '@src/components/ToastManager/ToastManagerContext';
import UserPermissions from '@src/authz-module/components/UserPermissions';
import OrgFilter from '@src/authz-module/components/TableControlBar/OrgFilter';
import RolesFilter from '@src/authz-module/components/TableControlBar/RolesFilter';
import TableControlBar from '@src/authz-module/components/TableControlBar/TableControlBar';
import messages from './messages';
import ConfirmDeletionModal from '../components/ConfirmDeletionModal';
import { getCellHeader, getScopeManageActionPermission } from '../utils';

// Stable fallback while the query has no data yet: a fresh object here would give
// react-table a new `data` identity on every render, retriggering its auto-reset
// effects in an endless render loop.
const EMPTY_ASSIGNMENTS = { results: [], count: 0 };

// Keep active filters and sorting when the assignments list is refetched
// (e.g. after a role revocation invalidates the query).
const TABLE_OPTIONS = { autoResetFilters: false, autoResetSortBy: false };

const AuditUserPage = () => {
  const { formatMessage } = useIntl();
  const [columnsWithFiltersApplied, setColumnsWithFiltersApplied] = useState<string[]>([]);
  const { username } = useParams();
  const { authenticatedUser } = useContext(AppContext);
  const navigate = useNavigate();
  const {
    isLoading: isLoadingUser, data: user, isError: isErrorUser, error: errorUser,
  } = useUserAccount(username);
  const { isCourseViewAllowed } = useViewTeamPermissions();
  const { isCourseEnabled } = useCourseAuthoringFlag();

  const {
    isLoading: isLoadingUserAssignments, data: { results: userAssignments, count } = EMPTY_ASSIGNMENTS,
  } = useUserAssignedRoles(username, isCourseViewAllowed ? undefined : LIBRARY_ROLE_KEYS);
  const [roleToDelete, setRoleToDelete] = useState<RoleToDelete | null>(null);
  const [showConfirmDeletionModal, setShowConfirmDeletionModal] = useState(false);
  const {
    showToast, showErrorToast, Bold, Br,
  } = useToastManager();
  const { mutate: revokeUserRoles, isPending: isRevokingUserRolePending } = useRevokeUserRoles();

  // Hide course rows whose course-authoring flag is disabled; libraries and
  // Django-managed roles are never flag-gated.
  const visibleAssignments = useMemo(
    () => userAssignments.filter((assignment) => !assignment.scope?.startsWith('course') || isCourseEnabled(assignment.scope)),
    [userAssignments, isCourseEnabled],
  );

  const deletePermissions = useMemo(() => {
    const uniqueScopes = [...new Set(visibleAssignments.map(assignment => assignment.scope))];
    return uniqueScopes.map(scope => getScopeManageActionPermission(scope));
  }, [visibleAssignments]);

  const {
    data: permissionsToManageScope,
  } = useValidateUserPermissionsNonSuspense(deletePermissions);

  const rowsWithPermissions = useMemo(() => {
    if (!permissionsToManageScope) { return visibleAssignments; }

    return visibleAssignments.map(assignment => {
      const canManageScope = permissionsToManageScope.some(
        permission => permission.scope === assignment.scope && permission.allowed,
      );
      return {
        ...assignment,
        canManageScope,
      };
    });
  }, [visibleAssignments, permissionsToManageScope]);

  useEffect(() => {
    if (!user && !isLoadingUser) {
      // @ts-ignore
      if (!isErrorUser || errorUser?.customAttributes?.httpErrorStatus === 404) {
        navigate(AUTHZ_HOME_PATH);
      }
    }
  }, [user, isLoadingUser, navigate, isErrorUser, errorUser]);

  const handleShowConfirmDeletionModal = useCallback((role: RoleToDelete) => {
    if (isRevokingUserRolePending) { return; }

    setRoleToDelete(role);
    setShowConfirmDeletionModal(true);
  }, [isRevokingUserRolePending]);

  const navLinks = useMemo(() => [
    {
      label: formatMessage(baseMessages['authz.management.home.nav.link']),
      to: AUTHZ_HOME_PATH,
    },
  ], [formatMessage]);

  const additionalColumns = useMemo(() => [
    {
      id: 'view_permissions',
      Header: '',
      Cell: ViewAllPermissionsCell,
    },
    {
      id: 'action',
      Header: formatMessage(messages['authz.user.table.action.column.header']),
      Cell: createActionsCell({
        onClickDeleteButton: handleShowConfirmDeletionModal,
        isUserAuthenticatedPage: username === authenticatedUser?.username,
      }),
    },
  ], [authenticatedUser?.username, formatMessage, handleShowConfirmDeletionModal, username]);

  const columns = useMemo(() => [
    {
      Header: getCellHeader('role', formatMessage(messages['authz.user.table.role.column.header']), columnsWithFiltersApplied),
      accessor: 'role',
      Cell: RoleCell,
      filter: 'includesValue',
      Filter: RolesFilter,
      filterButtonText: formatMessage(messages['authz.user.table.role.column.header']),
      filterOrder: 2,
    },
    {
      Header: getCellHeader('org', formatMessage(messages['authz.user.table.organization.column.header']), columnsWithFiltersApplied),
      accessor: 'org',
      Cell: OrgCell,
      filter: 'includesValue',
      Filter: OrgFilter,
      filterButtonText: formatMessage(messages['authz.user.table.organization.column.header']),
      filterOrder: 1,
    },
    {
      Header: getCellHeader('scope', formatMessage(messages['authz.user.table.scope.column.header']), columnsWithFiltersApplied),
      accessor: 'scope',
      Cell: ScopeCell,
      disableFilters: true,

    },
    {
      Header: formatMessage(messages['authz.user.table.permissions.column.header']),
      Cell: PermissionsCell,
      disableFilters: true,
      disableSortBy: true,
    },
  ], [formatMessage, columnsWithFiltersApplied]);

  const handleCloseConfirmDeletionModal = () => {
    setRoleToDelete(null);
    setShowConfirmDeletionModal(false);
  };

  const handleRevokeUserRole = () => {
    if (!user || !roleToDelete) { return; }

    const data = {
      users: user.username,
      role: roleToDelete.role,
      scope: roleToDelete.scope,
    };

    const runRevokeRole = (variables) => {
      revokeUserRoles(variables, {
        onSuccess: (response) => {
          const { errors } = response;

          if (errors.length) {
            showToast({
              type: 'error',
              message: formatMessage(
                baseMessages['authz.team.toast.default.error.message'],
                { Bold, Br },
              ),
            });
            return;
          }

          const remainingRolesCount = count ? count - 1 : 0;
          showToast({
            message: formatMessage(
              baseMessages['authz.team.remove.user.toast.success.description'],
              {
                role: roleToDelete.name ?? roleToDelete.role,
                rolesCount: remainingRolesCount,
              },
            ),
            type: 'success',
          });
          handleCloseConfirmDeletionModal();
          if (remainingRolesCount === 0) {
            navigate(AUTHZ_HOME_PATH);
          }
        },
        onError: (error, retryVariables) => {
          showErrorToast(error, () => runRevokeRole(retryVariables));
        },
      });
    };

    runRevokeRole({ data });
  };

  return (
    <div className="authz-module">
      <ConfirmDeletionModal
        isOpen={showConfirmDeletionModal}
        close={handleCloseConfirmDeletionModal}
        onSave={handleRevokeUserRole}
        isDeleting={isRevokingUserRolePending}
        context={{
          userName: user?.username || '',
          scope: roleToDelete?.scope || '',
          role: roleToDelete?.role || '',
          name: roleToDelete?.name || '',
          rolesCount: count || 0,
        }}
      />
      <AuthZLayout
        context={{
          id: '',
          org: '',
          title: '',
        }}
        navLinks={navLinks}
        activeLabel={user?.username || ''}
        pageTitle={user?.username || ''}
        pageSubtitle={user?.email || ''}
        actions={
          [
            <AddRoleButton presetUsername={user?.username} key="add-role-button" />,
          ]
        }
      >
        <Container className="bg-light-200 p-5">
          {count > TABLE_MAX_SUPPORTED_RECORDS && (
            <Alert variant="warning">
              {formatMessage(baseMessages['authz.table.max.records.warning'], {
                maxRecords: TABLE_MAX_SUPPORTED_RECORDS,
                count,
              })}
            </Alert>
          )}
          <DataTable
            isPaginated
            isFilterable
            isSortable
            data={rowsWithPermissions}
            itemCount={rowsWithPermissions.length}
            initialState={{ pageSize: TABLE_DEFAULT_PAGE_SIZE }}
            initialTableOptions={TABLE_OPTIONS}
            additionalColumns={additionalColumns}
            columns={columns}
            isLoading={isLoadingUserAssignments}
            isExpandable
            renderRowSubComponent={({ row }) => (
              <UserPermissions row={row} />
            )}
          >
            <TableControlBar onFilterChange={setColumnsWithFiltersApplied} />
            <DataTable.Table />
            <TableFooter />
          </DataTable>

        </Container>
      </AuthZLayout>
    </div>
  );
};

export default AuditUserPage;
