import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Rotate3d, ChevronLeft, ChevronRight, MapPin, Info, X } from "lucide-react";
import { Footer } from "../components/Footer";
import { AnimatePresence, motion } from "framer-motion";
import "pannellum/build/pannellum.js";
import "pannellum/build/pannellum.css";
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
  purple:   "#9333EA",
};

type Spot = {
  id: number;
  name: string;
  hindi: string;
  desc: string;
  img: string;
  hotspots: { x: number; y: number; label: string }[];
};

const SPOTS: Spot[] = [
  {
    id: 1,
    name: "Main Entrance (Singhdwar)",
    hindi: "मुख्य द्वार — सिंहद्वार",
    desc: "The grand ceremonial gateway of Shri Khatu Shyam Ji Temple, adorned with intricate carvings and the sacred 'Om' symbol. Thousands of devotees pass through this gate every day seeking the blessings of Shyam Baba.",
    img: "https://images.unsplash.com/photo-1695395550316-8995ae9d35ff?auto=format&fit=crop&w=1400&q=80",
    hotspots: [
      { x: 30, y: 45, label: "Sacred Bell" },
      { x: 65, y: 35, label: "Om Carving" },
    ],
  },
  {
    id: 2,
    name: "Garbhagriha (Inner Sanctum)",
    hindi: "गर्भगृह — मुख्य मंदिर",
    desc: "The holiest chamber housing the main idol of Shri Khatu Shyam Ji. The deity is adorned with gold and silver ornaments, fresh flowers, and divine offerings. The sanctum is illuminated by hundreds of diyas during aarti.",
    img: "https://images.unsplash.com/photo-1768731764777-de5860f41126?auto=format&fit=crop&w=1400&q=80",
    hotspots: [
      { x: 50, y: 40, label: "Main Idol" },
      { x: 20, y: 60, label: "Diya Stand" },
      { x: 75, y: 55, label: "Flower Offering" },
    ],
  },
  {
    id: 3,
    name: "Parikrama Path (Circumambulation)",
    hindi: "परिक्रमा पथ",
    desc: "The sacred circumambulation path encircling the main temple. Devotees perform parikrama as an act of devotion, walking barefoot around the temple while chanting 'Jai Shree Shyam'. The path is lined with small shrines.",
    img: "https://images.unsplash.com/photo-1754055518753-d051b8c3309a?auto=format&fit=crop&w=1400&q=80",
    hotspots: [
      { x: 40, y: 50, label: "Shrine of Hanuman" },
      { x: 70, y: 40, label: "Ancient Pillar" },
    ],
  },
  {
    id: 4,
    name: "Shyam Kund (Sacred Pond)",
    hindi: "श्याम कुण्ड",
    desc: "The ancient sacred pond believed to have miraculous properties. Pilgrims take a holy dip in the kund before entering the temple. The water is considered blessed by Shyam Baba himself.",
    img: "https://images.unsplash.com/photo-1765648335436-608a95a4f1d1?auto=format&fit=crop&w=1400&q=80",
    hotspots: [
      { x: 55, y: 65, label: "Bathing Ghat" },
      { x: 25, y: 35, label: "Ancient Steps" },
    ],
  },
  {
    id: 5,
    name: "Prasad Hall (Bhandara)",
    hindi: "प्रसाद हॉल — भंडारा",
    desc: "The large community kitchen and distribution hall where Annadaan (free food) is served to thousands of devotees daily. The tradition of Bhandara has been ongoing for centuries, symbolising the ethos of equality and service.",
    img: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?auto=format&fit=crop&w=1400&q=80",
    hotspots: [
      { x: 35, y: 55, label: "Serving Counter" },
      { x: 65, y: 45, label: "Community Seating" },
    ],
  },
  {
    id: 6,
    name: "Temple Garden & Courtyard",
    hindi: "मंदिर प्रांगण एवं उद्यान",
    desc: "The beautifully maintained courtyard surrounding the temple, with fragrant marigold garlands, sacred tulsi plants, and seating areas for devotees. The garden fills with the scent of incense and fresh flowers during morning prayers.",
    img: "https://images.unsplash.com/photo-1764796834177-c06b81b322f1?auto=format&fit=crop&w=1400&q=80",
    hotspots: [
      { x: 45, y: 30, label: "Tulsi Mandir" },
      { x: 70, y: 60, label: "Rest Area" },
    ],
  },
];

