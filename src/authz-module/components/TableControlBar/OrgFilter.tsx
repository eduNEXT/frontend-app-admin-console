import React, { useMemo } from 'react';
import { Business } from '@openedx/paragon/icons';
import { useOrgs } from '@src/authz-module/data/hooks';
import { useViewTeamPermissions } from '@src/authz-module/hooks/useViewTeamPermissions';
import { useCourseAuthoringFlag } from '@src/authz-module/hooks/useCourseAuthoringFlag';
import { DEFAULT_FILTER_PAGE_SIZE } from '@src/authz-module/constants';
import { FilterColumnProps, MultipleChoiceFilterProps } from './types';
import MultipleChoiceFilter from './MultipleChoiceFilter';

type OrgFilterProps = Omit<MultipleChoiceFilterProps, 'filterChoices' | 'isSearchable' | 'onSearchChange'>
& FilterColumnProps;

const OrgFilter = ({
  filterButtonText, filterValue, setFilter, disabled, preFilteredRows, id,
}: OrgFilterProps) => {
  const [searchValue, setSearchValue] = React.useState<string | undefined>(undefined);
  const { isLibraryViewAllowed, isLoading } = useViewTeamPermissions();
  const { isOrgAuthoringEnabled, isLoading: isFlagLoading } = useCourseAuthoringFlag();
  const {
    data: orgsData = {
      count: 0, next: null, previous: null, results: [],
    },
  } = useOrgs(searchValue, 1, DEFAULT_FILTER_PAGE_SIZE);

  // Libraries span orgs and are always enabled, so they must keep their behavior: only
  // filter orgs by the course-authoring flag for course-only users, and never while
  // permissions or flag states are still loading (default to showing every org).
  const filterByAuthoringFlag = !isLoading && !isFlagLoading && !isLibraryViewAllowed;

  const filterChoices = useMemo(() => {
    // When rendered as a column Filter, offer only the orgs present in the table
    // rows (react-table's preFilteredRows), so the choices always match the data
    // being filtered. Standalone usages (e.g. the wizard) fall back to the org API.
    if (preFilteredRows) {
      const search = searchValue?.toLowerCase();
      return [...new Set(preFilteredRows.map((row) => row.values[id ?? 'org']))]
        .filter((org) => !!org && (!search || org.toLowerCase().includes(search)))
        .sort()
        .map((org) => ({ displayName: org, value: org }));
    }
    return (orgsData?.results ?? [])
      .filter((org) => !filterByAuthoringFlag || isOrgAuthoringEnabled(org.shortName))
      .map((org) => ({
        displayName: org.name,
        value: org.shortName,
      }));
  }, [preFilteredRows, id, searchValue, orgsData, filterByAuthoringFlag, isOrgAuthoringEnabled]);

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
      onSearchChange={handleSearchChange}
      iconSrc={Business}
      disabled={disabled}
    />
  );
};

export default OrgFilter;
