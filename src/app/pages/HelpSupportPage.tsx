import { useState } from "react";
import { Footer } from "../components/Footer";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Search, Phone, Mail, MessageCircle, ShieldAlert,
  Calendar, CreditCard, HandCoins, Compass, FileBadge, Wrench,
  ChevronDown, MapPin, Clock, Send, CheckCircle2,
  Building2, Shield, Stethoscope, Car, Landmark, Users2,
  Flame, Star, Hotel, Train, Plane, Bus, Radio, Globe,
} from "lucide-react";
import logoImg from "../../imports/image-21.png";

const C = {
  orange:   "#F7941D",
  darkBlue: "#1F2F8C",
  cream:    "#FDF5E6",
  white:    "#FFFFFF",
  green:    "#28A745",
  pink:     "#E97B8C",
  darkText: "#333333",
  border:   "#E5E5E5",
  muted:    "#666666",
};

const QUICK_CONTACTS = [
  { label: "Call Helpline", value: "1800-572-0000", icon: <Phone        size={20} />, bg: C.darkBlue, sub: "24×7 toll-free" },
  { label: "Email Us",      value: "help@khatushyam.in", icon: <Mail     size={20} />, bg: C.orange,   sub: "Reply within 24 hrs" },
  { label: "Live Chat",     value: "Chat Now",       icon: <MessageCircle size={20} />, bg: C.green,    sub: "Avg wait 2 min" },
  { label: "Emergency SOS", value: "112",            icon: <ShieldAlert  size={20} />, bg: C.pink,     sub: "Police · Medical · Fire" },
];

const CATEGORIES = [
  { label: "Darshan & Aarti",  icon: <Calendar    size={22} />, desc: "Timings, special darshan, queue passes", color: C.orange },
  { label: "Bookings & Pass",  icon: <FileBadge   size={22} />, desc: "E-Pass, Darshan Pass, vehicle permits", color: C.darkBlue },
  { label: "Donations",        icon: <HandCoins   size={22} />, desc: "Donate, 80G receipts, refunds",         color: C.green },
  { label: "Travel & Stay",    icon: <Compass     size={22} />, desc: "How to reach, Atithi Niwas, parking",   color: "#8B5CF6" },
  { label: "Payments",         icon: <CreditCard  size={22} />, desc: "UPI, cards, failed transactions",       color: C.pink },
  { label: "Technical Help",   icon: <Wrench      size={22} />, desc: "Login issues, OTP, app errors",         color: "#0EA5E9" },
];

type HelplineCat = "All" | "Emergency" | "Temple Services" | "Administration" | "Tourist Services";

const HELPLINE_CATS: HelplineCat[] = ["All", "Emergency", "Temple Services", "Administration", "Tourist Services"];

