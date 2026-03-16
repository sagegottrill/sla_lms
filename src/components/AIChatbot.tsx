import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const faqs = [
  { q: "how do I enroll in a course", a: "To enroll, visit the course page and click **Enrol Now**. You can pay by card or mobile money. After payment, the course immediately appears in your dashboard under My Courses." },
  { q: "how do I get my certificate", a: "Complete all course modules and pass the final assessment (score ≥ 70%). Your certificate will be automatically generated and available under **Dashboard → Certificates** within 24 hours." },
  { q: "can I get a refund", a: "As all our courses provide immediate access to digital materials, we do not offer refunds. Please carefully review the course description and curriculum before enrolling." },
  { q: "how do job matches work", a: "After completing courses, your skill profile is updated automatically. Employers search our talent pool by skills and location. You can also enable **Job Matching** in your Privacy Settings to be discovered." },
  { q: "what are programs vs courses", a: "**Courses** are self-paced individual modules. **Programs** are structured cohort experiences — you go through them with a group of peers, with live sessions, mentorship, and a dedicated program manager." },
  { q: "what languages are available", a: "Most courses are in **English**, with select courses in French, Swahili, and Hausa. We're actively expanding our African language library. Check the course detail page for language info." },
  { q: "how do I contact support", a: "Reach us at **support@sheleadsafrica.org** or via WhatsApp at +234 800 SLA HELP. Support is available Monday–Friday, 8am–6pm WAT." },
];

const suggestions = [
  "How do I get my certificate?",
  "How do job matches work?",
  "What are programs vs courses?",
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

function matchAnswer(input: string): string {
  const lower = input.toLowerCase();
  for (const faq of faqs) {
    const keywords = faq.q.toLowerCase().split(" ").filter(w => w.length > 3);
    if (keywords.some(kw => lower.includes(kw))) return faq.a;
  }
  return "I'm not sure about that yet — I'm still learning! For complex questions, please email **support@sheleadsafrica.org** or WhatsApp us at **+234 800 SLA HELP** (Mon–Fri, 8am–6pm WAT). Is there anything else I can help you with?";
}

export default function AIChatbot() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm **Asha**, your Connecta assistant 👋\n\nHow can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  if (!isAuthenticated) return null;

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: matchAnswer(text) }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  const renderText = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <>
      {/* Floating button — smaller, less intrusive */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full gradient-card shadow-lg flex items-center justify-center text-primary-foreground hover:opacity-90 transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 right-5 z-50 w-[340px] max-w-[calc(100vw-20px)] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
            style={{ height: "460px" }}
          >
            {/* Header */}
            <div className="gradient-card p-3.5 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-primary-foreground text-sm">Asha</p>
                <span className="flex items-center gap-1 text-primary-foreground/70 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                  Online now
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-primary-foreground/70 hover:text-primary-foreground p-1 rounded-lg hover:bg-primary-foreground/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full gradient-card flex items-center justify-center text-primary-foreground text-[9px] font-bold shrink-0 mr-2 mt-0.5">A</div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                      ? "gradient-card text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
                  />
                </motion.div>
              ))}
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full gradient-card flex items-center justify-center text-primary-foreground text-[9px] font-bold shrink-0">A</div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground bg-muted/50 hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send(input)}
                placeholder="Ask me anything..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                className="w-8 h-8 rounded-xl gradient-card text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
