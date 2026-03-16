import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Building2, Lock, Shield, CheckCircle2, Clock, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { Course } from "@/data/mockData";
import { useEnrollment } from "@/contexts/EnrollmentContext";
import { toast } from "sonner";

type PaymentMethod = "card" | "mobile_money" | "bank_transfer";

const currencies = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1 },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", rate: 1580 },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", rate: 153 },
  { code: "GHS", symbol: "GH₵", label: "Ghanaian Cedi", rate: 15.2 },
  { code: "ZAR", symbol: "R", label: "South African Rand", rate: 18.5 },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.79 },
];

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourseById(Number(id)).then((data) => {
      setCourse(data ?? null);
      setLoading(false);
    });
  }, [id]);

  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [currency, setCurrency] = useState(currencies[0]);
  const [receiptId] = useState(() => `SLA-${Date.now().toString().slice(-8)}`);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    mobileProvider: "M-Pesa",
    mobileNumber: "",
    bankName: "",
    accountRef: "",
  });

  const convertPrice = useCallback((usd: number) => {
    const converted = usd * currency.rate;
    return currency.code === "USD" ? converted.toFixed(2) : Math.round(converted).toLocaleString();
  }, [currency]);

  const downloadInvoice = useCallback(() => {
    if (!course) return;
    const lines = [
      "═══════════════════════════════════════",
      "         SHE LEADS AFRICA — CONNECTA        ",
      "                PAYMENT RECEIPT               ",
      "═══════════════════════════════════════",
      "",
      `Receipt #:      ${receiptId}`,
      `Date:           ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      "─── COMPANY ───────────────────────────",
      "Name:           Devorent Nigeria Limited",
      "Address:        Wakeman Heights Building, 294 Borno Way",
      "                Alagomeji-Yaba, Lagos 101245",
      "TIN (FIRS):     18393079-0001",
      "",
      "─── CUSTOMER ──────────────────────────",
      `Name:           ${form.fullName}`,
      `Email:          ${form.email}`,
      form.phone ? `Phone:          ${form.phone}` : "",
      "",
      "─── ITEM ──────────────────────────────",
      `Course:         ${course.title}`,
      `Instructor:     ${course.instructor}`,
      `Duration:       ${course.duration}`,
      "",
      "─── PAYMENT ───────────────────────────",
      `Method:         ${method.replace("_", " ")}`,
      `Currency:       ${currency.code}`,
      `Amount:         ${currency.symbol}${convertPrice(course.price)}`,
      "",
      "═══════════════════════════════════════",
      "This is a computer-generated receipt.",
      "She Leads Africa | connecta.sla.africa",
      "Support: support@sheleadsafrica.org",
      "═══════════════════════════════════════",
    ].filter(Boolean).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SLA-Receipt-${receiptId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded!");
  }, [course, form, method, currency, convertPrice, receiptId]);

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-semibold mb-4">Course not found</p>
          <Link to="/courses"><Button variant="outline" className="rounded-xl">Browse Courses</Button></Link>
        </div>
      </div>
    );
  }

  if (isEnrolled(course.id)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Already Enrolled!</h1>
          <p className="text-muted-foreground mb-6">You already have access to this course.</p>
          <Link to="/dashboard/courses"><Button className="gradient-card text-primary-foreground rounded-xl">Go to My Courses</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmitDetails = () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }
    if (!form.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setStep("payment");
  };

  const handlePay = () => {
    if (method === "card" && (!form.cardNumber || !form.expiry || !form.cvv)) {
      toast.error("Please fill in all card details.");
      return;
    }
    if (method === "mobile_money" && !form.mobileNumber) {
      toast.error("Please enter your mobile money number.");
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      enroll(course.id, course.curriculum[0]?.items[0] ?? "Module 1");
      setStep("success");
    }, 2500);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-5 pt-24 pb-16 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-secondary" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Payment Successful!</h1>
            <p className="text-sm text-foreground font-medium mb-1">You’ve just made a massive power move by investing in yourself. Your tribe is rooting for you!</p>
            <p className="text-muted-foreground mb-2">Get ready to level up in</p>
            <p className="text-lg font-semibold text-foreground mb-6">{course.title}</p>
            <div className="bg-card rounded-2xl border border-border p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-bold text-foreground">{currency.symbol}{convertPrice(course.price)} {currency.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground capitalize">{method.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receipt #</span>
                <span className="text-primary font-medium">{receiptId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email confirmation</span>
                <span className="text-foreground">{form.email}</span>
              </div>
            </div>
            <Button onClick={downloadInvoice} variant="outline" className="w-full sm:w-auto rounded-xl gap-2 mb-4">
              <Download className="w-4 h-4" /> Download Receipt
            </Button>
            <p className="text-xs text-muted-foreground mb-6">A confirmation email has been sent to {form.email} with your receipt and course access details.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={`/courses/${course.id}`}>
                <Button className="gradient-card text-primary-foreground rounded-xl px-8">Start Learning</Button>
              </Link>
              <Link to="/dashboard/courses">
                <Button variant="outline" className="rounded-xl px-8">Go to Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link to={`/courses/${course.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to course
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" /> Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8">
        {/* Currency selector */}
        <div className="flex justify-end mb-4">
          <select value={currency.code} onChange={e => setCurrency(currencies.find(c => c.code === e.target.value) || currencies[0])}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
            {currencies.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {["Your Details", "Payment"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                (i === 0 && step === "details") || (i === 1 && step === "payment")
                  ? "gradient-card text-primary-foreground"
                  : i === 0 && step === "payment"
                  ? "bg-secondary text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i === 0 && step === "payment" ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${(i === 0 && step === "details") || (i === 1 && step === "payment") ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {i === 0 && <div className="w-12 h-0.5 bg-border ml-2" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-2">
            <motion.div key={step} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl border border-border p-6 space-y-5">

              {step === "details" && (
                <>
                  <h2 className="font-display text-xl font-bold text-foreground">Your Details</h2>
                  <p className="text-sm text-muted-foreground">We'll use this to create your account and send course access.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                      <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Amara Osei"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address *</label>
                      <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="amara@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number (optional)</label>
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 800 000 0000"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <Button onClick={handleSubmitDetails} className="w-full sm:w-auto gradient-card text-primary-foreground rounded-xl h-11 font-semibold hover:opacity-90">
                    Continue to Payment
                  </Button>
                </>
              )}

              {step === "payment" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-foreground">Payment Method</h2>
                    <button onClick={() => setStep("details")} className="text-sm text-primary hover:underline">Edit details</button>
                  </div>

                  {/* Method tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "card" as const, label: "Card", icon: CreditCard },
                      { key: "mobile_money" as const, label: "Mobile Money", icon: Smartphone },
                      { key: "bank_transfer" as const, label: "Bank Transfer", icon: Building2 },
                    ]).map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => setMethod(key)}
                        className={`p-3 rounded-xl border text-center transition-all ${method === key
                          ? "border-primary bg-accent text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                        }`}>
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Card form */}
                  {method === "card" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Card Number</label>
                        <input value={form.cardNumber} onChange={(e) => update("cardNumber", e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())}
                          placeholder="4242 4242 4242 4242" maxLength={19}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Expiry</label>
                          <input value={form.expiry} onChange={(e) => update("expiry", e.target.value)} placeholder="MM/YY" maxLength={5}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">CVV</label>
                          <input type="password" value={form.cvv} onChange={(e) => update("cvv", e.target.value)} placeholder="•••" maxLength={4}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Money form */}
                  {method === "mobile_money" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Provider</label>
                        <select value={form.mobileProvider} onChange={(e) => update("mobileProvider", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option>M-Pesa</option>
                          <option>MTN Mobile Money</option>
                          <option>Airtel Money</option>
                          <option>Orange Money</option>
                          <option>Vodafone Cash</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Mobile Number</label>
                        <input value={form.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} placeholder="+254 700 000 000"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="p-3 rounded-xl bg-accent text-sm text-primary">
                        A payment prompt will be sent to your phone. Approve the transaction to complete enrollment.
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer */}
                  {method === "bank_transfer" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-muted border border-border space-y-2">
                        <p className="text-sm font-semibold text-foreground">Transfer to:</p>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Bank</span>
                          <span className="text-foreground font-medium">GTBank</span>
                          <span className="text-muted-foreground">Account Name</span>
                          <span className="text-foreground font-medium">She Leads Africa Ltd</span>
                          <span className="text-muted-foreground">Account Number</span>
                          <span className="text-foreground font-mono font-medium">0174 5829 310</span>
                          <span className="text-muted-foreground">Amount</span>
                          <span className="text-foreground font-bold">{currency.symbol}{convertPrice(course.price)} {currency.code}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Reference</label>
                        <input value={form.accountRef} onChange={(e) => update("accountRef", e.target.value)} placeholder="Enter your transfer reference"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                  )}

                  <Button onClick={handlePay} disabled={processing}
                    className="w-full gradient-card text-primary-foreground rounded-xl h-12 font-semibold hover:opacity-90 disabled:opacity-50">
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Processing payment...
                      </span>
                    ) : (
                      `Pay ${currency.symbol}${convertPrice(course.price)} ${currency.code}`
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 256-bit SSL</span>
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> PCI Compliant</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Right — Order Summary */}
          <div>
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-6 space-y-4">
              <h3 className="font-semibold text-foreground">Order Summary</h3>
              <div className="flex gap-3">
                <img src={course.image} alt={course.title} className="w-16 h-12 rounded-xl object-cover shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{course.title}</p>
                  <p className="text-xs text-muted-foreground">{course.instructor}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Course price</span>
                  <span className="text-foreground">{currency.symbol}{convertPrice(course.price)}</span>
                </div>
                {course.originalPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-secondary font-semibold">-{currency.symbol}{convertPrice(course.originalPrice - course.price)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{currency.symbol}{convertPrice(course.price)} {currency.code}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                  Lifetime access to all course content
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                  Certificate upon completion
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
