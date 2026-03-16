import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, Play, Trash2, CheckCircle, Clock, AlertCircle, Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialVideos: VideoItem[] = [
  { id: 1, title: "Introduction to Data Analytics", course: "Women in Data Science", duration: "12:34", size: "248 MB", status: "ready", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=170&fit=crop", uploadDate: "Mar 1, 2026" },
  { id: 2, title: "Module 2 – Power BI Fundamentals", course: "Women in Data Science", duration: "28:47", size: "512 MB", status: "ready", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=170&fit=crop", uploadDate: "Mar 2, 2026" },
  { id: 3, title: "Business Model Canvas Deep Dive", course: "Startup Founders", duration: "—", size: "—", status: "processing", thumbnail: null, uploadDate: "Mar 5, 2026" },
];

type VideoStatus = "ready" | "processing" | "error" | "uploading";

interface VideoItem {
  id: number;
  title: string;
  course: string;
  duration: string;
  size: string;
  status: VideoStatus;
  thumbnail: string | null;
  uploadDate: string;
  progress?: number;
}

const statusIcon: Record<VideoStatus, React.ReactNode> = {
  ready: <CheckCircle className="w-4 h-4 text-primary" />,
  processing: <Clock className="w-4 h-4 text-secondary" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
  uploading: <Upload className="w-4 h-4 text-primary animate-bounce" />,
};

const statusLabel: Record<VideoStatus, string> = {
  ready: "Ready",
  processing: "Processing...",
  error: "Upload Error",
  uploading: "Uploading...",
};

export default function VideoUploadPage() {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [dragging, setDragging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: "", course: "Women in Data Science" });
  const fileRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (title: string, course: string) => {
    const id = Date.now();
    const newItem: VideoItem = {
      id, title, course, duration: "—", size: "—", status: "uploading",
      thumbnail: null, uploadDate: "Today", progress: 0,
    };
    setVideos(prev => [newItem, ...prev]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 12;
      if (progress >= 100) {
        clearInterval(interval);
        setVideos(prev => prev.map(v => v.id === id ? { ...v, status: "processing", progress: 100 } : v));
        setTimeout(() => {
          setVideos(prev => prev.map(v => v.id === id ? { ...v, status: "ready", duration: "15:22", size: "310 MB" } : v));
        }, 2000);
      } else {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, progress } : v));
      }
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      simulateUpload(file.name.replace(/\.[^.]+$/, ""), "Women in Data Science");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name.replace(/\.[^.]+$/, ""), newVideo.course);
  };

  const handleFormUpload = () => {
    if (!newVideo.title) return;
    simulateUpload(newVideo.title, newVideo.course);
    setNewVideo({ title: "", course: "Women in Data Science" });
    setShowForm(false);
  };

  const deleteVideo = (id: number) => setVideos(prev => prev.filter(v => v.id !== id));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Video Uploads</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload and manage course video content</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl gradient-card text-primary-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" /> Upload Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          ["Total Videos", videos.length, "text-foreground"],
          ["Ready", videos.filter(v => v.status === "ready").length, "text-primary"],
          ["Processing", videos.filter(v => v.status === "processing" || v.status === "uploading").length, "text-primary"],
        ].map(([label, val, cls]) => (
          <div key={label as string} className="bg-card rounded-2xl border border-border p-4 text-center">
            <div className={`font-display text-2xl font-bold ${cls}`}>{val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Upload New Video</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newVideo.title} onChange={e => setNewVideo(p => ({ ...p, title: e.target.value }))} placeholder="Video title"
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <select value={newVideo.course} onChange={e => setNewVideo(p => ({ ...p, course: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
                <option>Women in Data Science</option>
                <option>Startup Founders</option>
                <option>Women in Leadership</option>
                <option>Digital Marketing</option>
              </select>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
              <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Drag & drop your video here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse · MP4, MOV, AVI up to 2GB</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFormUpload} className="rounded-xl gradient-card text-primary-foreground text-sm">Start Upload</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl text-sm">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag drop zone (when no form) */}
      {!showForm && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragging ? "border-primary bg-primary/5" : "border-border"}`}>
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Drag & drop videos here for quick upload</p>
        </div>
      )}

      {/* Video grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, i) => (
          <motion.div key={video.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border overflow-hidden group">
            {/* Thumbnail */}
            <div className="relative h-36 bg-muted overflow-hidden">
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-10 h-10 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary ml-0.5" />
                </div>
              </div>
              {video.status === "uploading" && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-border">
                  <motion.div className="h-full bg-primary" animate={{ width: `${video.progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">{video.title}</h3>
                <button onClick={() => deleteVideo(video.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{video.course}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{video.duration} · {video.size}</span>
                <span className="flex items-center gap-1">
                  {statusIcon[video.status]}
                  <span className={video.status === "ready" ? "text-primary" : video.status === "error" ? "text-destructive" : "text-primary"}>
                    {statusLabel[video.status]}
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
