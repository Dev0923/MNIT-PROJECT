import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { ArrowLeft, X, ChevronLeft, ChevronRight, ZoomIn, Images } from "lucide-react";
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

type Category = "All" | "Temple" | "Festivals" | "Devotees" | "Aarti & Rituals";

type GalleryItem = {
  id: number;
  url: string;
  title: string;
  category: Exclude<Category, "All">;
  photographer: string;
};

const ITEMS: GalleryItem[] = [
  { id: 1,  url: "/Gallery_photos/gallery-01.jpeg", title: "Temple Darshan", category: "Temple", photographer: "Temple Trust" },
  { id: 2,  url: "/Gallery_photos/gallery-02.jpeg", title: "Sacred Panorama", category: "Temple", photographer: "Temple Trust" },
  { id: 3,  url: "/Gallery_photos/gallery-03.jpeg", title: "Devotional Moment", category: "Devotees", photographer: "Temple Trust" },
  { id: 4,  url: "/Gallery_photos/gallery-04.jpeg", title: "Temple Grounds", category: "Temple", photographer: "Temple Trust" },
  { id: 5,  url: "/Gallery_photos/gallery-05.jpeg", title: "Festive Celebration", category: "Festivals", photographer: "Temple Trust" },
  { id: 6,  url: "/Gallery_photos/gallery-06.jpeg", title: "Aarti Ceremony", category: "Aarti & Rituals", photographer: "Temple Trust" },
  { id: 7,  url: "/Gallery_photos/gallery-07.jpeg", title: "Evening Prayer", category: "Aarti & Rituals", photographer: "Temple Trust" },
  { id: 8,  url: "/Gallery_photos/gallery-08.jpeg", title: "Temple Architecture", category: "Temple", photographer: "Temple Trust" },
  { id: 9,  url: "/Gallery_photos/gallery-09.jpeg", title: "Grand Festival", category: "Festivals", photographer: "Temple Trust" },
  { id: 10, url: "/Gallery_photos/gallery-10.jpeg", title: "Pilgrims Gathering", category: "Devotees", photographer: "Temple Trust" },
  { id: 11, url: "/Gallery_photos/gallery-11.jpeg", title: "Sacred Offerings", category: "Aarti & Rituals", photographer: "Temple Trust" },
  { id: 12, url: "/Gallery_photos/gallery-12.png",  title: "Temple Overview", category: "Temple", photographer: "Temple Trust" },
  { id: 13, url: "/Gallery_photos/gallery-13.jpeg", title: "Devotee Prayers", category: "Devotees", photographer: "Temple Trust" },
  { id: 14, url: "/Gallery_photos/gallery-14.jpeg", title: "Shyam Bhajan", category: "Devotees", photographer: "Temple Trust" },
  { id: 15, url: "/Gallery_photos/gallery-15.jpeg", title: "Holy Darbar", category: "Temple", photographer: "Temple Trust" },
  { id: 16, url: "/Gallery_photos/gallery-16.jpeg", title: "Festival Decorations", category: "Festivals", photographer: "Temple Trust" },
  { id: 17, url: "/Gallery_photos/gallery-17.jpeg", title: "Lamp Lighting", category: "Aarti & Rituals", photographer: "Temple Trust" },
  { id: 18, url: "/Gallery_photos/gallery-18.jpeg", title: "Temple at Dusk", category: "Temple", photographer: "Temple Trust" },
];

const CATEGORIES: Category[] = ["All", "Temple", "Festivals", "Devotees", "Aarti & Rituals"];

