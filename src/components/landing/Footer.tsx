import { useState } from "react";
import { BookOpen, Mail, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const footerLinks = {
  "Learn": [
    { label: "Browse Courses", href: "/courses" },
    { label: "Browse Programs", href: "/programs" },
    { label: "Certifications", href: "/courses" },
    { label: "For Teams", href: "/for-teams" },
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
    <footer className="gradient-hero text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <img src="/sla_logo_transparent.png" alt="She Leads Africa" className="h-10 w-auto hover:opacity-90 transition-opacity" />
            </Link>
            <p className="text-primary-foreground/55 text-sm leading-relaxed mb-6">
              Africa's leading learning platform for ambitious women. Build career-defining skills, earn certificates, and connect with opportunities.
            </p>
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="flex items-center flex-1 bg-primary-foreground/8 rounded-xl border border-primary-foreground/18 px-3">
                <Mail className="w-4 h-4 text-primary-foreground/35 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/35 focus:outline-none py-2.5 px-2"
                />
              </div>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0 bg-secondary text-primary hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </form>
            {/* Socials */}
            <div className="flex gap-3 mt-5">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-primary-foreground/8 hover:bg-primary-foreground/18 border border-primary-foreground/14 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary-foreground/65" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-primary-foreground/85 text-sm mb-4 uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-xs text-primary-foreground/38">
            <p>© 2026 Connecta by She Leads Africa. All rights reserved.</p>
            <p className="mt-1">Operated by Devorent Nigeria Limited (TIN: 18393079-0001)</p>
            <p>Wakeman Heights Building, 294 Borno Way, Alagomeji-Yaba, Lagos</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/about" },
              { label: "Terms", href: "/about" },
              { label: "Cookies", href: "/about" },
            ].map((link) => (
              <Link key={link.label} to={link.href} className="text-xs text-primary-foreground/38 hover:text-primary-foreground/65 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
