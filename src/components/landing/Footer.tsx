import { useState } from "react";
import { BookOpen, Mail, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const footerLinks = {
  "Learn": [
    { label: "Browse Courses", href: "/courses" },
    { label: "Browse Programs", href: "/programs" },
    { label: "Certifications", href: "/courses" },
    { label: "For Employers", href: "/for-teams" },
  ],
  "Company": [
    { label: "About Us", href: "/about" },
    { label: "Partners", href: "/for-teams" },
    { label: "Job Board", href: "/courses" },
  ],
  "Support": [
    { label: "Contact Us", href: "/about" },
    { label: "Privacy Policy", href: "/about" },
    { label: "Terms of Service", href: "/about" },
  ],
  "Community": [
    { label: "She Leads Africa", href: "/about" },
    { label: "Events", href: "/programs" },
  ],
};

const socials = [
  { icon: Twitter, href: "https://twitter.com/shaborneafrica", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/she-leads-africa", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/sheleadsafrica", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@sheleadsafrica", label: "YouTube" },
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
              Africa's leading learning platform for ambitious women. Build career-defining skills, earn certificates, and connect with opportunities.
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
                    <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-[11px] text-white/40 leading-relaxed font-medium">
            <p>© 2026 She Leads Africa. All rights reserved.</p>
            <p className="mt-1">Operated by Devorent Nigeria Limited</p>
            <p>Lagos, Nigeria</p>
          </div>
          <div className="flex items-center gap-8">
            {[
              { label: "Privacy", href: "/about" },
              { label: "Terms", href: "/about" },
              { label: "Cookies", href: "/about" },
            ].map((link) => (
              <Link key={link.label} to={link.href} className="text-xs text-white/40 hover:text-white transition-colors font-bold">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
