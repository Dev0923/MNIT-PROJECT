import { useEffect, useState, useRef } from "react";
import {
  X, User, Phone, Mail, Calendar, Clock, ShieldCheck,
  Ticket, HandCoins, Building2, Car,
  LogOut, Loader2, IndianRupee, MapPin, BadgeCheck,
  AlertCircle, CheckCircle2, Timer, RefreshCw,
  ShieldAlert, Utensils, Activity, Search, Package,
  FileText, Siren, Hash
} from "lucide-react";

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
  bg: "#F8F9FF",
  red: "#DC2626",
};

const API_BASE = "http://localhost:8000";

type Tab = "overview" | "bookings" | "donations" | "accommodation" | "vehicles" | "sos" | "bhandara" | "medical" | "lost_found";

interface ProfileData {
  user: {
    id: number;
    name: string | null;
    phone: string | null;
    email: string | null;
    is_admin: boolean;
    receive_updates: boolean;
    created_at: string | null;
    last_login: string | null;
  };
  statistics: {
    darshan: number;
    donations: number;
    stays: number;
    bhandara: number;
    medical: number;
    vehicles: number;
    sos: number;
    lostFound: number;
  };
  activities: Array<{
    id: number;
    activity_type: string;
    title: string;
    description: string | null;
    created_at: string | null;
  }>;
  bookings: Array<{
    id: number;
    booking_id: string;
    booking_type: string;
    date: string | null;
    phone: string;
    city: string;
    individual_details: any;
    group_details: any;
    status: string;
    created_at: string | null;
  }>;
  donations: Array<{
    id: number;
    donation_id: string;
    fullName: string;
    purpose: string;
    amount: number;
    want80G: boolean;
    created_at: string | null;
  }>;
  accommodation_bookings: Array<{
    id: number;
    booking_id: string;
    property_name: string;
    room_type: string;
    check_in: string | null;
    check_out: string | null;
    adults: number;
    children: number;
    total_amount: number;
    status: string;
    created_at: string | null;
  }>;
  vehicles: Array<{
    id: number;
    plate_number: string;
    vehicle_type: string;
    model: string | null;
    created_at: string | null;
    permits: Array<{
      id: number;
      permit_type: string;
      status: string;
      valid_from: string | null;
      valid_to: string | null;
      allowed_zones: string[];
    }>;
  }>;
  sos_alerts: Array<{
    id: number;
    status: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string | null;
  }>;
  bhandara_bookings: Array<{
    id: number;
    spot_id: number;
    spot_name: string;
    start_time: string | null;
    end_time: string | null;
    duration_hours: number;
    org_name: string;
    expected_meals: number;
    purpose: string;
    status: string;
    created_at: string | null;
  }>;
  general_permissions: Array<{
    id: number;
    permission_code: string;
    name: string;
    type: string;
    subtype: string;
    purpose: string;
    date: string;
    status: string;
    created_at: string | null;
  }>;
  lost_items: Array<{
    id: number;
    category: string;
    date_lost: string | null;
    location: string;
    description: string | null;
    contact_name: string;
    contact_phone: string;
    status: string;
    created_at: string | null;
  }>;
  lost_persons: Array<{
    id: number;
    name: string;
    age: number;
    gender: string | null;
    last_seen_location: string;
    last_seen_time: string | null;
    contact_name: string;
    contact_phone: string;
    status: string;
    created_at: string | null;
  }>;
}

