import { useState } from "react";
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
  { id: 1,  url: "https://images.unsplash.com/photo-1768731764777-de5860f41126?auto=format&fit=crop&w=900&q=80", title: "Sacred Shikhara", category: "Temple", photographer: "Anand Mahajan" },
  { id: 2,  url: "https://images.unsplash.com/photo-1634351356743-05de62a4b80b?auto=format&fit=crop&w=900&q=80", title: "Devotees in Sarees", category: "Devotees", photographer: "Gene Brutty" },
  { id: 3,  url: "https://images.unsplash.com/photo-1605302977545-3a09913be1dd?auto=format&fit=crop&w=900&q=80", title: "Sacred Diya", category: "Aarti & Rituals", photographer: "Jyoti Singh" },
  { id: 4,  url: "https://images.unsplash.com/photo-1767278608250-e87182850006?auto=format&fit=crop&w=900&q=80", title: "Festival by the River", category: "Festivals", photographer: "Rohit Dey" },
  { id: 5,  url: "https://images.unsplash.com/photo-1754055518753-d051b8c3309a?auto=format&fit=crop&w=900&q=80", title: "Ancient Architecture", category: "Temple", photographer: "Rohan Mathur" },
  { id: 6,  url: "https://images.unsplash.com/photo-1616787671779-eed71117a65e?auto=format&fit=crop&w=900&q=80", title: "Hands Raised in Prayer", category: "Devotees", photographer: "Ravi Sharma" },
  { id: 7,  url: "https://images.unsplash.com/photo-1636227597176-c554bcbee419?auto=format&fit=crop&w=900&q=80", title: "Evening Diyas", category: "Aarti & Rituals", photographer: "Suchandra Roy" },
  { id: 8,  url: "https://images.unsplash.com/photo-1695395550316-8995ae9d35ff?auto=format&fit=crop&w=900&q=80", title: "Temple Spires", category: "Temple", photographer: "Jayanth Muppaneni" },
  { id: 9,  url: "https://images.unsplash.com/photo-1617184003107-0df15fea4903?auto=format&fit=crop&w=900&q=80", title: "Colourful Procession", category: "Festivals", photographer: "Bhupesh Pal" },
  { id: 10, url: "https://images.unsplash.com/photo-1777222218992-27b952b6b276?auto=format&fit=crop&w=900&q=80", title: "Queue of Faith", category: "Devotees", photographer: "Dibakar Roy" },
  { id: 11, url: "https://images.unsplash.com/photo-1666694051761-cd972857da30?auto=format&fit=crop&w=900&q=80", title: "Havan Kund", category: "Aarti & Rituals", photographer: "Abhinav Bhardwaj" },
  { id: 12, url: "https://images.unsplash.com/photo-1764796834177-c06b81b322f1?auto=format&fit=crop&w=900&q=80", title: "Temple in the Valley", category: "Temple", photographer: "Dewang Gupta" },
  { id: 13, url: "https://images.unsplash.com/photo-1617184003170-1f266c325ff3?auto=format&fit=crop&w=900&q=80", title: "Shyam Mahotsav", category: "Festivals", photographer: "Bhupesh Pal" },
  { id: 14, url: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?auto=format&fit=crop&w=900&q=80", title: "Bhajan Sandhya", category: "Devotees", photographer: "Dibakar Roy" },
  { id: 15, url: "https://images.unsplash.com/photo-1605378229010-11aedbb01b24?auto=format&fit=crop&w=900&q=80", title: "Deepdan Ritual", category: "Aarti & Rituals", photographer: "Ashwini Chaudhary" },
  { id: 16, url: "https://images.unsplash.com/photo-1711547979445-a72c87dfd004?auto=format&fit=crop&w=900&q=80", title: "Mela Procession", category: "Festivals", photographer: "Parth Bhawsar" },
  { id: 17, url: "https://images.unsplash.com/photo-1639575668834-e0fd81f744ad?auto=format&fit=crop&w=900&q=80", title: "Pilgrims at Rest", category: "Devotees", photographer: "Swastik Arora" },
  { id: 18, url: "https://images.unsplash.com/photo-1718476971217-677d43112daa?auto=format&fit=crop&w=900&q=80", title: "Candles of Devotion", category: "Aarti & Rituals", photographer: "Rahul Saraf" },
  { id: 19, url: "https://images.unsplash.com/photo-1625069111882-7735b7b95721?auto=format&fit=crop&w=900&q=80", title: "Inner Sanctum", category: "Temple", photographer: "Yash Parashar" },
  { id: 20, url: "https://images.unsplash.com/photo-1663154048558-2510385fee89?auto=format&fit=crop&w=900&q=80", title: "Crowd of Bhakts", category: "Festivals", photographer: "Pramod Tiwari" },
];

const CATEGORIES: Category[] = ["All", "Temple", "Festivals", "Devotees", "Aarti & Rituals"];

export function GalleryPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = activeCategory === "All" ? ITEMS : ITEMS.filter(i => i.category === activeCategory);

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
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white text-sm font-semibold hover:opacity-80 ml-2">
          <ArrowLeft size={15} /> Back to Home
        </button>
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
              src={activeItem.url.replace("w=900", "w=1400")}
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
