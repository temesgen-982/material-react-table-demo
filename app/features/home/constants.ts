import type {
  MRT_ColumnFilterFnsState,
  MRT_ColumnFiltersState,
  MRT_ColumnPinningState,
  MRT_GroupingState,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";

import type { TableDisplayColumnId } from "./types";

export const POSTS_API_URL = "https://dummyjson.com/posts";

export const DEFAULT_SORTING: MRT_SortingState = [{ id: "likes", desc: true }];

export const REQUIRED_LEFT_PINS: TableDisplayColumnId[] = [
  "mrt-row-expand",
  "mrt-row-select",
  "mrt-row-number",
];

export const REQUIRED_RIGHT_PINS: TableDisplayColumnId[] = ["mrt-row-actions"];

export const DEFAULT_COLUMN_PINNING: MRT_ColumnPinningState = {
  left: REQUIRED_LEFT_PINS,
  right: REQUIRED_RIGHT_PINS,
};

export const DEFAULT_GROUPING: MRT_GroupingState = [];
export const DEFAULT_COLUMN_FILTERS: MRT_ColumnFiltersState = [];
export const DEFAULT_COLUMN_FILTER_FNS: MRT_ColumnFilterFnsState = {};
export const DEFAULT_COLUMN_VISIBILITY: MRT_VisibilityState = {};
export const DEFAULT_GLOBAL_FILTER = "";

export const AI_PROMPT_SUGGESTIONS = [
  "Sort by views descending",
  "Show only posts with more than 3000 views",
  "Group by userId",
  "Hide dislikes and pin views to the right",
  "Reset the table to its default state",
];
