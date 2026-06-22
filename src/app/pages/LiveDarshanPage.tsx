import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize,
  Heart, Share2, Bell, HandCoins, Send, MessageCircle,
  Calendar, Camera, Languages, Users, Clock, Settings,
  Sparkles, ChevronRight,
} from "lucide-react";
import logoImg from "../../imports/image-21.png";
import templeImg from "../../imports/khatu-shyam-ji.jpg";

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
  live:     "#E11D48",
};

const CAMERA_ANGLES = [
  { id: "garbha",   label: "Garbha Griha",    sub: "Main sanctum"   },
  { id: "aarti",    label: "Aarti Hall",      sub: "Front view"     },
  { id: "shyam",    label: "Shyam Kund",      sub: "Sacred pond"    },
  { id: "courtyard",label: "Outer Courtyard", sub: "Entrance gate"  },
];

const LANGUAGES = ["हिंदी", "English", "मराठी", "ગુજરાતી", "தமிழ்"];

const SCHEDULE = [
  { name: "Mangala Aarti",  time: "04:30 AM", status: "done"    },
  { name: "Shringar Aarti", time: "07:00 AM", status: "done"    },
  { name: "Bhog Aarti",     time: "12:00 PM", status: "live"    },
  { name: "Sandhya Aarti",  time: "07:30 PM", status: "upcoming"},
  { name: "Shayan Aarti",   time: "10:00 PM", status: "upcoming"},
];

const INITIAL_CHAT = [
  { user: "Pooja R.",     msg: "Jai Shree Shyam 🙏 from Mumbai",         time: "2m" },
  { user: "Amit S.",      msg: "Beautiful darshan today",                  time: "2m" },
  { user: "Devotee_91",   msg: "Haare Ka Sahara, Baba Shyam Hamara",       time: "1m" },
  { user: "Riya M.",      msg: "Praying for my family ❤️",                 time: "1m" },
  { user: "Vikram B.",    msg: "Streaming from Singapore. Jai Shyam!",     time: "1m" },
  { user: "Neha K.",      msg: "Bhog aarti starting soon 🪔",              time: "now"},
];

