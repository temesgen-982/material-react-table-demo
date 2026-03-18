import type {
  MRT_ColumnFilterFnsState,
  MRT_ColumnFiltersState,
  MRT_ColumnPinningState,
  MRT_FilterOption,
  MRT_GroupingState,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";

export type Post = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: {
    likes: number;
    dislikes: number;
  };
  views: number;
  userId: number;
};

export type PostsResponse = {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
};

export type TableColumnId = "id" | "title" | "tags" | "likes" | "dislikes" | "views" | "userId";

export type TableDisplayColumnId =
  | "mrt-row-expand"
  | "mrt-row-select"
  | "mrt-row-number"
  | "mrt-row-actions";

export type AiFilter = {
  id: TableColumnId;
  value: string | number | boolean;
  filterFn: MRT_FilterOption;
};

export type AiChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type AiPlan =
  | {
      summary: string;
      operations: Array<
        | { type: "resetTableState" }
        | { type: "setSorting"; sorting: Array<{ id: TableColumnId; desc: boolean }> }
        | { type: "setGrouping"; grouping: TableColumnId[] }
        | { type: "setColumnFilters"; filters: AiFilter[] }
        | { type: "setGlobalFilter"; value: string }
        | { type: "setColumnVisibility"; visibility: Partial<Record<TableColumnId, boolean>> }
        | {
            type: "setColumnPinning";
            left: Array<TableColumnId | TableDisplayColumnId>;
            right: Array<TableColumnId | TableDisplayColumnId>;
          }
      >;
    };

export type AiAssistantResponse =
  | {
      ok: true;
      plan: AiPlan;
      conversationId: string;
      message: string;
    }
  | {
      ok: false;
      error: string;
      conversationId?: string;
    };

export type AiTableContext = {
  sorting: MRT_SortingState;
  grouping: MRT_GroupingState;
  columnFilters: MRT_ColumnFiltersState;
  columnFilterFns: MRT_ColumnFilterFnsState;
  globalFilter: string;
  columnVisibility: MRT_VisibilityState;
  columnPinning: MRT_ColumnPinningState;
};

export type AiConversationRequest = {
  prompt: string;
  conversationId: string;
  history: AiChatMessage[];
  currentState: AiTableContext | null;
};
