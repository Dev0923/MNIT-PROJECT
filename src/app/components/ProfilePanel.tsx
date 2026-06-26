import { useEffect, useState, useRef } from "react";
import {
  X, User, Phone, Mail, Calendar, Clock, ShieldCheck,
  Ticket, HandCoins, Building2, Car,
  LogOut, Loader2, IndianRupee, MapPin, BadgeCheck,
  AlertCircle, CheckCircle2, Timer, RefreshCw,
  ShieldAlert, Utensils, Activity
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

type Tab = "overview" | "bookings" | "donations" | "accommodation" | "vehicles" | "sos" | "bhandara" | "medical";

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
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data) => setProfileData(data))
      .catch((err) => setError(err.message || "Could not load profile"))
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
                  label: "Bookings",
                  val: profileData.bookings.length,
                  color: "#60a5fa",
                },
                {
                  label: "Donations",
                  val: profileData.donations.length,
                  color: "#34d399",
                },
                {
                  label: "Stays",
                  val: profileData.accommodation_bookings.length,
                  color: "#f472b6",
                },
                {
                  label: "Vehicles",
                  val: profileData.vehicles.length,
                  color: C.orange,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-2 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: item.color }}
                  >
                    {item.val}
                  </div>
                  <div
                    className="text-[9px] font-medium"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {item.label}
                  </div>
                </div>
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
                              No permits issued
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
                                {fmtDate(p.valid_from)} → {fmtDate(p.valid_to)}
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