function getInitials(name: string | null, phone: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (phone) return phone.slice(-2);
  return "U";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUpcoming(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) > new Date();
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = "#E5E5E5",
    color = C.muted,
    icon = <AlertCircle size={11} />;
  if (s === "confirmed" || s === "approved" || s === "active" || s === "upcoming") {
    bg = "#DCFCE7";
    color = "#166534";
    icon = <CheckCircle2 size={11} />;
  } else if (s === "pending") {
    bg = "#FEF3C7";
    color = "#92400E";
    icon = <Timer size={11} />;
  } else if (s === "cancelled" || s === "rejected" || s === "denied") {
    bg = "#FEE2E2";
    color = C.red;
    icon = <X size={11} />;
  } else if (s === "completed") {
    bg = "#EFF6FF";
    color = "#1e40af";
    icon = <BadgeCheck size={11} />;
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: bg, color }}
    >
      {icon} {status}
    </span>
  );
}

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchProfile = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const errText = await r.text().catch(() => "");
          console.error(`Profile API Error (${r.status}):`, errText);
          throw new Error(`Server returned ${r.status}`);
        }
        return r.json();
      })
      .then((data) => setProfileData(data))
      .catch((err) => {
        console.error("Profile Fetch Exception:", err);
        setError(err.message || "Could not load profile");
      })
      .finally(() => setLoading(false));
  };

  // Action handlers
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this Darshan booking?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to cancel booking");
      }
      alert("Darshan booking cancelled successfully.");
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Error cancelling booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelStay = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this stay booking?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API_BASE}/api/accommodation/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to cancel stay");
      }
      alert("Stay booking cancelled successfully.");
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Error cancelling stay booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBhandaraSpot = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this Bhandara spot booking?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/bhandara/bookings/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to cancel Bhandara booking");
      }
      alert("Bhandara booking cancelled successfully.");
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Error cancelling Bhandara booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelGeneralPermission = async (code: string) => {
    if (!window.confirm("Are you sure you want to cancel this application request?")) return;
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    setActionLoading(code);
    try {
      const res = await fetch(`${API_BASE}/api/general-permissions/applications/${code}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to cancel application");
      }
      alert("Application cancelled successfully.");
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Error cancelling application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateSOS = async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    
    let lat: number | null = null;
    let lng: number | null = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        console.warn("Geolocation prompt failed or timed out:", e);
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/alerts/sos/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to activate SOS");
      }
      alert("EMERGENCY DISTRESS SOS ACTIVATED! The Temple Control Room has been notified with your coordinates.");
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Could not trigger SOS alert");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSOS = async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/alerts/sos/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to cancel SOS signal");
      alert("Active SOS signals cancelled.");
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Could not cancel SOS signal");
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data when panel opens
  useEffect(() => {
    if (!isOpen) return;
    if (!profileData) fetchProfile();
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const u = profileData?.user;
  const initials = getInitials(u?.name ?? null, u?.phone ?? null);

  const TABS: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    { key: "overview", label: "Overview", icon: <User size={14} /> },
    {
      key: "bookings",
      label: "Darshan",
      icon: <Ticket size={14} />,
      count: profileData?.bookings.length,
    },
    {
      key: "donations",
      label: "Donations",
      icon: <HandCoins size={14} />,
      count: profileData?.donations.length,
    },
    {
      key: "accommodation",
      label: "Stay",
      icon: <Building2 size={14} />,
      count: profileData?.accommodation_bookings.length,
    },
    {
      key: "vehicles",
      label: "Vehicles",
      icon: <Car size={14} />,
      count: profileData?.vehicles.length,
    },
    {
      key: "sos",
      label: "SOS",
      icon: <ShieldAlert size={14} />,
      count: profileData?.sos_alerts.filter(s => s.status === "Activated").length,
    },
    {
      key: "bhandara",
      label: "Bhandara",
      icon: <Utensils size={14} />,
      count: (profileData?.bhandara_bookings.length ?? 0) + (profileData?.general_permissions.filter(gp => gp.type.toLowerCase() === "bandhara").length ?? 0),
    },
    {
      key: "medical",
      label: "Medical",
      icon: <Activity size={14} />,
      count: profileData?.general_permissions.filter(gp => gp.type.toLowerCase() === "medical").length,
    },
    {
      key: "lost_found",
      label: "Lost & Found",
      icon: <Search size={14} />,
      count: (profileData?.lost_items.length ?? 0) + (profileData?.lost_persons.length ?? 0),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(15, 20, 50, 0.45)",
          backdropFilter: "blur(2px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full z-[100] flex flex-col"
        style={{
          width: "min(420px, 95vw)",
          backgroundColor: C.white,
          boxShadow: "-8px 0 40px rgba(31,47,140,0.15)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          borderLeft: `3px solid ${C.orange}`,
        }}
      >
        {/* ── Header ─────────────────────── */}
        <div
          className="flex-shrink-0 px-5 pt-5 pb-4"
          style={{
            background: `linear-gradient(135deg, ${C.darkBlue} 0%, #2d46c4 100%)`,
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Devotee Profile
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${C.orange}, #fbbf24)`,
                color: C.white,
                boxShadow: "0 4px 16px rgba(247,148,29,0.4)",
              }}
            >
              {loading ? (
                <Loader2
                  size={24}
                  className="animate-spin"
                  style={{ color: C.white }}
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="font-bold text-base truncate"
                style={{ color: C.white }}
              >
                {u?.name || "Devotee"}
              </div>
              <div
                className="text-xs truncate mt-0.5"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {u?.phone || u?.email || "—"}
              </div>
              {u?.is_admin && (
                <span
                  className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: C.orange, color: C.white }}
                >
                  <ShieldCheck size={10} /> Admin
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          {profileData && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                {
                  label: "Darshan",
                  val: profileData.statistics?.darshan ?? profileData.bookings.length,
                  color: "#60a5fa",
                  tab: "bookings" as Tab,
                },
                {
                  label: "Donations",
                  val: profileData.statistics?.donations ?? profileData.donations.length,
                  color: "#34d399",
                  tab: "donations" as Tab,
                },
                {
                  label: "Stays",
                  val: profileData.statistics?.stays ?? profileData.accommodation_bookings.length,
                  color: "#f472b6",
                  tab: "accommodation" as Tab,
                },
                {
                  label: "Bhandara",
                  val: profileData.statistics?.bhandara ?? (profileData.bhandara_bookings.length + profileData.general_permissions.filter(gp => gp.type.toLowerCase() === "bandhara").length),
                  color: "#fb923c",
                  tab: "bhandara" as Tab,
                },
                {
                  label: "Medical",
                  val: profileData.statistics?.medical ?? profileData.general_permissions.filter(gp => gp.type.toLowerCase() === "medical").length,
                  color: "#a78bfa",
                  tab: "medical" as Tab,
                },
                {
                  label: "Vehicles",
                  val: profileData.statistics?.vehicles ?? profileData.vehicles.length,
                  color: C.orange,
                  tab: "vehicles" as Tab,
                },
                {
                  label: "SOS",
                  val: profileData.statistics?.sos ?? profileData.sos_alerts.length,
                  color: "#f87171",
                  tab: "sos" as Tab,
                },
                {
                  label: "Lost/Found",
                  val: profileData.statistics?.lostFound ?? (profileData.lost_items.length + profileData.lost_persons.length),
                  color: "#facc15",
                  tab: "lost_found" as Tab,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.tab)}
                  className="rounded-xl p-2 text-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: activeTab === item.tab ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    border: activeTab === item.tab ? `1px solid ${item.color}55` : "1px solid transparent",
                  }}
                  title={`View ${item.label} history`}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: item.color }}
                  >
                    {item.val}
                  </div>
                  <div
                    className="text-[9px] font-medium"
                    style={{ color: activeTab === item.tab ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}
                  >
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ──────────────────────── */}
        <div
          className="flex-shrink-0 flex overflow-x-auto gap-0 px-1 py-1.5 border-b"
          style={{ borderColor: C.border, backgroundColor: C.bg }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-[11px] font-semibold transition-all flex-shrink-0"
              style={{
                backgroundColor:
                  activeTab === tab.key ? C.white : "transparent",
                color: activeTab === tab.key ? C.darkBlue : C.muted,
                boxShadow:
                  activeTab === tab.key
                    ? "0 1px 4px rgba(0,0,0,0.10)"
                    : "none",
              }}
            >
              <span
                style={{
                  color: activeTab === tab.key ? C.orange : C.muted,
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{
                    backgroundColor:
                      activeTab === tab.key ? C.orange : "#E5E5E5",
                    color: activeTab === tab.key ? C.white : C.muted,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ───────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: C.orange }}
              />
              <p className="text-sm" style={{ color: C.muted }}>
                Loading your profile...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle size={32} style={{ color: C.red }} />
              <p className="text-sm font-medium" style={{ color: C.darkText }}>
                {error}
              </p>
              <button
                onClick={fetchProfile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: C.orange }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && profileData && (
            <>
              {/* ── OVERVIEW TAB ── */}
              {activeTab === "overview" && (
                <div className="flex flex-col gap-3">
                  <SectionCard
                    title="Personal Information"
                    icon={<User size={14} color={C.orange} />}
                  >
                    <InfoRow
                      icon={<User size={13} />}
                      label="Full Name"
                      value={u?.name || "Not set"}
                    />
                    <InfoRow
                      icon={<Phone size={13} />}
                      label="Phone"
                      value={u?.phone || "Not set"}
                    />
                    <InfoRow
                      icon={<Mail size={13} />}
                      label="Email"
                      value={u?.email || "Not set"}
                    />
                  </SectionCard>

                  <SectionCard
                    title="Account Details"
                    icon={<ShieldCheck size={14} color={C.orange} />}
                  >
                    <InfoRow
                      icon={<Calendar size={13} />}
                      label="Member Since"
                      value={fmtDate(u?.created_at ?? null)}
                    />
                    <InfoRow
                      icon={<Clock size={13} />}
                      label="Last Login"
                      value={fmtDateTime(u?.last_login ?? null)}
                    />
                    <InfoRow
                      icon={<BadgeCheck size={13} />}
                      label="Account Type"
                      value={u?.is_admin ? "Administrator" : "Devotee"}
                      highlight={u?.is_admin}
                    />
                  </SectionCard>

                  {/* Upcoming darshan */}
                  {profileData.bookings.filter((b) => isUpcoming(b.date))
                    .length > 0 && (
                    <SectionCard
                      title="Upcoming Darshan"
                      icon={<Ticket size={14} color={C.green} />}
                    >
                      {profileData.bookings
                        .filter((b) => isUpcoming(b.date))
                        .slice(0, 3)
                        .map((b) => (
                          <div
                            key={b.booking_id}
                            className="flex items-center justify-between py-2.5 border-b last:border-0"
                            style={{ borderColor: C.border }}
                          >
                            <div>
                              <p
                                className="text-xs font-bold"
                                style={{ color: C.darkText }}
                              >
                                {b.booking_id}
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: C.muted }}
                              >
                                {fmtDateTime(b.date)} · {b.city}
                              </p>
                            </div>
                            <StatusBadge status="Upcoming" />
                          </div>
                        ))}
                    </SectionCard>
                  )}

                  {/* Upcoming stays */}
                  {profileData.accommodation_bookings.filter(
                    (ab) => ab.status === "Confirmed" && isUpcoming(ab.check_in)
                  ).length > 0 && (
                    <SectionCard
                      title="Upcoming Stay"
                      icon={<Building2 size={14} color={C.pink} />}
                    >
                      {profileData.accommodation_bookings
                        .filter(
                          (ab) =>
                            ab.status === "Confirmed" && isUpcoming(ab.check_in)
                        )
                        .slice(0, 2)
                        .map((ab) => (
                          <div
                            key={ab.booking_id}
                            className="flex items-center justify-between py-2.5 border-b last:border-0"
                            style={{ borderColor: C.border }}
                          >
                            <div>
                              <p
                                className="text-xs font-bold truncate max-w-[180px]"
                                style={{ color: C.darkText }}
                              >
                                {ab.property_name}
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: C.muted }}
                              >
                                {fmtDate(ab.check_in)} → {fmtDate(ab.check_out)}
                              </p>
                            </div>
                            <StatusBadge status={ab.status} />
                          </div>
                        ))}
                    </SectionCard>
                  )}

                  {/* Recent Activity Timeline */}
                  <SectionCard
                    title="Recent Activity"
                    icon={<Activity size={14} color={C.orange} />}
                  >
                    {(!profileData.activities || profileData.activities.length === 0) ? (
                      <div className="flex flex-col items-center py-4 gap-2" style={{ color: C.muted }}>
                        <Activity size={22} />
                        <p className="text-xs">No activity recorded yet. Start booking a service!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0">
                        {profileData.activities.slice(0, 10).map((act, i) => {
                          const typeColors: Record<string, string> = {
                            "Darshan Booking": "#60a5fa",
                            "Donation": "#34d399",
                            "Accommodation": "#f472b6",
                            "Bhandara": "#fb923c",
                            "Permission": "#a78bfa",
                            "Vehicle Registration": C.orange,
                            "Vehicle Permit": C.orange,
                            "SOS": "#f87171",
                            "Lost Item": "#facc15",
                            "Lost Person": "#facc15",
                          };
                          const dotColor = typeColors[act.activity_type] || C.muted;
                          return (
                            <div key={act.id} className="flex gap-3 py-2 border-b last:border-0" style={{ borderColor: C.border }}>
                              <div className="flex flex-col items-center gap-1 pt-1">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                                {i < (Math.min(profileData.activities.length, 10) - 1) && (
                                  <div className="w-px flex-1 min-h-[16px]" style={{ backgroundColor: C.border }} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pb-1">
                                <p className="text-xs font-semibold truncate" style={{ color: C.darkText }}>{act.title}</p>
                                {act.description && (
                                  <p className="text-[10px] truncate mt-0.5" style={{ color: C.muted }}>{act.description}</p>
                                )}
                                <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{fmtDateTime(act.created_at)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ── BOOKINGS TAB ── */}
              {activeTab === "bookings" && (
                <div className="flex flex-col gap-2">
                  {profileData.bookings.length === 0 ? (
                    <EmptyState
                      icon={<Ticket size={28} />}
                      text="No Darshan bookings yet"
                    />
                  ) : (
                    profileData.bookings.map((b) => (
                      <div
                        key={b.booking_id}
                        className="rounded-xl p-3 border"
                        style={{
                          backgroundColor: C.white,
                          borderColor: isUpcoming(b.date)
                            ? C.green
                            : C.border,
                          boxShadow: isUpcoming(b.date)
                            ? "0 0 0 1px #28A74530"
                            : "none",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p
                              className="text-xs font-bold"
                              style={{ color: C.darkBlue }}
                            >
                              {b.booking_id}
                            </p>
                            <p
                              className="text-[10px] mt-0.5 capitalize font-medium"
                              style={{ color: C.orange }}
                            >
                              {b.booking_type} booking
                            </p>
                          </div>
                          <StatusBadge
                            status={isUpcoming(b.date) ? "Upcoming" : "Completed"}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <InfoRowSmall
                            icon={<Calendar size={11} />}
                            label="Date"
                            value={fmtDateTime(b.date)}
                          />
                          <InfoRowSmall
                            icon={<MapPin size={11} />}
                            label="City"
                            value={b.city}
                          />
                          {b.booking_type === "group" && b.group_details && (
                            <InfoRowSmall
                              icon={<User size={11} />}
                              label="Group Size"
                              value={`${b.group_details.count} people`}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── DONATIONS TAB ── */}
              {activeTab === "donations" && (
                <div className="flex flex-col gap-2">
                  {profileData.donations.length === 0 ? (
                    <EmptyState
                      icon={<HandCoins size={28} />}
                      text="No donations recorded yet"
                    />
                  ) : (
                    <>
                      {/* Total donated summary card */}
                      <div
                        className="rounded-xl p-4 text-white"
                        style={{
                          background: `linear-gradient(135deg, ${C.green}, #20c997)`,
                          boxShadow: "0 4px 16px rgba(40,167,69,0.25)",
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold opacity-70 uppercase tracking-wider"
                        >
                          Total Donated
                        </p>
                        <p className="text-2xl font-bold mt-1 flex items-center gap-1">
                          <IndianRupee size={18} />
                          {profileData.donations
                            .reduce((sum, d) => sum + d.amount, 0)
                            .toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] opacity-70 mt-0.5">
                          {profileData.donations.length} donation(s) · Jai Shyam Baba 🙏
                        </p>
                      </div>

                      {profileData.donations.map((d) => (
                        <div
                          key={d.donation_id}
                          className="rounded-xl p-3 border"
                          style={{
                            backgroundColor: C.white,
                            borderColor: C.border,
                          }}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div>
                              <p
                                className="text-xs font-bold"
                                style={{ color: C.darkBlue }}
                              >
                                {d.purpose}
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: C.muted }}
                              >
                                {d.donation_id}
                              </p>
                            </div>
                            <p
                              className="text-sm font-bold flex items-center"
                              style={{ color: C.green }}
                            >
                              <IndianRupee size={12} />
                              {d.amount.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p
                              className="text-[10px]"
                              style={{ color: C.muted }}
                            >
                              {fmtDate(d.created_at)}
                            </p>
                            {d.want80G && (
                              <span
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: "#DCFCE7",
                                  color: "#166534",
                                }}
                              >
                                80G Eligible
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ── ACCOMMODATION TAB ── */}
              {activeTab === "accommodation" && (
                <div className="flex flex-col gap-2">
                  {profileData.accommodation_bookings.length === 0 ? (
                    <EmptyState
                      icon={<Building2 size={28} />}
                      text="No accommodation bookings yet"
                    />
                  ) : (
                    profileData.accommodation_bookings.map((ab) => (
                      <div
                        key={ab.booking_id}
                        className="rounded-xl p-3 border"
                        style={{
                          backgroundColor: C.white,
                          borderColor: C.border,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <p
                              className="text-xs font-bold truncate"
                              style={{ color: C.darkBlue }}
                            >
                              {ab.property_name}
                            </p>
                            <p
                              className="text-[10px] font-medium mt-0.5"
                              style={{ color: C.orange }}
                            >
                              {ab.room_type}
                            </p>
                          </div>
                          <StatusBadge status={ab.status} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <InfoRowSmall
                            icon={<Calendar size={11} />}
                            label="Check-in"
                            value={fmtDate(ab.check_in)}
                          />
                          <InfoRowSmall
                            icon={<Calendar size={11} />}
                            label="Check-out"
                            value={fmtDate(ab.check_out)}
                          />
                          <InfoRowSmall
                            icon={<User size={11} />}
                            label="Guests"
                            value={`${ab.adults} adults${ab.children > 0 ? `, ${ab.children} children` : ""}`}
                          />
                          <InfoRowSmall
                            icon={<IndianRupee size={11} />}
                            label="Amount"
                            value={`₹${ab.total_amount.toLocaleString("en-IN")}`}
                          />
                        </div>
                        <p
                          className="text-[9px] mt-2"
                          style={{ color: C.muted }}
                        >
                          {ab.booking_id}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── VEHICLES TAB ── */}
              {activeTab === "vehicles" && (
                <div className="flex flex-col gap-2">
                  {profileData.vehicles.length === 0 ? (
                    <EmptyState
                      icon={<Car size={28} />}
                      text="No registered vehicles yet"
                    />
                  ) : (
                    profileData.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-xl border overflow-hidden"
                        style={{ borderColor: C.border }}
                      >
                        {/* Vehicle header */}
                        <div
                          className="flex items-center gap-3 p-3"
                          style={{ backgroundColor: C.bg }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${C.darkBlue}15` }}
                          >
                            <Car size={18} color={C.darkBlue} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-bold"
                              style={{ color: C.darkBlue }}
                            >
                              {v.plate_number}
                            </p>
                            <p
                              className="text-[10px]"
                              style={{ color: C.muted }}
                            >
                              {v.vehicle_type}
                              {v.model ? ` · ${v.model}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Permits */}
                        {v.permits.length === 0 ? (
                          <div className="px-3 py-2">
                            <p className="text-[10px]" style={{ color: C.muted }}>
                              No parking permits issued
                            </p>
                          </div>
                        ) : (
                          v.permits.map((p) => (
                            <div
                              key={p.id}
                              className="px-3 py-2 border-t"
                              style={{ borderColor: C.border }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p
                                  className="text-xs font-semibold"
                                  style={{ color: C.darkText }}
                                >
                                  {p.permit_type} Permit
                                </p>
                                <StatusBadge status={p.status} />
                              </div>
                              <p
                                className="text-[10px]"
                                style={{ color: C.muted }}
                              >
                                Valid: {fmtDate(p.valid_from)} → {fmtDate(p.valid_to)}
                              </p>
                              {p.allowed_zones?.length > 0 && (
                                <p
                                  className="text-[9px] mt-1"
                                  style={{ color: C.muted }}
                                >
                                  Zones: {p.allowed_zones.join(", ")}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── SOS TAB ── */}
              {activeTab === "sos" && (
                <div className="flex flex-col gap-3">
                  {/* SOS Action Buttons */}
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#fecaca" }}>
                    <div
                      className="px-4 py-3"
                      style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)" }}
                    >
                      <p className="text-white font-bold text-sm flex items-center gap-2">
                        <Siren size={14} /> Emergency SOS
                      </p>
                      <p className="text-red-200 text-[10px] mt-0.5">
                        Press only in genuine emergency situations
                      </p>
                    </div>
                    <div className="p-3 flex gap-2" style={{ backgroundColor: "#fff5f5" }}>
                      <button
                        onClick={handleActivateSOS}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: C.red, boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }}
                      >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
                        Activate SOS
                      </button>
                      <button
                        onClick={handleCancelSOS}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: "#E5E5E5", color: C.darkText }}
                      >
                        <X size={12} /> Cancel SOS
                      </button>
                    </div>
                  </div>

                  {/* SOS History */}
                  <p className="text-[11px] font-bold uppercase tracking-wider px-1" style={{ color: C.muted }}>
                    Alert History
                  </p>
                  {profileData.sos_alerts.length === 0 ? (
                    <EmptyState icon={<ShieldAlert size={28} />} text="No SOS alerts triggered yet" />
                  ) : (
                    profileData.sos_alerts.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl p-3 border"
                        style={{
                          backgroundColor: C.white,
                          borderColor: s.status === "Activated" ? C.red : C.border,
                          boxShadow: s.status === "Activated" ? "0 0 0 1px #dc262630" : "none",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: s.status === "Activated" ? "#FEE2E2" : "#F3F4F6",
                              }}
                            >
                              <Siren
                                size={14}
                                color={s.status === "Activated" ? C.red : C.muted}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color: C.darkBlue }}>
                                SOS Alert #{s.id}
                              </p>
                              <p className="text-[10px]" style={{ color: C.muted }}>
                                {fmtDateTime(s.created_at)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>
                        {(s.latitude || s.longitude) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin size={10} color={C.muted} />
                            <p className="text-[10px]" style={{ color: C.muted }}>
                              {s.latitude?.toFixed(5)}, {s.longitude?.toFixed(5)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── BHANDARA TAB ── */}
              {activeTab === "bhandara" && (() => {
                const spotBookings = profileData.bhandara_bookings;
                const campPermissions = profileData.general_permissions.filter(
                  (gp) => gp.type.toLowerCase() === "bandhara"
                );
                return (
                  <div className="flex flex-col gap-3">
                    {/* Spot Bookings Section */}
                    <p className="text-[11px] font-bold uppercase tracking-wider px-1" style={{ color: C.muted }}>
                      Bhandara Spot Bookings
                    </p>
                    {spotBookings.length === 0 ? (
                      <div
                        className="rounded-xl p-4 text-center"
                        style={{ backgroundColor: C.bg, border: `1px dashed ${C.border}` }}
                      >
                        <Utensils size={22} color={C.border} className="mx-auto mb-1" />
                        <p className="text-xs" style={{ color: C.muted }}>No Bhandara spot bookings yet</p>
                      </div>
                    ) : (
                      spotBookings.map((bb) => (
                        <div
                          key={bb.id}
                          className="rounded-xl p-3 border"
                          style={{ backgroundColor: C.white, borderColor: C.border }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-xs font-bold truncate" style={{ color: C.darkBlue }}>
                                {bb.org_name}
                              </p>
                              <p className="text-[10px] font-medium mt-0.5" style={{ color: C.orange }}>
                                {bb.spot_name}
                              </p>
                            </div>
                            <StatusBadge status={bb.status} />
                          </div>
                          <div className="flex flex-col gap-1 mb-2">
                            <InfoRowSmall
                              icon={<Calendar size={11} />}
                              label="Start"
                              value={fmtDateTime(bb.start_time)}
                            />
                            <InfoRowSmall
                              icon={<Calendar size={11} />}
                              label="End"
                              value={fmtDateTime(bb.end_time)}
                            />
                            <InfoRowSmall
                              icon={<Clock size={11} />}
                              label="Duration"
                              value={`${bb.duration_hours} hrs`}
                            />
                            <InfoRowSmall
                              icon={<Utensils size={11} />}
                              label="Meals/Day"
                              value={bb.expected_meals.toLocaleString("en-IN")}
                            />
                          </div>
                          {bb.status === "Pending" && (
                            <button
                              onClick={() => handleCancelBhandaraSpot(bb.id)}
                              disabled={actionLoading === bb.id}
                              className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all hover:bg-red-50 disabled:opacity-50"
                              style={{ borderColor: C.red, color: C.red }}
                            >
                              {actionLoading === bb.id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <X size={10} />
                              )}
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      ))
                    )}

                    {/* Camp Permission Applications Section */}
                    <p className="text-[11px] font-bold uppercase tracking-wider px-1 mt-1" style={{ color: C.muted }}>
                      Bhandara Camp Applications
                    </p>
                    {campPermissions.length === 0 ? (
                      <div
                        className="rounded-xl p-4 text-center"
                        style={{ backgroundColor: C.bg, border: `1px dashed ${C.border}` }}
                      >
                        <FileText size={22} color={C.border} className="mx-auto mb-1" />
                        <p className="text-xs" style={{ color: C.muted }}>No Bhandara camp applications yet</p>
                      </div>
                    ) : (
                      campPermissions.map((gp) => (
                        <div
                          key={gp.id}
                          className="rounded-xl p-3 border"
                          style={{ backgroundColor: C.white, borderColor: C.border }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-xs font-bold truncate" style={{ color: C.darkBlue }}>
                                {gp.name}
                              </p>
                              <p className="text-[10px] font-medium mt-0.5" style={{ color: C.orange }}>
                                {gp.subtype}
                              </p>
                            </div>
                            <StatusBadge status={gp.status} />
                          </div>
                          <div className="flex flex-col gap-1 mb-2">
                            <InfoRowSmall
                              icon={<Hash size={11} />}
                              label="Code"
                              value={gp.permission_code}
                            />
                            <InfoRowSmall
                              icon={<Calendar size={11} />}
                              label="Date"
                              value={gp.date}
                            />
                            <InfoRowSmall
                              icon={<FileText size={11} />}
                              label="Purpose"
                              value={gp.purpose}
                            />
                          </div>
                          {(gp.status === "pending" || gp.status === "Pending") && (
                            <button
                              onClick={() => handleCancelGeneralPermission(gp.permission_code)}
                              disabled={actionLoading === gp.permission_code}
                              className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all hover:bg-red-50 disabled:opacity-50"
                              style={{ borderColor: C.red, color: C.red }}
                            >
                              {actionLoading === gp.permission_code ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <X size={10} />
                              )}
                              Cancel Application
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}

              {/* ── MEDICAL TAB ── */}
              {activeTab === "medical" && (() => {
                const medicalPerms = profileData.general_permissions.filter(
                  (gp) => gp.type.toLowerCase() === "medical"
                );
                return (
                  <div className="flex flex-col gap-2">
                    {medicalPerms.length === 0 ? (
                      <EmptyState
                        icon={<Activity size={28} />}
                        text="No medical camp applications yet"
                      />
                    ) : (
                      <>
                        {/* Summary banner */}
                        <div
                          className="rounded-xl p-4 text-white"
                          style={{
                            background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                            boxShadow: "0 4px 16px rgba(109,40,217,0.25)",
                          }}
                        >
                          <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wider">
                            Medical Camp Applications
                          </p>
                          <p className="text-2xl font-bold mt-1">{medicalPerms.length}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">
                            {medicalPerms.filter((p) => p.status === "approved" || p.status === "Approved").length} approved ·{" "}
                            {medicalPerms.filter((p) => p.status === "pending" || p.status === "Pending").length} pending
                          </p>
                        </div>

                        {medicalPerms.map((gp) => (
                          <div
                            key={gp.id}
                            className="rounded-xl p-3 border"
                            style={{
                              backgroundColor: C.white,
                              borderColor:
                                gp.status === "approved" || gp.status === "Approved"
                                  ? "#86efac"
                                  : gp.status === "rejected" || gp.status === "Rejected"
                                  ? "#fca5a5"
                                  : C.border,
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-xs font-bold truncate" style={{ color: C.darkBlue }}>
                                  {gp.name}
                                </p>
                                <p className="text-[10px] font-medium mt-0.5" style={{ color: "#7c3aed" }}>
                                  {gp.subtype}
                                </p>
                              </div>
                              <StatusBadge status={gp.status} />
                            </div>
                            <div className="flex flex-col gap-1 mb-2">
                              <InfoRowSmall
                                icon={<Hash size={11} />}
                                label="Application Code"
                                value={gp.permission_code}
                              />
                              <InfoRowSmall
                                icon={<Calendar size={11} />}
                                label="Requested Date"
                                value={gp.date}
                              />
                              <InfoRowSmall
                                icon={<FileText size={11} />}
                                label="Purpose"
                                value={gp.purpose}
                              />
                              <InfoRowSmall
                                icon={<Clock size={11} />}
                                label="Applied On"
                                value={fmtDate(gp.created_at)}
                              />
                            </div>
                            {(gp.status === "pending" || gp.status === "Pending") && (
                              <button
                                onClick={() => handleCancelGeneralPermission(gp.permission_code)}
                                disabled={actionLoading === gp.permission_code}
                                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all hover:bg-red-50 disabled:opacity-50"
                                style={{ borderColor: C.red, color: C.red }}
                              >
                                {actionLoading === gp.permission_code ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <X size={10} />
                                )}
                                Withdraw Application
                              </button>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ── LOST & FOUND TAB ── */}
              {activeTab === "lost_found" && (
                <div className="flex flex-col gap-3">
                  {/* Lost Items */}
                  <p className="text-[11px] font-bold uppercase tracking-wider px-1" style={{ color: C.muted }}>
                    Lost Item Reports
                  </p>
                  {profileData.lost_items.length === 0 ? (
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{ backgroundColor: C.bg, border: `1px dashed ${C.border}` }}
                    >
                      <Package size={22} color={C.border} className="mx-auto mb-1" />
                      <p className="text-xs" style={{ color: C.muted }}>No lost item reports yet</p>
                    </div>
                  ) : (
                    profileData.lost_items.map((li) => (
                      <div
                        key={li.id}
                        className="rounded-xl p-3 border"
                        style={{
                          backgroundColor: C.white,
                          borderColor:
                            li.status === "Found" || li.status === "Claimed"
                              ? "#86efac"
                              : C.border,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${C.orange}15` }}
                            >
                              <Package size={14} color={C.orange} />
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color: C.darkBlue }}>
                                {li.category}
                              </p>
                              <p className="text-[10px]" style={{ color: C.muted }}>
                                Lost on {fmtDate(li.date_lost)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={li.status} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <InfoRowSmall
                            icon={<MapPin size={11} />}
                            label="Location"
                            value={li.location}
                          />
                          {li.description && (
                            <InfoRowSmall
                              icon={<FileText size={11} />}
                              label="Description"
                              value={li.description}
                            />
                          )}
                          <InfoRowSmall
                            icon={<Phone size={11} />}
                            label="Contact"
                            value={`${li.contact_name} · ${li.contact_phone}`}
                          />
                        </div>
                      </div>
                    ))
                  )}

                  {/* Lost Persons */}
                  <p className="text-[11px] font-bold uppercase tracking-wider px-1 mt-1" style={{ color: C.muted }}>
                    Missing Person Reports
                  </p>
                  {profileData.lost_persons.length === 0 ? (
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{ backgroundColor: C.bg, border: `1px dashed ${C.border}` }}
                    >
                      <User size={22} color={C.border} className="mx-auto mb-1" />
                      <p className="text-xs" style={{ color: C.muted }}>No missing person reports yet</p>
                    </div>
                  ) : (
                    profileData.lost_persons.map((lp) => (
                      <div
                        key={lp.id}
                        className="rounded-xl p-3 border"
                        style={{
                          backgroundColor: C.white,
                          borderColor: lp.status === "Found" ? "#86efac" : "#fca5a5",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: lp.status === "Found" ? "#DCFCE7" : "#FEE2E2",
                              }}
                            >
                              <User
                                size={14}
                                color={lp.status === "Found" ? "#166534" : C.red}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color: C.darkBlue }}>
                                {lp.name}
                              </p>
                              <p className="text-[10px]" style={{ color: C.muted }}>
                                Age {lp.age}{lp.gender ? ` · ${lp.gender}` : ""}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={lp.status} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <InfoRowSmall
                            icon={<MapPin size={11} />}
                            label="Last Seen"
                            value={lp.last_seen_location}
                          />
                          <InfoRowSmall
                            icon={<Clock size={11} />}
                            label="Last Seen At"
                            value={fmtDateTime(lp.last_seen_time)}
                          />
                          <InfoRowSmall
                            icon={<Phone size={11} />}
                            label="Contact"
                            value={`${lp.contact_name} · ${lp.contact_phone}`}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer: Logout ────────────── */}
        <div
          className="flex-shrink-0 p-4 border-t"
          style={{ borderColor: C.border, backgroundColor: C.bg }}
        >
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: C.red,
              boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Helpers ─────────────────────────── */

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: C.border }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{
          backgroundColor: C.bg,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {icon}
        <p className="text-xs font-bold" style={{ color: C.darkBlue }}>
          {title}
        </p>
      </div>
      <div className="px-4 py-0 flex flex-col">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: C.border }}
    >
      <div className="flex items-center gap-2" style={{ color: C.muted }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span
        className="text-xs font-semibold text-right max-w-[55%] truncate"
        style={{ color: highlight ? C.orange : C.darkText }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRowSmall({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: C.muted }}>{icon}</span>
      <span className="text-[10px]" style={{ color: C.muted }}>
        {label}:
      </span>
      <span className="text-[10px] font-semibold" style={{ color: C.darkText }}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div style={{ color: C.border }}>{icon}</div>
      <p className="text-sm font-medium" style={{ color: C.muted }}>
        {text}
      </p>
    </div>
  );
}
