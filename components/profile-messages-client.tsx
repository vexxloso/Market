"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserRole } from "@prisma/client";
import { io, type Socket } from "socket.io-client";

function profileInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

type SessionLike = {
  id: string;
  role: UserRole;
};

type ConversationDTO = {
  id: string;
  kind: string;
  bookingId: string | null;
  listing: {
    id: string;
    title: string;
    imageUrl: string;
    location: string;
    country: string;
  };
  other: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  lastMessage: null | {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  };
  updatedAt: string;
};

export type MessageDTO = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

function broadcastUnreadRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("stayly-unread-refresh"));
  }
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/** One tick = sent; two ticks = read (WhatsApp-style). */
function DeliveryTicks({
  readAt,
  className,
}: {
  readAt: string | null;
  className?: string;
}) {
  const read = Boolean(readAt);
  if (!read) {
    return (
      <span
        className={`inline-flex shrink-0 ${className ?? ""}`}
        title="Sent"
        aria-label="Sent"
      >
        <CheckIcon className="text-[var(--muted)]" />
      </span>
    );
  }
  return (
    <span
      className={`-ml-0.5 inline-flex shrink-0 items-center ${className ?? ""}`}
      title="Read"
      aria-label="Read"
    >
      <CheckIcon className="text-emerald-600" />
      <CheckIcon className="-ml-2 text-emerald-600" />
    </span>
  );
}

