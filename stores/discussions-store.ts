import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Discussion, DiscussionType, CreateMessagePayload, DiscussionMessage, FetchMessagesResponse, UpdateMessagePayload, MessageMentionInput } from "@/types/discussions.types";
import type { Profile } from "@/types/profile.types";
import { useAuthStore } from "@/stores/auth-store";
import { discussionAPI } from "@/lib/api/discussion-api";

const createLoadingMessage = (discussionId: string): DiscussionMessage => ({
  id: 'loading-' + crypto.randomUUID(),
  pending: true,
  discussionId,
  authorId: '',  // No author → hides avatar/name in ThreadCard
  text: 'Loading messages...',  // ✅ Visible placeholder
  replyTo: null,
  attachments: [],
  mentions: [],
  reactions: [],
  isEdited: false,
  isDeleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getCurrentUserId = (): string | null => {
  return useAuthStore.getState().user?.id ?? null;
};

// ---- STATE + ACTIONS ----
interface DiscussionStore {
  // ---- STATE ----
  discussions: Discussion[];
  loading: boolean;
  error: string | null;

  // ---- ACTIONS ----
  fetchDiscussions: (type: DiscussionType, referenceId: string) => Promise<void>;

  getSortedDiscussions: (
    profile: Profile | null,
    type: DiscussionType,
    referenceId: string
  ) => Discussion[];

  createDiscussion: (
    type: DiscussionType,
    referenceId: string,
    payload: {
      title: string;
      description?: string;
      priority?: "low" | "medium" | "high";
      tags?: string[];
      mentions?: MessageMentionInput[];
      metadata?: Record<string, unknown>;
      uploadIds?: string[];
    }
  ) => Promise<void>;

  discussionMessages: (discussionId: string) => Promise<void>;
  createMessage: (
    type: DiscussionType,
    referenceId: string,
    discussionId: string,
    payload: CreateMessagePayload
  ) => Promise<void>;

  updateMessage: (
    discussionId: string,
    replyId: string,
    payload: UpdateMessagePayload
  ) => Promise<void>;

  // setTyping: (userId: string, parentId: number, isTyping: boolean) => void;
  deleteDiscussion: (discussionId: string) => Promise<void>;
  deleteReply: (discussionId: string, replyId: string) => Promise<void>;
  deleteDiscussionAttachment: (discussionId: string, attachmentId: string) => Promise<void>;

  reset: () => void;
}

// const sameReply = (m: DiscussionMessage, replyId: string) =>
//   m.id === replyId || (m as any)._id === replyId;

// ---- STORE ----
export const useDiscussionStore = create<DiscussionStore>()(
  persist(
    (set, get) => ({
      // ---- INITIAL STATE ----
      discussions: [],
      loading: false,
      error: null,

      // ---- ACTIONS ----
      // ---- GET discussions ----
      fetchDiscussions: async (type, referenceId) => {
        try {
          set({ loading: true, error: null });

          const res = await discussionAPI.getDiscussions(type, referenceId);

          const list = Array.isArray(res.data) ? res.data : [res.data];

          // sort by createdAt ascending (oldest at top, newest at bottom)
          const sorted = [...list].sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return aTime - bTime; // older first
          });

          set({
            discussions: sorted,
            loading: false,
          });
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message || "Failed to fetch discussions",
          });
        }
      },

      getSortedDiscussions: (profile, type, referenceId) => {
        const discussions = get().discussions;

        if (!profile) return discussions;

        const pinnedThreadId = profile.discussionSettings?.[type]?.[referenceId]?.pinnedThreadId;

        if (!pinnedThreadId) return discussions;

        return [
          ...discussions.filter(d => (d._id ?? d.id) === pinnedThreadId),
          ...discussions.filter(d => (d._id ?? d.id) !== pinnedThreadId),
        ];
      },

      createDiscussion: async (type, referenceId, payload) => {
        try {
          set({ loading: true, error: null });

          const res = await discussionAPI.createDiscussion(
            type,
            referenceId,
            payload
          );

          set((state) => ({
            discussions: [...state.discussions, res.data],
            loading: false,
          }));
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message || "Failed to create discussion",
          });
        }
      },

      createMessage: async (type, referenceId, discussionId, payload) => {
        try {

          // optimistic message
          const clientId = crypto.randomUUID();
          const optimisticMessage: DiscussionMessage = {
            id: clientId,
            pending: true,
            discussionId,
            authorId: {
              id: "",
              name: "",
              email: "",
              profilePicture: "user!.profilePictureUrl",
            },
            text: payload.text,
            replyTo: payload.replyTo
              ? {
                id: payload.replyTo,
                text: "",
                authorId: "",
                createdAt: new Date().toISOString(),
              }
              : null,
            attachments: payload.attachments || [],
            mentions: payload.mentions || [],
            reactions: [],
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // optimistic update
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: [...(d.messages || []), optimisticMessage],
                }
                : d
            ),
          }));

          // API call: note discussionId is first
          const res = await discussionAPI.createMessages(discussionId, payload);

          // replace temp message with real one
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: d.messages?.map((m) =>
                    (m.id === clientId || (m as any)._id === clientId) ? res.data : m
                  ),
                }
                : d
            ),
          }));
        } catch (err: any) {
          // revert optimistic update
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: d.messages?.filter(
                    (m) => !m.id?.startsWith("temp-")
                  ),
                }
                : d
            ),
            loading: false,
            error: err?.message || "Failed to create message",
          }));
        }
      },

      discussionMessages: async (discussionId) => {
        try {
          set({ loading: true, error: null });

          // Optimistic: Remove old pendings + add loader
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: [
                    ...(d.messages || []).filter((m) => !m.pending),
                    createLoadingMessage(discussionId),
                  ],
                }
                : d
            ),
          }));

          const res = await discussionAPI.fetchMessages(discussionId);
          const messagesArray = res.data.messages || [];
          const sortedMessages = [...messagesArray].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          // ✅ Replace: Remove ALL pendings, add real messages ONLY
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: sortedMessages,  // Clean slate: real messages only
                }
                : d
            ),
            loading: false,
          }));
        } catch (err: any) {
          set({ loading: false, error: err?.message || 'Failed to fetch messages' });
          // Revert: Remove pendings
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? { ...d, messages: (d.messages || []).filter((m) => !m.pending) }
                : d
            ),
          }));
        }
      },

      updateMessage: async (discussionId: string, replyId: string, payload: UpdateMessagePayload) => {
        let previousMessage: DiscussionMessage | null = null;
        const currentUserId = getCurrentUserId();

        if (!currentUserId) throw new Error("User not authenticated");

        // Helper defined inline (or move to top of file)
        const sameReply = (m: DiscussionMessage) =>
          m.id === replyId || (m as any)._id === replyId;

        try {
          // OPTIMISTIC update
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: d.messages?.map((m) => {
                    if (!sameReply(m)) return m;
                    previousMessage = { ...m };

                    let updated = { ...m, updatedAt: new Date().toISOString() };

                    if (payload.text !== undefined) {
                      updated = { ...updated, text: payload.text, isEdited: true };
                    }

                    if (payload.removeAttachmentIds?.length) {
                      updated = {
                        ...updated,
                        attachments: (m.attachments || []).filter(
                          (att: any) =>
                            !att.id || !payload.removeAttachmentIds!.includes(att.id)
                        ),
                        isEdited: true,
                      };
                    }

                    if (payload.reactions?.length) {
                      const reactions = updated.reactions || [];
                      payload.reactions.forEach((emoji) => {
                        const exists = reactions.some(
                          (r) => r.emoji === emoji && r.userId === currentUserId
                        );
                        updated.reactions = exists
                          ? reactions.filter(
                            (r) => !(r.emoji === emoji && r.userId === currentUserId)
                          )
                          : [
                            ...reactions,
                            {
                              id: crypto.randomUUID(),
                              emoji,
                              userId: currentUserId,
                              createdAt: new Date().toISOString(),
                            },
                          ];
                      });
                    }

                    if (payload.removeReactionIds?.length) {
                      updated.reactions = (updated.reactions || []).filter(
                        (r) => !payload.removeReactionIds!.includes(r.id)
                      );
                    }

                    return updated;
                  }),
                }
                : d
            ),
          }));

          // API call
          const res = await discussionAPI.updateReply(discussionId, replyId, payload);

          // Normalize id shape from server response
          const updatedMessage = {
            ...res.data,
            id: res.data.id ?? (res.data as any)._id,
          };

          // Server wins: replace with real data
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  messages: d.messages?.map((m) =>
                    sameReply(m) ? updatedMessage : m
                  ),
                }
                : d
            ),
          }));
        } catch (err: any) {
          if (previousMessage) {
            set((state) => ({
              discussions: state.discussions.map((d) =>
                (d._id ?? d.id) === discussionId
                  ? {
                    ...d,
                    messages: d.messages?.map((m) =>
                      sameReply(m) ? previousMessage! : m
                    ),
                  }
                  : d
              ),
            }));
          }
          console.error(err);
        }
      },

      deleteDiscussionAttachment: async (discussionId: string, attachmentId: string) => {
        let previousDiscussions: Discussion[] = [];

        try {
          previousDiscussions = get().discussions;

          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? {
                  ...d,
                  attachments: d.attachments?.filter(
                    (att: any) => (att.id ?? att._id) !== attachmentId
                  ),
                }
                : d
            ),
          }));

          await discussionAPI.deleteDiscussionAttachment(discussionId, attachmentId);
        } catch (err: any) {
          set({ discussions: previousDiscussions, error: err?.message || "Failed to delete attachment" });
          console.error(err);
        }
      },

      deleteDiscussion: async (discussionId: string) => {
        let previousDiscussions: Discussion[] = [];

        try {
          // ✅ Backup current state (for rollback)
          previousDiscussions = get().discussions;

          // ✅ Optimistic UI (remove instantly)
          set((state) => ({
            discussions: state.discussions.filter(
              (d) => d._id !== discussionId && d.id !== discussionId
            ),
          }));

          // ✅ API call
          await discussionAPI.deleteDiscussion(discussionId);

        } catch (err: any) {
          // ❌ Rollback if API fails
          set({ discussions: previousDiscussions });

          set({
            error: err?.message || "Failed to delete discussion",
          });
        }
      },

      deleteReply: async (discussionId: string, replyId: string) => {
        let previousMessages: DiscussionMessage[] = [];

        const sameReply = (m: DiscussionMessage) =>
          m.id === replyId || (m as any)._id === replyId;

        try {
          // Backup messages for rollback
          const discussion = get().discussions.find(
            (d) => (d._id ?? d.id) === discussionId
          );
          previousMessages = discussion?.messages ? [...discussion.messages] : [];

          // Optimistic UI: remove reply instantly
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? { ...d, messages: d.messages?.filter((m) => !sameReply(m)) }
                : d
            ),
          }));

          // API call
          await discussionAPI.deleteReply(discussionId, replyId);

        } catch (err: any) {
          // Rollback on failure
          set((state) => ({
            discussions: state.discussions.map((d) =>
              (d._id ?? d.id) === discussionId
                ? { ...d, messages: previousMessages }
                : d
            ),
            error: err?.message || "Failed to delete reply",
          }));
          console.error(err);
        }
      },

      // Reset
      reset: () => {
        localStorage.removeItem('discussion-store');
      },

    }),

    { name: "discussion-store" }
  )
);
