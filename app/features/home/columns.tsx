import { Chip, Stack, Typography, createTheme } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";

import type { Post } from "./types";

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export const columns: MRT_ColumnDef<Post>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 80,
    enableGrouping: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    size: 320,
    aggregationFn: "count",
    AggregatedCell: ({ cell }) => (
      <Typography fontWeight={700}>
        {formatNumber(cell.getValue<number>())} posts in this group
      </Typography>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    size: 240,
    enableSorting: false,
    Cell: ({ row }) => (
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {row.original.tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
        ))}
      </Stack>
    ),
  },
  {
    accessorFn: (row) => row.reactions.likes,
    id: "likes",
    header: "Likes",
    size: 110,
    aggregationFn: "sum",
    AggregatedCell: ({ cell }) => (
      <Typography color="success.main" fontWeight={700}>
        Total {formatNumber(cell.getValue<number>() ?? 0)}
      </Typography>
    ),
    Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
  },
  {
    accessorFn: (row) => row.reactions.dislikes,
    id: "dislikes",
    header: "Dislikes",
    size: 110,
    aggregationFn: "sum",
    AggregatedCell: ({ cell }) => (
      <Typography color="warning.main" fontWeight={700}>
        Total {formatNumber(cell.getValue<number>() ?? 0)}
      </Typography>
    ),
    Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
  },
  {
    accessorKey: "views",
    header: "Views",
    size: 110,
    aggregationFn: "sum",
    AggregatedCell: ({ cell }) => (
      <Typography color="primary.main" fontWeight={700}>
        Total {formatNumber(cell.getValue<number>() ?? 0)}
      </Typography>
    ),
    Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
  },
  {
    accessorKey: "userId",
    header: "User ID",
    size: 110,
    GroupedCell: ({ cell, row }) => (
      <Typography color="primary.main" fontWeight={700}>
        User {cell.getValue<number>()} ({formatNumber(row.subRows?.length ?? 0)} posts)
      </Typography>
    ),
  },
];

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
    },
    secondary: {
      main: "#ea580c",
    },
    background: {
      default: "#f4f7f3",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    h1: {
      fontSize: "clamp(2rem, 3vw, 3rem)",
      fontWeight: 800,
    },
  },
});
