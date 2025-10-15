import { useIntl } from '@edx/frontend-platform/i18n';
import { Tab, Tabs } from '@openedx/paragon';
import { useLibrary } from '@src/authz-module/data/hooks';
import TeamTable from './components/TeamTable';
import AuthZLayout from '../components/AuthZLayout';
import { AddNewTeamMemberTrigger } from './components/AddNewTeamMemberModal';
import { useLibraryAuthZ } from './context';

import messages from './messages';
import { useLocation } from 'react-router-dom';

const LibrariesTeamManager = () => {
  const intl = useIntl();
  const location = useLocation();
  const hash = location.hash; const { libraryId, canManageTeam } = useLibraryAuthZ();
  const { data: library } = useLibrary(libraryId);
  const rootBradecrumb = intl.formatMessage(messages['library.authz.breadcrumb.root']) || '';
  const pageTitle = intl.formatMessage(messages['library.authz.manage.page.title']);
  return (
    <div className="authz-libraries">
      <AuthZLayout
        context={{ id: libraryId, title: library.title, org: library.org }}
        navLinks={[{ label: rootBradecrumb }]}
        activeLabel={pageTitle}
        pageTitle={pageTitle}
        pageSubtitle={libraryId}
        actions={
          canManageTeam
            ? [<AddNewTeamMemberTrigger libraryId={libraryId} />]
            : []
        }
      >
        <Tabs
          variant="tabs"
          defaultActiveKey={ hash ? 'permissions' : 'team'}
          className="bg-light-100 px-5"
        >
          <Tab eventKey="team" title={intl.formatMessage(messages['library.authz.tabs.team'])} className="p-5">
            <TeamTable />
          </Tab>
          <Tab eventKey="roles" title={intl.formatMessage(messages['library.authz.tabs.roles'])}>
            Role tab.
          </Tab>
          <Tab id="libraries-permissions-tab" eventKey="permissions" title={intl.formatMessage(messages['library.authz.tabs.permissions'])}>
            Permissions tab.
          </Tab>
        </Tabs>
      </AuthZLayout>
    </div>
  );
};

export default LibrariesTeamManager;
