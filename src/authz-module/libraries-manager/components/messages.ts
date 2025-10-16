import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
 'library.authz.team.remove.user.modal.title': {
    id: 'library.authz.team.remove.user.modal.title',
    defaultMessage: 'Remove role?',
    description: 'Libraries team management remove user modal title',
  },
  'library.authz.team.remove.user.modal.body.1': {
    id: 'library.authz.team.remove.user.modal.body',
    defaultMessage: 'Are you sure you want to remove the {role} role from the user “{userName}” in the library {scope}?',
    description: 'Libraries team management remove user modal body',
  },
  'library.authz.team.remove.user.modal.body.2': {
    id: 'library.authz.team.remove.user.modal.body',
    defaultMessage: "This is the user's only role in this library. Removing it will revoke their access completely, and they will no longer appear in the library's member List.",
    description: 'Libraries team management remove user modal body',
  },
  'library.authz.team.remove.user.modal.body.3': {
    id: 'library.authz.team.remove.user.modal.body',
    defaultMessage: 'Are you sure you want to proceed?',
    description: 'Libraries team management remove user modal body',
  },
  'libraries.authz.manage.cancel.button': {
    id: 'libraries.authz.manage.cancel.button',
    defaultMessage: 'Cancel',
    description: 'Libraries AuthZ cancel button title',
  },
  'libraries.authz.manage.removing.button': {
    id: 'libraries.authz.manage.removing.button',
    defaultMessage: 'Removing...',
    description: 'Libraries AuthZ removing button title',
  },
  'libraries.authz.manage.remove.button': {
    id: 'libraries.authz.manage.remove.button',
    defaultMessage: 'Remove',
    description: 'Libraries AuthZ remove button title',
  },
  'libraries.authz.manage.saving.button': {
    id: 'libraries.authz.manage.saving.button',
    defaultMessage: 'Saving...',
    description: 'Libraries AuthZ saving button title',
  },
  'libraries.authz.manage.save.button': {
    id: 'libraries.authz.manage.save.button',
    defaultMessage: 'Save',
    description: 'Libraries AuthZ save button title',
  },
});

export default messages;
