import { useEffect, useState } from "react";
import { getParkingAvailability, type ParkingLotPublic } from "../services/adminApi";

// ── Helpers ───────────────────────────────────────────────

function getStatusColor(pct: number) {
  if (pct >= 90) return { bg: "#ff4d4d", label: "Full", ring: "rgba(255,77,77,0.3)" };
  if (pct >= 70) return { bg: "#ff9900", label: "Limited", ring: "rgba(255,153,0,0.3)" };
  if (pct >= 40) return { bg: "#f5c518", label: "Moderate", ring: "rgba(245,197,24,0.3)" };
  return { bg: "#22c55e", label: "Available", ring: "rgba(34,197,94,0.3)" };
}

function formatTime(iso: string | null): string {
  if (!iso) return "Not yet updated";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Circular arc progress ─────────────────────────────────
function ArcGauge({ pct, color }: { pct: number; color: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - pct / 100);
  return (
    <svg viewBox="0 0 100 100" style={{ width: 110, height: 110 }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={fill}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text
        x="50" y="54"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="#fff"
        fontFamily="Inter, sans-serif"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Slot bar ──────────────────────────────────────────────
function SlotBar({ occupied, total, color }: { occupied: number; total: number; color: string }) {
  const pct = total > 0 ? (occupied / total) * 100 : 0;
  return (
    <div style={{ margin: "12px 0 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
        <span>Occupied: <b style={{ color: "#ff6b6b" }}>{occupied}</b></span>
        <span>Available: <b style={{ color: "#22c55e" }}>{total - occupied}</b></span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          borderRadius: 8,
          transition: "width 1s ease",
        }} />
      </div>
    </div>
  );
}

// ── Slot dot grid ─────────────────────────────────────────
function SlotDots({ total, occupied }: { total: number; occupied: number }) {
  const displayMax = Math.min(total, 50);
  const scale = total / displayMax;
  const occDisplay = Math.round(occupied / scale);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12, justifyContent: "center" }}>
      {Array.from({ length: displayMax }).map((_, i) => (
        <div
          key={i}
          title={i < occDisplay ? "Occupied" : "Available"}
          style={{
            width: 10, height: 10,
            borderRadius: 2,
            background: i < occDisplay ? "#ff4d6d" : "#22c55e",
            opacity: 0.85,
            transition: "background 0.3s",
          }}
        />
      ))}
      {total > displayMax && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>+{total - displayMax} more</span>
      )}
    </div>
  );
}

