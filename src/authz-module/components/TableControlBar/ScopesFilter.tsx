import { useMemo, useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { LocationOn } from '@openedx/paragon/icons';
import { FilterColumnProps, MultipleChoiceFilterProps } from './types';
import MultipleChoiceFilter from './MultipleChoiceFilter';
import { RESOURCE_ICONS } from '../constants';
import messages from '../messages';

type ScopesFilterProps = Omit<MultipleChoiceFilterProps, 'filterChoices' | 'isSearchable' | 'onSearchChange'>
& FilterColumnProps;

const ScopesFilter = ({
  filterButtonText, filterValue, setFilter, disabled, preFilteredRows, id,
}: ScopesFilterProps) => {
  const { formatMessage } = useIntl();
  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);

  // Offer only the scopes present in the table rows (react-table's preFilteredRows),
  // so the choices always match the data being filtered. Global (Django-managed)
  // scopes are not offered, mirroring the scope list API this filter used to query.
  const filterChoices = useMemo(() => {
    const search = searchValue?.toLowerCase();
    return [...new Set((preFilteredRows ?? []).map((row) => row.values[id ?? 'scope']))]
      .filter((scope) => scope?.startsWith('lib') || scope?.startsWith('course'))
      .filter((scope) => !search || scope.toLowerCase().includes(search))
      .sort()
      .map((scope) => {
        const isLibrary = scope.startsWith('lib');
        return {
          displayName: scope,
          value: scope,
          groupName: formatMessage(isLibrary
            ? messages['authz.team.members.table.group.libraries']
            : messages['authz.team.members.table.group.courses']),
          groupIcon: isLibrary ? RESOURCE_ICONS.LIBRARY : RESOURCE_ICONS.COURSE,
        };
      });
  }, [preFilteredRows, id, searchValue, formatMessage]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  return (
    <MultipleChoiceFilter
      filterButtonText={filterButtonText}
      filterChoices={filterChoices}
      filterValue={filterValue}
      setFilter={setFilter}
      isSearchable
      isGrouped
      onSearchChange={handleSearchChange}
      iconSrc={LocationOn}
      disabled={disabled}
    />
  );
};

export default ScopesFilter;
