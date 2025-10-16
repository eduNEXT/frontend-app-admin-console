import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Container } from '@openedx/paragon';
import { ROUTES } from '@src/authz-module/constants';
import { Role } from 'types';
import AuthZLayout from '../components/AuthZLayout';
import { useLibraryAuthZ } from './context';
import RoleCard from '../components/RoleCard';
import { AssignNewRoleTrigger } from './components/AssignNewRoleModal';
import { buildPermissionMatrixByRole } from './utils';
import { useLibrary, useRevokeUserRoles, useTeamMembers } from '../data/hooks';

import messages from './messages';
import ConfirmDeletionModal from './components/ConfirmDeletionModal';

const LibrariesUserManager = () => {
  const intl = useIntl();
 // const { username } = useParams();
 const location = useLocation();
  const navigate = useNavigate();
  const { username } = useParams();
  const {
    libraryId, permissions, roles, resources, canManageTeam,
  } = useLibraryAuthZ();
  const { data: library } = useLibrary(libraryId);
  const { mutate: revokeUserRoles, isPending: isRevokingUserRole } = useRevokeUserRoles();
  const rootBreadcrumb = intl.formatMessage(messages['library.authz.breadcrumb.root']) || '';
  const pageManageTitle = intl.formatMessage(messages['library.authz.manage.page.title']);
  const teamMembersPath = `/authz/${ROUTES.LIBRARIES_TEAM_PATH.replace(':libraryId', libraryId)}`;

  //const { data: teamMembers } = useTeamMembers(libraryId);
  //console.log(teamMembers)
  //const user = teamMembers?.find(member => member.username === username);
  const user = location?.state?.user;
  console.log(user)
  const [roleToDelete, setRoleToDelete] = useState('');
  const [showConfirmDeletionModal, setShowConfirmDeletionModal] = useState(false);

  const userRoles = useMemo(() => {
    const assignedRoles = roles.filter(role => user?.roles.includes(role.role));
    return buildPermissionMatrixByRole({
      roles: assignedRoles, permissions, resources, intl,
    });
  }, [roles, user?.roles, permissions, resources, intl]);

  const handleCloseConfirmDeletionModal = () => {
    setShowConfirmDeletionModal(false);
    setRoleToDelete('');
  };

  const handleShowConfirmDeletionModal = (role: Pick<Role, 'name' | 'role'>) => {
    setRoleToDelete(role.name);
    setShowConfirmDeletionModal(true);
  };

  const handleRevokeUserRole = (role: string) => {
    if (user) {
      const data = {
        users: user.username,
        role: roles.find(r => r.name === role)!.role,
        scope: libraryId,
      };

      revokeUserRoles({ data }, {
        onSuccess: () => {
          handleCloseConfirmDeletionModal();
        },
      });
    }
  };

  // useEffect(() => {
  //   if (!isLoadingTeamMembers && !userRoles.length) {
  //     navigate(teamMembersPath);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [userRoles, libraryId]);

  return (
    <div className="authz-libraries">
      <ConfirmDeletionModal
        isOpen={showConfirmDeletionModal}
        close={handleCloseConfirmDeletionModal}
        onSave={() => handleRevokeUserRole(roleToDelete)}
        isDeleting={isRevokingUserRole}
        context={{
          userName: user?.username || '',
          scope: library.title,
          role: roleToDelete,
          rolesCount: userRoles.length,
        }}
      />

      <AuthZLayout
        context={{ id: libraryId, title: library.title, org: library.org }}
        navLinks={[{ label: rootBreadcrumb }, { label: pageManageTitle, to: teamMembersPath }]}
        activeLabel={user?.username || ''}
        pageTitle={user?.username || ''}
        pageSubtitle={<p>{user?.email}</p>}
        actions={user && canManageTeam
          ? [<AssignNewRoleTrigger
              username={user.username}
              libraryId={libraryId}
              currentUserRoles={userRoles.map(role => role.role)}
          />]
          : []}
      >
        <Container className="bg-light-200 p-5">
          {userRoles && userRoles.map(role => (
            <RoleCard
              key={`${role}-${user.username}`}
              title={role.name}
              objectName={library.title}
              description={role.description}
              permissionsByResource={role.resources as any[]}
              handleDelete={() => handleShowConfirmDeletionModal(role)}
            />
          ))}
        </Container>
      </AuthZLayout>
    </div>
  );
};

export default LibrariesUserManager;
