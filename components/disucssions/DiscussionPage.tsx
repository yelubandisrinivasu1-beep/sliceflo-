"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { DiscussionType, MessageAttachment } from "@/types/discussions.types";
import { useDiscussionStore } from "@/stores/discussions-store";
import { uploadFile, type UploadResponse } from '@/lib/api/uploads-api'
import EmptyTeamDiscussion from "@/components/disucssions/EmptyTeamDiscussion";
// import NewThreadInput from "@/components/teams/TeamDiscussions/NewThreadInput";
import ThreadCard from "./ThreadCard";
import NewThreadInput from "./NewThreadInput";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// interface aligns only this component; store types stay in teams.types
interface LocalReply {
    id: string;
    // userId: string;
    authorId: string;
    user: string;
    author: string;
    createdAt: string;
    mention: string;
    text: string;
    editable: boolean;
    edited: boolean;
    attachments: MessageAttachment[];
}

interface Thread {
    id: string;
    discussionId: string;
    user: string;
    avatar: string;
    createdAt: string;
    text: string;
    replies: LocalReply[];
    isPinned?: boolean;
}

interface MentionableMember {
    id: string;
    name: string;
    profilePictureUrl?: string;
}

interface DiscussionPageProps {
    entityType: DiscussionType;
    entityId: string;
    mentionableMembers: MentionableMember[];
}

