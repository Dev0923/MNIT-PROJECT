import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Video, Play, Clock, Eye } from "lucide-react";
import { Footer } from "../components/Footer";
import logoImg from "../../imports/image-21.png";

const C = {
  orange:   "#F7941D",
  gold:     "#F4C430",
  darkBlue: "#1F2F8C",
  cream:    "#FDF5E6",
  white:    "#FFFFFF",
  darkText: "#333333",
  border:   "#E5E5E5",
  muted:    "#666666",
};

const VIDEOS = [
  { id: 1,  title: "Mangala Aarti — Live Darshan",         duration: "18:42", views: "2.4L", thumb: "https://images.unsplash.com/photo-1605302977545-3a09913be1dd?auto=format&fit=crop&w=600&q=80", tag: "Aarti" },
  { id: 2,  title: "Shyam Mahotsav 2024 — Highlights",     duration: "32:15", views: "5.1L", thumb: "https://images.unsplash.com/photo-1767278608250-e87182850006?auto=format&fit=crop&w=600&q=80", tag: "Festival" },
  { id: 3,  title: "Sandhya Aarti — Evening Prayers",       duration: "22:08", views: "1.8L", thumb: "https://images.unsplash.com/photo-1636227597176-c554bcbee419?auto=format&fit=crop&w=600&q=80", tag: "Aarti" },
  { id: 4,  title: "Temple Architecture — 4K Virtual Tour", duration: "14:55", views: "3.7L", thumb: "https://images.unsplash.com/photo-1768731764777-de5860f41126?auto=format&fit=crop&w=600&q=80", tag: "Temple" },
  { id: 5,  title: "Falgun Mela 2024 — Grand Procession",   duration: "45:20", views: "8.2L", thumb: "https://images.unsplash.com/photo-1617184003107-0df15fea4903?auto=format&fit=crop&w=600&q=80", tag: "Festival" },
  { id: 6,  title: "Bhajan Sandhya — Full Program",         duration: "1:12:30", views: "4.5L", thumb: "https://images.unsplash.com/photo-1663154048558-2510385fee89?auto=format&fit=crop&w=600&q=80", tag: "Bhajan" },
  { id: 7,  title: "Shayan Aarti — Night Prayers",          duration: "16:40", views: "1.2L", thumb: "https://images.unsplash.com/photo-1666694051761-cd972857da30?auto=format&fit=crop&w=600&q=80", tag: "Aarti" },
  { id: 8,  title: "Devotees Arriving at Khatu Dham",       duration: "08:30", views: "2.9L", thumb: "https://images.unsplash.com/photo-1616787671779-eed71117a65e?auto=format&fit=crop&w=600&q=80", tag: "Devotees" },
  { id: 9,  title: "Temple History & Significance",         duration: "28:00", views: "6.3L", thumb: "https://images.unsplash.com/photo-1754055518753-d051b8c3309a?auto=format&fit=crop&w=600&q=80", tag: "Temple" },
  { id: 10, title: "Annadaan Seva — Feeding Thousands",     duration: "11:15", views: "1.6L", thumb: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?auto=format&fit=crop&w=600&q=80", tag: "Seva" },
  { id: 11, title: "Holi Celebration at Khatu",             duration: "24:50", views: "7.0L", thumb: "https://images.unsplash.com/photo-1617184003170-1f266c325ff3?auto=format&fit=crop&w=600&q=80", tag: "Festival" },
  { id: 12, title: "Puja & Rituals — Step-by-Step Guide",   duration: "19:22", views: "3.1L", thumb: "https://images.unsplash.com/photo-1605378229010-11aedbb01b24?auto=format&fit=crop&w=600&q=80", tag: "Ritual" },
];

const TAG_COLORS: Record<string, string> = {
  Aarti:    C.orange,
  Festival: "#9333EA",
  Temple:   C.darkBlue,
  Bhajan:   "#0EA5E9",
  Devotees: "#28A745",
  Seva:     "#F59E0B",
  Ritual:   C.orange,
};

const ALL_TAGS = ["All", ...Array.from(new Set(VIDEOS.map(v => v.tag)))];

export function GalleryVideosPage() {
  const navigate  = useNavigate();
  const [activeTag, setActiveTag] = useState("All");

  const filtered = activeTag === "All" ? VIDEOS : VIDEOS.filter(v => v.tag === activeTag);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>

      {/* Back bar */}
      <div className="w-full px-6 py-4 flex items-center gap-2" style={{ backgroundColor: C.darkBlue }}>
        <img src={logoImg} alt="Logo" className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: C.orange }} />
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white text-sm font-semibold hover:opacity-80 ml-2">
          <ArrowLeft size={15} /> Back to Home
        </button>
        <button onClick={() => navigate("/gallery")} className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 ml-4"
          style={{ color: "rgba(255,255,255,0.60)" }}>
          Photos
        </button>
        <span className="ml-auto text-white text-xs opacity-60 hidden sm:block">Shri Khatu Shyam Ji Temple Trust</span>
      </div>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative py-14 text-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.darkBlue} 0%, #2a3fa8 100%)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: `${C.orange}25`, border: `1px solid ${C.orange}60` }}>
            <Video size={13} color={C.orange} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.orange }}>Video Gallery</span>
          </div>
          <h1 className="mb-3" style={{ color: C.white, fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, fontFamily: "'Georgia',serif" }}>
            Khatu Dham — Videos
          </h1>
          <p className="text-sm max-w-xl mx-auto px-4" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
            Watch aarti recordings, festival highlights, devotional bhajans, and guided tours of Shri Khatu Shyam Ji Temple.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ height: 32 }}>
          <path d="M0,24 C360,48 720,0 1080,28 C1260,42 1380,18 1440,24 L1440,48 L0,48 Z" fill={C.cream} />
        </svg>
      </section>

      {/* ── Tag filter ────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 w-full">
        <div className="flex flex-wrap gap-2 justify-center">
          {ALL_TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              className="px-5 py-2 rounded-full text-xs font-bold transition-all border-2"
              style={{
                borderColor:     activeTag === tag ? C.orange : C.border,
                backgroundColor: activeTag === tag ? C.orange : C.white,
                color:           activeTag === tag ? C.white  : C.muted,
                boxShadow:       activeTag === tag ? `0 4px 14px ${C.orange}50` : "none",
              }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Video grid ───────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-14 w-full flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(vid => (
            <div key={vid.id}
              className="group bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{ border: `1.5px solid ${C.border}`, boxShadow: "0 2px 10px rgba(31,47,140,0.07)" }}>

              {/* Thumbnail */}
              <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img src={vid.thumb} alt={vid.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                {/* Dark overlay */}
                <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-70"
                  style={{ backgroundColor: "rgba(0,0,0,0.30)" }} />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${C.orange}dd`, boxShadow: `0 8px 28px ${C.orange}88` }}>
                    <Play size={22} color="#fff" fill="#fff" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#fff" }}>
                  {vid.duration}
                </div>

                {/* Tag badge */}
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: TAG_COLORS[vid.tag] ?? C.orange, color: "#fff" }}>
                  {vid.tag}
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3">
                <p className="text-sm font-bold leading-snug mb-2" style={{ color: C.darkText }}>{vid.title}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                    <Eye size={12} /> {vid.views} views
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                    <Clock size={12} /> {vid.duration}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

