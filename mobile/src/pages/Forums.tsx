import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, MessageSquarePlus, MessagesSquare, Pin, Search, X } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { supabase } from "@/lib/supabase";
import { Avatar, Btn, Card, Empty, Input, Spinner, Tag, Textarea } from "@kit";
import { errorText, fmtDate, friendlyError, isApp, useImagePreviewUrl } from "@kit";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["General", "Career", "Business", "Skills", "Funding", "Learning"] as const;

/**
 * COMMUNITY FORUMS TAB — threads with images, compose with image picker,
 * live popups via the mounted ForumAlerts hook.
 */
export default function Forums() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [image, setImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreview = useImagePreviewUrl(image);

  const { data: threads, isLoading } = useQuery({
    queryKey: [...queryKeys.forumThreads.base, "mobile-forums"],
    queryFn: () => api.getForumThreads(),
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const filtered = (threads ?? []).filter((t: any) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (t.title ?? "").toLowerCase().includes(needle) || (t.body ?? "").toLowerCase().includes(needle);
  });

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setImage(f);
  };

  const post = async () => {
    if (!appUser) return;
    if (!title.trim() || !body.trim()) {
      toast.error("Give your post a title and a message");
      return;
    }
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (image) {
        const up = await api.uploadForumImage(appUser.id, image);
        if (!up.success) {
          toast.error(friendlyError(errorText(up.error ?? "Image upload failed")));
          setPosting(false);
          return;
        }
        imageUrl = up.data ?? undefined;
      }
      const res = await api.createForumThread({
        userId: appUser.id,
        title: title.trim(),
        body: body.trim(),
        category,
        authorName: appUser.name,
        imageUrl,
      });
      if (!res.success) {
        toast.error(friendlyError(errorText(res.error)));
        return;
      }
      toast.success("Posted to the community 🎉");
      setComposeOpen(false);
      setTitle("");
      setBody("");
      setImage(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.forumThreads.base });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    }  finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Community</h1>
          <Btn size="md" onClick={() => setComposeOpen((v) => !v)} className="h-9 rounded-xl px-3 text-xs">
            <MessageSquarePlus className="h-4 w-4" /> New post
          </Btn>
        </div>
        <div className="relative mt-2.5">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search discussions…" className="pl-11" value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" />
        </div>
      </div>

      {composeOpen && (
        <ComposeCard
          title={title} setTitle={setTitle}
          body={body} setBody={setBody}
          category={category} setCategory={setCategory}
          imagePreview={imagePreview}
          onPick={() => fileInputRef.current?.click()}
          onClearImage={() => setImage(null)}
          onSubmit={post}
          posting={posting}
          onClose={() => setComposeOpen(false)}
        />
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />

      <div className="px-4 pb-6 pt-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
        ) : filtered.length === 0 ? (
          <Empty
            icon={MessagesSquare}
            title={q ? "No matching discussions" : "No posts yet"}
            sub={q ? "Try another search term." : "Be the first to start a conversation — your question could help hundreds of women."}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((t: any) => (
              <motion.div key={t.id} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/forum/${t.id}`)}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={t.author_name} src={t.author_avatar} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-muted-foreground">{t.author_name ?? "Member"}</p>
                        {t.category && t.category !== "General" && <Tag color="violet">{t.category}</Tag>}
                      </div>
                      <p className="mt-1 line-clamp-2 font-semibold leading-snug">{t.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {(t.body ?? "").replace(/<[^>]*>/g, "")}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{fmtDate(t.created_at, { day: "numeric", month: "short" })}</span>
                        <span>{t.replies_count ?? 0} replies</span>
                        {t.image_url && <span>📷 Photo</span>}
                      </div>
                    </div>
                    {t.image_url && <img src={t.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Compose card ─────────────────────────────── */

function ComposeCard(props: {
  title: string; setTitle: (v: string) => void;
  body: string; setBody: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  imagePreview: string | null;
  onPick: () => void;
  onClearImage: () => void;
  onSubmit: () => void;
  posting: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mx-4 mt-3 overflow-hidden rounded-2xl bg-card shadow-md ring-1 ring-border">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">New discussion</p>
          <button onClick={props.onClose} className="rounded-full p-1.5 hover:bg-muted" aria-label="Discard"><X className="h-4 w-4" /></button>
        </div>
        <Input className="mt-3" placeholder="Title" value={props.title} onChange={(e) => props.setTitle(e.target.value)} maxLength={120} />
        <Textarea className="mt-2 min-h-24" placeholder="What do you want to share or ask?" value={props.body} onChange={(e) => props.setBody(e.target.value)} rows={4} />
        <div className="no-scrollbar-scroll mt-2 flex gap-1.5 pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => props.setCategory(c)} className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${props.category === c ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
        {props.imagePreview && (
          <div className="relative mt-3">
            <img src={props.imagePreview} alt="" className="h-36 w-full rounded-xl object-cover" />
            <button onClick={props.onClearImage} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white" aria-label="Remove image"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Btn variant="outline" size="md" onClick={props.onPick} className="flex-1">
            <ImagePlus className="h-4 w-4" /> Add image
          </Btn>
          <Btn size="md" onClick={props.onSubmit} loading={props.posting} className="flex-1">
            {props.posting ? "Posting…" : "Post"}
          </Btn>
        </div>
      </div>
    </motion.div>
  );
}
