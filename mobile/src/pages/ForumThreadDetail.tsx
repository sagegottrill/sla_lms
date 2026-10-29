import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Send, X } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { supabase } from "@/lib/supabase";
import { Avatar, Btn, Card, Input, PageLoader, Spinner, Tag, Textarea } from "@kit";
import { errorText, fmtDate, friendlyError, useImagePreviewUrl } from "@kit";
import { useParams, useNavigate } from "react-router-dom";

/**
 * THREAD DETAIL — thread body with image, live-updating replies,
 * reply composer with image upload.
 */
export default function ForumThreadDetail() {
  const { threadId } = useParams();
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imagePreview = useImagePreviewUrl(image);

  const { data: threads, isLoading: threadLoading } = useQuery({
    queryKey: [...queryKeys.forumThreads.base, "mobile-forums"],
    queryFn: () => api.getForumThreads(),
    select: (r) => (r.success ? r.data ?? [] : []),
  });
  const thread = (threads ?? []).find((t: any) => String(t.id) === String(threadId));

  const { data: replies, isLoading: repliesLoading, refetch } = useQuery({
    queryKey: ["forumReplies", threadId],
    queryFn: () => api.getForumReplies(threadId!),
    enabled: !!threadId,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  // Realtime updates while the thread is open (falls back to the global poll).
  useEffect(() => {
    if (!threadId || !appUser) return;
    const channel = supabase
      .channel(`thread_replies_mobile_${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_replies", filter: `thread_id=eq.${threadId}` }, () => {
        void refetch();
        queryClient.invalidateQueries({ queryKey: queryKeys.forumThreads.base });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, appUser?.id, refetch, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [(replies ?? []).length]);

  const send = async () => {
    if (!appUser || !threadId || !reply.trim()) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (image) {
        const up = await api.uploadForumImage(appUser.id, image);
        if (!up.success) {
          toast.error(friendlyError(errorText(up.error ?? "Image upload failed")));
          setSending(false);
          return;
        }
        imageUrl = up.data ?? undefined;
      }
      const res = await api.createForumReply({
        threadId: String(threadId),
        userId: appUser.id,
        body: reply.trim(),
        authorName: appUser.name,
        imageUrl,
      });
      if (!res.success) {
        toast.error(friendlyError(errorText(res.error)));
        return;
      }
      setReply("");
      setImage(null);
      void refetch();
      queryClient.invalidateQueries({ queryKey: queryKeys.forumThreads.base });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setSending(false);
    }
  };

  if (threadLoading) return <PageLoader />;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar title={thread?.title ?? "Discussion"} />

      <div className="flex-1 px-4 pb-40">
        {thread && (
          <Card className="mt-2 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={thread.author_name} src={thread.author_avatar} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{thread.author_name ?? "Member"}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(thread.created_at)}</p>
              </div>
              {thread.category && thread.category !== "General" && <Tag color="violet" className="ml-auto">{thread.category}</Tag>}
            </div>
            <h1 className="mt-3 font-display text-xl font-bold leading-snug">{thread.title}</h1>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{thread.body}</p>
            {thread.image_url && <img src={thread.image_url} alt="" className="mt-3 max-h-80 w-full rounded-xl object-cover" loading="lazy" />}
          </Card>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Replies <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{(replies ?? []).length}</span>
        </div>

        {repliesLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-5 w-5" /></div>
        ) : (replies ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No replies yet — be the first to respond 💬</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {(replies ?? []).map((r: any) => (
              <Card key={r.id} className="p-3.5">
                <div className="flex items-start gap-2.5">
                  <Avatar name={r.author_name} src={r.author_avatar} className="h-8 w-8 text-[11px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-semibold">{r.author_name ?? "Member"}</p>
                      <span className="text-[10px] text-muted-foreground">{fmtDate(r.created_at)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
                    {r.image_url && <img src={r.image_url} alt="" className="mt-2 max-h-64 w-full rounded-lg object-cover" loading="lazy" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* reply composer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 pb-3 pt-2 backdrop-blur pad-bottom-safe">
        {image && (
          <div className="relative mb-2 inline-block">
            <img src={imagePreview ?? undefined} alt="" className="h-16 rounded-lg object-cover" />
            <button onClick={() => setImage(null)} className="absolute -right-2 -top-2 rounded-full bg-black/70 p-1 text-white" aria-label="Remove image">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted" aria-label="Add image">
            <ImagePlus className="h-5 w-5" />
          </button>
          <Textarea
            rows={1}
            placeholder="Write a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="max-h-32 min-h-11 flex-1 resize-none py-3"
          />
          <Btn size="md" onClick={send} disabled={!reply.trim() || sending} className="h-11 w-11 rounded-xl px-0" aria-label="Send reply">
            <Send className="h-5 w-5" />
          </Btn>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB"); setImage(f); } e.target.value = ""; }} />
    </div>
  );
}
