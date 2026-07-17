/**
 * Subset of the react-table column props our filter components use to derive
 * their choices from the loaded rows. Provided automatically when the component
 * is rendered as a column `Filter`; absent in standalone usages.
 */
export interface FilterColumnProps {
  preFilteredRows?: Array<{ values: Record<string, string> }>;
  id?: string;
}

export type FilterChoice = {
  groupName?: string;
  groupIcon?: React.ComponentType<{}>;
  displayName: string;
  value: string;
  description?: string;
};

export interface MultipleChoiceFilterProps {
  filterButtonText: string;
  filterChoices: Array<FilterChoice>;
  filterValue: string[] | undefined;
  setFilter: (value: string[], newItem: FilterChoice) => void;
  isGrouped?: boolean;
  isSearchable?: boolean;
  onSearchChange?: (value: string) => void;
  iconSrc?: React.ComponentType<{}> | undefined;
  disabled?: boolean;
}
