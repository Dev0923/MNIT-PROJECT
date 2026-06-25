import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { DivIcon, type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft, Search, Plus, Minus, Locate, Layers,
  Navigation, Car, Hospital, ShieldAlert, Utensils,
  Hotel, Toilet, Droplet, Info, X, Star, MapPin,
} from "lucide-react";

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
  mapLand:  "#EAEDDC",   // google-maps land
  mapPark:  "#C8E6C9",
  mapWater: "#A5D8F3",
  mapRoad:  "#FFFFFF",
  mapRoadAlt: "#FFE082",
};

type Category = "temple" | "parking" | "medical" | "police" | "food" | "stay" | "toilet" | "water";

type POI = {
  id: string;
  name: string;
  category: Category;
  x: number; // percent
  y: number; // percent
  lat: number;
  lng: number;
  desc: string;
  rating?: number;
  open?: string;
};

const CATEGORIES: { key: Category; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "temple",  label: "Temple",   color: "#F7941D", icon: <Star          size={14} /> },
  { key: "parking", label: "Parking",  color: "#1F2F8C", icon: <Car           size={14} /> },
  { key: "medical", label: "Medical",  color: "#E97B8C", icon: <Hospital      size={14} /> },
  { key: "police",  label: "Police",   color: "#0EA5E9", icon: <ShieldAlert   size={14} /> },
  { key: "food",    label: "Food",     color: "#F59E0B", icon: <Utensils      size={14} /> },
  { key: "stay",    label: "Stay",     color: "#8B5CF6", icon: <Hotel         size={14} /> },
  { key: "toilet",  label: "Toilets",  color: "#14B8A6", icon: <Toilet        size={14} /> },
  { key: "water",   label: "Water",    color: "#06B6D4", icon: <Droplet       size={14} /> },
];

const LAT_RANGE: [number, number] = [27.335, 27.555];
const LNG_RANGE: [number, number] = [75.275, 75.525];

function toGeo(x: number, y: number) {
  const lng = LNG_RANGE[0] + (x / 100) * (LNG_RANGE[1] - LNG_RANGE[0]);
  const lat = LAT_RANGE[1] - (y / 100) * (LAT_RANGE[1] - LAT_RANGE[0]);
  return { lat, lng };
}

function withGeoPoi(input: Omit<POI, "lat" | "lng">): POI {
  return { ...input, ...toGeo(input.x, input.y) };
}

const POIS: POI[] = [
  withGeoPoi({ id: "t1",  name: "Khatu Shyam Ji Main Temple", category: "temple",  x: 50, y: 48, desc: "Main sanctum (Garbha Griha). Darshan timings vary by season.", rating: 4.9, open: "04:30 AM – 10:00 PM" }),
  withGeoPoi({ id: "t2",  name: "Shyam Kund",                category: "temple",  x: 41, y: 56, desc: "Sacred pond believed to be the original site where Baba's head was found.", rating: 4.7, open: "Open 24h" }),
  withGeoPoi({ id: "p1",  name: "Parking Sector 4",          category: "parking", x: 22, y: 32, desc: "Main parking lot for cars and 2-wheelers. ~1,200 capacity.", open: "24h" }),
  withGeoPoi({ id: "p2",  name: "Parking Sector 6",          category: "parking", x: 78, y: 64, desc: "Overflow parking, mostly buses. ~600 capacity.", open: "24h" }),
  withGeoPoi({ id: "p3",  name: "VIP Parking",               category: "parking", x: 58, y: 36, desc: "Reserved parking with permit only.", open: "24h" }),
  withGeoPoi({ id: "m1",  name: "Mela Medical Camp 1",       category: "medical", x: 35, y: 70, desc: "24×7 emergency medical camp staffed by govt doctors.", open: "24h" }),
  withGeoPoi({ id: "m2",  name: "Civil Hospital",            category: "medical", x: 84, y: 22, desc: "Nearest full hospital, 2.4 km from temple.", open: "24h" }),
  withGeoPoi({ id: "pol1",name: "Mela Control Room",         category: "police",  x: 48, y: 38, desc: "Central police & admin control room for Mela operations.", open: "24h" }),
  withGeoPoi({ id: "pol2",name: "Police Outpost — Sector 4", category: "police",  x: 26, y: 38, desc: "On-ground assistance and lost & found booth.", open: "24h" }),
  withGeoPoi({ id: "f1",  name: "Bhandara Hall",             category: "food",    x: 56, y: 60, desc: "Free langar served thrice daily during Mela.", open: "08:00 AM – 09:00 PM" }),
  withGeoPoi({ id: "f2",  name: "Food Court Plaza",          category: "food",    x: 66, y: 50, desc: "Vegetarian food stalls — chaat, thali, beverages.", open: "07:00 AM – 11:00 PM" }),
  withGeoPoi({ id: "s1",  name: "Atithi Niwas",              category: "stay",    x: 30, y: 22, desc: "Temple guest house. AC & non-AC rooms.", open: "24h reception" }),
  withGeoPoi({ id: "s2",  name: "Devotee Dharamshala",       category: "stay",    x: 72, y: 30, desc: "Budget rooms, dormitory style.", open: "24h reception" }),
  withGeoPoi({ id: "to1", name: "Toilet Block A",            category: "toilet",  x: 44, y: 64, desc: "Public sanitation block, wheelchair accessible.", open: "24h" }),
  withGeoPoi({ id: "to2", name: "Toilet Block B",            category: "toilet",  x: 64, y: 42, desc: "Public sanitation block.", open: "24h" }),
  withGeoPoi({ id: "w1",  name: "Water Refill Station",      category: "water",   x: 52, y: 58, desc: "Free RO drinking-water refill point.", open: "24h" }),
  withGeoPoi({ id: "w2",  name: "Water Refill Station 2",    category: "water",   x: 38, y: 44, desc: "Free RO drinking-water refill point.", open: "24h" }),
];

