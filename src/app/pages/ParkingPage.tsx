import { useEffect, useState, useRef, useCallback } from "react";
import { getParkingZones, type ParkingZone } from "../services/adminApi";

// ── Constants ─────────────────────────────────────────────
const TEMPLE_LAT = 27.4465;
const TEMPLE_LNG = 75.4005;
const WS_URL = "ws://localhost:8000/api/parking/ws";

const VEHICLE_LABEL: Record<string, string> = {
  two_wheeler: "🏍️ Two Wheeler",
  four_wheeler: "🚗 Four Wheeler",
  heavy: "🚌 Heavy Vehicle",
};

// Site design tokens matching HomePage.tsx
const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  green: "#28A745",
  pink: "#E97B8C",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
};

// ── Color state helpers ───────────────────────────────────
function getZoneStatus(zone: ParkingZone): {
  color: string; gradFrom: string; gradTo: string;
  label: string; ring: string; dotColor: string;
} {
  const freeRatio = zone.available_slots / zone.system_capacity_limit;
  if (freeRatio > 0.20)
    return { color: C.green, gradFrom: "#218838", gradTo: "#28A745", label: "Open", ring: "rgba(40,167,69,0.25)", dotColor: C.green };
  if (freeRatio > 0.05)
    return { color: C.orange, gradFrom: "#e67e22", gradTo: C.orange, label: "Filling Fast", ring: "rgba(247,148,29,0.25)", dotColor: C.orange };
  return { color: "#dc2626", gradFrom: "#b91c1c", gradTo: "#ef4444", label: "Full", ring: "rgba(220,38,38,0.25)", dotColor: "#dc2626" };
}

function formatCoords(coords: string): { lat: string; lng: string } {
  const [lat, lng] = coords.split(",");
  return { lat: lat?.trim() ?? TEMPLE_LAT.toString(), lng: lng?.trim() ?? TEMPLE_LNG.toString() };
}

// ── Arc Gauge ─────────────────────────────────────────────
function ArcGauge({ pct, color }: { pct: number; color: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg viewBox="0 0 100 100" style={{ width: 88, height: 88, flexShrink: 0 }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 0.9s ease" }} />
      <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="900" fill={C.darkBlue} fontFamily="Inter, sans-serif">{Math.round(pct)}%</text>
      <text x="50" y="62" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6B7280" fontFamily="Inter, sans-serif">FULL</text>
    </svg>
  );
}

// ── Slot Bar ──────────────────────────────────────────────
function SlotBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 5 }}>
        <span>Occupied: <b style={{ color: "#dc2626" }}>{used}</b></span>
        <span>Available: <b style={{ color: C.green }}>{Math.max(0, limit - used)}</b></span>
      </div>
      <div style={{ background: "#E5E7EB", borderRadius: 6, height: 7, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          borderRadius: 6, transition: "width 0.9s ease",
        }} />
      </div>
    </div>
  );
}