export default function ProfileMessagesClient({
  session,
  initialBookingId,
}: {
  session: SessionLike;
  initialBookingId?: string;
}) {
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [body, setBody] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingBurstRef = useRef(0);
  const messageFormRef = useRef<HTMLFormElement | null>(null);

  const [peerTyping, setPeerTyping] = useState(false);

  function appendMessagesDeduped(prev: MessageDTO[], incoming: MessageDTO) {
    return prev.some((x) => x.id === incoming.id) ? prev : [...prev, incoming];
  }

  async function notifyTyping(typing: boolean) {
    const cid = selectedIdRef.current;
    if (!cid) return;
    void fetch(withBasePath(`/api/conversations/${cid}/typing`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typing }),
    });
  }

  const loadConversations = useCallback(async () => {
    setError(null);
    const res = await fetch(withBasePath("/api/conversations"));
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      data?: ConversationDTO[];
    };
    if (!res.ok) {
      setError(data.error ?? "Failed to load conversations.");
      return;
    }
    setConversations(data.data ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingConversations(true);
      await loadConversations();
      if (mounted) setLoadingConversations(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    (async () => {
      const res = await fetch(withBasePath("/api/realtime/socket-token"), {
        method: "POST",
      });
      if (!res.ok || cancelled) return;
      const { token } = (await res.json()) as { token?: string };
      if (!token || cancelled) return;

      socket = io({
        path: "/socket.io",
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on(
        "message:new",
        (payload: { conversationId: string; message: MessageDTO }) => {
          if (payload.conversationId === selectedIdRef.current) {
            setMessages((prev) => appendMessagesDeduped(prev, payload.message));
            setPeerTyping(false);
          }
          void loadConversations();
          broadcastUnreadRefresh();
        },
      );

      socket.on("message:deleted", (payload: { conversationId: string; messageId: string }) => {
        if (payload.conversationId === selectedIdRef.current) {
          setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
        }
        void loadConversations();
        broadcastUnreadRefresh();
      });

      socket.on("messages:read", (payload: { conversationId: string }) => {
        if (payload.conversationId === selectedIdRef.current) {
          const ts = new Date().toISOString();
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === session.id && !m.readAt ? { ...m, readAt: ts } : m,
            ),
          );
        }
        broadcastUnreadRefresh();
      });

      socket.on(
        "conversation:typing",
        (payload: { conversationId: string; userId: string; typing: boolean }) => {
          if (payload.conversationId !== selectedIdRef.current) return;
          if (payload.userId === session.id) return;
          setPeerTyping(Boolean(payload.typing));
        },
      );

      socket.on("unread:refresh", () => {
        broadcastUnreadRefresh();
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [loadConversations, session.id]);

  useEffect(() => {
    return () => {
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    };
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const isAdmin = session.role === UserRole.ADMIN;

  /** Booking / listing threads only (not admin support). */
  const bookingConversations = useMemo(
    () => conversations.filter((c) => c.kind !== "ADMIN_SUPPORT"),
    [conversations],
  );

  /**
   * Show the conversation list only when there is at least one non-admin chat,
   * or while loading, or for platform admins (full inbox).
   * Guests/hosts with only the admin support thread get a single full-width chat with admin.
   */
  const showConversationSidebar =
    loadingConversations || isAdmin || bookingConversations.length > 0;

  useEffect(() => {
    if (conversations.length === 0) return;
    if (initialBookingId) {
      const match = conversations.find((c) => c.bookingId === initialBookingId);
      if (match) {
        setSelectedId(match.id);
        return;
      }
    }
    if (!isAdmin && bookingConversations.length === 0) {
      const adminConv = conversations.find((c) => c.kind === "ADMIN_SUPPORT");
      if (adminConv) {
        setSelectedId(adminConv.id);
        return;
      }
    }
    setSelectedId((prev) =>
      prev && conversations.some((c) => c.id === prev) ? prev : conversations[0].id,
    );
  }, [conversations, initialBookingId, isAdmin, bookingConversations.length]);

  useEffect(() => {
    setPeerTyping(false);
  }, [selectedId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedId) return;
      setLoadingMessages(true);
      setError(null);
      try {
        const res = await fetch(withBasePath(`/api/conversations/${selectedId}/messages`));
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          data?: MessageDTO[];
        };
        if (!res.ok) {
          setError(data.error ?? "Failed to load messages.");
          return;
        }
        if (!mounted) return;
        setMessages(data.data ?? []);
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || loadingMessages) return;
    void (async () => {
      await fetch(withBasePath(`/api/conversations/${selectedId}/read`), { method: "POST" });
      broadcastUnreadRefresh();
    })();
  }, [selectedId, loadingMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function deleteMessage(messageId: string) {
    if (!selectedId) return;
    const res = await fetch(
      withBasePath(`/api/conversations/${selectedId}/messages/${messageId}`),
      {
        method: "DELETE",
      },
    );
    if (!res.ok) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    void loadConversations();
    broadcastUnreadRefresh();
  }

  return (
    <div className="w-full max-w-none">
      {!showConversationSidebar && !loadingConversations ? (
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-900">
          Messages
        </h1>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        {showConversationSidebar ? (
          <aside className="w-full md:w-[380px]">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Messages
              </h1>
            </div>

            {loadingConversations ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                Loading…
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                No conversations yet.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => {
                const active = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm"
                        : "border-[var(--border)] bg-white hover:border-[var(--brand-soft-border)]"
                    }`}
                    onClick={(e) => {
                      const raw = e.target;
                      const el =
                        raw instanceof Element
                          ? raw
                          : raw instanceof Node
                            ? raw.parentElement
                            : null;
                      if (el?.closest("a[href]")) return;
                      setSelectedId(c.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/listing/${c.listing.id}`}
                        prefetch={true}
                        className="relative z-10 h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-200 ring-1 ring-black/5 transition hover:opacity-90"
                        aria-label={`View listing: ${c.listing.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.listing.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/listing/${c.listing.id}`}
                          prefetch={true}
                          className="relative z-10 block truncate text-sm font-semibold text-neutral-900 hover:underline"
                        >
                          {c.listing.title}
                        </Link>
                        <div
                          className={`mt-1 line-clamp-1 text-xs ${
                            active ? "text-[var(--muted)]" : "text-[var(--muted)]"
                          }`}
                        >
                          {c.lastMessage?.body ?? "Say hi"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </aside>
        ) : null}

        <section className="w-full flex-1">
          <div className="h-[70vh] min-h-[420px] rounded-2xl border border-[var(--border)] bg-white">
            {error ? (
              <div className="p-4 text-sm text-red-600">{error}</div>
            ) : !selectedConversation ? (
              <div className="p-4 text-sm text-[var(--muted)]">
                {loadingConversations
                  ? "Loading…"
                  : conversations.length === 0
                    ? "No conversations yet."
                    : "Select a conversation."}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] p-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/listing/${selectedConversation.listing.id}`}
                      className="truncate text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {selectedConversation.listing.title}
                    </Link>
                    <div className="truncate text-xs text-[var(--muted)]">
                      {selectedConversation.listing.location},{" "}
                      {selectedConversation.listing.country}
                    </div>
                  </div>
                  <Link
                    href={`/profile/${selectedConversation.other.id}`}
                    title="View profile"
                    className="flex shrink-0 items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition hover:bg-neutral-50"
                  >
                    {selectedConversation.other.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedConversation.other.avatarUrl}
                        alt=""
                        className="h-11 w-11 rounded-full border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
                        {profileInitial(
                          selectedConversation.other.name,
                          selectedConversation.other.email,
                        )}
                      </div>
                    )}
                    <span className="max-w-[140px] truncate text-left text-sm font-semibold text-neutral-900 sm:max-w-[200px]">
                      {selectedConversation.other.name ?? selectedConversation.other.email}
                    </span>
                  </Link>
                </div>

                <div className="flex h-[calc(70vh-64px-64px)] flex-col">
                  <div
                    className="flex-1 space-y-3 overflow-y-auto p-4"
                    aria-live="polite"
                  >
                    {loadingMessages ? (
                      <div className="text-sm text-[var(--muted)]">Loading messages…</div>
                    ) : messages.length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">No messages yet.</div>
                    ) : (
                      Array.from(new Map(messages.map((m) => [m.id, m])).values()).map((m) => {
                        const mine = m.senderId === session.id;
                        return (
                          <div
                            key={m.id}
                            className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`relative max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                mine
                                  ? "border border-[var(--brand-soft-border-light)] bg-[var(--brand-soft-hover)] text-neutral-900 shadow-sm"
                                  : "border border-neutral-100 bg-[#f4f4f5] text-neutral-900"
                              }`}
                            >
                              <div className="whitespace-pre-wrap break-words">{m.body}</div>
                              <div
                                className={`mt-1 flex flex-wrap items-center justify-end gap-2 text-[11px] ${
                                  mine ? "text-[var(--muted)]" : "text-neutral-500"
                                }`}
                              >
                                <span>
                                  {new Date(m.createdAt).toLocaleString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {mine ? <DeliveryTicks readAt={m.readAt} /> : null}
                              </div>
                              {mine ? (
                                <button
                                  type="button"
                                  onClick={() => void deleteMessage(m.id)}
                                  className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-transparent opacity-0 transition group-hover:bg-[var(--brand-soft-hover)] group-hover:text-neutral-800 group-hover:opacity-100"
                                  aria-label="Delete message"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {peerTyping ? (
                      <p className="text-xs italic text-[var(--muted)]">
                        {selectedConversation.other.name ??
                          selectedConversation.other.email}{" "}
                        is typing…
                      </p>
                    ) : null}
                    <div ref={endRef} />
                  </div>

                  <form
                    ref={messageFormRef}
                    className="border-t border-[var(--border)] p-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedId) return;
                      const text = body.trim();
                      if (!text) return;

                      setBody("");
                      const res = await fetch(
                        withBasePath(`/api/conversations/${selectedId}/messages`),
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ body: text }),
                        },
                      );
                      const data = (await res.json().catch(() => ({}))) as {
                        error?: string;
                        data?: MessageDTO;
                      };
                      if (!res.ok || !data.data) {
                        setError(data.error ?? "Failed to send message.");
                        return;
                      }
                      setError(null);
                      setMessages((prev) => appendMessagesDeduped(prev, data.data as MessageDTO));
                      void loadConversations();
                      broadcastUnreadRefresh();
                    }}
                  >
                    <div className="flex gap-3">
                      <textarea
                        value={body}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBody(v);
                          if (!selectedId) return;
                          const now = Date.now();
                          if (v.trim().length > 0 && now - lastTypingBurstRef.current > 1200) {
                            lastTypingBurstRef.current = now;
                            void notifyTyping(true);
                          }
                          if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
                          if (v.trim().length === 0) {
                            void notifyTyping(false);
                            return;
                          }
                          typingIdleRef.current = setTimeout(() => {
                            void notifyTyping(false);
                            typingIdleRef.current = null;
                          }, 2000);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            messageFormRef.current?.requestSubmit();
                          }
                        }}
                        onBlur={() => {
                          if (typingIdleRef.current) {
                            clearTimeout(typingIdleRef.current);
                            typingIdleRef.current = null;
                          }
                          void notifyTyping(false);
                        }}
                        placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
                        className="min-h-[44px] w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                      />
                      <button
                        type="submit"
                        className="brand-btn shrink-0 self-end rounded-xl px-4 py-2 text-sm font-semibold text-white"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
