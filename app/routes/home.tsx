import { startTransition, useEffect, useRef, useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MRT_EditActionButtons,
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleFullScreenButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
  type MRT_ColumnFilterFnsState,
  type MRT_ColumnFiltersState,
  type MRT_ColumnPinningState,
  type MRT_GroupingState,
  type MRT_Row,
  type MRT_SortingState,
  type MRT_VisibilityState,
} from "material-react-table";
import { useFetcher } from "react-router";

import { generateAiPlan, withRequiredPins } from "~/features/home/ai";
import { columns, theme } from "~/features/home/columns";
import {
  AI_PROMPT_SUGGESTIONS,
  DEFAULT_COLUMN_FILTER_FNS,
  DEFAULT_COLUMN_FILTERS,
  DEFAULT_COLUMN_PINNING,
  DEFAULT_COLUMN_VISIBILITY,
  DEFAULT_GLOBAL_FILTER,
  DEFAULT_GROUPING,
  DEFAULT_SORTING,
  POSTS_API_URL,
} from "~/features/home/constants";
import { exportPostsToCsv, exportPostsToPdf } from "~/features/home/export-utils";
import type {
  AiAssistantResponse,
  AiFilter,
  AiTableContext,
  Post,
  PostsResponse,
} from "~/features/home/types";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Material React Table Demo" },
    {
      name: "description",
      content: "A server-rendered Material React Table example using DummyJSON posts.",
    },
  ];
}

export async function loader() {
  const response = await fetch(POSTS_API_URL);

  if (!response.ok) {
    throw new Response("Failed to fetch posts.", {
      status: response.status,
      statusText: response.statusText,
    });
  }

  return (await response.json()) as PostsResponse;
}

