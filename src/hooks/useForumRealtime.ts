import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Real-time forum alerts with belt-and-braces delivery.
 *
 * 1. Fast path: Supabase Realtime INSERT events on `forum_threads`/`forum_replies`.
 * 2. Fallback: a 15s poll that fires alerts for any post newer than the last seen
 *    cursor (at mount this is "now", so long-standing posts never re-announce).
 *
 * Every alert is a toast popup on any dashboard page + a browser notification
 * when permission is granted, with an action to open Community Forums.
 */
const POLL_INTERVAL_MS = 15_000;

export function useForumRealtime() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  // Keep the latest user id without re-subscribing on appUser updates.
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = appUser?.id ?? null;

  useEffect(() => {
    // Don't alert until we know who the user is (avoids pinging during load).
    let canceled = false;
    const seen = new Set<string>(); // notification keys already announced in this session
    let threadCursor = ""; // newest created_at already announced
    let replyCursor = "";

    const notify = (
      title: string,
      description: string | undefined,
      userId: string | null | undefined,
      toPath: string,
    ) => {
      if (!userIdRef.current) return;
      // Never ping people about their own posts.
      if (userId && userId === userIdRef.current) return;

      toast.info(title, {
        description,
        action: { label: "Open", onClick: () => navigate(toPath) },
        duration: 8000,
      });

      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: description, tag: "sla-forum" });
        } else if ("Notification" in window && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      } catch {
        // Browser notifications are best-effort only; toast already fired.
      }
    };

    // -------------------------------------------------------------
    // Cursor bootstrap: everything already in the DB before we started
    // is history, never re-announced.
    // -------------------------------------------------------------
    void (async () => {
      const [threads, replies] = await Promise.all([
        supabase.from("forum_threads").select("id,created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("forum_replies").select("id,created_at").order("created_at", { ascending: false }).limit(1),
      ]);
      if (canceled) return;
      threadCursor = threads.data?.[0]?.created_at ?? ""; // "" parses as invalid Date => announces nothing
      replyCursor = replies.data?.[0]?.created_at ?? "";
    })();

    const isAfterCursor = (cursor: string, createdAt: string | null) =>
      Boolean(createdAt) && (!cursor || new Date(createdAt).getTime() > new Date(cursor).getTime());

    // -------------------------------------------------------------
    // Poll fallback: any thread/reply newer than cursor produces an alert.
    // -------------------------------------------------------------
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
          notify(`New forum topic from ${t.author_name ?? "a member"}`, t.title, t.user_id, "/dashboard/forums");
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
          notify(
            `${r.author_name ?? "A member"} replied in the forum`,
            "Open Community Forums to see the new reply.",
            r.user_id,
            "/dashboard/forums",
          );
        }
        queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      } catch (err: any) {
        console.warn("Forum alert poll failed:", err?.message ?? err);
      }
    };
    const pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);

    // -------------------------------------------------------------
    // Realtime fast path (additional; same dedup set).
    // -------------------------------------------------------------
    type ForumRow = { id: string | number; title?: string; author_name: string | null; user_id: string | null; created_at?: string };
    const channel = supabase
      .channel("forum_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "forum_threads" },
        (payload) => {
          const t = payload.new as ForumRow;
          const key = `thread-${t?.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          if (t?.created_at) threadCursor = t.created_at;
          queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
          notify(`New forum topic from ${t?.author_name ?? "a member"}`, t?.title ?? "", t?.user_id, "/dashboard/forums");
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "forum_replies" },
        (payload) => {
          const r = payload.new as ForumRow;
          const key = `reply-${r?.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          if (r?.created_at) replyCursor = r.created_at;
          queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
          notify(
            `${r?.author_name ?? "A member"} replied in the forum`,
            "Open Community Forums to see the new reply.",
            r?.user_id,
            "/dashboard/forums",
          );
        },
      )
      .subscribe();
    void poll();

    return () => {
      canceled = true;
      clearInterval(pollTimer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, navigate]);
}
