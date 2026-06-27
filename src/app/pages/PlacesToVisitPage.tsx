import { useState } from "react";
import { Plus, Trash2, Compass, ExternalLink, Sparkles, Map, Info } from "lucide-react";

const C = {
  orange: "#F7941D",
  gold: "#F4C430",
  maroon: "#7A1C1C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  charcoal: "#2D1F18",
  muted: "#6E5B52",
  border: "#EADCC9",
};

import shyamKundImg from "./images/shyam-kund.jpeg";
import gourishankarImg from "./images/gourishankar-temple.jpeg";
import shyamBagichiImg from "./images/shyam-baghichi.jpeg";
import khatuFortImg from "./images/khatu-fort.jpeg";
import jeenMataImg from "./images/jeenmata-temple.jpeg";
import harshnathImg from "./images/harshnath-temple.jpeg";
import ranilaFortImg from "./images/hill-fort.jpeg";
import sikarCityImg from "./images/sikar-city.jpeg";
import devgarhImg from "./images/devgarh.jpeg";
import nawalgarhImg from "./images/nawalgarh.jpeg";
import raniSatiImg from "./images/rani-sati.jpeg";
import salasarImg from "./images/salasar.jpeg";

interface Place {
  name: string;
  category: "Temple" | "Garden" | "Fort" | "Heritage Town";
  distance: number;
  desc: string;
  image: string; // paste your image URL here
}

const PLACES: Place[] = [
  { name: "Shyam Kund", category: "Temple", distance: 0, desc: "sacred pond, ritual dip before darshan", image: shyamKundImg },
  { name: "Gourishankar Temple", category: "Temple", distance: 0, desc: "ancient Shiva-Parvati temple", image: gourishankarImg },
  { name: "Shyam Bagichi", category: "Garden", distance: 0, desc: "peaceful garden near temple", image: shyamBagichiImg },
  { name: "Khatu Fort", category: "Fort", distance: 0, desc: "historic fort in town", image: khatuFortImg },
  { name: "Jeen Mata Temple", category: "Temple", distance: 28, desc: "hilltop Durga shrine, 300+ steps", image: jeenMataImg },
  { name: "Harshnath Temple", category: "Temple", distance: 35, desc: "10th-c. Shiva temple, Aravalli views", image: harshnathImg },
//  { name: "Ranila Hill Fort", category: "Fort", distance: 20, desc: "rocky hilltop fort, valley views", image: ranilaFortImg },
  { name: "Sikar city", category: "Heritage Town", distance: 35, desc: "frescoed havelis, bazaars", image: sikarCityImg },
  { name: "Devgarh Fort", category: "Fort", distance: 50, desc: "18th-c. fort, Rajputana-Mughal style", image: devgarhImg },
  { name: "Nawalgarh", category: "Heritage Town", distance: 60, desc: "Shekhawati painted havelis", image: nawalgarhImg },
  { name: "Rani Sati Dadi Temple", category: "Temple", distance: 70, desc: "marble temple, trishul worship", image: raniSatiImg },
  { name: "Salasar Balaji Temple", category: "Temple", distance: 90, desc: "major Hanuman shrine", image: salasarImg },
];

const CATEGORIES = ["All", "Temple", "Garden", "Fort", "Heritage Town"];
const DISTANCES = [
  { label: "All Distances", value: "all" },
  { label: "Within 30 km", value: "under30" },
  { label: "30 to 50 km", value: "30to50" },
  { label: "50 to 90 km", value: "50to90" },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  "Temple": "🛕",
  "Garden": "🌳",
  "Fort": "🏰",
  "Heritage Town": "🏡",
};