const KHATU_CENTER: [number, number] = [27.448, 75.401];

function PoiFocus({ selected }: { selected: POI | null }) {
  const map = useMap();

  if (selected) {
    map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }

  return null;
}

function makeMarkerIcon(color: string, selected: boolean) {
  return new DivIcon({
    html: `<div style="
      width:${selected ? 28 : 22}px;
      height:${selected ? 28 : 22}px;
      border-radius:999px;
      border:2px solid #ffffff;
      background:${color};
      box-shadow:0 4px 10px rgba(0,0,0,0.32);
    "></div>`,
    className: "",
    iconSize: [selected ? 28 : 22, selected ? 28 : 22],
    iconAnchor: [selected ? 14 : 11, selected ? 14 : 11],
  });
}

export function MelaMapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<LeafletMap | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<Category, boolean>>({
    temple: true, parking: true, medical: true, police: true,
    food: true, stay: true, toilet: true, water: true,
  });
  const [selected, setSelected] = useState<POI | null>(POIS[0]);
  const [zoom, setZoom] = useState(12);
  const [layersOpen, setLayersOpen] = useState(true);

  const visible = POIS.filter(p =>
    active[p.category] &&
    (query.trim() === "" || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  const catColor = (c: Category) => CATEGORIES.find(x => x.key === c)!.color;
  const catIcon  = (c: Category) => CATEGORIES.find(x => x.key === c)!.icon;
  const markerIcons = useMemo(() => {
    const icons: Record<string, DivIcon> = {};
    for (const cat of CATEGORIES) {
      icons[cat.key] = makeMarkerIcon(cat.color, false);
      icons[`${cat.key}-selected`] = makeMarkerIcon(cat.color, true);
    }
    return icons;
  }, []);

  const zoomIn = () => {
    const next = Math.min(18, zoom + 1);
    setZoom(next);
    mapRef.current?.setZoom(next);
  };

  const zoomOut = () => {
    const next = Math.max(11, zoom - 1);
    setZoom(next);
    mapRef.current?.setZoom(next);
  };

  const locateToTemple = () => {
    setZoom(13);
    mapRef.current?.flyTo(KHATU_CENTER, 13, { duration: 0.8 });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>

      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="w-full flex items-center gap-3 px-4 py-3 shadow-md z-30"
        style={{ backgroundColor: C.white, borderBottom: `2px solid ${C.orange}` }}>
        <button onClick={() => navigate("/")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors hover:bg-orange-50"
          style={{ color: C.darkBlue }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex-1 max-w-xl relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
            <Search size={15} color={C.muted} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search temple, parking, food, hospital…"
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: C.darkText }}
            />
            {query && (
              <button onClick={() => setQuery("")}><X size={14} color={C.muted} /></button>
            )}
          </div>
          {/* Suggestions */}
          {query && visible.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-40"
              style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
              {visible.slice(0, 6).map(p => (
                <button key={p.id} onClick={() => { setSelected(p); setQuery(""); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors"
                  style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: catColor(p.category) }}>
                    {catIcon(p.category)}
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: C.darkText }}>{p.name}</p>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: C.muted }}>{p.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setLayersOpen(!layersOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={{ backgroundColor: layersOpen ? `${C.orange}20` : C.cream, color: C.darkBlue, border: `1px solid ${C.border}` }}>
            <Layers size={13} /> Layers
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: C.darkBlue }}>
            <Navigation size={13} /> Directions
          </button>
        </div>
      </header>

      {/* ── Main grid ───────────────────────────────────── */}
      <div className="flex-1 relative grid lg:grid-cols-[280px_1fr] overflow-hidden" style={{ minHeight: "calc(100vh - 60px)" }}>

        {/* Left sidebar — categories */}
        {layersOpen && (
          <aside className="border-r overflow-y-auto z-10"
            style={{ backgroundColor: C.white, borderColor: C.border, maxHeight: "calc(100vh - 60px)" }}>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: C.orange }}>Map Layers</p>
              <h3 className="text-base font-bold mb-4" style={{ color: C.darkBlue }}>Show on Map</h3>
              <div className="flex flex-col gap-1.5">
                {CATEGORIES.map(cat => {
                  const count = POIS.filter(p => p.category === cat.key).length;
                  const on = active[cat.key];
                  return (
                    <button key={cat.key}
                      onClick={() => setActive(a => ({ ...a, [cat.key]: !a[cat.key] }))}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: on ? `${cat.color}15` : C.cream,
                        border: `1px solid ${on ? cat.color + "55" : C.border}`,
                      }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: cat.color, opacity: on ? 1 : 0.4 }}>
                        {cat.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-bold" style={{ color: C.darkText }}>{cat.label}</p>
                        <p className="text-[10px]" style={{ color: C.muted }}>{count} {count === 1 ? "location" : "locations"}</p>
                      </div>
                      <span className="w-8 h-4 rounded-full relative transition-colors"
                        style={{ backgroundColor: on ? cat.color : "#CBD5E1" }}>
                        <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                          style={{ left: on ? "calc(100% - 14px)" : "2px" }} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 mx-3 mb-4 rounded-lg" style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} color={C.orange} />
                <p className="text-xs font-bold" style={{ color: C.darkBlue }}>Mela Tip</p>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                Click any pin on the map to see live details, walking time and directions. Crowd-heat overlay refreshes every 5 minutes.
              </p>
            </div>
          </aside>
        )}

        {/* Map area */}
        <div className="relative overflow-hidden" style={{ backgroundColor: C.mapLand }}>

          <MapContainer
            center={KHATU_CENTER}
            zoom={12}
            scrollWheelZoom
            zoomControl={false}
            className="h-full w-full"
            style={{ minHeight: "calc(100vh - 60px)" }}
            whenReady={(event) => {
              mapRef.current = event.target;
            }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PoiFocus selected={selected} />
            {visible.map((p) => {
              const isSelected = selected?.id === p.id;
              const icon = isSelected ? markerIcons[`${p.category}-selected`] : markerIcons[p.category];
              return (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelected(p),
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{p.name}</p>
                      <p style={{ color: C.muted }}>{p.desc}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Zoom controls */}
          <div className="absolute right-4 top-4 flex flex-col rounded-lg overflow-hidden shadow-lg"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
            <button onClick={zoomIn} className="w-9 h-9 flex items-center justify-center hover:bg-orange-50 border-b"
              style={{ borderColor: C.border, color: C.darkBlue }}>
              <Plus size={16} />
            </button>
            <button onClick={zoomOut} className="w-9 h-9 flex items-center justify-center hover:bg-orange-50"
              style={{ color: C.darkBlue }}>
              <Minus size={16} />
            </button>
          </div>

          {/* Locate me */}
          <button onClick={locateToTemple}
            className="absolute right-4 bottom-32 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors hover:bg-orange-50"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, color: C.darkBlue }}>
            <Locate size={16} />
          </button>

          {/* Map legend strip */}
          <div className="absolute left-4 bottom-4 flex flex-wrap gap-2 max-w-md px-3 py-2 rounded-lg shadow-md"
            style={{ backgroundColor: "rgba(255,255,255,0.96)", border: `1px solid ${C.border}` }}>
            {CATEGORIES.filter(c => active[c.key]).map(c => (
              <div key={c.key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] font-semibold" style={{ color: C.darkText }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* POI Info Card */}
          <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 bottom-4 w-80 rounded-xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
              <div className="h-24 relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${catColor(selected.category)}, ${catColor(selected.category)}dd)` }}>
                <button onClick={() => setSelected(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-white/30 hover:bg-white/50 text-white">
                  <X size={14} />
                </button>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.7)" }}>
                  {catIcon(selected.category)}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold" style={{ color: C.darkBlue }}>{selected.name}</h3>
                  {selected.rating && (
                    <span className="flex items-center gap-0.5 text-xs font-bold flex-shrink-0" style={{ color: C.orange }}>
                      <Star size={11} fill={C.orange} /> {selected.rating}
                    </span>
                  )}
                </div>
                <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: catColor(selected.category) }}>
                  {selected.category}
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>{selected.desc}</p>
                {selected.open && (
                  <p className="text-[11px] mb-3 flex items-center gap-1" style={{ color: C.darkText }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.green }} />
                    <span className="font-semibold" style={{ color: C.green }}>Open</span> · {selected.open}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => mapRef.current?.flyTo([selected.lat, selected.lng], 15, { duration: 0.8 })} className="flex-1 py-2 rounded-md text-xs font-bold text-white flex items-center justify-center gap-1 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: C.darkBlue }}>
                    <Navigation size={12} /> Directions
                  </button>
                  <button className="px-3 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-colors hover:bg-orange-50"
                    style={{ backgroundColor: C.white, color: C.darkBlue, border: `1px solid ${C.border}` }}>
                    <MapPin size={12} /> Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
          </div>
  );
}
