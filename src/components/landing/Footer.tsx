import { useState } from "react";
import { BookOpen, Mail, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Learn: [
    { label: "Browse courses", href: "/courses" },
    { label: "Browse programs", href: "/programs" },
    { label: "Certificates", href: "/courses" },
  ],
  Platform: [
    { label: "Sign in", href: "/" },
    { label: "She Leads Africa", href: "https://sheleadsafrica.org" },
  ],
  Support: [{ label: "Contact", href: "mailto:info@sheleadsafrica.org" }],
};

const socials = [
  { icon: Twitter, href: "https://twitter.com/SheLeadsAfrica", label: "Twitter" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/she-leads-africa", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/sheleadsafrica", label: "Instagram" },
  { icon: Youtube, href: "https://www.youtube.com/@sheleadsafrica", label: "YouTube" },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Subscribed! Check your inbox for a welcome email.");
    setEmail("");
  };

  return (
    <footer className="bg-primary text-white border-t border-white/5">
      <div className="container mx-auto px-5 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-6">
              <img src="/sla_logo_transparent.png" alt="She Leads Africa" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
              Africa's leading learning platform for ambitious women. Build career-defining skills, earn certificates, and learn alongside a global community.
            </p>
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="flex items-center flex-1 bg-white/5 rounded-lg border border-white/10 px-3">
                <Mail className="w-4 h-4 text-white/40 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none py-2.5 px-2"
                />
              </div>
              <button type="submit" className="px-5 py-2 rounded-lg text-sm font-bold shrink-0 bg-white text-primary hover:bg-white/90 transition-all">
                Join
              </button>
            </form>
            {/* Socials */}
            <div className="flex gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-white text-xs mb-6 uppercase tracking-[0.15em]">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {/^https?:\/\//.test(link.href) || link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        {...(link.href.startsWith("mailto:")
                          ? {}
                          : { target: "_blank", rel: "noopener noreferrer" })}
                        className="text-sm text-white/60 hover:text-white transition-colors font-medium"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors font-medium">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-[11px] text-white/40 leading-relaxed font-medium">
            <p className="text-white/55 font-semibold mb-1">Powered by She Leads Africa</p>
            <p>© 2026 She Leads Africa. All rights reserved.</p>
            <p className="mt-1">Operated by Devorent Nigeria Limited</p>
            <p>Lagos, Nigeria</p>
          </div>
          <div className="flex items-center gap-8">
            {[
              { label: "Privacy", href: "mailto:info@sheleadsafrica.org?subject=Privacy" },
              { label: "Terms", href: "mailto:info@sheleadsafrica.org?subject=Terms" },
              { label: "Cookies", href: "mailto:info@sheleadsafrica.org?subject=Cookies" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-white/40 hover:text-white transition-colors font-bold"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="pt-6 mt-2 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] sm:text-xs text-white/35 font-medium tracking-[0.12em] uppercase">
            <span>Design by</span>
            <a
              href="https://github.com/sagegottrill"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-white/45 hover:text-white/75 normal-case tracking-normal font-semibold transition-colors duration-300 underline-offset-[5px] decoration-white/15 hover:decoration-white/35 underline decoration-1"
            >
              Orivon Edge
            </a>
            <span className="text-white/20 font-normal" aria-hidden>
              ·
            </span>
            <a
              href="https://www.instagram.com/orivonedge"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Orivon Edge on Instagram"
              className="inline-flex items-center justify-center rounded-md p-1 text-white/40 transition-colors duration-300 hover:text-white/75 hover:bg-white/[0.06]"
            >
              <Instagram className="w-[15px] h-[15px] sm:w-4 sm:h-4" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