const HELPLINES = [
  /* ── Emergency ──────────────────────────────── */
  {
    id: 1, dept: "Medical Emergency (Ambulance)", hindi: "चिकित्सा आपातकाल",
    numbers: ["108"], email: null, category: "Emergency" as HelplineCat,
    icon: <Stethoscope size={20} />, color: "#E97B8C", urgent: true,
  },
  {
    id: 2, dept: "Police Helpline", hindi: "पुलिस हेल्पलाइन",
    numbers: ["100", "112"], email: null, category: "Emergency" as HelplineCat,
    icon: <Shield size={20} />, color: "#1F2F8C", urgent: true,
  },
  {
    id: 3, dept: "Fire Brigade", hindi: "अग्निशमन विभाग",
    numbers: ["101"], email: null, category: "Emergency" as HelplineCat,
    icon: <Flame size={20} />, color: "#EF4444", urgent: true,
  },
  {
    id: 4, dept: "Women Helpline", hindi: "महिला हेल्पलाइन",
    numbers: ["1091"], email: null, category: "Emergency" as HelplineCat,
    icon: <Users2 size={20} />, color: "#9333EA", urgent: true,
  },
  {
    id: 5, dept: "Child Helpline", hindi: "बाल हेल्पलाइन",
    numbers: ["1098"], email: null, category: "Emergency" as HelplineCat,
    icon: <Star size={20} />, color: "#F59E0B", urgent: true,
  },
  /* ── Temple Services ────────────────────────── */
  {
    id: 6, dept: "Temple Trust Office", hindi: "मंदिर ट्रस्ट कार्यालय",
    numbers: ["01576-221000", "01576-221001"], email: "trust@khatushyam.rajasthan.gov.in",
    category: "Temple Services" as HelplineCat, icon: <Building2 size={20} />, color: "#F7941D", urgent: false,
  },
  {
    id: 7, dept: "Temple PRO (Public Info)", hindi: "जनसंपर्क अधिकारी",
    numbers: ["01576-221005"], email: "pro@khatushyam.rajasthan.gov.in",
    category: "Temple Services" as HelplineCat, icon: <Globe size={20} />, color: "#F7941D", urgent: false,
  },
  {
    id: 8, dept: "Prasad & Bhog Counter", hindi: "प्रसाद एवं भोग काउंटर",
    numbers: ["01576-221050"], email: null,
    category: "Temple Services" as HelplineCat, icon: <Star size={20} />, color: "#F4C430", urgent: false,
  },
  {
    id: 9, dept: "Donation & Seva Counter", hindi: "दान एवं सेवा काउंटर",
    numbers: ["01576-221100"], email: "donate@khatushyam.rajasthan.gov.in",
    category: "Temple Services" as HelplineCat, icon: <HandCoins size={20} />, color: "#28A745", urgent: false,
  },
  {
    id: 10, dept: "Accommodation Cell (Dharamshala)", hindi: "धर्मशाला / आवास सेल",
    numbers: ["01576-221002", "01576-221003"], email: null,
    category: "Temple Services" as HelplineCat, icon: <Hotel size={20} />, color: "#8B5CF6", urgent: false,
  },
  {
    id: 11, dept: "Lost & Found", hindi: "खोया-पाया केन्द्र",
    numbers: ["01576-221010"], email: null,
    category: "Temple Services" as HelplineCat, icon: <Search size={20} />, color: "#0EA5E9", urgent: false,
  },
  /* ── Administration ─────────────────────────── */
  {
    id: 12, dept: "Mela Control Room", hindi: "मेला नियंत्रण कक्ष",
    numbers: ["01576-220100", "01576-220101"], email: "mela@khatushyam.rajasthan.gov.in",
    category: "Administration" as HelplineCat, icon: <Radio size={20} />, color: "#1F2F8C", urgent: false,
  },
  {
    id: 13, dept: "Police Control Room (Khatu)", hindi: "पुलिस नियंत्रण कक्ष",
    numbers: ["01576-202100", "01576-202016"], email: null,
    category: "Administration" as HelplineCat, icon: <ShieldAlert size={20} />, color: "#1F2F8C", urgent: false,
  },
  {
    id: 14, dept: "Traffic Control Centre", hindi: "यातायात नियंत्रण केन्द्र",
    numbers: ["01576-220300"], email: null,
    category: "Administration" as HelplineCat, icon: <Car size={20} />, color: "#F7941D", urgent: false,
  },
  {
    id: 15, dept: "District Collector, Sikar", hindi: "जिला कलेक्टर कार्यालय, सीकर",
    numbers: ["01572-270001"], email: "collector.sikar@rajasthan.gov.in",
    category: "Administration" as HelplineCat, icon: <Landmark size={20} />, color: "#6366F1", urgent: false,
  },
  {
    id: 16, dept: "S.P. Office, Sikar", hindi: "पुलिस अधीक्षक कार्यालय, सीकर",
    numbers: ["01572-250333"], email: null,
    category: "Administration" as HelplineCat, icon: <Shield size={20} />, color: "#1F2F8C", urgent: false,
  },
  {
    id: 17, dept: "Parking Management Cell", hindi: "पार्किंग प्रबंधन सेल",
    numbers: ["01576-220400"], email: null,
    category: "Administration" as HelplineCat, icon: <Car size={20} />, color: "#F59E0B", urgent: false,
  },
  /* ── Tourist Services ───────────────────────── */
  {
    id: 18, dept: "Rajasthan Tourist Helpline", hindi: "राजस्थान पर्यटन हेल्पलाइन",
    numbers: ["1363"], email: "tourism@rajasthan.gov.in",
    category: "Tourist Services" as HelplineCat, icon: <Globe size={20} />, color: "#28A745", urgent: false,
  },
  {
    id: 19, dept: "Ringas Railway Station", hindi: "रींगस रेलवे स्टेशन",
    numbers: ["01576-281234"], email: null,
    category: "Tourist Services" as HelplineCat, icon: <Train size={20} />, color: "#0EA5E9", urgent: false,
  },
  {
    id: 20, dept: "Jaipur International Airport", hindi: "जयपुर अंतर्राष्ट्रीय हवाई अड्डा",
    numbers: ["0141-2550623"], email: null,
    category: "Tourist Services" as HelplineCat, icon: <Plane size={20} />, color: "#6366F1", urgent: false,
  },
  {
    id: 21, dept: "RSRTC Bus Stand, Sikar", hindi: "रोडवेज बस स्टैंड, सीकर",
    numbers: ["01572-251234"], email: null,
    category: "Tourist Services" as HelplineCat, icon: <Bus size={20} />, color: "#F7941D", urgent: false,
  },
];

