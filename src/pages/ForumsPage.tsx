import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Pin, Search, Plus, ChevronDown, ChevronUp, Loader2, Tag, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForumThreads, useCreateForumThreadMutation } from "@/hooks/useQueries";
import { api } from "@/services/api";

const categories = ["All", "General", "Career Advice", "Technical Help", "Programs", "Networking"];
const FORUM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Picks up a File selected in an <input type="file">, validating size/type. */
function validateForumImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Please choose an image file (PNG, JPG, GIF, WebP).";
  if (file.size > FORUM_IMAGE_MAX_BYTES) return "Image is larger than 5 MB. Please choose a smaller image.";
  return null;
}

function ForumImagePicker({
  file,
  preview,
  onPick,
  onClear,
  disabled,
}: {
  file: File | null;
  preview: string | null;
  onPick: (f: File | null) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputId = `forum-image-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f) {
            const err = validateForumImage(f);
            if (err) { toast.error(err); return; }
          }
          onPick(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="rounded-full h-8 text-xs font-semibold"
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Add image
      </Button>
      {file && !preview && <span className="text-xs text-muted-foreground max-w-40 truncate">{file.name}</span>}
      {(preview || file) && (
        <button type="button" onClick={onClear} disabled={disabled} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove image">
          <X className="w-4 h-4" />
        </button>
      )}
      {preview && (
        <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-black/5" />
      )}
    </div>
  );
}

export default function ForumsPage() {
  const { appUser } = useAuth();
  const { data: threads = [], isLoading } = useForumThreads();
  const createMutation = useCreateForumThreadMutation();

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newThread, setNewThread] = useState({ title: "", body: "", category: "General" });
  const [threadImage, setThreadImage] = useState<File | null>(null);
  const [threadImagePreview, setThreadImagePreview] = useState<string | null>(null);
  const [repliesByThread, setRepliesByThread] = useState<Record<string, any[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyImages, setReplyImages] = useState<Record<string, File | null>>({});
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const filtered = (threads as any[]).filter(t => {
    const matchCat = category === "All" || t.category === category;
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleThread = (id: string) => setOpenThread(prev => prev === id ? null : id);

  useEffect(() => {
    if (!openThread) return;
    if (repliesByThread[openThread]) return;
    setLoadingReplies(openThread);
    void api.getForumReplies(openThread).then((res) => {
      if (res.success) {
        setRepliesByThread((prev) => ({ ...prev, [openThread]: res.data ?? [] }));
      }
      setLoadingReplies(null);
    });
  }, [openThread, repliesByThread]);

  const submitReply = async (threadId: string) => {
    const body = (replyDrafts[threadId] ?? "").trim();
    const image = replyImages[threadId] ?? null;
    if ((!body && !image) || !appUser?.id) return;
    let imageUrl: string | undefined;
    if (image) {
      setUploadingImage(true);
      const up = await api.uploadForumImage(appUser.id, image);
      setUploadingImage(false);
      if (!up.success || !up.data) {
        toast.error(up.error || "Could not upload image");
        return;
      }
      imageUrl = up.data;
    }
    const res = await api.createForumReply({
      threadId,
      userId: appUser.id,
      body,
      authorName: appUser.name ?? "User",
      imageUrl,
    });
    if (!res.success) {
      toast.error(res.error || "Could not post reply");
      return;
    }
    setRepliesByThread((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), res.data],
    }));
    setReplyDrafts((prev) => ({ ...prev, [threadId]: "" }));
    setReplyImages((prev) => ({ ...prev, [threadId]: null }));
    toast.success("Reply posted");
  };

  const submitThread = () => {
    if (!appUser?.id) { toast.error("Please log in to post a thread."); return; }
    if (!newThread.title.trim()) return;
    void (async () => {
      let imageUrl: string | undefined;
      if (threadImage) {
        setUploadingImage(true);
        const up = await api.uploadForumImage(appUser.id!, threadImage);
        setUploadingImage(false);
        if (!up.success || !up.data) {
          toast.error(up.error || "Could not upload image");
          return;
        }
        imageUrl = up.data;
      }
      createMutation.mutate({
        userId:     appUser.id,
        title:      newThread.title.trim(),
        body:       newThread.body.trim(),
        category:   newThread.category,
        authorName: appUser.name ?? "User",
        imageUrl,
      }, {
        onSuccess: () => {
          setNewThread({ title: "", body: "", category: "General" });
          setThreadImage(null);
          setThreadImagePreview(null);
          setShowNew(false);
        },
        onError: (err: any) => toast.error(err?.message || "Could not post thread"),
      });
    })();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Community Forums</h1>
          <p className="text-muted-foreground text-sm">
            Ask questions, share knowledge, connect with peers.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0 transition-colors">
          <Plus className="w-3.5 h-3.5 mr-2" /> New Thread
        </Button>
      </div>

      {/* New thread form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 space-y-4">
            <h3 className="font-display font-semibold text-lg text-foreground">Start a New Discussion</h3>
            <input value={newThread.title} onChange={e => setNewThread(p => ({ ...p, title: e.target.value }))}
              placeholder="Thread title..." className="w-full px-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            <textarea value={newThread.body} onChange={e => setNewThread(p => ({ ...p, body: e.target.value }))}
              placeholder="What's on your mind?" rows={3}
              className="w-full px-4 py-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
            <ForumImagePicker
              file={threadImage}
              preview={threadImagePreview}
              onPick={(f) => {
                setThreadImage(f);
                setThreadImagePreview(f ? URL.createObjectURL(f) : null);
              }}
              onClear={() => {
                setThreadImage(null);
                setThreadImagePreview(null);
              }}
              disabled={createMutation.isPending || uploadingImage}
            />
            <div className="flex items-center gap-3">
              <select value={newThread.category} onChange={e => setNewThread(p => ({ ...p, category: e.target.value }))}
                className="px-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none appearance-none">
                {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
              </select>
              <Button
                onClick={submitThread}
                disabled={createMutation.isPending || uploadingImage || !newThread.title.trim()}
                className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0"
              >
                {createMutation.isPending || uploadingImage
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />{uploadingImage ? "Uploading image…" : "Posting…"}</>
                  : "Post"}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search discussions..."
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-max">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                category === c
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "text-foreground bg-transparent hover:bg-muted/80"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 bg-card/20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary/40" />
            <p className="text-sm">Loading discussions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card/20">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No discussions yet</p>
            <p className="text-sm text-muted-foreground">Be the first to start a conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((thread) => (
              <div key={thread.id}>
                <button className="w-full text-left px-6 py-4 hover:bg-muted/10 transition-colors" onClick={() => toggleThread(thread.id)}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                      {(thread.author_name ?? thread.author ?? "U").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {thread.pinned && <span className="text-[10px] text-primary font-semibold flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>}
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />{thread.category}
                        </span>
                        {thread.image_url && (
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground flex items-center gap-1">
                            <ImagePlus className="w-2.5 h-2.5" /> Photo
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{thread.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {thread.author_name ?? thread.author ?? "User"} ·{" "}
                        {thread.created_at
                          ? new Date(thread.created_at).toLocaleDateString("en-US")
                          : thread.date ?? ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 ml-2">
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{thread.likes}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{thread.replies_count ?? thread.replies ?? 0}</span>
                      {openThread === thread.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>
                {openThread === thread.id && (
                  <div className="px-6 pb-5 bg-muted/10 border-t border-border/40">
                    {thread.body ? <p className="text-sm text-foreground py-4 whitespace-pre-wrap">{thread.body}</p> : null}
                    {thread.image_url && (
                      <img src={thread.image_url} alt={thread.title} className="max-h-80 rounded-xl mt-1 mb-4 object-cover ring-1 ring-black/5" loading="lazy" />
                    )}
                    <div className="space-y-3">
                      {loadingReplies === thread.id ? (
                        <p className="text-xs text-muted-foreground">Loading replies…</p>
                      ) : (repliesByThread[thread.id] ?? []).map((reply: any) => (
                        <div key={reply.id} className="bg-card rounded-xl p-3 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">{reply.author_name ?? "User"}</p>
                          {reply.body ? <p className="text-foreground whitespace-pre-wrap">{reply.body}</p> : null}
                          {reply.image_url && (
                            <img src={reply.image_url} alt="" className="max-h-64 rounded-lg mt-2 object-cover ring-1 ring-black/5" loading="lazy" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <input
                        value={replyDrafts[thread.id] ?? ""}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                        placeholder="Write a reply..."
                        className="flex-1 min-w-40 px-3 py-2 rounded-xl border bg-background text-sm"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`reply-image-${thread.id}`}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          if (f) {
                            const err = validateForumImage(f);
                            if (err) { toast.error(err); return; }
                          }
                          setReplyImages((prev) => ({ ...prev, [thread.id]: f }));
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-8 text-xs font-semibold"
                        onClick={() => document.getElementById(`reply-image-${thread.id}`)?.click()}
                        aria-label="Attach an image"
                      >
                        <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                        {replyImages[thread.id]?.name ? "Photo attached" : "Add image"}
                      </Button>
                      {replyImages[thread.id] && (
                        <button onClick={() => setReplyImages((prev) => ({ ...prev, [thread.id]: null }))} className="text-muted-foreground hover:text-destructive" aria-label="Remove attached image">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <Button size="sm" className="rounded-full" disabled={uploadingImage} onClick={() => void submitReply(thread.id)}>Reply</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