// ── Parking Card ──────────────────────────────────────────
function ParkingCard({ lot }: { lot: ParkingLotPublic }) {
  const { bg, label, ring } = getStatusColor(lot.occupancy_pct);
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover
          ? "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))"
          : "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
        borderRadius: 20,
        border: `1.5px solid ${hover ? bg + "80" : "rgba(255,255,255,0.10)"}`,
        padding: "24px 22px",
        backdropFilter: "blur(16px)",
        boxShadow: hover ? `0 0 32px ${ring}, 0 8px 32px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "all 0.3s ease",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -20, right: -20, width: 100, height: 100,
        borderRadius: "50%", background: bg, opacity: 0.12, filter: "blur(30px)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span style={{
            display: "inline-block", padding: "3px 12px", borderRadius: 20,
            background: `${bg}22`, border: `1px solid ${bg}55`,
            color: bg, fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase", marginBottom: 8,
          }}>
            {label}
          </span>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
            {lot.name}
          </h3>
          {lot.location_description && (
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              📍 {lot.location_description}
            </p>
          )}
        </div>
        <ArcGauge pct={lot.occupancy_pct} color={bg} />
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
        background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 8px",
      }}>
        {[
          { label: "Total", value: lot.total_slots, color: "rgba(255,255,255,0.7)" },
          { label: "Occupied", value: lot.occupied_slots, color: "#ff6b6b" },
          { label: "Free", value: lot.available_slots, color: "#22c55e" },
        ].map(({ label: l, value, color }) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Slot bar */}
      <SlotBar occupied={lot.occupied_slots} total={lot.total_slots} color={bg} />

      {/* Dot grid */}
      <SlotDots total={lot.total_slots} occupied={lot.occupied_slots} />

      {/* Footer */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "blink 1.5s infinite" }} />
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
          Last updated: {formatTime(lot.last_updated)}
        </span>
      </div>
    </div>
  );
}

// ── Summary banner ────────────────────────────────────────
function SummaryBanner({ lots }: { lots: ParkingLotPublic[] }) {
  const total = lots.reduce((s, l) => s + l.total_slots, 0);
  const occupied = lots.reduce((s, l) => s + l.occupied_slots, 0);
  const available = total - occupied;
  const pct = total ? Math.round((occupied / total) * 100) : 0;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(139,92,246,0.20), rgba(59,130,246,0.15))",
      border: "1px solid rgba(139,92,246,0.30)",
      borderRadius: 20,
      padding: "28px 32px",
      marginBottom: 32,
      backdropFilter: "blur(16px)",
      display: "flex",
      flexWrap: "wrap",
      gap: 24,
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 800 }}>
          Overall Parking Status
        </h2>
        <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          Real-time across all parking zones
        </p>
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { label: "Total Slots", value: total, color: "#a78bfa" },
          { label: "Occupied", value: occupied, color: "#f87171" },
          { label: "Available", value: available, color: "#4ade80" },
          { label: "Occupancy", value: `${pct}%`, color: pct >= 80 ? "#f87171" : pct >= 50 ? "#fbbf24" : "#4ade80" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export function ParkingPage() {
  const [lots, setLots] = useState<ParkingLotPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const data = await getParkingAvailability();
      setLots(data);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Unable to load parking data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const activeLots = lots.filter((l) => l.is_active);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer { 0%{background-position:-1000px 0} 100%{background-position:1000px 0} }
        .parking-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:20px; }
        @media(max-width:600px){ .parking-grid{grid-template-columns:1fr;} }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #24243e 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "40px 20px 60px",
      }}>
        {/* ── Hero ── */}
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            {/* Icon */}
            <div style={{
              width: 72, height: 72, margin: "0 auto 20px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34,
              boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
              animation: "float 4s ease-in-out infinite",
            }}>🚗</div>

            <h1 style={{
              margin: 0, fontSize: "clamp(28px,5vw,44px)",
              fontWeight: 900, color: "#fff",
              background: "linear-gradient(135deg, #e0c3fc, #8ec5fc)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: -1,
            }}>
              Parking Availability
            </h1>
            <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.50)", fontSize: 15, lineHeight: 1.6 }}>
              Real-time parking slot status for Khatu Shyam Ji Temple premises.<br />
              Auto-refreshes every 30 seconds.
            </p>

            {/* Refresh button */}
            <button
              id="parking-refresh-btn"
              onClick={fetchData}
              style={{
                marginTop: 20,
                padding: "10px 24px", borderRadius: 30,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              🔄 Refresh Now
            </button>

            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.30)", fontSize: 12 }}>
              Last refreshed: {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 16px",
                border: "4px solid rgba(255,255,255,0.1)",
                borderTop: "4px solid #7c3aed",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
              <p style={{ color: "rgba(255,255,255,0.45)" }}>Fetching parking data…</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 14, padding: "20px 24px", marginBottom: 24, color: "#fca5a5",
              textAlign: "center",
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && activeLots.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              background: "rgba(255,255,255,0.04)", borderRadius: 20,
              border: "1px dashed rgba(255,255,255,0.12)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🅿️</div>
              <h3 style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>No Parking Zones Configured</h3>
              <p style={{ color: "rgba(255,255,255,0.35)" }}>Parking information will appear here once zones are set up by the admin.</p>
            </div>
          )}

          {/* ── Content ── */}
          {!loading && activeLots.length > 0 && (
            <>
              <SummaryBanner lots={activeLots} />
              <div className="parking-grid">
                {activeLots.map((lot) => (
                  <ParkingCard key={lot.id} lot={lot} />
                ))}
              </div>

              {/* Legend */}
              <div style={{
                marginTop: 40,
                background: "rgba(255,255,255,0.04)", borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "16px 24px",
                display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center",
              }}>
                <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, fontWeight: 600 }}>LEGEND</span>
                {[
                  { color: "#22c55e", label: "Available (< 40% full)" },
                  { color: "#f5c518", label: "Moderate (40–70%)" },
                  { color: "#ff9900", label: "Limited (70–90%)" },
                  { color: "#ff4d4d", label: "Full (> 90%)" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div style={{
                marginTop: 20,
                background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: 14, padding: "14px 20px",
                color: "rgba(255,255,255,0.50)", fontSize: 12, lineHeight: 1.7,
              }}>
                ℹ️ Parking counts are updated via AI-powered vehicle detection cameras. Data may have a brief delay.
                For precise guidance, follow directions from parking attendants on-site.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