export function GalleryPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [backendItems, setBackendItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/gallery")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data
            .filter((d: any) => d.type === "photo")
            .map((d: any) => ({
              id: d.id + 10000,
              url: "http://localhost:8000" + d.url,
              title: d.title,
              category: (d.category || "Temple") as Exclude<Category, "All">,
              photographer: d.photographer || "Admin",
            }));
          setBackendItems(mapped);
        }
      })
      .catch(console.error);
  }, []);

  const allItems = [...backendItems, ...ITEMS];
  const filtered = activeCategory === "All" ? allItems : allItems.filter(i => i.category === activeCategory);

  function openLightbox(id: number) {
    setLightbox(id);
  }

  function closeLightbox() {
    setLightbox(null);
  }

  function prevImage() {
    if (lightbox === null) return;
    const idx = filtered.findIndex(i => i.id === lightbox);
    const prev = filtered[(idx - 1 + filtered.length) % filtered.length];
    setLightbox(prev.id);
  }

  function nextImage() {
    if (lightbox === null) return;
    const idx = filtered.findIndex(i => i.id === lightbox);
    const next = filtered[(idx + 1) % filtered.length];
    setLightbox(next.id);
  }

  const activeItem = lightbox !== null ? filtered.find(i => i.id === lightbox) ?? null : null;
  const activeIdx  = lightbox !== null ? filtered.findIndex(i => i.id === lightbox) : -1;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>

      {/* Back bar */}
      <div className="w-full px-6 py-4 flex items-center gap-2" style={{ backgroundColor: C.darkBlue }}>
        <img src={logoImg} alt="Logo" className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: C.orange }} />

        <span className="ml-auto text-white text-xs opacity-60 hidden sm:block">Shri Khatu Shyam Ji Temple Trust</span>
      </div>

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative py-14 text-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.darkBlue} 0%, #2a3fa8 100%)` }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: `${C.orange}25`, border: `1px solid ${C.orange}60` }}>
            <Images size={13} color={C.orange} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.orange }}>Photo Gallery</span>
          </div>
          <h1
            className="mb-3"
            style={{ color: C.white, fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, fontFamily: "'Georgia', serif" }}
          >
            Glimpses of Khatu Dham
          </h1>
          <p className="text-sm max-w-xl mx-auto px-4" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
            A visual journey through the sacred precincts, grand festivities, and the boundless devotion at Shri Khatu Shyam Ji Temple.
          </p>
        </div>

        {/* Wave divider */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ height: 32 }}>
          <path d="M0,24 C360,48 720,0 1080,28 C1260,42 1380,18 1440,24 L1440,48 L0,48 Z" fill={C.cream} />
        </svg>
      </section>

      {/* ── Category Filter ───────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 w-full">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-5 py-2 rounded-full text-xs font-bold transition-all border-2"
              style={{
                borderColor:     activeCategory === cat ? C.orange : C.border,
                backgroundColor: activeCategory === cat ? C.orange : C.white,
                color:           activeCategory === cat ? C.white  : C.muted,
                boxShadow:       activeCategory === cat ? `0 4px 14px ${C.orange}50` : "none",
              }}
            >
              {cat}
              <span className="ml-1.5 text-xs opacity-70">
                ({cat === "All" ? ITEMS.length : ITEMS.filter(i => i.category === cat).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Masonry Grid ─────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-14 w-full flex-1">
        <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 640: 2, 1024: 3 }}>
          <Masonry gutter="12px">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl cursor-pointer"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
                onClick={() => openLightbox(item.id)}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full block transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
                  style={{ background: "linear-gradient(to top, rgba(21,32,96,0.88) 0%, transparent 60%)" }}>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block text-xs font-semibold mb-0.5" style={{ color: C.gold }}>{item.category}</span>
                      <p className="text-white text-sm font-bold">{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.60)" }}>📷 {item.photographer}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
                      style={{ backgroundColor: `${C.orange}cc` }}>
                      <ZoomIn size={16} color={C.white} />
                    </div>
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: C.orange, color: C.white }}>
                  {item.category}
                </div>
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </main>

      {/* ── Lightbox ─────────────────────────────────── */}
      {activeItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={closeLightbox}
          >
            <X size={20} color="white" />
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 w-11 h-11 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={e => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft size={22} color="white" />
          </button>

          {/* Image */}
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={activeItem.url.includes("unsplash.com") ? activeItem.url.replace("w=900", "w=1400") : activeItem.url}
              alt={activeItem.title}
              className="w-full max-h-[80vh] object-contain rounded-xl"
              style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
            />
            <div className="flex items-center justify-between mt-4 px-1">
              <div>
                <p className="text-white font-bold">{activeItem.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {activeItem.category} · 📷 {activeItem.photographer}
                </p>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                {activeIdx + 1} / {filtered.length}
              </p>
            </div>
          </div>

          {/* Next */}
          <button
            className="absolute right-4 w-11 h-11 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={e => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight size={22} color="white" />
          </button>
        </div>
      )}

          </div>
  );
}
