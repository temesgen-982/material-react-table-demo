import type { MRT_ColumnPinningState } from "material-react-table";

import { REQUIRED_LEFT_PINS, REQUIRED_RIGHT_PINS } from "./constants";
import type {
  AiAssistantResponse,
  AiChatMessage,
  AiConversationRequest,
  AiPlan,
  AiTableContext,
} from "./types";

export const aiPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "operations"],
  properties: {
    summary: { type: "string" },
    operations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: [
              "resetTableState",
              "setSorting",
              "setGrouping",
              "setColumnFilters",
              "setGlobalFilter",
              "setColumnVisibility",
              "setColumnPinning",
            ],
          },
          sorting: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "desc"],
              properties: {
                id: {
                  type: "string",
                  enum: ["id", "title", "tags", "likes", "dislikes", "views", "userId"],
                },
                desc: { type: "boolean" },
              },
            },
          },
          grouping: {
            type: "array",
            items: {
              type: "string",
              enum: ["id", "title", "tags", "likes", "dislikes", "views", "userId"],
            },
          },
          filters: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "value", "filterFn"],
              properties: {
                id: {
                  type: "string",
                  enum: ["id", "title", "tags", "likes", "dislikes", "views", "userId"],
                },
                value: {
                  anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
                },
                filterFn: {
                  type: "string",
                  enum: [
                    "contains",
                    "equals",
                    "greaterThan",
                    "greaterThanOrEqualTo",
                    "lessThan",
                    "lessThanOrEqualTo",
                  ],
                },
              },
            },
          },
          value: { type: "string" },
          visibility: {
            type: "object",
            additionalProperties: { type: "boolean" },
          },
          left: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "id",
                "title",
                "tags",
                "likes",
                "dislikes",
                "views",
                "userId",
                "mrt-row-expand",
                "mrt-row-select",
                "mrt-row-number",
                "mrt-row-actions",
              ],
            },
          },
          right: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "id",
                "title",
                "tags",
                "likes",
                "dislikes",
                "views",
                "userId",
                "mrt-row-expand",
                "mrt-row-select",
                "mrt-row-number",
                "mrt-row-actions",
              ],
            },
          },
        },
      },
    },
  },
};

export function withRequiredPins(pinning: MRT_ColumnPinningState): MRT_ColumnPinningState {
  return {
    left: Array.from(new Set([...(pinning.left ?? []), ...REQUIRED_LEFT_PINS])),
    right: Array.from(new Set([...(pinning.right ?? []), ...REQUIRED_RIGHT_PINS])),
  };
}

function formatConversationHistory(history: AiChatMessage[]) {
  if (history.length === 0) {
    return "No previous messages.";
  }

  return history.map((message) => `${message.role.toUpperCase()}: ${message.text}`).join("\n");
}

function buildAiPrompt({
  prompt,
  currentState,
  history,
}: Pick<AiConversationRequest, "prompt" | "currentState" | "history">) {
  return [
    "You translate natural-language table requests into structured Material React Table state updates.",
    "Available columns:",
    "- id: number",
    "- title: text",
    "- tags: list of text values",
    "- likes: number",
    "- dislikes: number",
    "- views: number",
    "- userId: number",
    "The body field is shown only in the detail panel, not as a filterable/sortable/groupable column.",
    "Supported operations:",
    "- resetTableState",
    "- setSorting",
    "- setGrouping",
    "- setColumnFilters",
    "- setGlobalFilter",
    "- setColumnVisibility",
    "- setColumnPinning",
    "Aggregation is already predefined in the table. To aggregate, group by a column. The table will count titles, sum likes, sum dislikes, and sum views automatically.",
    "Display columns mrt-row-expand, mrt-row-select, mrt-row-number, and mrt-row-actions stay pinned by default.",
    "Use precise column filters when possible. For text matching use contains or equals. For numeric comparisons use greaterThan, greaterThanOrEqualTo, lessThan, or lessThanOrEqualTo.",
    "When the user asks a follow-up question, use the previous conversation to resolve references like 'that', 'same filter', or 'also sort it'.",
    "Return JSON only, matching the provided schema.",
    `Previous conversation:\n${formatConversationHistory(history)}`,
    `Current table state: ${JSON.stringify(currentState)}`,
    `User request: ${prompt.trim()}`,
  ].join("\n");
}

export async function generateAiPlan(
  {
    prompt,
    conversationId,
    history,
    currentState,
  }: AiConversationRequest,
  apiKey: string,
): Promise<AiAssistantResponse> {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: buildAiPrompt({ prompt, currentState, history }) }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: aiPlanSchema,
        temperature: 0.1,
        maxOutputTokens: 700,
      },
    });

    if (!response.text) {
      return {
        ok: false,
        error: "The AI assistant returned an empty response.",
        conversationId,
      };
    }

    const plan = JSON.parse(response.text) as AiPlan;

    return {
      ok: true,
      plan,
      conversationId,
      message: plan.summary,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The AI assistant could not process that request.";
    return { ok: false, error: message, conversationId };
  }
}