const FAQS = [
  {
    cat: "Darshan",
    q: "What are the darshan timings at Khatu Shyam Ji Temple?",
    a: "Darshan timings vary between summer and winter. During summer the temple opens at 04:30 AM for Mangala Aarti and closes at 10:00 PM after Shayan Aarti. Please refer to the Daily Aarti Timings table on the homepage for the full schedule.",
  },
  {
    cat: "Bookings",
    q: "How do I book a Sheegh Darshan / E-Pass online?",
    a: "Go to Online Services → Darshan Pass or E-Pass Registration, choose your preferred date and time-slot, fill in devotee details, complete payment, and your QR-coded pass will be emailed instantly.",
  },
  {
    cat: "Bookings",
    q: "Can I cancel or reschedule a booking?",
    a: "Yes. Bookings can be rescheduled up to 6 hours before the slot through Login → My Bookings. Cancellations are refunded to the original payment method within 5–7 business days.",
  },
  {
    cat: "Donations",
    q: "Will I get an 80G tax-exemption receipt for my donation?",
    a: "Yes. An official 80G receipt is generated instantly after a successful donation and sent to your registered email. You can also download it any time from Login → Donations.",
  },
  {
    cat: "Travel",
    q: "How can I reach Khatu Shyam Ji Temple?",
    a: "Khatu village is in Sikar district, Rajasthan. The nearest railway stations are Ringas (17 km) and Sikar (45 km). Jaipur airport is 95 km away. Taxis, buses and shared autos are easily available from all three.",
  },
  {
    cat: "Travel",
    q: "Where can I park my vehicle during the Mela?",
    a: "Designated parking lots are available at Sectors 4 and 6 for cars and 2-wheelers. Buses use Sector 6 overflow. VIP parking is permit-only. See the live Map for real-time availability.",
  },
  {
    cat: "Payments",
    q: "My payment was deducted but the booking failed. What should I do?",
    a: "Don't worry — failed booking transactions are auto-reversed by the payment gateway within 5–7 business days. If you don't see a refund by then, contact us with the transaction reference number.",
  },
  {
    cat: "Technical",
    q: "I'm not receiving the OTP on my phone. What can I do?",
    a: "Please check that your mobile number is correct, switch off DND for transactional SMS, and try again after 60 seconds. You can also choose Login with Password instead.",
  },
];

