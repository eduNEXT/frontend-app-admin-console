import { Context, useContext } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  DataTable, DataTableContext,
  CheckboxFilter,
  Stack,
  TextFilter,
  Button,
} from '@openedx/paragon';
import type { DataTableContextShape } from '@src/paragon';

import MultipleChoiceFilter from './MultipleChoiceFilter';
import SortDropdown from './SortDropdown';
import SearchFilter from './SearchFilter';
import messages from '../messages';

const TableControlBar = () => {
  const intl = useIntl();
  const {
    columns,
    setAllFilters,
    state,
  } = useContext(DataTableContext as unknown as Context<DataTableContextShape>);

  const availableFilters = columns.filter((column) => column.canFilter);

  const columnTextFilterHeaders = columns
    .filter((column) => column.Filter === TextFilter)
    .map((column) => column.Header);

  const getSearchPlaceholder = () => intl.formatMessage(messages['authz.libraries.team.table.search'], {
    firstField: String(columnTextFilterHeaders[0] || 'field'),
    secondField: String(columnTextFilterHeaders[1] || 'field'),
  });

  return (
    <Stack className="pgn__data-table-status-bar mb-3 flex-wrap" gap={2} direction="horizontal">

      {availableFilters.map((column) => {
        if (column.Filter === CheckboxFilter) {
          return <MultipleChoiceFilter {...(column as React.ComponentProps<typeof MultipleChoiceFilter>)} />;
        }

        if (column.Filter === TextFilter) {
          return (
            <SearchFilter
              key={column.id || column.accessor}
              filterValue={column.filterValue}
              setFilter={column.setFilter!}
              placeholder={getSearchPlaceholder()}
            />
          );
        }

        return null;
      })}

      <SortDropdown />

      {state.filters.length > 0 && (
      <Button
        variant="link"
        onClick={() => setAllFilters([])}
      >
        {intl.formatMessage(messages['authz.libraries.team.table.clearFilters'])}
      </Button>
      )}

      <DataTable.RowStatus className="ml-auto" />
    </Stack>
  );
};

export default TableControlBar;