export function GalleryVirtualTourPage() {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [infoOpen, setInfoOpen]   = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);

  const spot = SPOTS[activeIdx];
  const hotspotStyleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of SPOTS) {
      for (const hs of s.hotspots) {
        map[`${s.id}-${hs.label}`] = activeHotspot === hs.label ? "hs-dot hs-dot-active" : "hs-dot";
      }
    }
    return map;
  }, [activeHotspot]);

  useEffect(() => {
    if (!viewerRef.current) return;

    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    const baseHfov = 105;
    instanceRef.current = (window as any).pannellum.viewer(viewerRef.current, {
      type: "equirectangular",
      panorama: spot.img,
      autoLoad: true,
      showControls: true,
      compass: false,
      hfov: baseHfov,
      pitch: 0,
      yaw: 0,
      hotSpots: spot.hotspots.map((hs, idx) => ({
        id: `${spot.id}-${hs.label}`,
        pitch: ((50 - hs.y) / 100) * 45,
        yaw: ((hs.x - 50) / 100) * 180,
        type: "info",
        text: hs.label,
        cssClass: hotspotStyleMap[`${spot.id}-${hs.label}`],
        clickHandlerFunc: () => {
          setActiveHotspot((curr) => (curr === hs.label ? null : hs.label));
        },
      })),
    });

    const smoothYaw = [-50, -20, 0, 25, 50, 70][activeIdx % 6];
    instanceRef.current.setYaw(smoothYaw, 800);

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [activeIdx, spot, hotspotStyleMap]);

  function prev() { setActiveIdx(i => (i - 1 + SPOTS.length) % SPOTS.length); setInfoOpen(false); setActiveHotspot(null); }
  function next() { setActiveIdx(i => (i + 1) % SPOTS.length); setInfoOpen(false); setActiveHotspot(null); }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0f172a" }}>

      {/* Back bar */}
      <div className="w-full px-6 py-4 flex items-center gap-2 z-10" style={{ backgroundColor: C.darkBlue }}>
        <img src={logoImg} alt="Logo" className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: C.orange }} />
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white text-sm font-semibold hover:opacity-80 ml-2">
          <ArrowLeft size={15} /> Back to Home
        </button>
        <div className="flex items-center gap-3 ml-4">
          <button onClick={() => navigate("/gallery")} className="text-sm font-semibold hover:opacity-80" style={{ color: "rgba(255,255,255,0.55)" }}>Photos</button>
          <button onClick={() => navigate("/gallery/videos")} className="text-sm font-semibold hover:opacity-80" style={{ color: "rgba(255,255,255,0.55)" }}>Videos</button>
        </div>
        <span className="ml-auto text-white text-xs opacity-60 hidden sm:block">Shri Khatu Shyam Ji Temple — Virtual Tour</span>
      </div>

      {/* ── Hero label ───────────────────────────────── */}
      <div className="text-center py-8 px-4" style={{ background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
          style={{ backgroundColor: `${C.purple}25`, border: `1px solid ${C.purple}60` }}>
          <Rotate3d size={13} color={C.purple} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.purple }}>360° Virtual Tour</span>
        </div>
        <h1 className="mb-2" style={{ color: C.white, fontSize: "clamp(1.5rem,3.5vw,2.4rem)", fontWeight: 800, fontFamily: "'Georgia',serif" }}>
          Explore Khatu Dham Virtually
        </h1>
        <p className="text-xs max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.50)" }}>
          Walk through the sacred spaces of Shri Khatu Shyam Ji Temple from anywhere in the world.
        </p>
      </div>

      {/* ── Main viewer ──────────────────────────────── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-6">

        {/* Viewer card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: "16/7", minHeight: 320 }}>
          <div ref={viewerRef} className="absolute inset-0" />

          {/* Gradient overlays */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 45%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 40%)" }} />

          {/* Bottom info strip */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: C.orange }}>LOCATION {activeIdx + 1} / {SPOTS.length}</p>
              <h2 className="text-white font-extrabold mb-0.5" style={{ fontSize: "clamp(1rem,2.5vw,1.4rem)", fontFamily: "'Georgia',serif" }}>
                {spot.name}
              </h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>{spot.hindi}</p>
            </div>
            <button
              onClick={() => setInfoOpen(o => !o)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: infoOpen ? C.orange : "rgba(255,255,255,0.15)", color: C.white, border: "1px solid rgba(255,255,255,0.3)" }}>
              <Info size={13} /> About this place
            </button>
          </div>

          {/* Prev / Next */}
          <button onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <ChevronLeft size={22} color="white" />
          </button>
          <button onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <ChevronRight size={22} color="white" />
          </button>

          {/* 360 badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${C.purple}cc`, border: `1px solid ${C.purple}` }}>
            <Rotate3d size={13} color="white" />
            <span className="text-xs font-bold text-white">360°</span>
          </div>
        </motion.div>

        {/* Info panel */}
        <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mt-3 rounded-2xl px-6 py-5 flex gap-4 items-start"
            style={{ backgroundColor: "#1e293b", border: `1px solid rgba(255,255,255,0.10)` }}>
            <MapPin size={18} color={C.orange} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-white mb-1 text-sm">{spot.name}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{spot.desc}</p>
            </div>
            <button onClick={() => setInfoOpen(false)} className="text-gray-500 hover:text-white transition-colors mt-0.5">
              <X size={16} />
            </button>
          </motion.div>
        )}
        </AnimatePresence>

        {/* ── Thumbnails strip ─────────────────────────── */}
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SPOTS.map((s, i) => (
            <button key={s.id} onClick={() => { setActiveIdx(i); setInfoOpen(false); setActiveHotspot(null); }}
              className="relative overflow-hidden rounded-xl transition-all hover:scale-105"
              style={{
                aspectRatio: "4/3",
                outline: i === activeIdx ? `2.5px solid ${C.orange}` : "2.5px solid transparent",
                boxShadow: i === activeIdx ? `0 0 0 1px ${C.orange}` : "none",
              }}>
              <img src={s.img} alt={s.name} className="w-full h-full object-cover" style={{ filter: i === activeIdx ? "none" : "brightness(0.55)" }} />
              {i === activeIdx && (
                <div className="absolute inset-0 flex items-end p-1.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}>
                  <p className="text-white text-[9px] font-bold leading-tight">{s.name.split("(")[0].trim()}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Hotspots legend */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>Tap the pulsing dots to explore points of interest</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.orange }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Hotspot</span>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .hs-dot {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #f7941d;
          border: 2px solid #fff;
          box-shadow: 0 0 0 0 rgba(247,148,29,0.65);
          animation: hsPulse 1.6s infinite;
        }

        .hs-dot-active {
          background: #f4c430;
        }

        @keyframes hsPulse {
          0% { box-shadow: 0 0 0 0 rgba(247,148,29,0.65); }
          70% { box-shadow: 0 0 0 12px rgba(247,148,29,0); }
          100% { box-shadow: 0 0 0 0 rgba(247,148,29,0); }
        }
      `}</style>
    </div>
  );
}
