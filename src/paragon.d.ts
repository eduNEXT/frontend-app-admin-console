export interface TableCellValue<T> {
  row: {
    original: T;
  };
}

export interface DataTableColumn {
  id?: string;
  accessor?: string;
  Header?: string | React.ReactNode;
  Filter?: React.ComponentType<any>;
  canFilter?: boolean;
  filterValue?: any;
  setFilter?: (value: any) => void;
  filterChoices?: Array<{ name: string; number: number; value: string }>;
  filterOrder?: number;
  filterButtonText?: string;
  [key: string]: any;
}

export interface DataTableContextShape {
  columns: DataTableColumn[];
  setAllFilters: (filters: any[]) => void;
  toggleSortBy: (columnId: string, desc: boolean) => void;
  gotoPage: (pageIndex: number) => void;
  pageCount: number;
  itemCount: number;
  rows: Array<{ original: any }>;
  state: {
    sortBy?: Array<{ id: string; desc: boolean }>;
    filters: Array<{ id: string; value: any }>;
    pageIndex: number;
    pageSize: number;
  };
}
