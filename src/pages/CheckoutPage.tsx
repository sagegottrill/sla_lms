import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Building2, Lock, Shield, CheckCircle2, Clock, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourse, useEnrollUserMutation, useUserEnrollments } from "@/hooks/useQueries";
import type { Course } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { initializePaystackPayment, PAYSTACK_NGN_CHANNELS } from "@/lib/paystack";
import { coursePathSegment, isCourseOrProgramRouteParam } from "@/lib/publicRoutes";
import { getSiteUrl } from "@/lib/siteUrl";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

type PaymentMethod = "card" | "mobile_money" | "bank_transfer";

// Prices in DB are NGN (naira). NGN is base; other codes use rate as NGN → target (e.g. 1 NGN = 0.00063 USD).
const currencies = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", rate: 1 },
  { code: "USD", symbol: "$", label: "US Dollar", rate: 0.00063 },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", rate: 0.097 },
  { code: "GHS", symbol: "GH₵", label: "Ghanaian Cedi", rate: 0.0096 },
  { code: "ZAR", symbol: "R", label: "South African Rand", rate: 0.012 },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.0005 },
];

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appUser, openAuthModal } = useAuth();
  const routeInvalid = id != null && id !== "" && !isCourseOrProgramRouteParam(id);

  const { data: course, isLoading: loading } = useCourse(id);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);
  const enrollMutation = useEnrollUserMutation();
  const queryClient = useQueryClient();

  const enrolled = !!course && enrollments.some((e: any) => e.course_id === course.id);

  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [currency, setCurrency] = useState(currencies[0]);
  const [receiptId, setReceiptId] = useState(() => `SLA-${Date.now().toString().slice(-8)}`);

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

  // `course.price` is NGN naira (not kobo). Paystack NGN charges use kobo: price * 100.
  const rawPriceNgn = Number(course?.price ?? 0);
  const priceNgn = Number.isFinite(rawPriceNgn) ? Math.max(0, rawPriceNgn) : NaN;
  const originalPriceNgn = Math.max(
    0,
    Number((course as any)?.originalPrice ?? (course as any)?.original_price ?? 0),
  );

  const convertPrice = useCallback(
    (ngn: number) => {
      const converted = ngn * currency.rate;
      return currency.code === "NGN"
        ? Math.round(converted).toLocaleString()
        : converted < 1
          ? converted.toFixed(4)
          : converted.toFixed(2);
    },
    [currency],
  );

  const downloadInvoice = useCallback(() => {
    if (!course) return;
    const lines = [
      "═══════════════════════════════════════",
      "         SHE LEADS AFRICA — LMS        ",
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
      `Amount:         ${currency.symbol}${convertPrice(priceNgn)}`,
      "",
      "═══════════════════════════════════════",
      "This is a computer-generated receipt.",
      `She Leads Africa | ${getSiteUrl().replace(/^https?:\/\//, "")}`,
      "Support: info@sheleadsafrica.org",
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
  }, [course, form, method, currency, convertPrice, priceNgn, receiptId]);

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  if (routeInvalid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-semibold mb-4">Course not found</p>
          <Link to="/courses"><Button variant="outline" className="rounded-xl">Browse Courses</Button></Link>
        </div>
      </div>
    );
  }

  if (loading || loadingEnrollments) {
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

  if (enrolled) {
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
    if (!course || !appUser) {
      toast.error("Please log in to complete payment.");
      openAuthModal("login");
      return;
    }
    if (!Number.isFinite(priceNgn)) {
      toast.error("Invalid course price.");
      return;
    }

    // Free course: enrol immediately (no Paystack).
    if (priceNgn === 0) {
      setProcessing(true);
      enrollMutation.mutate(
        { userId: appUser.id, courseId: course.id },
        {
          meta: { silentToast: true },
          onSuccess: () => {
            setProcessing(false);
            setStep("success");
          },
          onError: (err) => {
            setProcessing(false);
            toast.error(
              err instanceof Error ? err.message : "Failed to enrol for free. Please try again.",
            );
          },
        },
      );
      return;
    }

    // Paystack checkout (NGN only in this client).
    if (currency.code !== "NGN") {
      toast.error("Paystack checkout currently supports NGN only.");
      return;
    }

    const amountKobo = Math.round(priceNgn * 100);
    if (!amountKobo) {
      toast.error("Invalid payment amount.");
      return;
    }

    setProcessing(true);

    const reference = `ref_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    initializePaystackPayment({
      email: form.email,
      amount: amountKobo,
      currency: "NGN",
      reference,
      channels: [...PAYSTACK_NGN_CHANNELS],
      metadata: {
        user_id: appUser.id,
        course_id: course.id,
        program_id: null,
        // Keep custom_fields for Paystack dashboard display + legacy webhook parsing
        custom_fields: [
          { display_name: "User ID", variable_name: "user_id", value: appUser.id },
          { display_name: "Course ID", variable_name: "course_id", value: String(course.id) },
        ],
      },
      onSuccess: async (response?: { reference?: string; channel?: string }) => {
        const paidRef = response?.reference || reference;
        try {
          const payRes = await api.recordPayment({
            userId: appUser.id,
            courseId: course.id,
            amount: priceNgn,
            currency: "NGN",
            reference: paidRef,
            method: response?.channel || method,
            receiptId: paidRef,
            status: "successful",
          });
          if (!payRes.success) {
            console.error("Failed to record payment ledger entry:", payRes.error);
            toast.warning("Payment went through. Revenue may take a moment to appear on the admin dashboard.");
          } else {
            void queryClient.invalidateQueries({ queryKey: ["payments"] });
            void queryClient.invalidateQueries({ queryKey: ["stats"] });
          }
          await enrollMutation.mutateAsync(
            { userId: appUser.id, courseId: course.id },
            { meta: { silentToast: true } },
          );
          setReceiptId(paidRef);
          setProcessing(false);
          setStep("success");
        } catch (err) {
          setProcessing(false);
          toast.error(
            err instanceof Error
              ? err.message
              : "Payment succeeded, but enrollment failed to finalize.",
          );
        }
      },
      onClose: () => {
        setProcessing(false);
        toast.info("Payment window closed.");
      },
      onError: (err) => {
        setProcessing(false);
        toast.error(err.message || "Payment failed.");
      },
    });
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              {priceNgn === 0 ? "Enrollment Complete!" : "Payment Successful!"}
            </h1>
            <p className="text-sm text-foreground font-medium mb-1">
              {priceNgn === 0
                ? "You now have access to this course."
                : "You’ve just made a massive power move by investing in yourself. Your tribe is rooting for you!"}
            </p>
            <p className="text-muted-foreground mb-2">Get ready to level up in</p>
            <p className="text-lg font-semibold text-foreground mb-6">{course.title}</p>
            <div className="bg-card rounded-2xl shadow-sm border-0 p-6 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-bold text-foreground">{currency.symbol}{convertPrice(priceNgn)} {currency.code}</span>
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
            <p className="text-xs text-muted-foreground mb-6">
              {priceNgn === 0
                ? "Your course access has been added to your dashboard."
                : "Enrollment is being confirmed. Use your downloaded receipt as proof of payment."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={`/courses/${coursePathSegment(course)}`}>
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
          <Link to={`/courses/${coursePathSegment(course)}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            className="px-3 py-1.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
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
              className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-5">

              {step === "details" && (
                <>
                  <h2 className="font-display text-xl font-bold text-foreground">Your Details</h2>
                  <p className="text-sm text-muted-foreground">We'll use this to create your account and send course access.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                      <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Amara Osei"
                        className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address *</label>
                      <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="amara@example.com"
                        className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number (optional)</label>
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 800 000 0000"
                      className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <Button onClick={handleSubmitDetails} className="w-full sm:w-auto gradient-card text-primary-foreground rounded-xl h-11 font-semibold hover:opacity-90">
                    {priceNgn === 0 ? "Continue to Enrollment" : "Continue to Payment"}
                  </Button>
                </>
              )}

              {step === "payment" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-foreground">Pay with Paystack</h2>
                    <button onClick={() => setStep("details")} className="text-sm text-primary hover:underline">Edit details</button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose any method in the Paystack window: card, bank transfer, USSD, bank, QR, or mobile money.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {([
                      { key: "card" as const, label: "Card", icon: CreditCard },
                      { key: "bank_transfer" as const, label: "Bank transfer", icon: Building2 },
                      { key: "mobile_money" as const, label: "Mobile money", icon: Smartphone },
                    ]).map(({ key, label, icon: Icon }) => (
                      <button key={key} type="button" onClick={() => setMethod(key)}
                        className={`p-3 rounded-xl border text-center transition-all ${method === key
                          ? "border-primary bg-accent text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                        }`}>
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 ring-1 ring-black/5 dark:ring-white/10 text-sm text-foreground space-y-2">
                    <p className="font-medium">All Paystack options open in the next step:</p>
                    <ul className="grid grid-cols-2 gap-1 text-muted-foreground text-xs">
                      <li>Card (Visa, Mastercard, Verve)</li>
                      <li>Bank transfer (Paystack account)</li>
                      <li>USSD</li>
                      <li>Bank</li>
                      <li>QR</li>
                      <li>Mobile money</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Card details are entered only on Paystack — never on this page.
                    </p>
                  </div>

                  <Button onClick={handlePay} disabled={processing}
                    className="w-full gradient-card text-primary-foreground rounded-xl h-12 font-semibold hover:opacity-90 disabled:opacity-50">
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Processing payment...
                      </span>
                    ) : (
                      priceNgn === 0
                        ? "Complete Free Enrollment"
                        : `Pay ${currency.symbol}${convertPrice(priceNgn)} ${currency.code}`
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
            <div className="bg-card rounded-2xl shadow-sm border-0 p-6 sticky top-6 space-y-4">
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
                  <span className="text-foreground">{currency.symbol}{convertPrice(priceNgn)}</span>
                </div>
                {originalPriceNgn > priceNgn && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-secondary font-semibold">-{currency.symbol}{convertPrice(originalPriceNgn - priceNgn)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{currency.symbol}{convertPrice(priceNgn)} {currency.code}</span>
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