export function PlacesToVisitPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDistance, setSelectedDistance] = useState("all");
  const [trip, setTrip] = useState<Place[]>([]);

  // Filtering Logic
  const filteredPlaces = PLACES.filter(place => {
    // Category filter
    const matchesCategory = selectedCategory === "All" || place.category === selectedCategory;

    // Distance filter
    let matchesDistance = true;
    if (selectedDistance === "under30") {
      matchesDistance = place.distance < 30;
    } else if (selectedDistance === "30to50") {
      matchesDistance = place.distance >= 30 && place.distance <= 50;
    } else if (selectedDistance === "50to90") {
      matchesDistance = place.distance > 50 && place.distance <= 90;
    }

    return matchesCategory && matchesDistance;
  });

  // Trip Management Logic
  const addToTrip = (place: Place) => {
    if (trip.some(t => t.name === place.name)) return;
    setTrip([...trip, place]);
  };

  const removeFromTrip = (name: string) => {
    setTrip(trip.filter(t => t.name !== name));
  };

  const clearTrip = () => {
    setTrip([]);
  };

  // Cumulative distance calculation
  const totalDistance = trip.reduce((sum, item) => sum + item.distance, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream, color: C.charcoal }}>
      {/* ── Hero Header ───────────────────────────────────── */}
      <section className="relative py-16 text-center overflow-hidden text-white"
        style={{ background: `linear-gradient(135deg, ${C.maroon} 0%, #520F0F 100%)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: "rgba(247,148,29,0.2)", border: `1.5px solid ${C.orange}` }}>
            <Compass size={13} color={C.orange} />
            <span style={{ color: C.orange }}>Excursions & Sights</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "serif" }}>
            Places to Visit Near Khatu Dham
          </h1>
          <p className="text-sm md:text-base max-w-2xl mx-auto opacity-90 leading-relaxed" style={{ color: C.cream }}>
            Enhance your pilgrimage experience. Discover historic temples, majestic forts, and heritage towns surrounding Shri Khatu Shyam Dham.
          </p>
        </div>
      </section>

      {/* ── Main Layout ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Side: Filter Options & Card Grid (Main Content) */}
        <main className="lg:col-span-3 flex flex-col gap-6">

          {/* Filters Panel */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border" style={{ borderColor: C.border }}>
            <div className="flex flex-col gap-5">

              {/* Category Filter */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider block mb-3" style={{ color: C.muted }}>
                  📁 Filter By Category
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all border hover:scale-102"
                      style={{
                        backgroundColor: selectedCategory === cat ? C.maroon : C.white,
                        borderColor: selectedCategory === cat ? C.maroon : C.border,
                        color: selectedCategory === cat ? C.cream : C.charcoal,
                        boxShadow: selectedCategory === cat ? "0 4px 10px rgba(122,28,28,0.15)" : "none"
                      }}
                    >
                      {cat !== "All" && <span className="mr-1.5">{CATEGORY_EMOJIS[cat]}</span>}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Filter */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider block mb-3" style={{ color: C.muted }}>
                  🚗 Filter By Distance from Khatu Shyamji
                </span>
                <div className="flex flex-wrap gap-2">
                  {DISTANCES.map(dist => (
                    <button
                      key={dist.value}
                      onClick={() => setSelectedDistance(dist.value)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all border hover:scale-102"
                      style={{
                        backgroundColor: selectedDistance === dist.value ? C.orange : C.white,
                        borderColor: selectedDistance === dist.value ? C.orange : C.border,
                        color: selectedDistance === dist.value ? C.white : C.charcoal,
                        boxShadow: selectedDistance === dist.value ? "0 4px 10px rgba(247,148,29,0.15)" : "none"
                      }}
                    >
                      📍 {dist.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex justify-between items-center px-1">
            <p className="text-xs font-semibold" style={{ color: C.muted }}>
              Showing {filteredPlaces.length} attractions near Khatu Shyamji
            </p>
          </div>

          {/* Attraction Cards Grid */}
          {filteredPlaces.length === 0 ? (
            <div className="bg-white rounded-2xl py-16 text-center border flex flex-col items-center justify-center gap-3"
              style={{ borderColor: C.border }}>
              <span className="text-4xl">🗺️</span>
              <p className="text-sm font-semibold" style={{ color: C.muted }}>No attractions match your selected criteria.</p>
              <button
                onClick={() => { setSelectedCategory("All"); setSelectedDistance("all"); }}
                className="mt-2 text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: C.maroon }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPlaces.map(place => {
                const isInTrip = trip.some(t => t.name === place.name);
                const gmapsQuery = `${place.name}, Rajasthan, India`;
                const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gmapsQuery)}`;

                return (
                  <div
                    key={place.name}
                    className="bg-white rounded-2xl p-5 flex flex-col border transition-all hover:-translate-y-1 hover:shadow-md group"
                    style={{ borderColor: C.border }}
                  >
                    <div
                    className="w-full h-36 rounded-xl mb-3 overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}
                    >
                      {place.image ?
                      (
                      <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                    <span className="text-3xl opacity-40">{CATEGORY_EMOJIS[place.category]}</span>
                    )}
                    </div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5"
                          style={{ backgroundColor: `${C.gold}20`, color: C.maroon, border: `1px solid ${C.gold}` }}>
                          {CATEGORY_EMOJIS[place.category]} {place.category}
                        </span>
                        <h3 className="text-lg font-bold group-hover:text-amber-800 transition-colors"
                          style={{ color: C.charcoal, fontFamily: "serif" }}>
                          {place.name}
                        </h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold block px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: C.cream, color: C.maroon, border: `1px solid ${C.border}` }}>
                          🚗 {place.distance === 0 ? "Local Sights" : `${place.distance} km`}
                        </span>
                      </div>
                    </div>

                    {/* Desc */}
                    <p className="text-xs leading-relaxed mb-5 flex-grow" style={{ color: C.muted }}>
                      {place.desc}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2.5 mt-auto pt-3 border-t" style={{ borderColor: `${C.border}60` }}>
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 border"
                        style={{ borderColor: C.orange, color: C.orange, backgroundColor: `${C.cream}30` }}
                      >
                        <Map size={12} /> Get Directions <ExternalLink size={10} />
                      </a>

                      <button
                        onClick={() => addToTrip(place)}
                        disabled={isInTrip}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isInTrip ? "#C8B9A6" : C.maroon,
                          color: isInTrip ? C.charcoal : C.cream,
                        }}
                      >
                        {isInTrip ? (
                          <>✔ Added</>
                        ) : (
                          <><Plus size={12} /> Add to Trip</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Side: Trip Itinerary Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border sticky top-5" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b-2" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: C.maroon }}>Your Trip</h3>
                  <p className="text-[10px]" style={{ color: C.muted }}>Plan nearby excursions</p>
                </div>
              </div>
              {trip.length > 0 && (
                <button
                  onClick={clearTrip}
                  className="text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:text-red-700"
                  style={{ color: C.orange }}
                >
                  Clear Trip
                </button>
              )}
            </div>

            {trip.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2.5 text-xs" style={{ color: C.muted }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: C.cream }}>
                  <Sparkles size={16} color={C.orange} />
                </div>
                <p className="font-semibold">Your itinerary is empty</p>
                <p className="opacity-85 text-[11px] leading-relaxed max-w-[180px]">
                  Click "Add to Trip" on the attraction cards to organize your sightseeing route!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Trip Places List */}
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {trip.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2.5 rounded-xl border text-xs bg-amber-50/20"
                      style={{ borderColor: C.border }}
                    >
                      <div className="flex items-start gap-1.5 max-w-[80%]">
                        <span className="font-semibold opacity-70 mt-0.5">{idx + 1}.</span>
                        <div>
                          <p className="font-bold truncate" style={{ color: C.charcoal }}>{item.name}</p>
                          <p className="text-[10px]" style={{ color: C.muted }}>
                            {CATEGORY_EMOJIS[item.category]} {item.category} • {item.distance === 0 ? "Local" : `${item.distance}km`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromTrip(item.name)}
                        className="p-1 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Remove from itinerary"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Stats Panel */}
                <div className="p-4 rounded-xl flex flex-col gap-2" style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Total Sights:</span>
                    <span className="text-xs font-extrabold" style={{ color: C.maroon }}>{trip.length}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-dashed" style={{ borderColor: C.border }}>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Running Distance:</span>
                      <span className="text-[9px] opacity-75">(Sum of Khatu Dham offsets)</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: C.maroon }}>{totalDistance} km</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3.5 rounded-xl border flex gap-2" style={{ borderColor: C.border, backgroundColor: "#FFF" }}>
                  <Info size={14} className="flex-shrink-0 mt-0.5" color={C.orange} />
                  <p className="text-[10px] leading-relaxed" style={{ color: C.muted }}>
                    This trip calculates the total outbound displacement from Khatu Shyamji. Perfect for choosing day trips or single excursion circuits!
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
