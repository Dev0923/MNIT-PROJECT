import { useState, useEffect } from "react";
import { Phone, Shield, Heart, MapPin, MessageSquarePlus, X, Send, CheckCircle2, ArrowUp } from "lucide-react";
import logoImg from "../../imports/image-21.png";

const C = {
  orange:   "#F7941D",
  gold:     "#F4C430",
  pink:     "#E97B8C",
  cream:    "#FDF5E6",
  white:    "#FFFFFF",
  darkText: "#333333",
  border:   "#E5E5E5",
  muted:    "#666666",
  footerBg: "#152060",
};

function SocialIcon({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
      style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
      {children}
    </a>
  );
}

function EmergencyCard({ icon, label, number, bg, border }: { icon: React.ReactNode; label: string; number: string; bg: string; border: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: bg, borderColor: border }}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</p>
        <p className="text-base font-bold text-white">{number}</p>
      </div>
    </div>
  );
}

export function Footer() {
  const [open, setOpen]           = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [text, setText]           = useState("");
  const [name, setName]           = useState("");
  const [showTop, setShowTop]     = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setText("");
      setName("");
    }, 2800);
  }

  return (
    <>
      <footer className="relative overflow-hidden pt-12 pb-0" style={{ backgroundColor: C.footerBg }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pb-10">

            {/* Col 1 — Branding + Social */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 4px rgba(247,148,29,0.25)` }}>
                  <img src={logoImg} alt="Khatu Shyam Ji" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-extrabold text-sm tracking-wider uppercase text-white leading-tight">Khatu Shyam Ji</p>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.orange }}>Official Temple Portal</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
                The official digital gateway for Shri Khatu Shyam Ji Temple. Dedicated to ensuring a safe, seamless, and spiritual experience for millions of devotees.
              </p>
              <div className="flex gap-2">
                <SocialIcon href="#">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </SocialIcon>
                <SocialIcon href="#">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </SocialIcon>
                <SocialIcon href="#">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </SocialIcon>
                <SocialIcon href="#">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#152060"/></svg>
                </SocialIcon>
              </div>
            </div>

            {/* Col 2 — Emergency Contacts */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <EmergencyCard icon={<Phone  size={18} color={C.orange} />} label="Mela Control Room" number="01576-221000" bg={`${C.orange}18`}         border={`${C.orange}55`} />
              <EmergencyCard icon={<Shield size={18} color={C.cream}  />} label="Police Helpline"   number="100 / 112"   bg="rgba(253,245,230,0.08)" border="rgba(253,245,230,0.25)" />
              <EmergencyCard icon={<Heart  size={18} color={C.pink}   />} label="Medical Emergency" number="108"         bg={`${C.pink}18`}           border={`${C.pink}55`} />
            </div>

            {/* Col 3 — Mela Information */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 pb-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.orange}40` }}>
                <span style={{ color: C.orange, fontSize: "1rem" }}>‖</span> Mela Information
              </h4>
              <ul className="flex flex-col gap-2.5">
                {["Live Darshan", "How to Reach", "Places to Visit", "Parking Locations", "Medical Camps", "Lost & Found", "Crowd Status"].map(l => (
                  <li key={l}>
                    <button className="text-xs text-left transition-all"
                      style={{ color: "rgba(255,255,255,0.60)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.orange)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}>
                      › {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Digital Services */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 pb-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.orange}40` }}>
                <span style={{ color: C.orange, fontSize: "1rem" }}>‖</span> Digital Services
              </h4>
              <ul className="flex flex-col gap-2.5">
                {["E-Pass Registration", "Vehicle Permits", "Puja Booking", "Darshan Pass", "Officer Login", "Traffic Command Center", "Donation Portal"].map(l => (
                  <li key={l}>
                    <button className="text-xs text-left transition-all"
                      style={{ color: "rgba(255,255,255,0.60)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.orange)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}>
                      › {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Suggestion CTA strip ───────────────────────── */}
        <div className="relative" style={{ borderTop: `1px solid rgba(255,255,255,0.08)` }}>
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${C.orange}25`, border: `1px solid ${C.orange}50` }}>
                <MessageSquarePlus size={16} color={C.orange} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Have a suggestion for us?</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>Help us serve devotees better — your feedback matters.</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all hover:opacity-90 hover:-translate-y-0.5 flex-shrink-0"
              style={{
                background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`,
                color: C.white,
                boxShadow: `0 6px 20px ${C.orange}55`,
              }}
            >
              <MessageSquarePlus size={15} />
              Share Your Suggestion
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative" style={{ borderTop: `1px solid rgba(255,255,255,0.10)` }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.40)" }}>
              &copy; 2026 Khatu Shyam Ji Temple — Official Temple Management Portal &nbsp;|&nbsp; All Rights Reserved
            </p>
            <div className="flex items-center gap-1.5">
              <MapPin size={12} color={C.orange} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Khatu, Sikar, Rajasthan, India</p>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Suggestion modal ───────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ backgroundColor: C.white, boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(90deg, #1F2F8C, #2a3fa8)` }}>
              <div className="flex items-center gap-2">
                <MessageSquarePlus size={18} color={C.orange} />
                <p className="font-bold text-white text-sm">Share Your Suggestion</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{ color: "rgba(255,255,255,0.7)" }}>
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `#28A74520` }}>
                  <CheckCircle2 size={36} color="#28A745" />
                </div>
                <p className="font-bold text-lg mb-1" style={{ color: "#1F2F8C" }}>Jai Shree Shyam!</p>
                <p className="text-sm" style={{ color: C.muted }}>Thank you for your suggestion. We will review it carefully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                <p className="text-xs" style={{ color: C.muted }}>
                  Your thoughts help us improve this portal for millions of devotees. All suggestions are reviewed by our team.
                </p>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#1F2F8C" }}>Your Name <span style={{ color: C.muted }}>(optional)</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Devotee name"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.cream, border: `1.5px solid ${C.border}`, color: C.darkText }}
                  />
                </div>

                {/* Suggestion */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#1F2F8C" }}>
                    Your Suggestion <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Tell us how we can improve the temple portal, services, or mela experience…"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: C.cream, border: `1.5px solid ${C.border}`, color: C.darkText }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, boxShadow: `0 6px 18px ${C.orange}55` }}
                >
                  <Send size={14} />
                  Submit Suggestion
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ── Scroll-to-top button ───────────────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "24px",
          zIndex: 999,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
          boxShadow: `0 6px 20px ${C.orange}70`,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: showTop ? 1 : 0,
          transform: showTop ? "translateY(0) scale(1)" : "translateY(16px) scale(0.8)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          pointerEvents: showTop ? "auto" : "none",
        }}
      >
        <ArrowUp size={20} color="#fff" strokeWidth={2.5} />
      </button>
    </>
  );
}
