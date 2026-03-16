import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Download, CreditCard, CheckCircle2, Clock, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const transactions = [
  { id: "TXN-001", user: "Chioma Eze", course: "Data Analytics with Python", amount: 85000, gateway: "Stripe", date: "Mar 4, 2026", status: "paid", type: "course" },
  { id: "TXN-002", user: "Grace Mensah", course: "Annual Subscription", amount: 199000, gateway: "Paystack", date: "Mar 3, 2026", status: "paid", type: "subscription" },
  { id: "TXN-003", user: "Fatima Hassan", course: "Full-Stack Bootcamp", amount: 120000, gateway: "Stripe", date: "Mar 3, 2026", status: "paid", type: "course" },
  { id: "TXN-004", user: "Nkechi A.", course: "Advanced Data Visualization", amount: 69000, gateway: "Flutterwave", date: "Mar 2, 2026", status: "refunded", type: "course" },
  { id: "TXN-005", user: "Amara Osei", course: "Financial Modelling", amount: 79000, gateway: "Paystack", date: "Mar 1, 2026", status: "pending", type: "course" },
  { id: "TXN-006", user: "Blessing Okafor", course: "Monthly Subscription", amount: 29000, gateway: "Stripe", date: "Feb 28, 2026", status: "paid", type: "subscription" },
];

const revenueByGateway = [
  { gateway: "Stripe", amount: 42160, pct: 50, color: "bg-primary" },
  { gateway: "Paystack", amount: 25296, pct: 30, color: "bg-secondary" },
  { gateway: "Flutterwave", amount: 16864, pct: 20, color: "bg-gold" },
];

const statusIcon: Record<string, React.ElementType> = { paid: CheckCircle2, pending: Clock, refunded: XCircle };
const statusColors: Record<string, string> = { paid: "bg-accent text-primary", pending: "bg-accent text-primary", refunded: "bg-destructive/10 text-destructive" };

export default function PaymentsPage() {
  const [filter, setFilter] = useState("All");
  const filtered = transactions.filter(t => filter === "All" || t.status === filter.toLowerCase());
  const totalRevenue = transactions.filter(t => t.status === "paid").reduce((a, t) => a + t.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Revenue tracking and transaction history</p>
        </div>
        <Button variant="outline" className="rounded-xl flex items-center gap-2 text-sm" onClick={() => toast.success("Transactions exported!")}><Download className="w-4 h-4" /> Export Transactions</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue (MTD)", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-secondary bg-accent" },
          { label: "Transactions", value: transactions.filter(t => t.status === "paid").length, icon: CreditCard, color: "text-primary bg-accent" },
          { label: "Pending", value: transactions.filter(t => t.status === "pending").length, icon: Clock, color: "text-secondary bg-accent" },
          { label: "Refunds", value: transactions.filter(t => t.status === "refunded").length, icon: XCircle, color: "text-destructive bg-destructive/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div><div className="font-bold text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </motion.div>
        ))}
      </div>

      {/* Revenue by gateway */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">Revenue by Payment Gateway</h2>
        <div className="space-y-3">
          {revenueByGateway.map((g, i) => (
            <div key={g.gateway} className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground w-28">{g.gateway}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${g.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${g.color}`} />
              </div>
              <span className="text-sm font-bold text-foreground w-24 text-right">₦{g.amount.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground w-12 text-right">{g.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Transactions</h2>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {["All", "Paid", "Pending", "Refunded"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>{["ID", "User", "Course/Plan", "Amount", "Gateway", "Date", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t, i) => {
                const StatusIcon = statusIcon[t.status];
                return (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{t.user}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs"><div className="truncate">{t.course}</div></td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">₦{t.amount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.gateway}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit ${statusColors[t.status]}`}>
                        <StatusIcon className="w-3 h-3" />{t.status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