export function HelpSupportPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [activeCat, setActiveCat] = useState<string>("All");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [activeHelplineCat, setActiveHelplineCat] = useState<HelplineCat>("All");

  const cats = ["All", ...Array.from(new Set(FAQS.map(f => f.cat)))];
  const filteredFaqs = FAQS.filter(f =>
    (activeCat === "All" || f.cat === activeCat) &&
    (search.trim() === "" ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>

      {/* Top bar */}
      <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 shadow-sm sticky top-0 z-30"
        style={{ backgroundColor: C.white, borderBottom: `2px solid ${C.orange}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors hover:bg-orange-50"
            style={{ color: C.darkBlue }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
            style={{ backgroundColor: C.cream, boxShadow: `0 0 0 2px ${C.darkBlue}` }}>
            <img src={logoImg} alt="Khatu Shyam Ji" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm font-bold" style={{ color: C.darkBlue }}>Help &amp; Support</p>
        </div>
        <button onClick={() => navigate("/login")}
          className="px-4 py-1.5 rounded-md text-xs font-bold text-white"
          style={{ backgroundColor: C.green }}>
          My Account
        </button>
      </header>

      {/* ── Hero with search ─────────────────────────── */}
      <section className="relative overflow-hidden" style={{
        background: `linear-gradient(135deg, ${C.darkBlue} 0%, #2a3fa8 100%)`,
      }}>
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, #fff 1.5px, transparent 1.5px)`,
          backgroundSize: "24px 24px",
        }} />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${C.orange} 0%, transparent 70%)` }} />

        <div className="relative max-w-4xl mx-auto px-6 py-14 text-center">
          <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: C.orange }}>We're here to help</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white" style={{ fontFamily: "'Georgia', serif" }}>
            How can we assist you today?
          </h1>
          <p className="text-sm mb-7 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.78)" }}>
            Search our help center, browse common questions, or get in touch with the temple support team.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl"
              style={{ backgroundColor: C.white }}>
              <Search size={18} color={C.muted} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search for darshan timings, bookings, donations…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: C.darkText }}
              />
              <button className="px-4 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: C.orange }}>
                Search
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {["E-Pass", "Refund", "Aarti Timings", "Donation Receipt", "Parking"].map(t => (
                <button key={t} onClick={() => setSearch(t)}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick contact cards (subtle) ─────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_CONTACTS.map(qc => (
            <div key={qc.label}
              className="rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-start gap-3"
              style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${qc.bg}`,
                boxShadow: "0 4px 14px rgba(31,47,140,0.06)",
              }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.cream, color: qc.bg }}>
                {qc.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: C.muted }}>
                  {qc.label}
                </p>
                <p className="text-sm font-bold truncate" style={{ color: C.darkBlue }}>{qc.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{qc.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse Categories ────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-14">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: C.orange }}>Browse Topics</p>
          <h2 className="inline-flex items-center gap-4 text-2xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
            <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
            Popular Help Categories
            <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map(c => (
            <button key={c.label}
              className="group text-left p-5 rounded-xl transition-all hover:-translate-y-0.5 flex gap-4 items-start"
              style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 6px rgba(31,47,140,0.04)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.boxShadow = "0 8px 20px rgba(247,148,29,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 2px 6px rgba(31,47,140,0.04)"; }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.cream, color: C.darkBlue, border: `1px solid ${C.border}` }}>
                {c.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold mb-1" style={{ color: C.darkBlue }}>{c.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{c.desc}</p>
                <p className="mt-2 text-[11px] font-bold inline-flex items-center gap-1" style={{ color: C.orange }}>
                  View articles →
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────── */}
      <section className="w-full py-14 px-6" style={{ backgroundColor: C.white }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: C.orange }}>FAQs</p>
            <h2 className="inline-flex items-center gap-4 text-2xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
              <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
              Frequently Asked Questions
              <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
            </h2>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {cats.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeCat === cat ? C.orange : C.cream,
                  color: activeCat === cat ? C.white : C.darkBlue,
                  border: `1px solid ${activeCat === cat ? C.orange : C.border}`,
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="flex flex-col gap-3">
            {filteredFaqs.length === 0 && (
              <div className="text-center py-10 rounded-xl" style={{ backgroundColor: C.cream, border: `1px dashed ${C.border}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: C.darkBlue }}>No matching results</p>
                <p className="text-xs" style={{ color: C.muted }}>Try a different keyword or contact our support team below.</p>
              </div>
            )}
            {filteredFaqs.map((f, i) => {
              const open = openIdx === i;
              return (
                <div key={f.q} className="rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: C.white, border: `1px solid ${open ? C.orange : C.border}`, boxShadow: open ? `0 8px 24px rgba(247,148,29,0.15)` : "none" }}>
                  <button onClick={() => setOpenIdx(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${C.orange}20`, color: C.orange }}>{f.cat}</span>
                      <span className="text-sm font-bold" style={{ color: C.darkBlue }}>{f.q}</span>
                    </div>
                    <ChevronDown size={18} color={open ? C.orange : C.muted}
                      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm leading-relaxed pl-1" style={{ color: C.muted, borderLeft: `3px solid ${C.orange}`, paddingLeft: "12px" }}>
                        {f.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ HELPLINE NUMBERS SECTION ════════════════════ */}
      <section className="w-full py-16 px-4 sm:px-6" style={{ background: `linear-gradient(180deg, ${C.cream} 0%, #FFF8E7 100%)` }}>
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: `${C.orange}18`, border: `1px solid ${C.orange}40` }}>
              <Phone size={13} color={C.orange} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.orange }}>हेल्पलाइन नंबर</span>
            </div>
            <h2 className="mb-2" style={{ color: C.darkBlue, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, fontFamily: "'Georgia', serif" }}>
              Important Helpline Numbers
            </h2>
            <div className="w-16 h-0.5 mx-auto mb-3 rounded-full" style={{ backgroundColor: C.orange }} />
            <p className="text-sm max-w-xl mx-auto" style={{ color: C.muted }}>
              Quick access to all important contact numbers for temple services, emergency assistance, and tourist information.
            </p>
          </div>

          {/* Emergency banner */}
          <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: `2px solid #EF444440` }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: "#EF444415" }}>
              <ShieldAlert size={16} color="#EF4444" />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#EF4444" }}>Emergency — Call Immediately</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y" style={{ backgroundColor: C.white, borderColor: "#EF444420" }}>
              {HELPLINES.filter(h => h.urgent).map(h => (
                <a key={h.id} href={`tel:${h.numbers[0]}`}
                  className="flex flex-col items-center justify-center gap-1.5 py-5 px-3 text-center transition-all hover:opacity-80 cursor-pointer group"
                  style={{ textDecoration: "none" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${h.color}18`, color: h.color }}>
                    {h.icon}
                  </div>
                  <p className="text-xs font-bold" style={{ color: C.darkText }}>{h.dept}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{h.hindi}</p>
                  {h.numbers.map(n => (
                    <span key={n} className="text-base font-extrabold" style={{ color: h.color, fontFamily: "monospace" }}>{n}</span>
                  ))}
                </a>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {HELPLINE_CATS.map(cat => (
              <button key={cat} onClick={() => setActiveHelplineCat(cat)}
                className="px-5 py-2 rounded-full text-xs font-bold transition-all border-2"
                style={{
                  borderColor:     activeHelplineCat === cat ? C.darkBlue : C.border,
                  backgroundColor: activeHelplineCat === cat ? C.darkBlue : C.white,
                  color:           activeHelplineCat === cat ? C.white    : C.muted,
                  boxShadow:       activeHelplineCat === cat ? `0 4px 14px rgba(31,47,140,0.25)` : "none",
                }}>
                {cat}
                {cat !== "All" && (
                  <span className="ml-1.5 opacity-60">
                    ({HELPLINES.filter(h => !h.urgent && h.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HELPLINES
              .filter(h => !h.urgent)
              .filter(h => activeHelplineCat === "All" || h.category === activeHelplineCat)
              .map(h => (
              <div key={h.id}
                className="group bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ border: `1.5px solid ${C.border}`, boxShadow: "0 2px 8px rgba(31,47,140,0.05)" }}>

                {/* Color accent bar */}
                <div className="h-1" style={{ backgroundColor: h.color }} />

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${h.color}15`, color: h.color, border: `1.5px solid ${h.color}30` }}>
                      {h.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Category badge */}
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                        style={{ backgroundColor: `${h.color}15`, color: h.color }}>
                        {h.category}
                      </span>
                      <p className="text-sm font-bold leading-snug" style={{ color: C.darkText }}>{h.dept}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{h.hindi}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-4 h-px" style={{ backgroundColor: C.border }} />

                  {/* Numbers */}
                  <div className="flex flex-col gap-2">
                    {h.numbers.map(num => (
                      <a key={num} href={`tel:${num.replace(/\s|-/g, "")}`}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: `${h.color}12`, border: `1px solid ${h.color}30`, textDecoration: "none" }}>
                        <span className="font-extrabold tracking-wide" style={{ color: h.color, fontSize: "1.05rem", fontFamily: "monospace, sans-serif" }}>
                          {num}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: h.color }}>
                          <Phone size={11} />
                          Call
                        </div>
                      </a>
                    ))}

                    {/* Email */}
                    {h.email && (
                      <a href={`mailto:${h.email}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                        style={{ backgroundColor: C.cream, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}` }}>
                        <Mail size={12} color={C.orange} />
                        <span className="truncate" style={{ color: C.darkBlue }}>{h.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs mt-8" style={{ color: C.muted }}>
            * All helpline numbers are operational 24×7 unless stated otherwise. For life-threatening emergencies always dial <strong>112</strong>.
          </p>
        </div>
      </section>

      {/* ── Contact form + Visit ─────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-14 grid lg:grid-cols-5 gap-8">

        {/* Form */}
        <div className="lg:col-span-3 rounded-2xl p-7"
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 6px 18px rgba(31,47,140,0.08)" }}>
          <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: C.orange }}>Send a Message</p>
          <h3 className="text-xl font-bold mb-1" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>Still need help?</h3>
          <p className="text-xs mb-6" style={{ color: C.muted }}>Our support team will reply within 24 hours.</p>

          {submitted ? (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${C.green}20` }}>
                <CheckCircle2 size={36} color={C.green} />
              </div>
              <p className="text-base font-bold mb-1" style={{ color: C.darkBlue }}>Message Sent!</p>
              <p className="text-xs" style={{ color: C.muted }}>We've received your message and will respond shortly.</p>
              <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-5 px-5 py-2 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: C.orange }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Devotee name" />
                <Field label="Email Address" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="you@example.com" />
              </div>
              <Field label="Subject" value={form.subject} onChange={v => setForm({ ...form, subject: v })} placeholder="What's this about?" />
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.darkBlue }}>Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  placeholder="Describe your query in detail…"
                  className="w-full px-4 py-3 rounded-lg outline-none text-sm transition-colors focus:border-orange-400"
                  style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.darkText, resize: "vertical" }}
                />
              </div>
              <button type="submit"
                className="self-start flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.orange, boxShadow: `0 6px 16px rgba(247,148,29,0.35)` }}>
                <Send size={14} /> Send Message
              </button>
            </form>
          )}
        </div>

        {/* Visit info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${C.darkBlue}, #2a3fa8)` }}>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: C.orange }}>Visit Us</p>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>Khatu Shyam Ji Temple</h3>
            <div className="flex items-start gap-3 mb-3">
              <MapPin size={16} color={C.orange} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                Khatu Village, Sikar District,<br />Rajasthan – 332602, India
              </p>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <Clock size={16} color={C.orange} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                Support Center: <br />Mon – Sun, 06:00 AM – 10:00 PM
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} color={C.orange} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                01576-221000<br />1800-572-0000 (toll-free)
              </p>
            </div>
            <button onClick={() => navigate("/mela-map")}
              className="mt-5 w-full py-2 rounded-full text-xs font-bold transition-colors"
              style={{ backgroundColor: C.orange, color: C.white }}>
              Open Map
            </button>
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: `${C.pink}12`, border: `1px solid ${C.pink}50` }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} color={C.pink} />
              <p className="text-sm font-bold" style={{ color: C.pink }}>Emergency Contacts</p>
            </div>
            <ul className="flex flex-col gap-2 mt-2">
              {[
                { l: "Medical Emergency", n: "108" },
                { l: "Police Helpline",   n: "100 / 112" },
                { l: "Fire Brigade",      n: "101" },
                { l: "Mela Control Room", n: "01576-221000" },
              ].map(x => (
                <li key={x.l} className="flex items-center justify-between text-xs">
                  <span style={{ color: C.darkText }}>{x.l}</span>
                  <span className="font-bold" style={{ color: C.darkBlue }}>{x.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold mb-1.5 block" style={{ color: C.darkBlue }}>{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg outline-none text-sm transition-colors focus:border-orange-400"
        style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.darkText }}
      />
    </div>
  );
}
