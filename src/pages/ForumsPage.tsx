import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, Pin, Search, Plus, ChevronDown, ChevronUp, Send, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const categories = ["All", "General", "Career Advice", "Technical Help", "Programs", "Networking"];

const initialThreads = [
  {
    id: 1, title: "How do I get the most out of the Data Science program?", category: "Programs",
    author: "Chioma Eze", avatar: "C", date: "2 hours ago", replies: 8, likes: 14, pinned: true, solved: false,
    body: "Hi everyone! I just enrolled in the Women in Data Science program and I'm feeling a bit overwhelmed. Any tips on how to stay on track and actually finish the program?",
    replyList: [
      { id: 1, author: "Grace Mensah", avatar: "G", date: "1 hour ago", text: "Set aside at least 2 hours daily. The assignments build on each other so don't skip!", likes: 7 },
      { id: 2, author: "Amara Osei", avatar: "A", date: "45 min ago", text: "Join the cohort WhatsApp group — your program manager should share it. Community accountability helped me a lot.", likes: 5 },
    ],
  },
  {
    id: 2, title: "Resources for learning Power BI from scratch", category: "Technical Help",
    author: "Fatima Hassan", avatar: "F", date: "1 day ago", replies: 5, likes: 21, pinned: false, solved: true,
    body: "Does anyone have recommendations for beginner Power BI resources outside the course materials? YouTube channels, blogs, anything helps!",
    replyList: [
      { id: 1, author: "Zainab Musa", avatar: "Z", date: "23 hours ago", text: "Guy In A Cube on YouTube is literally the best Power BI channel. Start there!", likes: 12 },
    ],
  },
  {
    id: 3, title: "Networking event in Lagos next month — who's going?", category: "Networking",
    author: "Nkechi Adeyemi", avatar: "N", date: "3 days ago", replies: 12, likes: 34, pinned: false, solved: false,
    body: "SLA is hosting a networking event in Lagos on April 15. I'll be there — anyone else attending? Would love to connect IRL!",
    replyList: [],
  },
  {
    id: 4, title: "Certificate not downloading — is anyone else having this issue?", category: "Technical Help",
    author: "Keturah Lekwauwa", avatar: "K", date: "5 days ago", replies: 3, likes: 2, pinned: false, solved: true,
    body: "My certificate download just opens a blank page. Tried on Chrome and Firefox. Anyone else?",
    replyList: [
      { id: 1, author: "Admin", avatar: "A", date: "4 days ago", text: "Hi Keturah! This was a known issue that has now been resolved. Please try again and let us know if it persists.", likes: 3 },
    ],
  },
  {
    id: 5, title: "How to transition from Finance to Data Analytics", category: "Career Advice",
    author: "Blessing Okafor", avatar: "B", date: "1 week ago", replies: 19, likes: 47, pinned: false, solved: false,
    body: "I'm a finance professional with 4 years of experience and I want to transition into data analytics. How did others make this jump? What should I focus on?",
    replyList: [],
  },
];

export default function ForumsPage() {
  const [threads, setThreads] = useState(initialThreads);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openThread, setOpenThread] = useState<number | null>(null);
  const [newReply, setNewReply] = useState<Record<number, string>>({});
  const [showNew, setShowNew] = useState(false);
  const [newThread, setNewThread] = useState({ title: "", body: "", category: "General" });

  const filtered = threads.filter(t => {
    const matchCat = category === "All" || t.category === category;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleThread = (id: number) => setOpenThread(prev => prev === id ? null : id);

  const submitReply = (threadId: number) => {
    const text = newReply[threadId]?.trim();
    if (!text) return;
    setThreads(prev => prev.map(t => t.id === threadId ? {
      ...t,
      replies: t.replies + 1,
      replyList: [...t.replyList, { id: Date.now(), author: "You", avatar: "Y", date: "Just now", text, likes: 0 }],
    } : t));
    setNewReply(prev => ({ ...prev, [threadId]: "" }));
  };

  const submitThread = () => {
    if (!newThread.title.trim()) return;
    setThreads(prev => [{
      id: Date.now(), ...newThread, author: "You", avatar: "Y", date: "Just now",
      replies: 0, likes: 0, pinned: false, solved: false, replyList: [],
    }, ...prev]);
    setNewThread({ title: "", body: "", category: "General" });
    setShowNew(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Community Forums</h1>
          <p className="text-muted-foreground text-sm mt-1">Ask questions, share knowledge, connect with peers</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-xl gradient-card text-primary-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Thread
        </Button>
      </div>

      {/* New thread form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Start a New Discussion</h3>
            <input value={newThread.title} onChange={e => setNewThread(p => ({ ...p, title: e.target.value }))}
              placeholder="Thread title..." className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <textarea value={newThread.body} onChange={e => setNewThread(p => ({ ...p, body: e.target.value }))}
              placeholder="What's on your mind?" rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            <div className="flex items-center gap-3">
              <select value={newThread.category} onChange={e => setNewThread(p => ({ ...p, category: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
                {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
              </select>
              <Button onClick={submitThread} className="rounded-xl gradient-card text-primary-foreground text-sm">Post</Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="rounded-xl text-sm">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search discussions..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1 flex-wrap bg-muted p-1 rounded-xl">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <div className="space-y-3">
        {filtered.map((thread, i) => (
          <motion.div key={thread.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Thread header */}
            <button className="w-full text-left p-5" onClick={() => toggleThread(thread.id)}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 mt-0.5">
                  {thread.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {thread.pinned && <span className="flex items-center gap-1 text-[10px] text-secondary font-semibold"><Pin className="w-3 h-3" /> Pinned</span>}
                    {thread.solved && <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-semibold">✓ Solved</span>}
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />{thread.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm leading-snug">{thread.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">by {thread.author} · {thread.date}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 ml-2">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{thread.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{thread.replies}</span>
                  {openThread === thread.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {/* Thread body */}
            <AnimatePresence>
              {openThread === thread.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border overflow-hidden">
                  <div className="p-5 space-y-5">
                    {/* Original post */}
                    <div className="bg-muted/40 rounded-xl p-4">
                      <p className="text-sm text-foreground leading-relaxed">{thread.body}</p>
                    </div>

                    {/* Replies */}
                    {thread.replyList.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{thread.replyList.length} {thread.replyList.length === 1 ? "Reply" : "Replies"}</p>
                        {thread.replyList.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                              {reply.avatar}
                            </div>
                            <div className="flex-1 bg-background rounded-xl p-3 border border-border">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-foreground">{reply.author}</span>
                                <span className="text-[10px] text-muted-foreground">{reply.date}</span>
                              </div>
                              <p className="text-sm text-foreground/90">{reply.text}</p>
                              <button onClick={() => toast.success("Liked!")} className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                                <ThumbsUp className="w-3 h-3" /> {reply.likes}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full gradient-card flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 mt-1">Y</div>
                      <div className="flex-1 flex gap-2">
                        <input value={newReply[thread.id] || ""} onChange={e => setNewReply(p => ({ ...p, [thread.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && submitReply(thread.id)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <Button size="sm" onClick={() => submitReply(thread.id)} className="rounded-xl gradient-card text-primary-foreground px-3">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No threads found. Be the first to start a discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
