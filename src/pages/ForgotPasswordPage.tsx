import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setSubmitted(true);
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 mb-8">
                    <img src="/sla_logo_transparent.png" alt="SLA Connecta" className="h-8 w-auto" />
                </Link>

                {!submitted ? (
                    <>
                        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Reset your password</h1>
                        <p className="text-muted-foreground mb-8">Enter your email address and we'll send you a link to reset your password.</p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-shadow"
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full gradient-card text-primary-foreground h-11 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                                {loading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="w-8 h-8 text-secondary" />
                        </div>
                        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Check your email</h1>
                        <p className="text-muted-foreground mb-6">
                            We've sent a password reset link to <strong className="text-foreground">{email}</strong>. Please check your inbox.
                        </p>
                        <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">
                            Try a different email
                        </Button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
