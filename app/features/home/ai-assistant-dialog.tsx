import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { RefObject } from "react";

import { AI_PROMPT_SUGGESTIONS } from "./constants";
import type { AiAssistantSession } from "./types";

type AiAssistantDialogProps = {
  activeSession: AiAssistantSession | undefined;
  aiPrompt: string;
  fetcherState: "idle" | "loading" | "submitting";
  isHistoryOpen: boolean;
  onClose: () => void;
  onCreateSession: () => void;
  onPromptChange: (value: string) => void;
  onResetSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onSubmit: () => void;
  onSubmitSuggestion: (prompt: string) => void;
  onToggleEntry: (entryId: string) => void;
  onToggleHistory: () => void;
  open: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  sessions: AiAssistantSession[];
};

export function AiAssistantDialog({
  activeSession,
  aiPrompt,
  fetcherState,
  isHistoryOpen,
  onClose,
  onCreateSession,
  onPromptChange,
  onResetSession,
  onSelectSession,
  onSubmit,
  onSubmitSuggestion,
  onToggleEntry,
  onToggleHistory,
  open,
  scrollContainerRef,
  sessions,
}: AiAssistantDialogProps) {
  const isSubmitting = fetcherState !== "idle";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          overflow: "hidden",
          width: "min(100%, 398px)",
          height: "min(486px, calc(100vh - 96px))",
          borderRadius: 1.5,
          border: "1px solid rgba(15, 118, 110, 0.12)",
          boxShadow: "0 18px 48px rgba(15, 118, 110, 0.16)",
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
          onSubmit();
        }}
      >
        <DialogTitle sx={{ px: 2, py: 1.25 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Typography fontWeight={700} lineHeight={1.1} fontSize={18}>
                AI Assistant
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                lineHeight={1.2}
                sx={{
                  maxWidth: 250,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeSession?.pendingPrompt ||
                  activeSession?.entries.at(-1)?.prompt ||
                  "Ask your table"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="New conversation">
                <IconButton
                  aria-label="Start new AI conversation"
                  onClick={onCreateSession}
                  type="button"
                  size="small"
                  sx={{ color: "text.secondary", p: 0.5 }}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="History">
                <IconButton
                  aria-label="View AI history"
                  onClick={onToggleHistory}
                  type="button"
                  size="small"
                  sx={{
                    color: isHistoryOpen ? "primary.main" : "text.secondary",
                    p: 0.5,
                  }}
                >
                  <HistoryRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset conversation">
                <IconButton
                  aria-label="Reset AI conversation"
                  onClick={onResetSession}
                  type="button"
                  size="small"
                  sx={{ color: "text.secondary", p: 0.5 }}
                >
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton
                aria-label="Close AI assistant"
                onClick={onClose}
                type="button"
                size="small"
                sx={{ color: "text.secondary", p: 0.5 }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <Divider />
        {isHistoryOpen && activeSession && (
          <Box
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              backgroundColor: "rgba(15, 118, 110, 0.04)",
            }}
          >
            <List disablePadding sx={{ py: 0.5, maxHeight: 196, overflowY: "auto" }}>
              {sessions.map((session) => (
                <ListItemButton
                  key={session.id}
                  selected={session.id === activeSession.id}
                  onClick={() => onSelectSession(session.id)}
                  sx={{
                    px: 2,
                    py: 1,
                    alignItems: "flex-start",
                    borderLeft: "2px solid transparent",
                    borderLeftColor:
                      session.id === activeSession.id ? "primary.main" : "transparent",
                    "&.Mui-selected": {
                      backgroundColor: "rgba(15, 118, 110, 0.08)",
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "rgba(15, 118, 110, 0.12)",
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        fontSize={13}
                        fontWeight={session.id === activeSession.id ? 700 : 500}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {session.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {session.entries.length} result
                        {session.entries.length === 1 ? "" : "s"}
                        {session.pendingPrompt ? " • in progress" : ""}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}
        <DialogContent
          ref={scrollContainerRef}
          sx={{
            px: 2,
            pt: 1.5,
            pb: 0,
            flex: 1,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "flex-start",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {activeSession &&
          (activeSession.entries.length > 0 || activeSession.pendingPrompt || isSubmitting) ? (
            <Stack spacing={1.5} sx={{ width: "100%", minWidth: 0 }}>
              {activeSession.entries.map((entry) => (
                <Stack key={entry.id} direction="row" spacing={1} alignItems="flex-start">
                  <AutoAwesomeRoundedIcon
                    sx={{ mt: 0.35, fontSize: 14, color: "primary.main", opacity: 0.8 }}
                  />
                  <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.3 }}>
                      {entry.prompt}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={entry.kind === "error" ? "error.main" : "text.secondary"}
                      sx={{ lineHeight: 1.3, fontSize: 12.5 }}
                    >
                      {entry.message}
                    </Typography>
                    {entry.kind === "success" && entry.appliedChanges.length > 0 && (
                      <Box>
                        <Button
                          type="button"
                          size="small"
                          color="primary"
                          onClick={() => onToggleEntry(entry.id)}
                          endIcon={
                            entry.isExpanded ? (
                              <ExpandLessRoundedIcon fontSize="small" />
                            ) : (
                              <ExpandMoreRoundedIcon fontSize="small" />
                            )
                          }
                          sx={{
                            minWidth: 0,
                            px: 0,
                            mt: 0.15,
                            mb: 0.25,
                            fontSize: 11.5,
                            fontWeight: 700,
                            textTransform: "none",
                            color: "primary.main",
                          }}
                        >
                          Applied changes
                        </Button>
                        <Collapse in={entry.isExpanded}>
                          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                            {entry.appliedChanges.map((label) => (
                              <Chip
                                key={`${entry.id}-${label}`}
                                size="small"
                                label={label}
                                variant="filled"
                                sx={{
                                  height: 22,
                                  borderRadius: 999,
                                  backgroundColor: "rgba(15, 118, 110, 0.12)",
                                  color: "#14532d",
                                  border: "1px solid rgba(15, 118, 110, 0.16)",
                                  "& .MuiChip-label": {
                                    px: 1,
                                    fontSize: 12,
                                  },
                                }}
                              />
                            ))}
                          </Stack>
                        </Collapse>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              ))}
              {isSubmitting && activeSession.pendingPrompt && (
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <AutoAwesomeRoundedIcon
                    sx={{ mt: 0.35, fontSize: 14, color: "primary.main", opacity: 0.8 }}
                  />
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
                      {activeSession.pendingPrompt}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={14} />
                      <Typography variant="body2" color="text.secondary">
                        Applying changes...
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              )}
            </Stack>
          ) : isHistoryOpen ? null : (
            <Typography color="text.secondary">
              Start by asking the assistant to change the table.
            </Typography>
          )}
        </DialogContent>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={1}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "rgba(15, 118, 110, 0.22)",
                borderRadius: 0.75,
                px: 0.875,
                py: 0.375,
                backgroundColor: "rgba(15, 118, 110, 0.04)",
              }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  type="button"
                  aria-label="Voice input unavailable"
                  size="small"
                  disabled
                  sx={{ color: "text.disabled", p: 0.5 }}
                >
                  <MicOffRoundedIcon fontSize="small" />
                </IconButton>
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  variant="standard"
                  value={aiPrompt}
                  onChange={(event) => onPromptChange(event.target.value)}
                  placeholder="Type a prompt..."
                  InputProps={{
                    disableUnderline: true,
                  }}
                />
                <IconButton
                  type="submit"
                  aria-label="Ask AI"
                  disabled={isSubmitting || !aiPrompt.trim()}
                  size="small"
                  sx={{
                    color: aiPrompt.trim() ? "primary.main" : "text.disabled",
                    p: 0.5,
                  }}
                >
                  {isSubmitting ? <CircularProgress size={18} /> : <SendRoundedIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Suggestions
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 0.75,
                overflowX: "auto",
                pb: 0.25,
                scrollbarWidth: "thin",
              }}
            >
              {AI_PROMPT_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  variant="outlined"
                  onClick={() => onSubmitSuggestion(suggestion)}
                  sx={{
                    cursor: "pointer",
                    flexShrink: 0,
                    height: 30,
                    borderRadius: 999,
                    borderColor: "rgba(15, 118, 110, 0.22)",
                    color: "text.primary",
                    "&:hover": {
                      backgroundColor: "rgba(15, 118, 110, 0.08)",
                    },
                    "& .MuiChip-label": {
                      px: 1.1,
                      fontSize: 12.5,
                    },
                  }}
                />
              ))}
            </Box>
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}
