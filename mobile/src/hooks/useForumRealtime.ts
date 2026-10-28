import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mobile forum alerts — identical delivery strategy to the web app:
 *   1. Fast path  — Supabase Realtime INSERT events on forum tables.
 *   2. Fallback   — 15s cursor-based poll (survives realtime lag/reconnects).
 * Toast popup with an action + system browser notification when permitted.
 */
const POLL_INTERVAL_MS = 15_000;

export function useForumRealtime() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = appUser?.id ?? null;

  useEffect(() => {
    let canceled = false;
    const seen = new Set<string>();
    let threadCursor = "";
    let replyCursor = "";

    const notify = (title: string, description: string | undefined, userId: string | null | undefined, toPath: string) => {
      if (!userIdRef.current) return;
      if (userId && userId === userIdRef.current) return;

      toast.info(title, {
        description,
        action: { label: "Open", onClick: () => navigate(toPath) },
        duration: 8000,
      });

      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: description ?? undefined, tag: "sla-forum" });
        } else if ("Notification" in window && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      } catch {
        // system notifications best-effort only; toast already delivered
      }
    };

    void (async () => {
      const [threads, replies] = await Promise.all([
        supabase.from("forum_threads").select("id,created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("forum_replies").select("id,created_at").order("created_at", { ascending: false }).limit(1),
      ]);
      if (canceled) return;
      threadCursor = threads.data?.[0]?.created_at ?? "";
      replyCursor = replies.data?.[0]?.created_at ?? "";
    })();

    const isAfterCursor = (cursor: string, createdAt: string | null) =>
      Boolean(createdAt) && (!cursor || new Date(createdAt).getTime() > new Date(cursor).getTime());

    const poll = async () => {
      if (canceled || !userIdRef.current) return;
      try {
        const { data: latestThreads } = await supabase
          .from("forum_threads")
          .select("id,title,author_name,user_id,created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        for (const t of (latestThreads ?? []) as any[]) {
          if (!isAfterCursor(threadCursor, t.created_at)) continue;
          threadCursor = t.created_at;
          const key = `thread-${t.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          notify(`New forum topic from ${t.author_name ?? "a member"}`, t.title, t.user_id, "/tabs/forums");
        }

        const { data: latestReplies } = await supabase
          .from("forum_replies")
          .select("id,thread_id,author_name,user_id,created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        for (const r of (latestReplies ?? []) as any[]) {
          if (!isAfterCursor(replyCursor, r.created_at)) continue;
          replyCursor = r.created_at;
          const key = `reply-${r.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          notify(`${r.author_name ?? "A member"} replied in the forum`, "Tap to read the new reply.", r.user_id, "/forum/" + r.thread_id);
        }
        queryClient.invalidateQueries({ queryKey: ["forumThreads"] });
      } catch (err: any) {
        console.warn("Forum alert poll failed:", err?.message ?? err);
      }
    };
    const pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);

    type ForumRow = { id: string | number; title?: string; author_name: string | null; user_id: string | null; created_at?: string; thread_id?: string };
    const channel = supabase
      .channel("forum_alerts_mobile")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_threads" }, (payload) => {
        const t = payload.new as ForumRow;
        const key = `thread-${t?.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (t?.created_at) threadCursor = t.created_at;
        queryClient.invalidateQueries({ queryKey: ["forumThreads"] });
        notify(`New forum topic from ${t?.author_name ?? "a member"}`, t?.title ?? "", t?.user_id, "/tabs/forums");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_replies" }, (payload) => {
        const r = payload.new as ForumRow;
        const key = `reply-${r?.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (r?.created_at) replyCursor = r.created_at;
        queryClient.invalidateQueries({ queryKey: ["forumThreads"] });
        notify(`${r?.author_name ?? "A member"} replied in the forum`, "Tap to read the new reply.", r?.user_id, r?.thread_id ? `/forum/${r.thread_id}` : "/tabs/forums");
      })
      .subscribe();
    void poll();

    return () => {
      canceled = true;
      clearInterval(pollTimer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, navigate]);
}
