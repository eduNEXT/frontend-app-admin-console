import { Context, useContext } from 'react';
import { DataTableContextShape } from '@src/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { DataTableContext, Pagination, TableFooter } from '@openedx/paragon';
import messages from '../messages';

const Footer = () => {
  const { formatMessage } = useIntl();
  const {
    pageCount, gotoPage, state, itemCount, rows,
  } = useContext(DataTableContext as unknown as Context<DataTableContextShape>);
  const { pageIndex } = state;
  return (
    <TableFooter>
      <span>
        {formatMessage(messages['authz.table.footer.items.showing.text'], { pageSize: rows.length, itemCount })}
      </span>
      <Pagination
        variant="reduced"
        currentPage={pageIndex + 1}
        pageCount={pageCount}
        onPageSelect={(pageNum: number) => gotoPage(pageNum - 1)}
      />
    </TableFooter>
  );
};

export default Footer;