// ── Deep Link Reroute Overlay ─────────────────────────────
function RerouteOverlay({
  fullZone,
  altZone,
  onDismiss,
}: {
  fullZone: ParkingZone;
  altZone: ParkingZone | null;
  onDismiss: () => void;
}) {
  const { lat: aLat, lng: aLng } = altZone
    ? formatCoords(altZone.google_maps_coordinates)
    : { lat: "", lng: "" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(21,32,96,0.55)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: "#ffffff",
        border: "1.5px solid #fca5a5",
        borderRadius: 24, padding: "32px 28px", maxWidth: 440, width: "100%",
        boxShadow: "0 20px 50px rgba(21,32,96,0.18)",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🚫</div>
        <h2 style={{ margin: "0 0 8px", color: "#dc2626", fontSize: 20, fontWeight: 800, textAlign: "center", fontFamily: "Georgia, serif" }}>
          {fullZone.zone_name} is Full
        </h2>
        {altZone ? (
          <>
            <p style={{ color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 1.6, margin: "0 0 24px" }}>
              We have dynamically rerouted your directions to{" "}
              <b style={{ color: C.green }}>{altZone.zone_name}</b>{" "}
              ({altZone.available_slots} slots available).
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${aLat},${aLng}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", width: "100%", padding: "13px 0", borderRadius: 12,
                background: `linear-gradient(135deg, ${C.green}, #218838)`,
                color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 14,
                textDecoration: "none", marginBottom: 12, boxShadow: "0 4px 16px rgba(40,167,69,0.3)",
              }}
            >
              🚗 Drive to {altZone.zone_name}
            </a>
          </>
        ) : (
          <p style={{ color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 1.6, margin: "0 0 24px" }}>
            All parking zones are currently full. Please check back shortly.
          </p>
        )}
        <button
          onClick={onDismiss}
          style={{
            display: "block", width: "100%", padding: "11px 0", borderRadius: 12,
            background: "#f3f4f6", border: "1px solid #d1d5db",
            color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Zone Card ─────────────────────────────────────────────
function ZoneCard({
  zone,
  onSelect,
}: {
  zone: ParkingZone;
  onSelect: (z: ParkingZone) => void;
}) {
  const [hover, setHover] = useState(false);
  const s = getZoneStatus(zone);
  const { lat, lng } = formatCoords(zone.google_maps_coordinates);
  const walkUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${TEMPLE_LAT},${TEMPLE_LNG}&travelmode=walking`;
  const driveUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const isFull = zone.available_slots <= 0 || zone.pct_full >= 100;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.white,
        borderRadius: 20,
        border: `1.5px solid ${hover ? s.color : C.border}`,
        padding: "24px 22px",
        boxShadow: hover ? `0 12px 30px rgba(31,47,140,0.12)` : "0 4px 18px rgba(31,47,140,0.03)",
        transition: "all 0.28s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -16, right: -16, width: 90, height: 90,
        borderRadius: "50%", background: s.color, opacity: hover ? 0.08 : 0.04,
        filter: "blur(28px)", pointerEvents: "none", transition: "opacity 0.3s",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          {/* Status chip */}
          <span style={{
            display: "inline-block", padding: "3px 11px", borderRadius: 20,
            background: `${s.color}15`, border: `1px solid ${s.color}35`,
            color: s.color, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
            textTransform: "uppercase", marginBottom: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dotColor, display: "inline-block", marginRight: 5, animation: isFull ? undefined : "blink 1.5s infinite" }} />
            {s.label}
          </span>
          <h3 style={{ margin: "0 0 4px", color: C.darkBlue, fontSize: 16, fontWeight: 800, lineHeight: 1.3, fontFamily: "Georgia, serif" }}>{zone.zone_name}</h3>
          <span style={{
            display: "inline-block", fontSize: 11, color: "#4b5563",
            background: "#f3f4f6", borderRadius: 8, padding: "2px 8px", fontWeight: 500
          }}>
            {VEHICLE_LABEL[zone.allowed_vehicle_type] ?? zone.allowed_vehicle_type}
          </span>
        </div>
        <ArcGauge pct={zone.pct_full} color={s.color} />
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6,
        background: C.cream, borderRadius: 10, padding: "10px 6px", marginBottom: 2,
      }}>
        {[
          { label: "Physical Cap", value: zone.total_physical_capacity, color: C.darkText },
          { label: "Buffer Limit", value: zone.system_capacity_limit, color: "#6d28d9" },
          { label: "Available", value: zone.available_slots, color: s.color },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Slot bar */}
      <SlotBar used={zone.current_occupancy} limit={zone.system_capacity_limit} color={s.color} />

      {/* Barrier badge */}
      {zone.barrier_state === "forced_down" && (
        <div style={{
          marginTop: 10, padding: "5px 12px", borderRadius: 8,
          background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)",
          color: "#dc2626", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          🔴 Barrier Forced Down
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          id={`zone-${zone.zone_id}-drive`}
          onClick={() => {
            if (isFull) { onSelect(zone); return; }
            window.open(driveUrl, "_blank");
          }}
          style={{
            flex: 1, minWidth: 120, padding: "10px 12px", borderRadius: 10,
            background: isFull ? "rgba(220,38,38,0.08)" : `linear-gradient(135deg,${s.gradFrom},${s.gradTo})`,
            border: isFull ? "1px solid rgba(220,38,38,0.25)" : "none",
            color: isFull ? "#dc2626" : "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: isFull ? "none" : `0 4px 12px ${s.ring}`,
          }}
          onMouseEnter={e => { if (!isFull) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
        >
          🚗 Drive to Parking
        </button>

        <a
          id={`zone-${zone.zone_id}-walk`}
          href={walkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, minWidth: 120, padding: "10px 12px", borderRadius: 10,
            background: "#f3f4f6", border: "1px solid #d1d5db",
            color: "#374151", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif",
            textDecoration: "none", textAlign: "center", display: "block",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#e5e7eb"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#f3f4f6"; }}
        >
          🚶 Walk to Temple
        </a>
      </div>

      {/* Last calibrated */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.dotColor, animation: "blink 1.5s infinite" }} />
        <span style={{ color: C.muted, fontSize: 10 }}>
          Calibrated: {new Date(zone.last_calibrated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ── Summary Banner ────────────────────────────────────────
function SummaryBanner({ zones }: { zones: ParkingZone[] }) {
  const totalPhysical = zones.reduce((s, z) => s + z.total_physical_capacity, 0);
  const totalBuffer = zones.reduce((s, z) => s + z.system_capacity_limit, 0);
  const totalOccupied = zones.reduce((s, z) => s + z.current_occupancy, 0);
  const totalAvailable = zones.reduce((s, z) => s + z.available_slots, 0);
  const overallPct = totalBuffer > 0 ? Math.round((totalOccupied / totalBuffer) * 100) : 0;
  const pctColor = overallPct >= 95 ? "#fca5a5" : overallPct >= 80 ? "#fde047" : "#86efac";

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.darkBlue} 0%, #152060 100%)`,
      borderRadius: 20, padding: "26px 28px", marginBottom: 28,
      boxShadow: "0 6px 24px rgba(31,47,140,0.15)",
      display: "flex", flexWrap: "wrap", gap: 20,
      alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: "Georgia, serif" }}>Overall Parking Status</h2>
        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          Loop Detector System · Real-time across all zones
        </p>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {[
          { label: "Physical Cap", value: totalPhysical, color: "#c084fc" },
          { label: "Buffer Limit", value: totalBuffer, color: "rgba(255,255,255,0.85)" },
          { label: "Occupied", value: totalOccupied, color: "#fca5a5" },
          { label: "Available", value: totalAvailable, color: "#86efac" },
          { label: "Occupancy", value: `${overallPct}%`, color: pctColor },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "Georgia, serif" }}>{value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export function ParkingPage() {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedFullZone, setSelectedFullZone] = useState<ParkingZone | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initial fetch
  const fetchData = useCallback(async () => {
    try {
      const data = await getParkingZones();
      setZones(data);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Unable to load parking data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket live updates
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => { setWsConnected(true); };
      ws.onclose = () => {
        setWsConnected(false);
        // Reconnect after 4 seconds
        setTimeout(connect, 4000);
      };
      ws.onerror = () => { ws.close(); };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === "parking_count_update") {
            setZones(prev => prev.map(z =>
              z.zone_id === msg.zone_id
                ? {
                    ...z,
                    current_occupancy: msg.current_occupancy,
                    available_slots: msg.available_slots,
                    pct_full: msg.pct_full,
                  }
                : z
            ));
            setLastRefresh(new Date());
          }
        } catch { /* ignore malformed frames */ }
      };
    };

    fetchData();
    connect();

    // Fallback poll every 30 s in case WS is unavailable
    const poll = setInterval(fetchData, 30_000);
    return () => {
      clearInterval(poll);
      wsRef.current?.close();
    };
  }, [fetchData]);

  const activeZones = zones.filter(z => z.is_active);

  // Find best alternate zone when a full zone is selected
  const findAltZone = (fullZone: ParkingZone) =>
    activeZones.find(z => z.zone_id !== fullZone.zone_id && z.available_slots > 0) ?? null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .zone-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:20px; }
        @media(max-width:640px){ .zone-grid{grid-template-columns:1fr;} }
      `}</style>

      {/* Full-zone reroute overlay */}
      {selectedFullZone && (
        <RerouteOverlay
          fullZone={selectedFullZone}
          altZone={findAltZone(selectedFullZone)}
          onDismiss={() => setSelectedFullZone(null)}
        />
      )}

      <div style={{
        minHeight: "100vh",
        backgroundColor: C.cream,
        fontFamily: "'Inter', sans-serif",
        padding: "40px 20px 60px",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>

          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{
              width: 70, height: 70, margin: "0 auto 18px",
              background: `linear-gradient(135deg, #F7941D, #F26A21)`,
              borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, boxShadow: "0 8px 28px rgba(247,148,29,0.35)",
              animation: "float 4s ease-in-out infinite",
            }}>🅿️</div>

            <h1 style={{
              margin: 0, fontSize: "clamp(26px,5vw,42px)", fontWeight: 900, color: C.darkBlue,
              letterSpacing: -1, fontFamily: "Georgia, serif"
            }}>
              Zonal Parking System
            </h1>
            <p style={{ margin: "10px 0 0", color: C.muted, fontSize: 14, lineHeight: 1.7 }}>
              Live occupancy via buried loop detectors &amp; boom barriers · Khatu Shyam Ji Temple
            </p>

            {/* Status row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              {/* WS indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 30, padding: "6px 14px" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: wsConnected ? C.green : "#f87171",
                  animation: wsConnected ? "blink 1.5s infinite" : undefined,
                }} />
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 500 }}>
                  {wsConnected ? "Live Connected" : "Polling mode"}
                </span>
              </div>

              <button
                id="parking-refresh-btn"
                onClick={fetchData}
                style={{
                  padding: "7px 20px", borderRadius: 30,
                  background: `linear-gradient(90deg, #F7941D 0%, #F26A21 100%)`,
                  color: "#fff", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: "Georgia, serif",
                  boxShadow: "0 4px 12px rgba(247,148,29,0.35)",
                }}
              >
                🔄 Refresh
              </button>

              <span style={{ color: C.muted, fontSize: 11, fontWeight: 500 }}>
                Last: {lastRefresh.toLocaleTimeString("en-IN")}
              </span>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 46, height: 46, margin: "0 auto 14px", border: "4px solid #E5E7EB", borderTop: `4px solid ${C.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: C.muted }}>Fetching zone data…</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 12, padding: "18px 22px", marginBottom: 22, color: "#dc2626",
              textAlign: "center", fontWeight: 600, fontSize: 14
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && activeZones.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              background: "#ffffff", borderRadius: 18,
              border: `1px dashed ${C.border}`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🏗️</div>
              <h3 style={{ color: C.darkBlue, fontWeight: 800 }}>No Parking Zones Configured</h3>
              <p style={{ color: C.muted }}>Zones will appear once configured by the admin team.</p>
            </div>
          )}

          {/* ── Content ── */}
          {!loading && activeZones.length > 0 && (
            <>
              <SummaryBanner zones={activeZones} />
              <div className="zone-grid">
                {activeZones.map(zone => (
                  <ZoneCard
                    key={zone.zone_id}
                    zone={zone}
                    onSelect={setSelectedFullZone}
                  />
                ))}
              </div>

              {/* Legend */}
              <div style={{
                marginTop: 36, background: "#ffffff", borderRadius: 14,
                border: `1px solid ${C.border}`, padding: "14px 22px",
                display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center",
              }}>
                <span style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>LEGEND</span>
                {[
                  { color: C.green, label: "Open  (> 20% free)" },
                  { color: C.orange, label: "Filling Fast  (5–20% free)" },
                  { color: "#dc2626", label: "Full  (≤ 5% free)" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
                    <span style={{ color: C.darkText, fontSize: 12, fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* System notice */}
              <div style={{
                marginTop: 16,
                background: "rgba(31,47,140,0.06)", border: "1px solid rgba(31,47,140,0.18)",
                borderRadius: 12, padding: "14px 18px",
                color: C.darkText, fontSize: 12, lineHeight: 1.7,
              }}>
                ℹ️ Occupancy is tracked by <b style={{ color: C.darkBlue }}>buried inductive loop detectors</b> at each gate.
                Counts update in real-time via WebSocket. Capacity limits include a 5% bad-parking safety buffer.
                Follow on-site attendant guidance for final authority.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