export default function DiscussionPage({
    entityType,
    entityId,
    mentionableMembers,
}: DiscussionPageProps) {
    const {
        discussions,
        fetchDiscussions,
        createDiscussion,
        discussionMessages,
        getSortedDiscussions,
        loading,
    } = useDiscussionStore();

    const { user } = useAuthStore();

    const { user: profileUser } = useProfileStore();

    const threadRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [emojiAnchor, setEmojiAnchor] = useState<null | "main" | string | "thread-new">(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [openThreadId, setOpenThreadId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryThreadId = searchParams?.get("threadId") ?? null;

    const handleClearThreadView = () => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("threadId");
            router.push(url.pathname + url.search);
        }
    };

    const [collapsedThreads, setCollapsedThreads] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(`discussion-collapse:${entityType}:${entityId}`);
            let list: string[] = raw ? JSON.parse(raw) : [];
            if (queryThreadId) {
                list = list.filter((id) => id !== queryThreadId);
            }
            return list;
        } catch {
            return [];
        }
    });

    const profileImageUrl = profileUser?.profilePictureUrl || "";

    const projectId = entityType === "project" ? entityId : undefined;

    const shouldScrollToLatestRef = useRef(false);
    const targetScrollThreadId = useRef<string | null>(queryThreadId);

    useEffect(() => {
        if (queryThreadId) {
            setCollapsedThreads((prev) => {
                if (prev.includes(queryThreadId)) {
                    const next = prev.filter((id) => id !== queryThreadId);
                    localStorage.setItem(`discussion-collapse:${entityType}:${entityId}`, JSON.stringify(next));
                    return next;
                }
                return prev;
            });
            targetScrollThreadId.current = queryThreadId;
        }
    }, [queryThreadId, entityType, entityId]);

    useEffect(() => {
        if (!openThreadId && discussions.length > 0) {
            setOpenThreadId(discussions[discussions.length - 1].id);
        }
    }, [discussions.length]);

    useEffect(() => {
        if (!entityId) return;

        fetchDiscussions(entityType, entityId);
    }, [entityType, entityId, fetchDiscussions]);

    const currentPinnedThreadId = profileUser?.discussionSettings?.[entityType]?.[entityId]?.pinnedThreadId;

    useEffect(() => {
        if (currentPinnedThreadId && !collapsedThreads.includes(currentPinnedThreadId)) {
            setCollapsedThreads((prev) => {
                if (prev.includes(currentPinnedThreadId)) return prev;
                const next = [...prev, currentPinnedThreadId];
                localStorage.setItem(`discussion-collapse:${entityType}:${entityId}`, JSON.stringify(next));
                return next;
            });
        }
    }, [currentPinnedThreadId, entityType, entityId]);

    const threads = React.useMemo<Thread[]>(() => {
        const pinnedThreadId = profileUser?.discussionSettings?.[entityType]?.[entityId]?.pinnedThreadId;

        const sorted = getSortedDiscussions(
            profileUser,
            entityType,
            entityId
        ); // will place pinned ones first

        const list = sorted.map((discussion: any) => {
            const discussionId = discussion._id ?? discussion.id;
            const isPinned = pinnedThreadId === discussionId;

            return {
                id: discussionId,
                discussionId: discussionId,
                user: discussion.metadata?.authorName || "User",
                avatar:
                    discussion.metadata?.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${discussion.metadata?.authorName || "User"}`,
                createdAt: discussion.createdAt,
                text: discussion.description,
                replies: discussion.messages || [],
                attachments: discussion.attachments || [],
                isPinned,
            };
        });

        if (queryThreadId) {
            return list.filter((t: any) => t.id === queryThreadId);
        }
        return list;
    }, [discussions, profileUser, entityType, entityId, getSortedDiscussions, queryThreadId]);

    const fetchedMessagesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        discussions.forEach((d) => {
            const discussionId = d._id ?? d.id;
            if (!discussionId) return;

            if (
                d.messages === undefined &&
                !fetchedMessagesRef.current.has(discussionId)
            ) {
                fetchedMessagesRef.current.add(discussionId);
                discussionMessages(discussionId);
            }
        });
    }, [discussions, discussionMessages]);

    useEffect(() => {
        if (!threadRefs.current) return;

        // Prioritize user-targeted thread (from toggle)
        if (targetScrollThreadId.current) {
            const targetRef = threadRefs.current[targetScrollThreadId.current];
            if (targetRef) {
                requestAnimationFrame(() => {
                    targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });  // 'center' for better visibility
                    targetScrollThreadId.current = null;  // Clear after scroll
                });
                return;
            }
        }

        // Fallback: auto-scroll to latest only if shouldScrollToLatestRef.current (new/open)
        if (!shouldScrollToLatestRef.current || !threads.length) return;
        const latest = [...threads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        requestAnimationFrame(() => {
            threadRefs.current[latest.id!]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            shouldScrollToLatestRef.current = false;
        });
    }, [threads]);  // Depend on threads for re-renders after fetches

    const handleNewThreadFromInput = async ({
        text,
        uploads,
        mentions,
        uploadIds,
    }: {
        text: string;
        uploads: UploadResponse[];
        mentions: any[];
        uploadIds?: string[];
    }) => {
        if (!text.trim() && uploads.length === 0) return;

        shouldScrollToLatestRef.current = true; // ✅ intent set
        setActiveThreadId(null);

        await createDiscussion(entityType, entityId, {
            title: text.slice(0, 50),
            description: text,
            mentions,
            uploadIds,
            metadata: {
                authorName: user?.name || "User",
                avatarUrl: profileImageUrl,
            },
        });
    };

    // Scroll to latest thread when threads change
    // useEffect(() => {
    //     if (!threads.length) return;

    //     setCollapsedThreads([]);
    // }, [entityId, entityType]);



    // Close emoji picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setEmojiAnchor(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function TeamDiscussionLoader() {
        return (
            <div data-testid="discussion-loader" className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        data-testid={`discussion-loader-skeleton-${i}`}
                        className="h-20 w-full rounded-xl bg-gray-100 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            data-testid="discussion-page-container"
            className={`flex flex-col ${entityType !== "task" ? "h-full" : ""}`}
        >
            <div
                data-testid="discussion-thread-list"
                className={entityType !== "task" ? "flex-1 overflow-y-auto pr-1" : ""}
            >
                {loading ? (
                    <TeamDiscussionLoader />
                ) : queryThreadId && threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                        <p className="text-sm text-gray-500">
                            This thread could not be found or may have been deleted.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearThreadView}
                            className="text-xs bg-[#001F3F] text-white"
                        >
                            View all discussions
                        </Button>
                    </div>
                ) : discussions.length === 0 ? (
                    entityType === "task" ? (
                        <div className="py-2">
                            <div className="w-full">
                                <NewThreadInput
                                    data-testid="new-thread-input-task-empty"
                                    onNewThread={handleNewThreadFromInput}
                                    mentionableMembers={mentionableMembers}
                                />
                            </div>
                        </div>
                    ) : (
                        <EmptyTeamDiscussion data-testid="empty-discussion-state" />
                    )
                ) : (
                    <>
                        {threads.map((thread) => (
                            <div
                                key={thread.id}
                                ref={(el) => {
                                    threadRefs.current[thread.id] = el;
                                }}
                                data-testid={`thread-card-wrapper-${thread.id}`}
                                className={thread.isPinned && collapsedThreads.includes(thread.id) ? "sticky top-0 z-20 bg-white" : ""}
                            >
                                <ThreadCard
                                    thread={thread}
                                    collapsed={collapsedThreads.includes(thread.id)}
                                    onToggleCollapse={() => {
                                        if (!thread.discussionId) return;
                                        targetScrollThreadId.current = thread.id;  // From previous fix
                                        setCollapsedThreads((prev) => {
                                            const isCurrentlyCollapsed = prev.includes(thread.id);

                                            const next = isCurrentlyCollapsed
                                                ? prev.filter((id) => id !== thread.id)
                                                : [...prev, thread.id];

                                            localStorage.setItem(
                                                `discussion-collapse:${entityType}:${entityId}`,
                                                JSON.stringify(next)
                                            );

                                            if (isCurrentlyCollapsed) {
                                                discussionMessages(thread.discussionId);
                                            }

                                            return next;
                                        });
                                    }}
                                    entityType={entityType}
                                    entityId={entityId}
                                    projectId={projectId}
                                    onUserReply={(threadId) => {
                                        setActiveThreadId(threadId);
                                    }}
                                    mentionableMembers={mentionableMembers}
                                />
                            </div>

                        ))}
                    </>
                )}
            </div>
            {/* New thread input commented for now; you can re-enable when ready */}
            {!(entityType === "task" && discussions.length === 0) && !queryThreadId && (
                <div
                    data-testid="discussion-input-bar"
                    className={`border-t bg-white py-3 ${entityType !== "task" ? "px-4" : ""}`}
                >
                    <NewThreadInput
                        data-testid="new-thread-input-main"
                        onNewThread={handleNewThreadFromInput}
                        mentionableMembers={mentionableMembers}
                    />
                </div>
            )}
        </div>
    );
}
