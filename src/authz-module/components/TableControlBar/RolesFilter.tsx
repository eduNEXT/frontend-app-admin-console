import { useMemo } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Person } from '@openedx/paragon/icons';
import MultipleChoiceFilter from './MultipleChoiceFilter';
import { FilterColumnProps, MultipleChoiceFilterProps } from './types';
import { getRolesFiltersOptions } from '../constants';

type RolesFilterProps = Omit<MultipleChoiceFilterProps, 'filterChoices' | 'isSearchable' | 'onSearchChange'>
& FilterColumnProps;

const RolesFilter = ({
  filterButtonText, filterValue, setFilter, disabled, preFilteredRows, id,
}: RolesFilterProps) => {
  const intl = useIntl();

  // Offer only the roles present in the table rows (react-table's preFilteredRows),
  // so the choices always match the data being filtered.
  const rolesOptions = useMemo(() => {
    const presentRoles = new Set((preFilteredRows ?? []).map((row) => row.values[id ?? 'role']));
    return getRolesFiltersOptions(intl).filter((option) => presentRoles.has(option.value));
  }, [intl, preFilteredRows, id]);

  return (
    <MultipleChoiceFilter
      filterButtonText={filterButtonText}
      filterChoices={rolesOptions}
      filterValue={filterValue}
      setFilter={setFilter}
      isGrouped
      iconSrc={Person}
      disabled={disabled}
    />
  );
};

export default RolesFilter;