export function LiveDarshanPage() {
  const navigate = useNavigate();
  const [playing, setPlaying]   = useState(true);
  const [muted, setMuted]       = useState(true);
  const [angle, setAngle]       = useState("garbha");
  const [lang, setLang]         = useState("हिंदी");
  const [liked, setLiked]       = useState(false);
  const [tab, setTab]           = useState<"schedule" | "lyrics" | "info">("schedule");
  const [viewers, setViewers]   = useState(12483);
  const [chat, setChat]         = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [countdown, setCountdown] = useState({ h: 7, m: 18, s: 42 });

  // viewer count gentle drift
  useEffect(() => {
    const id = setInterval(() => {
      setViewers(v => v + Math.floor(Math.random() * 7) - 2);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // countdown tick
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        let { h, m, s } = c;
        if (s > 0) s--; else { s = 59; if (m > 0) m--; else { m = 59; if (h > 0) h--; } }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChat(c => [...c, { user: "You", msg: chatInput.trim(), time: "now" }]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>

      {/* Top bar */}
      <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sticky top-0 z-30"
        style={{ backgroundColor: C.white, borderBottom: `2px solid ${C.orange}`, boxShadow: "0 2px 10px rgba(31,47,140,0.06)" }}>
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
          <div>
            <p className="text-sm font-bold" style={{ color: C.darkBlue }}>Live Darshan</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>Khatu Shyam Ji Temple</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: C.cream, color: C.darkBlue, border: `1px solid ${C.border}` }}>
            <Bell size={12} /> Notify
          </button>
          <button onClick={() => navigate("/services/donation-portal")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: C.orange, boxShadow: `0 4px 12px rgba(247,148,29,0.30)` }}>
            <HandCoins size={12} /> Donate
          </button>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_340px] gap-6">

        {/* ─── Left: Player + Meta ─────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Player */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl"
            style={{ aspectRatio: "16 / 9", backgroundColor: "#000", border: `1px solid ${C.border}` }}>
            <iframe
              src="https://www.youtube.com/embed/iGsy-UoXWmI?autoplay=1&mute=1&controls=1&rel=0"
              title="Khatu Shyam Ji Live Darshan"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>

            {/* Top-left badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
              <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: C.live, boxShadow: "0 0 0 0 rgba(225,29,72,0.7)", animation: "livePulse 1.6s infinite" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                <Users size={11} /> {viewers.toLocaleString()} watching
              </span>
            </div>

            {/* Top-right camera switcher */}
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 pointer-events-none z-10"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              <Camera size={11} /> {CAMERA_ANGLES.find(c => c.id === angle)?.label}
            </div>
          </div>

          {/* Camera angle thumbs */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: C.muted }}>Camera Angles</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CAMERA_ANGLES.map(cam => (
                <button key={cam.id} onClick={() => setAngle(cam.id)}
                  className="text-left rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: C.white,
                    border: `2px solid ${angle === cam.id ? C.orange : C.border}`,
                    boxShadow: angle === cam.id ? `0 8px 18px rgba(247,148,29,0.20)` : "0 2px 6px rgba(31,47,140,0.05)",
                  }}>
                  <div className="relative" style={{ aspectRatio: "16 / 9" }}>
                    <img src={templeImg} alt={cam.label} className="w-full h-full object-cover"
                      style={{ filter: `hue-rotate(${cam.id === "shyam" ? 30 : cam.id === "courtyard" ? -10 : 0}deg)` }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)" }} />
                    {angle === cam.id && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded text-white"
                        style={{ backgroundColor: C.live }}>● LIVE</span>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold" style={{ color: C.darkBlue }}>{cam.label}</p>
                    <p className="text-[10px]" style={{ color: C.muted }}>{cam.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title + actions */}
          <div className="rounded-2xl p-5"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px rgba(31,47,140,0.06)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.orange }}>
                  &#x0950; Jai Shree Shyam
                </p>
                <h1 className="text-xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                  Bhog Aarti — Live from Garbha Griha
                </h1>
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  Streamed live · 12:00 PM IST · Officiated by Pt. Mukesh Sharma
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setLiked(!liked)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: liked ? `${C.pink}18` : C.cream,
                    border: `1px solid ${liked ? C.pink : C.border}`,
                    color: liked ? C.pink : C.darkBlue,
                  }}>
                  <Heart size={14} fill={liked ? C.pink : "none"} />
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.darkBlue }}>
                  <Share2 size={14} />
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.darkBlue }}>
                  <Bell size={14} />
                </button>
              </div>
            </div>

            {/* Language pills */}
            <div className="flex items-center gap-2 flex-wrap pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.muted }}>
                <Languages size={12} /> Audio
              </span>
              {LANGUAGES.map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className="text-xs px-3 py-1 rounded-full font-semibold transition-colors"
                  style={{
                    backgroundColor: lang === l ? C.darkBlue : C.cream,
                    color: lang === l ? C.white : C.darkBlue,
                    border: `1px solid ${lang === l ? C.darkBlue : C.border}`,
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px rgba(31,47,140,0.06)" }}>
            <div className="flex" style={{ borderBottom: `1px solid ${C.border}` }}>
              {[
                { id: "schedule", label: "Today's Schedule", icon: <Calendar size={13} /> },
                { id: "lyrics",   label: "Aarti Lyrics",     icon: <Sparkles size={13} /> },
                { id: "info",     label: "About Live Darshan", icon: <MessageCircle size={13} /> },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className="flex items-center gap-1.5 px-5 py-3 text-xs font-bold transition-all relative"
                  style={{
                    color: tab === t.id ? C.darkBlue : C.muted,
                    backgroundColor: tab === t.id ? C.cream : C.white,
                  }}>
                  {t.icon} {t.label}
                  {tab === t.id && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t" style={{ backgroundColor: C.orange }} />}
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === "schedule" && (
                <ul className="flex flex-col gap-2">
                  {SCHEDULE.map(s => (
                    <li key={s.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                      style={{
                        backgroundColor: s.status === "live" ? `${C.orange}10` : C.cream,
                        border: `1px solid ${s.status === "live" ? C.orange : C.border}`,
                      }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: s.status === "live" ? C.orange : s.status === "done" ? C.green : C.white,
                          color: s.status === "upcoming" ? C.darkBlue : C.white,
                          border: s.status === "upcoming" ? `1px solid ${C.border}` : "none",
                        }}>
                        <Clock size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: C.darkBlue }}>{s.name}</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>{s.time}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: s.status === "live" ? C.live : s.status === "done" ? `${C.green}20` : C.white,
                          color: s.status === "live" ? C.white : s.status === "done" ? C.green : C.muted,
                          border: s.status === "upcoming" ? `1px solid ${C.border}` : "none",
                        }}>
                        {s.status === "live" ? "● Live now" : s.status === "done" ? "Completed" : "Upcoming"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {tab === "lyrics" && (
                <div className="text-sm leading-relaxed" style={{ color: C.darkText, fontFamily: "'Georgia', serif" }}>
                  <p className="mb-3 font-bold" style={{ color: C.orange }}>श्री श्याम बाबा की आरती</p>
                  <p className="mb-2">ॐ जय श्री श्याम हरे, स्वामी जय श्री श्याम हरे।</p>
                  <p className="mb-2">भक्त जनों के संकट, दास जनों के संकट,</p>
                  <p className="mb-2">क्षण में दूर करे ॥ ॐ जय श्री श्याम हरे ॥</p>
                  <p className="mb-2">रत्न जड़ित सिंहासन, अद्भुत छवि राजे।</p>
                  <p className="mb-2">मोर मुकुट सिर सोहे, मोर मुकुट सिर सोहे,</p>
                  <p>तन केसरिया साजे ॥</p>
                </div>
              )}
              {tab === "info" && (
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Live Darshan is streamed 24×7 from four camera angles inside the Khatu Shyam Ji temple complex. The feed is in HD with multi-language audio commentary during aartis. Donations made during a live aarti are read out by the priest at the end of the ceremony.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right: Aside (Countdown + Chat) ─────── */}
        <aside className="flex flex-col gap-4">

          {/* Next Aarti Countdown */}
          <div className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${C.darkBlue}, #2a3fa8)` }}>
            <div className="absolute -top-12 -right-10 w-40 h-40 rounded-full opacity-30"
              style={{ background: `radial-gradient(circle, ${C.orange} 0%, transparent 70%)` }} />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.orange }}>Next Aarti In</p>
              <h3 className="text-base font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>Sandhya Aarti</h3>
              <div className="flex gap-2 mb-4">
                {[
                  { v: countdown.h, l: "HRS" },
                  { v: countdown.m, l: "MIN" },
                  { v: countdown.s, l: "SEC" },
                ].map(t => (
                  <div key={t.l} className="flex-1 rounded-lg py-2.5 text-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                    <p className="text-2xl font-extrabold tabular-nums">{String(t.v).padStart(2, "0")}</p>
                    <p className="text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>{t.l}</p>
                  </div>
                ))}
              </div>
              <button className="w-full py-2 rounded-full text-xs font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
                style={{ backgroundColor: C.orange, color: C.white }}>
                <Bell size={12} /> Set Reminder
              </button>
            </div>
          </div>

          {/* Live Chat */}
          <div className="rounded-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 4px 14px rgba(31,47,140,0.06)", height: "440px" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.cream }}>
              <div className="flex items-center gap-2">
                <MessageCircle size={14} color={C.darkBlue} />
                <p className="text-sm font-bold" style={{ color: C.darkBlue }}>Devotee Chat</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: C.green }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.green }} />
                {viewers.toLocaleString()} online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {chat.map((c, i) => (
                <div key={i} className="flex gap-2 px-2 py-1.5 rounded-lg"
                  style={{ backgroundColor: c.user === "You" ? `${C.orange}10` : "transparent" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: c.user === "You" ? C.orange : C.cream,
                      color: c.user === "You" ? C.white : C.darkBlue,
                      border: c.user !== "You" ? `1px solid ${C.border}` : "none",
                    }}>
                    {c.user[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] flex items-center gap-1.5">
                      <span className="font-bold" style={{ color: C.darkBlue }}>{c.user}</span>
                      <span style={{ color: C.muted }}>· {c.time}</span>
                    </p>
                    <p className="text-xs break-words" style={{ color: C.darkText }}>{c.msg}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick reactions */}
            <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 flex-wrap" style={{ borderTop: `1px solid ${C.border}` }}>
              {["🙏", "🪔", "❤️", "🌸", "ॐ"].map(e => (
                <button key={e} onClick={() => setChat(c => [...c, { user: "You", msg: e, time: "now" }])}
                  className="w-8 h-8 rounded-full text-base transition-colors hover:bg-orange-50"
                  style={{ backgroundColor: C.cream }}>
                  {e}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Type Jai Shree Shyam…"
                className="flex-1 px-3 py-2 rounded-full text-xs outline-none"
                style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.darkText }}
              />
              <button onClick={sendChat}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: C.orange }}>
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Donate prompt */}
          <button onClick={() => navigate("/services/donation-portal")}
            className="rounded-2xl p-4 text-left flex items-center gap-3 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.orange}`, boxShadow: "0 4px 12px rgba(31,47,140,0.06)" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: C.cream, color: C.orange }}>
              <HandCoins size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: C.darkBlue }}>Offer a Donation</p>
              <p className="text-[11px]" style={{ color: C.muted }}>Sankalp will be read at aarti end</p>
            </div>
            <ChevronRight size={16} color={C.muted} />
          </button>
        </aside>
      </main>

      <Footer />

      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(225,29,72,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(225,29,72,0); }
          100% { box-shadow: 0 0 0 0 rgba(225,29,72,0); }
        }
      `}</style>
    </div>
  );
}
