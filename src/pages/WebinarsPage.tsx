import { useMemo, useState } from "react";
import { Calendar, Clock, Link as LinkIcon, Plus, Trash2, Loader2, Video, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function useCountdown(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isPast: diff <= 0 };
}

const emptyForm = {
  title: "",
  description: "",
  meeting_url: "",
  starts_at: "",
  audience: "all",
};

function SessionCard({ session, isStaff, onDelete, onEdit }: { session: any; isStaff: boolean; onDelete: (id: string) => void; onEdit: (session: any) => void }) {
  const countdown = useCountdown(session.starts_at);
  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{session.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(session.starts_at).toLocaleString()}
          </p>
        </div>
        {isStaff && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEdit(session)} className="text-primary hover:text-primary/80 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => onDelete(session.id)} className="text-destructive hover:text-destructive/80 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {session.description ? <p className="text-sm text-muted-foreground mt-3">{session.description}</p> : null}
      <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-primary">
        <Clock className="w-3.5 h-3.5" />
        {countdown.isPast ? "Live now" : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`}
      </div>
      <Button className="mt-4 rounded-full text-xs" onClick={() => window.open(session.meeting_url, "_blank", "noopener,noreferrer")}>
        <LinkIcon className="w-3.5 h-3.5 mr-1" /> Join session
      </Button>
    </div>
  );
}

export default function WebinarsPage() {
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = appUser?.role === "admin" || appUser?.role === "program_manager" || appUser?.role === "instructor";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["live-sessions"],
    queryFn: async () => {
      const res = await api.getLiveSessions();
      return res.success ? res.data ?? [] : [];
    },
  });

  const upcoming = useMemo(
    () => sessions.filter((s: any) => new Date(s.starts_at).getTime() >= Date.now()).sort((a: any, b: any) => +new Date(a.starts_at) - +new Date(b.starts_at)),
    [sessions],
  );

  const handleEdit = (session: any) => {
    // Convert ISO date to datetime-local format
    const startsAt = new Date(session.starts_at);
    const localDateTime = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setForm({
      title: session.title,
      description: session.description || "",
      meeting_url: session.meeting_url,
      starts_at: localDateTime,
      audience: session.audience || "all",
    });
    setEditingId(session.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.meeting_url.trim() || !form.starts_at) {
      toast.error("Title, meeting link, and start time are required.");
      return;
    }
    setSaving(true);
    try {
      // Convert datetime-local string to ISO string (preserving local timezone)
      // datetime-local gives us "2024-01-15T18:00" which is in user's local time
      // We need to convert this to a proper ISO string for database storage
      const localDate = new Date(form.starts_at);
      const isoString = localDate.toISOString();
      
      const payload = {
        ...form,
        starts_at: isoString,
      };
      
      if (editingId) {
        // Update existing session
        const res = await api.updateLiveSession(editingId, payload);
        if (!res.success) throw new Error(res.error || "Could not update session");
        toast.success("Webinar updated successfully.");
      } else {
        // Create new session
        const res = await api.createLiveSession({
          ...payload,
          created_by: appUser?.id ?? null,
        });
        if (!res.success) throw new Error(res.error || "Could not schedule session");
        toast.success("Webinar scheduled.");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
    } catch (e: any) {
      toast.error(e?.message ?? (editingId ? "Could not update session" : "Could not schedule session"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    const res = await api.deleteLiveSession(id);
    if (!res.success) {
      toast.error(res.error || "Could not delete session");
      return;
    }
    toast.success("Webinar deleted.");
    queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Webinars & Live Sessions</h1>
          <p className="text-muted-foreground text-sm">Join live learning via Zoom, Google Meet, Teams, or other external links.</p>
        </div>
        {isStaff && (
          <Button onClick={() => setShowForm((v) => !v)} className="rounded-full px-6 h-9 text-xs font-bold">
            <Plus className="w-3.5 h-3.5 mr-2" /> Schedule session
          </Button>
        )}
      </div>

      {showForm && isStaff && (
        <div className="bg-card rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">
              {editingId ? "Edit Webinar" : "Schedule New Webinar"}
            </h3>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-muted-foreground">
                Cancel
              </Button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Session title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="px-3 py-2 rounded-xl border bg-background text-sm" />
            <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} className="px-3 py-2 rounded-xl border bg-background text-sm" />
            <input placeholder="Meeting URL" value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} className="sm:col-span-2 px-3 py-2 rounded-xl border bg-background text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="sm:col-span-2 px-3 py-2 rounded-xl border bg-background text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => void handleCreate()} disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update session" : "Save session"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancelEdit} className="rounded-full">
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : upcoming.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-2xl ring-1 ring-black/5">
          <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-foreground">No upcoming webinars</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {upcoming.map((session: any) => (
            <SessionCard key={session.id} session={session} isStaff={isStaff} onDelete={(id) => void handleDelete(id)} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
