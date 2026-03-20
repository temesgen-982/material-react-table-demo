import { useState, type ReactNode } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import {
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  MRT_EditActionButtons,
  MRT_ShowHideColumnsButton,
  MRT_ToggleFullScreenButton,
  MRT_ToggleGlobalFilterButton,
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnFilterFnsState,
  type MRT_ColumnFiltersState,
  type MRT_ColumnPinningState,
  type MRT_ColumnDef,
  type MRT_GroupingState,
  type MRT_RowData,
  type MRT_SortingState,
  type MRT_TableOptions,
  type MRT_VisibilityState,
} from "material-react-table";

export type DataTableState = {
  columnFilterFns: MRT_ColumnFilterFnsState;
  columnFilters: MRT_ColumnFiltersState;
  columnPinning: MRT_ColumnPinningState;
  columnVisibility: MRT_VisibilityState;
  globalFilter: string;
  grouping: MRT_GroupingState;
  sorting: MRT_SortingState;
};

type DataTableExportAction<TData extends MRT_RowData> = {
  icon: ReactNode;
  label: string;
  onClick: (rows: TData[]) => void;
  rows: "all" | "selected" | "visible";
};

type DataTableProps<TData extends MRT_RowData> = {
  columns: MRT_ColumnDef<TData>[];
  data: TData[];
  editDialogTitle?: string;
  exportActions?: DataTableExportAction<TData>[];
  extraToolbarActions?: (table: ReturnType<typeof useMaterialReactTable<TData>>) => ReactNode;
  getRowId: NonNullable<MRT_TableOptions<TData>["getRowId"]>;
  onColumnFiltersChange: MRT_TableOptions<TData>["onColumnFiltersChange"];
  onColumnPinningChange: MRT_TableOptions<TData>["onColumnPinningChange"];
  onColumnVisibilityChange: MRT_TableOptions<TData>["onColumnVisibilityChange"];
  onEditingRowSave?: MRT_TableOptions<TData>["onEditingRowSave"];
  onGlobalFilterChange: MRT_TableOptions<TData>["onGlobalFilterChange"];
  onGroupingChange: MRT_TableOptions<TData>["onGroupingChange"];
  onSortingChange: MRT_TableOptions<TData>["onSortingChange"];
  searchPlaceholder: string;
  state: DataTableState;
  tableOptions?: Partial<MRT_TableOptions<TData>>;
};

export function DataTable<TData extends MRT_RowData>({
  columns,
  data,
  editDialogTitle = "Edit row",
  exportActions = [],
  extraToolbarActions,
  getRowId,
  onColumnFiltersChange,
  onColumnPinningChange,
  onColumnVisibilityChange,
  onEditingRowSave,
  onGlobalFilterChange,
  onGroupingChange,
  onSortingChange,
  searchPlaceholder,
  state,
  tableOptions,
}: DataTableProps<TData>) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<HTMLElement | null>(null);
  const table = useMaterialReactTable({
    enableColumnOrdering: true,
    enableColumnPinning: true,
    enableDensityToggle: false,
    enableEditing: true,
    enableExpanding: true,
    enableGlobalFilter: true,
    enableGrouping: true,
    enableMultiRowSelection: true,
    enableRowActions: true,
    enableRowNumbers: true,
    enableRowSelection: true,
    enableStickyFooter: true,
    editDisplayMode: "modal",
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    muiPaginationProps: {
      rowsPerPageOptions: [10, 20, 30],
      variant: "outlined",
    },
    muiSearchTextFieldProps: {
      placeholder: searchPlaceholder,
      size: "small",
      variant: "outlined",
    },
    ...tableOptions,
    columns,
    data,
    getRowId,
    onColumnFiltersChange,
    onColumnPinningChange,
    onColumnVisibilityChange,
    onEditingRowSave,
    onGlobalFilterChange,
    onGroupingChange,
    onSortingChange,
    renderToolbarInternalActions: ({ table }) => {
      const selectedRows = table.getSelectedRowModel().flatRows.map((row) => row.original);
      const visibleRows = table.getPrePaginationRowModel().flatRows.map((row) => row.original);

      return (
        <>
          <MRT_ToggleGlobalFilterButton table={table} />
          {exportActions.length > 0 && (
            <>
              <Tooltip title="Export data">
                <IconButton
                  aria-label="Open export options"
                  onClick={(event) => setExportMenuAnchor(event.currentTarget)}
                >
                  <DownloadRoundedIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={() => setExportMenuAnchor(null)}
              >
                {exportActions.map((action) => {
                  const rows =
                    action.rows === "all"
                      ? data
                      : action.rows === "selected"
                        ? selectedRows
                        : visibleRows;

                  return (
                    <MenuItem
                      key={action.label}
                      disabled={action.rows === "selected" && selectedRows.length === 0}
                      onClick={() => {
                        action.onClick(rows);
                        setExportMenuAnchor(null);
                      }}
                    >
                      <ListItemIcon>{action.icon}</ListItemIcon>
                      <ListItemText>{action.label}</ListItemText>
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          )}
          <MRT_ShowHideColumnsButton table={table} />
          {extraToolbarActions?.(table)}
          <MRT_ToggleFullScreenButton table={table} />
        </>
      );
    },
    renderEditRowDialogContent:
      tableOptions?.renderEditRowDialogContent ??
      (({ internalEditComponents, row, table }) => (
        <>
          <DialogTitle>{editDialogTitle}</DialogTitle>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Stack spacing={2}>{internalEditComponents}</Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <MRT_EditActionButtons row={row} table={table} variant="text" />
          </DialogActions>
        </>
      )),
    state,
  });

  return <MaterialReactTable table={table} />;
}