export async function action({ request }: Route.ActionArgs): Promise<AiAssistantResponse> {
  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const tableContextInput = formData.get("tableContext");

  if (typeof prompt !== "string" || !prompt.trim()) {
    return { ok: false, error: "Enter a prompt so the assistant knows what to change." };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is missing from the server environment." };
  }

  let currentState: AiTableContext | null = null;

  if (typeof tableContextInput === "string" && tableContextInput.trim()) {
    try {
      currentState = JSON.parse(tableContextInput) as AiTableContext;
    } catch {
      currentState = null;
    }
  }

  return generateAiPlan({
    apiKey,
    prompt,
    currentState,
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts, total } = loaderData;

  const [data, setData] = useState(posts);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [rowToDelete, setRowToDelete] = useState<Post | null>(null);
  const [sorting, setSorting] = useState<MRT_SortingState>(DEFAULT_SORTING);
  const [grouping, setGrouping] = useState<MRT_GroupingState>(DEFAULT_GROUPING);
  const [columnFilters, setColumnFilters] =
    useState<MRT_ColumnFiltersState>(DEFAULT_COLUMN_FILTERS);
  const [columnFilterFns, setColumnFilterFns] =
    useState<MRT_ColumnFilterFnsState>(DEFAULT_COLUMN_FILTER_FNS);
  const [globalFilter, setGlobalFilter] = useState(DEFAULT_GLOBAL_FILTER);
  const [columnVisibility, setColumnVisibility] =
    useState<MRT_VisibilityState>(DEFAULT_COLUMN_VISIBILITY);
  const [columnPinning, setColumnPinning] =
    useState<MRT_ColumnPinningState>(DEFAULT_COLUMN_PINNING);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessage, setAiMessage] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const lastHandledResponseRef = useRef<AiAssistantResponse | null>(null);

  const handleDeleteRow = () => {
    if (!rowToDelete) {
      return;
    }

    setData((currentRows) => currentRows.filter((post) => post.id !== rowToDelete.id));
    setRowToDelete(null);
  };

  useEffect(() => {
    const response = fetcher.data;

    if (!response || lastHandledResponseRef.current === response) {
      return;
    }

    lastHandledResponseRef.current = response;

    if (!response.ok) {
      setAiMessage({ kind: "error", text: response.error });
      return;
    }

    startTransition(() => {
      for (const operation of response.plan.operations) {
        switch (operation.type) {
          case "resetTableState":
            setSorting(DEFAULT_SORTING);
            setGrouping(DEFAULT_GROUPING);
            setColumnFilters(DEFAULT_COLUMN_FILTERS);
            setColumnFilterFns(DEFAULT_COLUMN_FILTER_FNS);
            setGlobalFilter(DEFAULT_GLOBAL_FILTER);
            setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
            setColumnPinning(DEFAULT_COLUMN_PINNING);
            break;
          case "setSorting":
            setSorting(operation.sorting);
            break;
          case "setGrouping":
            setGrouping(operation.grouping);
            break;
          case "setColumnFilters":
            setColumnFilters(
              operation.filters.map((filter: AiFilter) => ({ id: filter.id, value: filter.value })),
            );
            setColumnFilterFns(
              Object.fromEntries(
                operation.filters.map((filter: AiFilter) => [filter.id, filter.filterFn]),
              ),
            );
            break;
          case "setGlobalFilter":
            setGlobalFilter(operation.value);
            break;
          case "setColumnVisibility":
            setColumnVisibility((currentVisibility) => ({
              ...currentVisibility,
              ...operation.visibility,
            }));
            break;
          case "setColumnPinning":
            setColumnPinning(
              withRequiredPins({
                left: operation.left,
                right: operation.right,
              }),
            );
            break;
        }
      }
    });

    setAiMessage({ kind: "success", text: response.plan.summary });
    setIsAiDialogOpen(false);
  }, [fetcher.data]);

  const submitAiPrompt = () => {
    const trimmedPrompt = aiPrompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setAiMessage(null);

    const tableContext: AiTableContext = {
      sorting,
      grouping,
      columnFilters,
      columnFilterFns,
      globalFilter,
      columnVisibility,
      columnPinning,
    };

    fetcher.submit(
      {
        prompt: trimmedPrompt,
        tableContext: JSON.stringify(tableContext),
      },
      { method: "post" },
    );
  };

  const table = useMaterialReactTable({
    columns,
    data,
    enableColumnPinning: true,
    enableColumnOrdering: true,
    enableDensityToggle: false,
    enableEditing: true,
    enableExpanding: true,
    enableGlobalFilter: true,
    enableGrouping: true,
    enableRowActions: true,
    enableRowNumbers: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableStickyFooter: true,
    editDisplayMode: "modal",
    getRowId: (row) => String(row.id),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnPinningChange: (updater) =>
      setColumnPinning((currentPinning) =>
        withRequiredPins(typeof updater === "function" ? updater(currentPinning) : updater),
      ),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onSortingChange: setSorting,
    state: {
      columnFilterFns,
      columnFilters,
      columnPinning,
      columnVisibility,
      globalFilter,
      grouping,
      sorting,
    },
    muiPaginationProps: {
      rowsPerPageOptions: [10, 20, 30],
      variant: "outlined",
    },
    muiSearchTextFieldProps: {
      placeholder: "Search posts",
      size: "small",
      variant: "outlined",
    },
    onEditingRowSave: async ({ row, values, table }) => {
      const updatedPost: Post = {
        ...row.original,
        ...values,
        id: Number(values.id ?? row.original.id),
        views: Number(values.views ?? row.original.views),
        userId: Number(values.userId ?? row.original.userId),
        reactions: {
          likes: Number(values.likes ?? row.original.reactions.likes),
          dislikes: Number(values.dislikes ?? row.original.reactions.dislikes),
        },
        tags:
          typeof values.tags === "string"
            ? values.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : row.original.tags,
      };

      setData((currentRows) =>
        currentRows.map((post) => (post.id === row.original.id ? updatedPost : post)),
      );
      table.setEditingRow(null);
    },
    renderToolbarInternalActions: ({ table }) => {
      const selectedRows = table.getSelectedRowModel().flatRows.map((row) => row.original);
      const currentRows = table.getPrePaginationRowModel().flatRows.map((row) => row.original);

      return (
        <>
          <MRT_ToggleGlobalFilterButton table={table} />
          <Tooltip title="Export data">
            <IconButton
              aria-label="Open export options"
              onClick={(event) => setExportMenuAnchor(event.currentTarget)}
            >
              <DownloadRoundedIcon />
            </IconButton>
          </Tooltip>
          <MRT_ShowHideColumnsButton table={table} />
          <Tooltip title="Ask AI">
            <IconButton aria-label="Open AI assistant" onClick={() => setIsAiDialogOpen(true)}>
              <AutoAwesomeRoundedIcon />
            </IconButton>
          </Tooltip>
          <MRT_ToggleFullScreenButton table={table} />
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                exportPostsToCsv(currentRows, "posts-visible-rows.csv");
                setExportMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <TableViewOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export all rows (CSV)</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportPostsToCsv(data, "posts-all-data.csv");
                setExportMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <TableViewOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export all data (CSV)</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={selectedRows.length === 0}
              onClick={() => {
                exportPostsToCsv(selectedRows, "posts-selected-rows.csv");
                setExportMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <TableViewOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export selected rows (CSV)</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportPostsToPdf(currentRows, "Visible Posts Export");
                setExportMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <PictureAsPdfOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export all rows (PDF)</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportPostsToPdf(data, "All Posts Export");
                setExportMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <PictureAsPdfOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export all data (PDF)</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={selectedRows.length === 0}
              onClick={() => {
                exportPostsToPdf(selectedRows, "Selected Posts Export");
                setExportMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <PictureAsPdfOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export selected rows (PDF)</ListItemText>
            </MenuItem>
          </Menu>
        </>
      );
    },
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Edit post">
          <IconButton aria-label={`Edit post ${row.original.id}`} onClick={() => table.setEditingRow(row)}>
            <EditOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete post">
          <IconButton
            aria-label={`Delete post ${row.original.id}`}
            color="error"
            onClick={() => setRowToDelete(row.original)}
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderDetailPanel: ({ row }) => (
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          px: 2,
          py: 2.5,
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Post body
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
          {row.original.body}
        </Typography>
      </Box>
    ),
    renderEditRowDialogContent: ({ internalEditComponents, row, table }) => (
      <>
        <DialogTitle>Edit post</DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>{internalEditComponents}</Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <MRT_EditActionButtons row={row} table={table} variant="text" />
        </DialogActions>
      </>
    ),
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(15,118,110,0.18), transparent 32%), linear-gradient(180deg, #f4f7f3 0%, #edf3ef 100%)",
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ mx: "auto", maxWidth: 1440 }}>
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Typography component="h1" variant="h1">
              Material React Table Demo
            </Typography>
            <Typography sx={{ maxWidth: 720 }} color="text.secondary">
              This page is server-rendered, typed with React Router route types, and populated
              from the{" "}
              <Box
                component="a"
                href={POSTS_API_URL}
                target="_blank"
                rel="noreferrer"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                DummyJSON
              </Box>{" "}
              posts endpoint. You can group and aggregate columns as needed, expand any row to
              read the full post body, and try local edit/delete actions from the pinned actions
              column.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Chip label={`${total} total posts available`} color="primary" />
              <Chip label={`Showing ${data.length} rows in the table`} variant="outlined" />
            </Stack>
          </Stack>

          {aiMessage && (
            <Alert severity={aiMessage.kind} sx={{ mb: 2 }}>
              <AlertTitle>{aiMessage.kind === "success" ? "AI Assistant" : "AI Error"}</AlertTitle>
              {aiMessage.text}
            </Alert>
          )}

          <MaterialReactTable table={table} />
        </Box>
      </Box>

      <Dialog
        open={isAiDialogOpen}
        onClose={() => setIsAiDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            overflow: "hidden",
            height: "min(560px, calc(100vh - 96px))",
          },
        }}
      >
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
          onSubmit={(event) => {
            event.preventDefault();
            submitAiPrompt();
          }}
        >
          <DialogTitle sx={{ px: 2.5, py: 1.5 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box>
                <Typography fontWeight={700}>AI Assistant</Typography>
                <Typography variant="body2" color="text.secondary">
                  New conversation
                </Typography>
              </Box>
              <IconButton aria-label="Close AI assistant" onClick={() => setIsAiDialogOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <Divider />
          <DialogContent
            sx={{
              px: 3,
              py: 0,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {aiMessage ? (
              <Stack spacing={1} sx={{ textAlign: "center", maxWidth: 360 }}>
                <Typography fontWeight={600}>
                  {aiMessage.kind === "success" ? "Last assistant update" : "Assistant error"}
                </Typography>
                <Typography color="text.secondary">{aiMessage.text}</Typography>
              </Stack>
            ) : (
              <Typography color="text.secondary">No prompt history</Typography>
            )}
          </DialogContent>
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Stack spacing={1.5}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  variant="standard"
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="Type a prompt..."
                  InputProps={{
                    disableUnderline: true,
                    endAdornment: (
                      <IconButton
                        type="submit"
                        aria-label="Ask AI"
                        disabled={fetcher.state !== "idle" || !aiPrompt.trim()}
                      >
                        {fetcher.state !== "idle" ? (
                          <CircularProgress size={18} />
                        ) : (
                          <SendRoundedIcon />
                        )}
                      </IconButton>
                    ),
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  overflowX: "auto",
                  pb: 0.5,
                  scrollbarWidth: "thin",
                }}
              >
                {AI_PROMPT_SUGGESTIONS.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    variant="outlined"
                    onClick={() => setAiPrompt(suggestion)}
                    sx={{ cursor: "pointer", flexShrink: 0 }}
                  />
                ))}
              </Box>
            </Stack>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(rowToDelete)}
        onClose={() => setRowToDelete(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            p: 1,
          },
        }}
      >
        <DialogTitle>Delete post</DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <DialogContentText>
            {rowToDelete
              ? `Are you sure you want to delete post #${rowToDelete.id}? This only removes it from the current table session because the data source is mock data.`
              : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRowToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteRow}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
