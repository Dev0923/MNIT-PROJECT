import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, IndianRupee, Users2, ClipboardList,
  Radio, Images, Megaphone, MessageCircle, BarChart2,
  LogOut, Search, Plus, Download, Check, X, Eye,
  TrendingUp, TrendingDown, Bell, Edit2, Trash2, RefreshCw,
  CheckCircle2, Menu as MenuIcon, UserCheck,
  Clock, Car, Stethoscope, Landmark, AlertCircle,
  Monitor, Camera, Maximize2, Wifi, Activity, Send, Signal,
  Users, Save, XCircle, Loader2, ShieldCheck,
  UploadCloud, Play, Pause, RotateCcw, AlertTriangle,
  ArrowRight, Smartphone, FileText, Globe, Ticket
} from "lucide-react";
import logoImg from "../../imports/image-21.png";
import * as api from "../services/adminApi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import type {
  AdminUser, AdminDonation, AdminBooking,
  AdminSupportTicket, AdminVehiclePermit, AdminStats, Announcement,
  AdminGeneralPermission, ParkingLotAdmin, ParkingSnapshot,
} from "../services/adminApi";

/* ─── palette (site theme) ──────────────────────────────── */
const C = {
  orange: "#F7941D",
  gold: "#F4C430",
  darkBlue: "#1F2F8C",
  navy: "#0f1d5e",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  green: "#28A745",
  pink: "#E97B8C",
  red: "#DC2626",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f9fafb",
};

/* ─── data types ────────────────────────────────────────── */
type Section =
  | "dashboard" | "donations" | "vehicle" | "permissions" | "epass"
  | "livestatus" | "videoanalysis" | "gallery" | "announcements" | "support" | "reports"
  | "users" | "lostfound";

/* ─── sidebar nav ───────────────────────────────────────── */
const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "users", label: "Users", icon: <Users size={16} /> },
  { id: "donations", label: "Donations", icon: <IndianRupee size={16} /> },
  { id: "epass", label: "E-Pass & Bookings", icon: <UserCheck size={16} /> },
  { id: "vehicle", label: "Vehicle Permits", icon: <Car size={16} /> },
  { id: "permissions", label: "Permissions", icon: <ClipboardList size={16} /> },
  { id: "parking", label: "Parking (AI)", icon: <Camera size={16} /> },
  { id: "livestatus", label: "Live Status", icon: <Radio size={16} /> },
  { id: "videoanalysis", label: "AI Video Analysis", icon: <Monitor size={16} /> },
  { id: "gallery", label: "Gallery", icon: <Images size={16} /> },
  { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
  { id: "support", label: "Support", icon: <MessageCircle size={16} /> },
  { id: "reports", label: "Reports", icon: <BarChart2 size={16} /> },
  { id: "lostfound", label: "Lost & Found", icon: <Search size={16} /> },
];

/* ─── Status maps ───────────────────────────────────────── */
const STATUS_MAP: Record<string, { bg: string; tc: string; dot: string }> = {
  pending: { bg: "#FEF9C3", tc: "#854D0E", dot: "#EAB308" },
  Pending: { bg: "#FEF9C3", tc: "#854D0E", dot: "#EAB308" },
  approved: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  Approved: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  completed: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  active: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  rejected: { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  Denied: { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  expired: { bg: "#F3F4F6", tc: "#6B7280", dot: "#9CA3AF" },
  inactive: { bg: "#F3F4F6", tc: "#6B7280", dot: "#9CA3AF" },
  used: { bg: "#EDE9FE", tc: "#5B21B6", dot: "#8B5CF6" },
  open: { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  resolved: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  "in-progress": { bg: "#DBEAFE", tc: "#1D4ED8", dot: "#3B82F6" },
  new: { bg: "#DBEAFE", tc: "#1D4ED8", dot: "#3B82F6" },
};

/* ─── Tiny helpers ──────────────────────────────────────── */
function Chip({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.tc }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
    </span>
  );
}
function Avatar({ name, color = C.darkBlue }: { name: string; color?: string }) {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: color }}>{(name ?? "?").charAt(0)}</div>
  );
}
function Kpi({ label, value, sub, icon, color, trend }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string; trend?: "up" | "down";
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-start gap-3"
      style={{ border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18`, color }}>{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.muted }}>{label}</p>
        <p className="text-2xl font-extrabold leading-none mb-1" style={{ color: C.text }}>{value}</p>
        <div className="flex items-center gap-1">
          {trend === "up" && <TrendingUp size={11} color={C.green} />}
          {trend === "down" && <TrendingDown size={11} color={C.red} />}
          <p className="text-[11px]" style={{ color: C.muted }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}
function Th({ ch }: { ch: string }) {
  return <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
    style={{ backgroundColor: C.bg, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{ch}</th>;
}
function Td({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return <td className={`px-4 py-3 text-xs ${cls}`} style={{ borderBottom: `1px solid ${C.border}` }}>{children}</td>;
}
function IconBtn({ col, icon, tip, onClick, disabled }: {
  col: string; icon: React.ReactNode; tip: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button title={tip} onClick={onClick} disabled={disabled}
      className="p-1.5 rounded-lg transition-all hover:opacity-75 disabled:opacity-40"
      style={{ backgroundColor: `${col}15`, color: col }}>{icon}</button>
  );
}
function SearchBar({ value, onChange, ph }: { value: string; onChange: (v: string) => void; ph: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white flex-1 min-w-40"
      style={{ border: `1px solid ${C.border}` }}>
      <Search size={13} color={C.muted} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={ph}
        className="flex-1 outline-none text-xs bg-transparent" style={{ color: C.text }} />
    </div>
  );
}
function Head({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div><h2 className="text-base font-bold" style={{ color: C.text }}>{title}</h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>}</div>
      {right}
    </div>
  );
}
function Table({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr>{cols.map(c => <Th key={c} ch={c} />)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={i} className="hover:bg-gray-50 transition-colors">{row.map((cell, j) => <Td key={j}>{cell}</Td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
function LoadingSpinner({ msg = "Loading data…" }: { msg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: C.muted }}>
      <Loader2 size={28} className="animate-spin" style={{ color: C.darkBlue }} />
      <p className="text-xs">{msg}</p>
    </div>
  );
}
function ErrorBanner({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
      style={{ backgroundColor: "#FEE2E2", border: `1px solid #FECACA` }}>
      <AlertCircle size={16} color={C.red} />
      <p className="text-xs flex-1" style={{ color: "#991B1B" }}>{msg}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-[11px] font-bold px-3 py-1 rounded-lg"
          style={{ backgroundColor: C.red, color: "white" }}>Retry</button>
      )}
    </div>
  );
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtAmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ═══════════════════════════════════════════════════════════
   SECTION: DASHBOARD (live data from /api/admin/stats)
═══════════════════════════════════════════════════════════ */
function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [permits, setPermits] = useState<AdminVehiclePermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [s, d, t, p] = await Promise.all([
        api.getStats(),
        api.getDonations(undefined, 0, 5),
        api.getSupportTickets("open", 0, 5),
        api.getVehiclePermits("Pending", undefined, 0, 5),
      ]);
      setStats(s); setDonations(d); setTickets(t); setPermits(p);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner msg={error} onRetry={load} />;
  if (!stats) return null;

  return (
    <div>
      <Head title="Dashboard" sub="Welcome back, Admin — here's today at a glance." />

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <Kpi label="Registered Users" value={String(stats.total_users)} sub="all time" icon={<Users2 size={20} />} color={C.darkBlue} trend="up" />
        <Kpi label="Total Donated" value={`₹${(stats.total_donated_amount / 1000).toFixed(1)}K`} sub={`${stats.total_donations} transactions`} icon={<IndianRupee size={20} />} color={C.green} trend="up" />
        <Kpi label="Total Bookings" value={String(stats.total_bookings)} sub="Darshan e-passes" icon={<UserCheck size={20} />} color={C.orange} />
        <Kpi label="Open Tickets" value={String(stats.open_tickets)} sub="Awaiting response" icon={<MessageCircle size={20} />} color={C.pink} />
        <Kpi label="Pending Permits" value={String(stats.pending_permits)} sub="Vehicle permits" icon={<Car size={20} />} color="#7C3AED" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent donations */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Recent Donations</p>
          {donations.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: C.muted }}>No donations yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {donations.map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <Avatar name={d.fullName} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{d.fullName}</p>
                    <p className="text-[11px] truncate" style={{ color: C.muted }}>{d.purpose}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: C.green }}>{fmtAmt(d.amount)}</p>
                    <p className="text-[10px]" style={{ color: C.muted }}>{fmtDate(d.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending permits + open tickets */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Pending Actions</p>
          <div className="flex flex-col gap-2">
            {permits.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <Car size={14} color={C.darkBlue} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: C.text }}>{p.owner_name ?? "Unknown"}</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>{p.plate_number} · {p.permit_type}</p>
                </div>
                <Chip status="Pending" />
              </div>
            ))}
            {tickets.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE68A" }}>
                <AlertCircle size={14} color="#D97706" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#92400E" }}>{t.subject}</p>
                  <p className="text-[11px]" style={{ color: "#78350F" }}>{t.name}</p>
                </div>
                <Chip status="open" />
              </div>
            ))}
            {permits.length === 0 && tickets.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: C.muted }}>All caught up! No pending actions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: USERS (real API)
═══════════════════════════════════════════════════════════ */
function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<api.AdminUserUpdate>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      setUsers(await api.getUsers(q || undefined));
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updated = await api.updateUser(editingUser.id, editForm);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingUser(null);
    } catch (e: unknown) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteConfirm(null);
    } catch (e: unknown) { alert((e as Error).message); }
  }

  async function handleToggleAdmin(user: AdminUser) {
    try {
      const updated = await api.updateUser(user.id, { is_admin: !user.is_admin });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (e: unknown) { alert((e as Error).message); }
  }

  return (
    <div>
      <Head title="User Management"
        sub={`${users.length} users in database`}
        right={
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: C.darkBlue }}>
            <RefreshCw size={13} />Refresh
          </button>
        }
      />
      {error && <ErrorBanner msg={error} onRetry={load} />}

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchBar value={q} onChange={setQ} ph="Search by name, email, or phone…" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <Table
          cols={["ID", "Name", "Phone", "Email", "Admin", "Joined", "Last Login", "Actions"]}
          rows={users.map(u => [
            <span className="font-mono text-[11px]" style={{ color: C.muted }}>#{u.id}</span>,
            <div className="flex items-center gap-2">
              <Avatar name={u.name ?? u.email ?? "?"} />
              <span style={{ color: C.text }}>{u.name ?? <em style={{ color: C.muted }}>—</em>}</span>
            </div>,
            <span style={{ color: C.muted }}>{u.phone ?? "—"}</span>,
            <span style={{ color: C.muted }}>{u.email ?? "—"}</span>,
            <button onClick={() => handleToggleAdmin(u)}
              title={u.is_admin ? "Click to revoke admin" : "Click to grant admin"}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${u.is_admin ? "cursor-pointer" : "cursor-pointer"}`}
              style={{ backgroundColor: u.is_admin ? `${C.orange}20` : `${C.muted}15`, color: u.is_admin ? C.orange : C.muted }}>
              {u.is_admin ? <><ShieldCheck size={10} />Admin</> : "User"}
            </button>,
            <span style={{ color: C.muted }}>{fmtDate(u.created_at)}</span>,
            <span style={{ color: C.muted }}>{u.last_login ? fmtDate(u.last_login) : "Never"}</span>,
            <div className="flex gap-1">
              <IconBtn col={C.darkBlue} icon={<Edit2 size={12} />} tip="Edit user"
                onClick={() => { setEditingUser(u); setEditForm({ name: u.name ?? "", email: u.email ?? "", phone: u.phone ?? "" }); }} />
              <IconBtn col={C.red} icon={<Trash2 size={12} />} tip="Delete user"
                onClick={() => setDeleteConfirm(u.id)} />
            </div>,
          ])}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm" style={{ color: C.text }}>Edit User #{editingUser.id}</p>
              <button onClick={() => setEditingUser(null)}><X size={18} color={C.muted} /></button>
            </div>
            {(["name", "email", "phone"] as const).map(field => (
              <div key={field} className="mb-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: C.muted }}>
                  {field}
                </label>
                <input value={(editForm as Record<string, string>)[field] ?? ""}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                  style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
              </div>
            ))}
            <div className="mb-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: C.muted }}>
                New Password (leave blank to keep current)
              </label>
              <input type="password" value={editForm.password ?? ""}
                onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: saving ? "#999" : C.green }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: `1px solid ${C.border}` }}>
            <p className="font-bold text-sm mb-2" style={{ color: C.text }}>Delete User?</p>
            <p className="text-xs mb-5" style={{ color: C.muted }}>
              This will permanently delete user #{deleteConfirm} and all their associated data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: C.red }}>Delete</button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: DONATIONS (real API)
═══════════════════════════════════════════════════════════ */
function Donations() {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setDonations(await api.getDonations(q || undefined)); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [q]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <Head title="Donation Management"
        sub={`${fmtAmt(total)} across ${donations.length} records`}
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: C.darkBlue }}><Download size={13} />Export CSV</button>}
      />
      {error && <ErrorBanner msg={error} onRetry={load} />}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchBar value={q} onChange={setQ} ph="Search donor name, mobile, or ID…" />
      </div>
      {loading ? <LoadingSpinner /> : (
        <Table
          cols={["ID", "Donor", "Mobile", "Purpose", "Amount", "80G", "Date"]}
          rows={donations.map(d => [
            <span className="font-mono text-[11px]" style={{ color: C.muted }}>{d.donation_id}</span>,
            <div className="flex items-center gap-2"><Avatar name={d.fullName} /><span style={{ color: C.text }}>{d.fullName}</span></div>,
            <span style={{ color: C.muted }}>{d.mobile}</span>,
            <span style={{ color: C.text }}>{d.purpose}</span>,
            <span className="font-bold" style={{ color: C.green }}>{fmtAmt(d.amount)}</span>,
            d.want80G
              ? <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: `${C.green}15`, color: C.green }}>Yes</span>
              : <span style={{ color: C.muted }}>No</span>,
            <span style={{ color: C.muted }}>{fmtDate(d.created_at)}</span>,
          ])}
        />
      )}
      {!loading && donations.length === 0 && (
        <p className="text-center text-xs py-12" style={{ color: C.muted }}>No donations found.</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: E-PASS / BOOKINGS (real API)
═══════════════════════════════════════════════════════════ */
function EPass() {
  const [maxCapacity, setMaxCapacity] = useState(2000);
  const [capacityInput, setCapacityInput] = useState("2000");
  const [currentInside, setCurrentInside] = useState(0);
  const [onlineScans, setOnlineScans] = useState(0);
  const [counterScans, setCounterScans] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Simulator states
  const [simTicketId, setSimTicketId] = useState("");
  const [simBookingType, setSimBookingType] = useState("online");
  const [simVerificationMedium, setSimVerificationMedium] = useState("smartphone");
  const [simMessage, setSimMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // View Logs modal state
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:8000/api/gate/dashboard-data");
      if (!res.ok) throw new Error("Failed to load initial gate dashboard data");
      const data = await res.json();
      updateState(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateState = (data: any) => {
    setMaxCapacity(data.max_capacity);
    setCapacityInput(data.max_capacity.toString());
    setCurrentInside(data.current_inside);
    setOnlineScans(data.online_scans_today);
    setCounterScans(data.counter_scans_today);
    setRecentLogs(data.recent_logs || []);
    setTrendData(data.trend_data || []);
  };

  useEffect(() => {
    loadInitialData();

    // Establish WebSocket Connection
    const ws = new WebSocket("ws://localhost:8000/api/gate/ws/live-updates");

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event === "initial_state" || message.event === "headcount_update") {
          updateState(message.data);
        }
      } catch (err) {
        console.error("Error processing websocket message", err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [loadInitialData]);

  // Handle setting save
  const handleSaveCapacity = async () => {
    const val = parseInt(capacityInput, 10);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid capacity limit.");
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch("http://localhost:8000/api/gate/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_capacity: val })
      });
      if (!res.ok) throw new Error("Failed to update capacity limit");
      const data = await res.json();
      setMaxCapacity(data.max_capacity);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Helper date formatting
  const formatLogDate = (isoString: string | null) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    const pad = (num: number) => num.toString().padStart(2, "0");
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = date.getFullYear();
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${d}-${m}-${y} ${pad(hours)}:${minutes} ${ampm}`;
  };

  // Filter devotee logs
  const filteredLogs = recentLogs.filter(log => {
    const matchesSearch = log.ticket_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true :
      statusFilter === "Inside" ? log.status === "entered" :
      log.status === "exited";
    const matchesType =
      typeFilter === "All" ? true :
      log.booking_type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate scans in last 10 mins (from frontend logs)
  const getScansLast10Mins = (type: "online" | "counter" | "exit") => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    return recentLogs.filter(log => {
      if (type === "online") {
        return log.booking_type === "online" && log.scanned_at_entry && new Date(log.scanned_at_entry) >= tenMinsAgo;
      } else if (type === "counter") {
        return log.booking_type === "counter" && log.scanned_at_entry && new Date(log.scanned_at_entry) >= tenMinsAgo;
      } else {
        return log.scanned_at_exit && new Date(log.scanned_at_exit) >= tenMinsAgo;
      }
    }).length;
  };

  // Simulating Actions
  const handleSimulateCreate = async () => {
    if (!simTicketId.trim()) {
      setSimMessage({ text: "Ticket ID is required", success: false });
      return;
    }
    setSimLoading(true);
    setSimMessage(null);
    try {
      const res = await fetch("http://localhost:8000/api/gate/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: simTicketId.trim(),
          booking_type: simBookingType,
          verification_medium: simVerificationMedium
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create ticket");
      setSimMessage({ text: `Ticket ${data.ticket_id} created successfully!`, success: true });
    } catch (err: any) {
      setSimMessage({ text: err.message, success: false });
    } finally {
      setSimLoading(false);
    }
  };

  const handleSimulateScan = async (action: "entry" | "exit") => {
    if (!simTicketId.trim()) {
      setSimMessage({ text: "Ticket ID is required", success: false });
      return;
    }
    setSimLoading(true);
    setSimMessage(null);
    try {
      const endpoint = action === "entry" ? "entry-scan" : "exit-scan";
      const res = await fetch(`http://localhost:8000/api/gate/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: simTicketId.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Scan failed: ${res.statusText}`);
      setSimMessage({
        text: action === "entry" ? `Entry allowed! Ticket status: entered` : `Exit allowed! Ticket status: exited`,
        success: true
      });
    } catch (err: any) {
      setSimMessage({ text: err.message, success: false });
    } finally {
      setSimLoading(false);
    }
  };

  const isCapacityReached = currentInside >= maxCapacity;

  if (loading) return <LoadingSpinner msg="Loading real-time gate controls..." />;

  return (
    <div className="space-y-6">
      {/* Header and Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: C.border }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.text }}>E-Pass & Booking Operational Dashboard</h2>
          <p className="text-xs" style={{ color: C.muted }}>Manage gate entry limits, monitor physical merge lanes, and track real-time devotee movements.</p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Connected (WS)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              WS Disconnected (Offline)
            </span>
          )}
          <button onClick={loadInitialData} className="p-2 rounded-xl border hover:bg-gray-50 transition-colors" style={{ borderColor: C.border }}>
            <RefreshCw size={14} className="text-gray-600" />
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error} onRetry={loadInitialData} />}

      {/* Section A: Dynamic Capacity Control & Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Capacity Input Card */}
        <div className="bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-sm" style={{ borderColor: C.border }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Capacity Control</span>
              <Save size={16} className="text-blue-600" />
            </div>
            <p className="text-[11px] mb-3" style={{ color: C.muted }}>Adjust peak capacity dynamically based on crowd or weather conditions.</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border outline-none font-semibold text-center"
              style={{ borderColor: C.border, color: C.text }}
              placeholder="e.g. 2000"
            />
            <button
              onClick={handleSaveCapacity}
              disabled={savingSettings}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {savingSettings ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Card 1: Live Occupancy */}
        <div 
          className="rounded-2xl p-5 border flex flex-col justify-between shadow-sm transition-all duration-300"
          style={{ 
            borderColor: isCapacityReached ? C.red : C.border, 
            backgroundColor: isCapacityReached ? "#FEF2F2" : "#FFFFFF",
            boxShadow: isCapacityReached ? "0 0 12px rgba(220, 38, 38, 0.15)" : "none"
          }}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isCapacityReached ? "text-red-700" : ""}`} style={{ color: isCapacityReached ? undefined : C.muted }}>Live Occupancy</span>
            <Users size={18} className={isCapacityReached ? "text-red-600 animate-bounce" : "text-blue-600"} />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold ${isCapacityReached ? "text-red-600 animate-pulse font-black" : ""}`} style={{ color: isCapacityReached ? undefined : C.text }}>
                {currentInside}
              </span>
              <span className="text-sm font-semibold" style={{ color: C.muted }}>/ {maxCapacity}</span>
            </div>
            {isCapacityReached ? (
              <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                <AlertCircle size={10} /> TEMPLE FULL · HOLD ENTRY
              </span>
            ) : (
              <p className="text-[10px] mt-2 font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                🟢 Space Available ({(100 - (currentInside / maxCapacity) * 100).toFixed(0)}%)
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Online Scans Today */}
        <div className="bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-sm" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Online Scans Today</span>
            <Globe size={18} className="text-emerald-600" />
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold" style={{ color: C.text }}>{onlineScans}</p>
            <span className="inline-flex items-center gap-0.5 mt-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              🌐 Phone QR Lane Flow
            </span>
          </div>
        </div>

        {/* Card 3: Counter Scans Today */}
        <div className="bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-sm" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Counter Scans Today</span>
            <FileText size={18} className="text-amber-600" />
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold" style={{ color: C.text }}>{counterScans}</p>
            <span className="inline-flex items-center gap-0.5 mt-2 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              🏪 Paper Slip Lane Flow
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Section & Gate Scanner Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator Control Panel (interactive & convenient for testing) */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm space-y-4" style={{ borderColor: C.border }}>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
              <Ticket size={16} className="text-indigo-600" />
              Interactive Gate Simulator
            </h3>
            <p className="text-[11px]" style={{ color: C.muted }}>Create mock tickets and test entry/exit locks instantly.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Ticket ID</label>
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  value={simTicketId}
                  onChange={(e) => setSimTicketId(e.target.value)}
                  placeholder="e.g. TKT-999"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none font-mono"
                  style={{ borderColor: C.border }}
                />
                <button
                  onClick={() => setSimTicketId("TKT-" + Math.floor(10000 + Math.random() * 90000))}
                  className="px-2.5 py-1.5 text-[10px] font-bold border border-dashed rounded-xl hover:bg-gray-50 text-indigo-600"
                  style={{ borderColor: C.border }}
                >
                  Gen ID
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                <select
                  value={simBookingType}
                  onChange={(e) => {
                    setSimBookingType(e.target.value);
                    setSimVerificationMedium(e.target.value === "online" ? "smartphone" : "paper_slip");
                  }}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                  style={{ borderColor: C.border }}
                >
                  <option value="online">Online</option>
                  <option value="counter">Counter</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Verification</label>
                <select
                  value={simVerificationMedium}
                  onChange={(e) => setSimVerificationMedium(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                  style={{ borderColor: C.border }}
                >
                  <option value="smartphone">Smartphone</option>
                  <option value="paper_slip">Paper Slip</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleSimulateCreate}
                disabled={simLoading}
                className="px-2 py-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
              >
                1. Book
              </button>
              <button
                onClick={() => handleSimulateScan("entry")}
                disabled={simLoading}
                className="px-2 py-2 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
              >
                2. Entry Scan
              </button>
              <button
                onClick={() => handleSimulateScan("exit")}
                disabled={simLoading}
                className="px-2 py-2 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50"
              >
                3. Exit Scan
              </button>
            </div>

            {simMessage && (
              <div 
                className={`p-2.5 rounded-xl border text-[11px] font-semibold ${simMessage.success ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
              >
                {simMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* Section B: Live Gate Activity Table */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm lg:col-span-2" style={{ borderColor: C.border }}>
          <div className="mb-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
              <Activity size={16} className="text-emerald-600" />
              Live Gate Activity (Scanner Monitors)
            </h3>
            <p className="text-[11px]" style={{ color: C.muted }}>Real-time health status, cumulative throughput, and short-term scan rates.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: C.border }}>
                  <th className="py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Gate Section</th>
                  <th className="py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Scanner ID</th>
                  <th className="py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-2 text-right font-bold text-gray-500 uppercase tracking-wider">Total Scans Today</th>
                  <th className="py-2 text-right font-bold text-gray-500 uppercase tracking-wider">Scans Last 10 Mins</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: C.border }}>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 font-semibold text-gray-700">Online Entry Lane</td>
                  <td className="py-3 font-mono text-gray-600">Scanner #1 (Phone QR)</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      🟢 Active
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-gray-800">{onlineScans}</td>
                  <td className="py-3 text-right font-bold text-indigo-600 bg-indigo-50/50 px-2 rounded">{getScansLast10Mins("online")}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 font-semibold text-gray-700">Counter Entry Lane</td>
                  <td className="py-3 font-mono text-gray-600">Scanner #2 (Paper QR)</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      🟢 Active
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-gray-800">{counterScans}</td>
                  <td className="py-3 text-right font-bold text-indigo-600 bg-indigo-50/50 px-2 rounded">{getScansLast10Mins("counter")}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 font-semibold text-gray-700">Main Exit Gate</td>
                  <td className="py-3 font-mono text-gray-600">Scanner #3 (Combined)</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      🟢 Active
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-gray-800">{recentLogs.filter(l => l.status === "exited").length}</td>
                  <td className="py-3 text-right font-bold text-indigo-600 bg-indigo-50/50 px-2 rounded">{getScansLast10Mins("exit")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section C: Live Devotee Traffic Log Table */}
      <div className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: C.border }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
              <Users2 size={16} className="text-blue-600" />
              Live Devotee Traffic Log
            </h3>
            <p className="text-[11px]" style={{ color: C.muted }}>List of devotees passing through entry/exit scanning points. Auto-slides new scans at top.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border text-xs" style={{ borderColor: C.border }}>
              <Search size={12} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Search Ticket ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="outline-none bg-transparent w-32"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border text-xs bg-gray-50"
              style={{ borderColor: C.border }}
            >
              <option value="All">All Statuses</option>
              <option value="Inside">Inside</option>
              <option value="Exited">Exited</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border text-xs bg-gray-50"
              style={{ borderColor: C.border }}
            >
              <option value="All">All Types</option>
              <option value="Online">Online</option>
              <option value="Counter">Counter</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: C.border }}>
                <th className="py-2 text-left font-bold text-gray-500 uppercase">Ticket ID</th>
                <th className="py-2 text-left font-bold text-gray-500 uppercase">Booking Type</th>
                <th className="py-2 text-left font-bold text-gray-500 uppercase">Media Type</th>
                <th className="py-2 text-left font-bold text-gray-500 uppercase">Current Status</th>
                <th className="py-2 text-left font-bold text-gray-500 uppercase">Entry Timestamp</th>
                <th className="py-2 text-left font-bold text-gray-500 uppercase">Exit Timestamp</th>
                <th className="py-2 text-center font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.border }}>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.ticket_id} className="hover:bg-gray-50 animate-fade-in transition-all">
                    <td className="py-3 font-mono font-bold text-blue-900">{log.ticket_id}</td>
                    <td className="py-3">
                      {log.booking_type === "online" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <Globe size={11} /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <FileText size={11} /> Counter
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {log.verification_medium === "smartphone" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                          <Smartphone size={11} /> Smartphone
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                          <FileText size={11} /> Paper Slip
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {log.status === "entered" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-50 text-green-700 border border-green-200">
                          🟢 INSIDE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          ⚪ EXITED
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-gray-700">{formatLogDate(log.scanned_at_entry)}</td>
                    <td className="py-3 text-gray-700">{formatLogDate(log.scanned_at_exit)}</td>
                    <td className="py-3 text-center">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border text-blue-700 hover:bg-blue-50 transition-colors"
                        style={{ borderColor: C.border }}
                      >
                        View Logs
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 font-medium">
                    No matching gate scanner traffic logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section D: Total Occupancy Trend Graph */}
      <div className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: C.border }}>
        <div className="mb-4">
          <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
            <BarChart2 size={16} className="text-indigo-600" />
            Total Occupancy Trend Graph (Today)
          </h3>
          <p className="text-[11px]" style={{ color: C.muted }}>Hourly crowd count trend compared against the custom Max Capacity limit line (6:00 AM - 9:00 PM).</p>
        </div>
        <div className="w-full bg-gray-50/50 p-2 rounded-xl border border-dashed" style={{ borderColor: C.border }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', borderColor: C.border, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                labelStyle={{ fontWeight: 'bold', fontSize: 11, color: C.text }}
                itemStyle={{ fontSize: 11, color: '#1F2F8C' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Headcount Inside" 
                stroke="#1F2F8C" 
                strokeWidth={3} 
                dot={{ stroke: '#1F2F8C', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 6 }} 
              />
              <ReferenceLine 
                y={maxCapacity} 
                stroke="#DC2626" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                label={{ 
                  value: `Limit: ${maxCapacity}`, 
                  position: 'insideBottomRight', 
                  fill: '#DC2626', 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  offset: 8
                }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* View Logs Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <Ticket size={16} className="text-blue-600" />
                Audit Logs: {selectedLog.ticket_id}
              </h4>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block">Booking Type</span>
                  <span className="font-semibold text-gray-700 capitalize">{selectedLog.booking_type}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block">Verification Medium</span>
                  <span className="font-semibold text-gray-700 capitalize">{selectedLog.verification_medium.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket History Lifecycle</h5>
                <div className="relative pl-6 border-l-2 border-dashed space-y-4" style={{ borderColor: C.border }}>
                  
                  {/* Step 1: Created */}
                  <div className="relative">
                    <span className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Ticket Booked</p>
                      <p className="text-[10px] text-gray-500">{formatLogDate(selectedLog.created_at)}</p>
                    </div>
                  </div>

                  {/* Step 2: Entered */}
                  {selectedLog.scanned_at_entry && (
                    <div className="relative">
                      <span className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Scanned Entry ({selectedLog.booking_type === "online" ? "Online Lane" : "Counter Lane"})</p>
                        <p className="text-[10px] text-gray-500">{formatLogDate(selectedLog.scanned_at_entry)}</p>
                        <p className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">Verified on {selectedLog.verification_medium}</p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Exited */}
                  {selectedLog.scanned_at_exit && (
                    <div className="relative">
                      <span className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-500 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Scanned Exit (Combined Exit Gate)</p>
                        <p className="text-[10px] text-gray-500">{formatLogDate(selectedLog.scanned_at_exit)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: VEHICLE PERMITS (real API)
═══════════════════════════════════════════════════════════ */
function VehiclePermits() {
  const [permits, setPermits] = useState<AdminVehiclePermit[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"" | "Pending" | "Approved" | "Denied">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setPermits(await api.getVehiclePermits(filter || undefined, q || undefined)); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [filter, q]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  async function handleAction(id: number, newStatus: "Approved" | "Denied") {
    setActionId(id);
    try {
      const updated = await api.approveVehiclePermit(id, newStatus);
      setPermits(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (e: unknown) { alert((e as Error).message); }
    finally { setActionId(null); }
  }

  const pending = permits.filter(p => p.status === "Pending").length;
  const approved = permits.filter(p => p.status === "Approved").length;
  const denied = permits.filter(p => p.status === "Denied").length;

  return (
    <div>
      <Head title="Vehicle Permits"
        right={<button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: C.darkBlue }}><RefreshCw size={13} />Refresh</button>}
      />
      {error && <ErrorBanner msg={error} onRetry={load} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: permits.length, color: C.darkBlue },
          { label: "Approved", value: approved, color: C.green },
          { label: "Pending", value: pending, color: "#D97706" },
          { label: "Denied", value: denied, color: C.red },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center"
            style={{ border: `1.5px solid ${C.border}`, borderTop: `3px solid ${s.color}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchBar value={q} onChange={setQ} ph="Search by plate number or owner name…" />
        {(["", "Pending", "Approved", "Denied"] as const).map(f => (
          <button key={f || "all"} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ backgroundColor: filter === f ? C.darkBlue : C.white, color: filter === f ? "white" : C.muted, border: `1px solid ${filter === f ? C.darkBlue : C.border}` }}>
            {f || "All"}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <Table
          cols={["Owner", "Plate No.", "Type", "Permit", "Valid From", "Valid To", "Status", "Actions"]}
          rows={permits.map(p => [
            <div>
              <p className="font-semibold" style={{ color: C.text }}>{p.owner_name ?? "Guest"}</p>
              <p className="text-[10px]" style={{ color: C.muted }}>{p.owner_phone ?? "—"}</p>
            </div>,
            <span className="font-mono font-semibold" style={{ color: C.darkBlue }}>{p.plate_number}</span>,
            <span style={{ color: C.muted }}>{p.vehicle_type}</span>,
            <span style={{ color: C.text }}>{p.permit_type}</span>,
            <span style={{ color: C.muted }}>{fmtDate(p.valid_from)}</span>,
            <span style={{ color: C.muted }}>{fmtDate(p.valid_to)}</span>,
            <Chip status={p.status} />,
            p.status === "Pending" ? (
              <div className="flex gap-1">
                <button onClick={() => handleAction(p.id, "Approved")} disabled={actionId === p.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold disabled:opacity-50"
                  style={{ backgroundColor: `${C.green}15`, color: C.green }}>
                  {actionId === p.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}Approve
                </button>
                <button onClick={() => handleAction(p.id, "Denied")} disabled={actionId === p.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold disabled:opacity-50"
                  style={{ backgroundColor: `${C.red}15`, color: C.red }}>
                  <X size={10} />Deny
                </button>
              </div>
            ) : (
              <button onClick={() => handleAction(p.id, "Denied")} disabled={actionId === p.id}
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${C.muted}15`, color: C.muted }}>
                <RefreshCw size={12} />
              </button>
            ),
          ])}
        />
      )}
      {!loading && permits.length === 0 && (
        <p className="text-center text-xs py-12" style={{ color: C.muted }}>No vehicle permits found.</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: PERMISSIONS (static categories - Bandhara, Medical, Other)
   Note: These use the vehicle permits endpoint filtered by type context.
   Keeping as informational for now with a note.
═══════════════════════════════════════════════════════════ */
function Permissions() {
  const [permissions, setPermissions] = useState<AdminGeneralPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"All" | "Bandhara" | "Medical" | "Other">("All");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected">("");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getGeneralPermissions();
      setPermissions(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusUpdate(dbId: number, newStatus: "approved" | "rejected") {
    setActionId(dbId);
    try {
      await api.updateGeneralPermissionStatus(dbId, newStatus);
      setPermissions(prev =>
        prev.map(p => (p.db_id === dbId ? { ...p, status: newStatus } : p))
      );
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setActionId(null);
    }
  }

  // Filter permissions based on type, status, and search query
  const filtered = permissions.filter(p => {
    const matchesType = typeFilter === "All" || p.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = !statusFilter || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const pendingCount = permissions.filter(p => p.status.toLowerCase() === "pending").length;
  const approvedCount = permissions.filter(p => p.status.toLowerCase() === "approved").length;
  const rejectedCount = permissions.filter(p => p.status.toLowerCase() === "rejected").length;

  return (
    <div>
      <Head
        title="Permission Management"
        sub="Approve or reject Bandhara, Medical Camp, and Other permissions"
        right={
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors"
            style={{ backgroundColor: C.darkBlue }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {error && <ErrorBanner msg={error} onRetry={load} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Applications", value: permissions.length, color: C.darkBlue },
          { label: "Approved", value: approvedCount, color: C.green },
          { label: "Pending", value: pendingCount, color: "#D97706" },
          { label: "Rejected", value: rejectedCount, color: C.red },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 text-center"
            style={{ border: `1.5px solid ${C.border}`, borderTop: `3px solid ${s.color}` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>
              {s.label}
            </p>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          ph="Search by code, applicant name or purpose…"
        />

        {/* Type Filter */}
        <div className="flex rounded-xl overflow-hidden border bg-white" style={{ borderColor: C.border }}>
          {(["All", "Bandhara", "Medical", "Other"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 text-xs font-bold transition-colors animate-all"
              style={{
                backgroundColor: typeFilter === t ? C.darkBlue : "transparent",
                color: typeFilter === t ? C.white : C.text,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex rounded-xl overflow-hidden border bg-white" style={{ borderColor: C.border }}>
          {[
            { label: "All Status", val: "" },
            { label: "Pending", val: "pending" },
            { label: "Approved", val: "approved" },
            { label: "Rejected", val: "rejected" },
          ].map(f => (
            <button
              key={f.label}
              onClick={() => setStatusFilter(f.val as any)}
              className="px-3 py-1.5 text-xs font-bold transition-colors animate-all"
              style={{
                backgroundColor: statusFilter === f.val ? C.darkBlue : "transparent",
                color: statusFilter === f.val ? C.white : C.text,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: C.border }}>
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs" style={{ color: C.muted }}>
            No permission requests found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ backgroundColor: "#f9fafb", borderColor: C.border }}>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Code</th>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Applicant</th>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Type / Subtype</th>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Purpose / Details</th>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: C.border }}>
                {filtered.map(p => (
                  <tr key={p.db_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-xs font-extrabold text-gray-900 uppercase">
                      #{p.id}
                    </td>
                    <td className="p-4 text-xs font-bold text-gray-800">
                      {p.name}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs font-medium text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold mr-1.5 text-[10px]">
                        {p.type}
                      </span>
                      <span>{p.subtype}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs font-medium text-gray-600">
                      {p.date}
                    </td>
                    <td className="p-4 text-xs text-gray-500 max-w-[240px] truncate" title={p.purpose}>
                      {p.purpose}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <Chip status={p.status} />
                    </td>
                    <td className="p-4 whitespace-nowrap text-right text-xs">
                      {p.status.toLowerCase() === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            disabled={actionId !== null}
                            onClick={() => handleStatusUpdate(p.db_id, "approved")}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            disabled={actionId !== null}
                            onClick={() => handleStatusUpdate(p.db_id, "rejected")}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-400 capitalize">
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: SUPPORT (real API)
═══════════════════════════════════════════════════════════ */
function Support() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [sel, setSel] = useState<AdminSupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setTickets(await api.getSupportTickets(filterStatus || undefined)); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdateStatus(id: number, newStatus: string) {
    setSaving(true);
    try {
      const updated = await api.updateTicketStatus(id, newStatus, reply || undefined);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSel(updated);
      setReply("");
    } catch (e: unknown) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <div>
      <Head title="Support Tickets" sub={`${openCount} open tickets awaiting response.`} />
      {error && <ErrorBanner msg={error} onRetry={load} />}

      <div className="flex gap-2 mb-4">
        {["", "open", "in-progress", "resolved"].map(s => (
          <button key={s || "all"} onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ backgroundColor: filterStatus === s ? C.darkBlue : C.white, color: filterStatus === s ? "white" : C.muted, border: `1px solid ${filterStatus === s ? C.darkBlue : C.border}` }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ") : "All"}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-2">
            {tickets.map(t => (
              <button key={t.id} onClick={() => { setSel(t); setReply(""); }}
                className="text-left p-4 rounded-xl w-full transition-all"
                style={{ backgroundColor: sel?.id === t.id ? `${C.darkBlue}08` : C.white, border: `1.5px solid ${sel?.id === t.id ? C.darkBlue : C.border}` }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold leading-snug" style={{ color: C.text }}>{t.subject}</p>
                  <Chip status={t.status} />
                </div>
                <p className="text-[11px]" style={{ color: C.muted }}>{t.name} · {fmtDate(t.created_at)}</p>
              </button>
            ))}
            {tickets.length === 0 && <p className="text-xs text-center py-12" style={{ color: C.muted }}>No tickets found.</p>}
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
            {sel ? (
              <>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <p className="font-bold text-sm" style={{ color: C.text }}>{sel.subject}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sel.name} · {sel.email} · {fmtDate(sel.created_at)}</p>
                  </div>
                  <Chip status={sel.status} />
                </div>
                <div className="px-4 py-3.5 rounded-xl mb-4 text-sm leading-relaxed"
                  style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.text }}>{sel.message}</div>

                {sel.admin_reply && (
                  <div className="px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: `${C.darkBlue}08`, border: `1px solid ${C.darkBlue}20` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.darkBlue }}>Admin Reply</p>
                    <p className="text-xs" style={{ color: C.text }}>{sel.admin_reply}</p>
                  </div>
                )}

                {sel.status !== "resolved" ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Reply to Devotee</p>
                    <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
                      placeholder="Type your response…"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
                      style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(sel.id, "resolved")} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                        style={{ backgroundColor: C.green }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}Mark Resolved
                      </button>
                      <button onClick={() => handleUpdateStatus(sel.id, "in-progress")} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                        style={{ backgroundColor: `${C.darkBlue}12`, color: C.darkBlue }}>
                        <Send size={14} />Send Reply
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm" style={{ color: C.green }}>
                    <CheckCircle2 size={16} />This ticket has been resolved.
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16" style={{ color: C.muted }}>
                <MessageCircle size={38} color={C.border} />
                <p className="mt-3 text-sm">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: REPORTS (real API)
═══════════════════════════════════════════════════════════ */
function Reports() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [s, d] = await Promise.all([api.getStats(), api.getDonations(undefined, 0, 200)]);
      setStats(s); setDonations(d);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner msg={error} onRetry={load} />;
  if (!stats) return null;

  const byPurpose = donations.reduce<Record<string, number>>((a, d) => ({ ...a, [d.purpose]: (a[d.purpose] ?? 0) + d.amount }), {});
  const sorted = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div>
      <Head title="Reports & Analytics" sub="Donation trends, visitor stats, and permission summaries."
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: C.darkBlue }}><Download size={13} />Export Report</button>} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Donations", value: fmtAmt(stats.total_donated_amount), sub: `${stats.total_donations} transactions`, color: C.green },
          { label: "Total Bookings", value: String(stats.total_bookings), sub: "Darshan e-passes issued", color: C.darkBlue },
          { label: "Open Tickets", value: String(stats.open_tickets), sub: "Awaiting admin response", color: C.pink },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 text-center" style={{ border: `1px solid ${C.border}` }}>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {sorted.length > 0 && (
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <p className="font-bold text-sm mb-5" style={{ color: C.text }}>Donations by Purpose</p>
          <div className="flex flex-col gap-4">
            {sorted.map(([purpose, amount]) => (
              <div key={purpose} className="flex items-center gap-3">
                <p className="text-xs font-semibold flex-shrink-0 truncate" style={{ color: C.muted, width: 180 }}>{purpose}</p>
                <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ backgroundColor: C.bg }}>
                  <div className="h-full rounded-lg flex items-center px-3 transition-all"
                    style={{ width: `${(amount / max) * 100}%`, background: `linear-gradient(90deg,${C.darkBlue},${C.orange})`, minWidth: 72 }}>
                    <span className="text-white text-xs font-bold">{fmtAmt(amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: LIVE STATUS (unchanged — uses simulated data)
═══════════════════════════════════════════════════════════ */
const CAMERAS = [
  { id: "C1", label: "Main Entrance (Singhdwar)", location: "Gate 1", img: "https://images.unsplash.com/photo-1711547979445-a72c87dfd004?w=800&q=70", count: 847, status: "online" },
  { id: "C2", label: "Garbhagriha Queue", location: "Inner", img: "https://images.unsplash.com/photo-1634351356743-05de62a4b80b?w=800&q=70", count: 312, status: "online" },
  { id: "C3", label: "Parikrama Path", location: "Outer", img: "https://images.unsplash.com/photo-1777222218992-27b952b6b276?w=800&q=70", count: 203, status: "online" },
  { id: "C4", label: "Parking Area — Sector 4", location: "Parking", img: "https://images.unsplash.com/photo-1616787671779-eed71117a65e?w=800&q=70", count: 156, status: "online" },
  { id: "C5", label: "Prasad Hall (Bhandara)", location: "Hall", img: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?w=800&q=70", count: 98, status: "offline" },
  { id: "C6", label: "Temple Garden", location: "Garden", img: "https://images.unsplash.com/photo-1639575668834-e0fd81f744ad?w=800&q=70", count: 124, status: "online" },
];
const CROWD_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  "Low": { color: C.green, bg: "#DCFCE7", emoji: "🟢" },
  "Moderate": { color: C.orange, bg: "#FEF3C7", emoji: "🟡" },
  "High": { color: "#D97706", bg: "#FEF9C3", emoji: "🟠" },
  "Very High": { color: C.red, bg: "#FEE2E2", emoji: "🔴" },
};

function LiveStatus() {
  const [selCam, setSelCam] = useState("C1");
  const [crowd, setCrowd] = useState("Moderate");
  const [wait, setWait] = useState("45");
  const [parking, setParking] = useState("Available");
  const [inferenceMap, setInferenceMap] = useState<Record<string, number>>({});
  const [liveTime, setLiveTime] = useState(new Date());
  const [smartMsg, setSmartMsg] = useState("");
  const [screenMode, setScreenMode] = useState<"crowd" | "wait" | "both" | "custom">("both");
  const [broadcast, setBroadcast] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [cameras, setCameras] = useState(CAMERAS);
  const [viewMode, setViewMode] = useState<"camera" | "overlay" | "heatmap">("camera");

  useEffect(() => {
    const fetchCameraStatuses = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/cameras");
        if (res.ok) {
          const data = await res.json();
          setCameras(prev => prev.map(c => {
            const found = data.find((d: any) => d.id === c.id);
            return found ? { ...c, status: found.status } : c;
          }));
        }
      } catch (err) {
        console.error("Failed to fetch camera statuses:", err);
      }
    };

    fetchCameraStatuses();
    const statusInterval = setInterval(fetchCameraStatuses, 5000);
    return () => clearInterval(statusInterval);
  }, []);

  // ── Live AI inference polling (replaces mock random mutation) ──────────────
  useEffect(() => {
    const fetchInference = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/inference");
        if (res.ok) {
          const data: { camera_id: string; crowd_count: number }[] = await res.json();
          setInferenceMap(
            Object.fromEntries(data.map(r => [r.camera_id, r.crowd_count]))
          );
        }
      } catch {
        // Inference service unreachable — keep last known values displayed
      }
    };
    fetchInference();
    const id = setInterval(fetchInference, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Clock tick (independent of inference polling) ─────────────────────────
  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalCount = Object.values(inferenceMap).reduce((a, b) => a + b, 0);
  const activeCam = cameras.find(c => c.id === selCam) ?? cameras[0];
  const selCount = inferenceMap[selCam];
  const crowdCfg = CROWD_CONFIG[crowd] ?? CROWD_CONFIG["Moderate"];

  function doBroadcast() {
    setBroadcast(true);
    setTimeout(() => { setBroadcast(false); setBroadcastDone(true); setTimeout(() => setBroadcastDone(false), 2500); }, 1800);
  }

  return (
    <div className="space-y-5">
      <Head title="Live Status Control" sub="CCTV feeds, crowd AI count, and smart screen broadcast." />

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          <div className="flex items-center gap-2">
            <Camera size={15} color={C.red} />
            <p className="text-xs font-bold" style={{ color: C.text }}>CCTV Live Feeds</p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${C.red}15`, color: C.red }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.red }} />LIVE
            </span>
          </div>
          {/* Professional CCTV analytics display mode selector */}
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-white" style={{ borderColor: C.border }}>
            {(["camera", "overlay", "heatmap"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded transition-colors"
                style={{
                  backgroundColor: viewMode === mode ? C.darkBlue : "transparent",
                  color: viewMode === mode ? C.white : C.muted,
                }}
              >
                {mode === "camera" ? "Camera Only" : mode === "overlay" ? "Overlay" : "Density Map"}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-mono" style={{ color: C.muted }}>
            {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 relative" style={{ aspectRatio: "16/9", backgroundColor: "#0a0a0a", minHeight: 220 }}>
            <img 
              src={activeCam.status === "offline" || activeCam.status === "error" || activeCam.status === "not_configured"
                ? activeCam.img 
                : viewMode === "overlay"
                  ? `http://localhost:8000/api/v1/cameras/${activeCam.id}/overlay`
                  : viewMode === "heatmap"
                    ? `http://localhost:8000/api/v1/cameras/${activeCam.id}/heatmap`
                    : `http://localhost:8000/api/v1/cameras/${activeCam.id}/stream`
              } 
              alt={activeCam.label} 
              className="w-full h-full object-cover opacity-85" 
            />
            <div className="absolute inset-0 pointer-events-none">
              {[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"],
              ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, brd], i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 ${brd}`} style={{ borderColor: "rgba(247,148,29,0.8)" }} />
              ))}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "rgba(220,38,38,0.88)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-bold tracking-widest">LIVE</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.80) 0%,transparent 100%)" }}>
                <p className="text-white text-xs font-bold">{activeCam.label}</p>
                <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Activity size={10} color={C.orange} />AI Count:{" "}
                  <strong className="text-white ml-1">
                    {selCount !== undefined ? `${Math.round(selCount).toLocaleString()} people` : "—"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 border-l" style={{ borderColor: C.border }}>
            {cameras.map((cam, i) => (
              <button key={cam.id} onClick={() => setSelCam(cam.id)}
                className="relative overflow-hidden transition-all"
                style={{ aspectRatio: "16/9", borderBottom: `1px solid ${C.border}`, outline: selCam === cam.id ? `2px solid ${C.orange}` : "none", outlineOffset: "-2px" }}>
                <img
                  src={
                    cam.status === "offline" || cam.status === "error" || cam.status === "not_configured"
                      ? cam.img
                      : `http://localhost:8000/api/v1/cameras/${cam.id}/snapshot?t=${liveTime.getTime()}`
                  }
                  alt={cam.label}
                  className="w-full h-full object-cover"
                  style={{ filter: cam.status === "offline" || cam.status === "error" || cam.status === "not_configured" ? "grayscale(1) brightness(0.4)" : selCam === cam.id ? "brightness(1)" : "brightness(0.6)" }}
                />
                <div className="absolute inset-0 px-1.5 py-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: cam.status === "offline" || cam.status === "error" || cam.status === "not_configured" ? "rgba(0,0,0,0.7)" : "rgba(220,38,38,0.85)", color: "white" }}>
                      {cam.status === "offline" || cam.status === "error" || cam.status === "not_configured" ? "OFF" : "● LIVE"}
                    </span>
                    <span className="text-[9px] font-bold" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "1px 4px", borderRadius: 3 }}>{cam.id}</span>
                  </div>
                  <div style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent)", padding: "4px 4px 2px" }}>
                    <p className="text-white text-[9px] font-bold leading-tight truncate">{cam.label}</p>
                    {cam.status !== "offline" && cam.status !== "error" && (
                      <p className="text-[9px]" style={{ color: C.orange }}>
                        {inferenceMap[cam.id] !== undefined
                          ? `${Math.round(inferenceMap[cam.id])} ppl`
                          : "—"}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Homepage & System Controls</p>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-semibold mb-2" style={{ color: C.text }}>Crowd Density Level</p>
              <div className="grid grid-cols-2 gap-2">
                {["Low", "Moderate", "High", "Very High"].map(v => (
                  <button key={v} onClick={() => setCrowd(v)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all border-2"
                    style={{ backgroundColor: crowd === v ? CROWD_CONFIG[v].bg : "white", borderColor: crowd === v ? CROWD_CONFIG[v].color : C.border, color: crowd === v ? CROWD_CONFIG[v].color : C.muted }}>
                    {CROWD_CONFIG[v].emoji} {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: C.text }}>Darshan Wait Time (mins)</p>
              <input type="number" value={wait} onChange={e => setWait(e.target.value)} min={0} max={300}
                className="w-full px-4 py-2.5 rounded-xl font-extrabold text-xl outline-none"
                style={{ border: `2px solid ${C.orange}`, color: C.darkBlue, backgroundColor: C.cream }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold mb-2" style={{ color: C.text }}>Parking Status</p>
              <div className="flex gap-2">
                {["Available", "Limited", "Full"].map(v => (
                  <button key={v} onClick={() => setParking(v)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                    style={{
                      backgroundColor: parking === v ? (v === "Available" ? `${C.green}15` : v === "Limited" ? `${C.orange}15` : `${C.red}15`) : "white",
                      borderColor: parking === v ? (v === "Available" ? C.green : v === "Limited" ? C.orange : C.red) : C.border,
                      color: parking === v ? (v === "Available" ? C.green : v === "Limited" ? C.orange : C.red) : C.muted,
                    }}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={15} color={C.darkBlue} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Outdoor Smart Screen</p>
            <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${C.green}15`, color: C.green }}>
              <Signal size={10} /> Connected
            </div>
          </div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: C.text }}>What to display on screen:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {([{ id: "crowd", label: "Crowd Density Only" }, { id: "wait", label: "Wait Time Only" }, { id: "both", label: "Crowd + Wait Time" }, { id: "custom", label: "Custom Message" }] as const).map(m => (
              <button key={m.id} onClick={() => setScreenMode(m.id)}
                className="px-3 py-2 rounded-xl text-[11px] font-bold border-2 transition-all text-left"
                style={{ backgroundColor: screenMode === m.id ? `${C.darkBlue}10` : "white", borderColor: screenMode === m.id ? C.darkBlue : C.border, color: screenMode === m.id ? C.darkBlue : C.muted }}>
                {m.label}
              </button>
            ))}
          </div>
          {screenMode === "custom" && (
            <input value={smartMsg} onChange={e => setSmartMsg(e.target.value)}
              placeholder="e.g. Heavy rush — please use Gate 3"
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none mb-4"
              style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
          )}
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: "3px solid #1a1a1a", backgroundColor: "#111" }}>
            <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: "#1a1a1a" }}>
              <p className="text-[9px] text-white opacity-50 tracking-widest uppercase">Khatu Shyam Ji · Smart Display</p>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.green }} />
            </div>
            <div className="px-5 py-5 text-center" style={{ background: `linear-gradient(135deg, ${C.darkBlue} 0%, #0f1d5e 100%)` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                🕐 {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Khatu Shyam Ji Temple
              </p>
              {(screenMode === "crowd" || screenMode === "both") && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Crowd Density</p>
                  <div className="inline-block px-6 py-2 rounded-xl" style={{ backgroundColor: crowdCfg.bg, border: `2px solid ${crowdCfg.color}` }}>
                    <p className="text-xl font-extrabold" style={{ color: crowdCfg.color }}>{crowdCfg.emoji} {crowd.toUpperCase()}</p>
                  </div>
                </div>
              )}
              {(screenMode === "wait" || screenMode === "both") && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Estimated Wait Time</p>
                  <p className="text-3xl font-extrabold" style={{ color: C.gold }}>{wait} <span className="text-lg">mins</span></p>
                </div>
              )}
              {screenMode === "custom" && <p className="text-base font-extrabold text-white px-4">{smartMsg || "Enter a message above…"}</p>}
              <p className="text-[9px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                AI Count: {Math.round(totalCount).toLocaleString()} people · Parking: {parking}
              </p>
            </div>
            <div className="flex items-center justify-center py-1.5" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "#333" }} />
            </div>
          </div>
          <button onClick={doBroadcast} disabled={broadcast}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: broadcastDone ? C.green : broadcast ? "#666" : `linear-gradient(90deg,${C.darkBlue},#2a3fa8)`, cursor: broadcast ? "wait" : "pointer" }}>
            {broadcastDone ? <><CheckCircle2 size={15} />Broadcast Sent!</> : broadcast
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Broadcasting…</>
              : <><Send size={14} />Broadcast to Smart Screen</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: AI VIDEO ANALYSIS
   ═══════════════════════════════════════════════════════════ */
function VideoAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<"overlay" | "density" | "side-by-side">("overlay");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [processingFps, setProcessingFps] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Poll status endpoint
  useEffect(() => {
    if (!taskId || status === "completed" || status === "failed" || status === "cancelled") {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/video-analysis/status/${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setProgress(data.progress || 0);
          setCurrentFrame(data.current_frame || 0);
          setTotalFrames(data.total_frames || 0);
          setElapsedTime(data.elapsed_time || 0);
          setEta(data.eta || 0);
          setProcessingFps(data.fps || 0);
          setErrorMessage(data.error_message || "");
          if (data.status === "completed") {
            setResults(data.results);
          }
        }
      } catch (err) {
        console.error("Error polling task status:", err);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [taskId, status]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext && ["mp4", "avi", "mov", "mkv"].includes(ext)) {
        setFile(selectedFile);
      } else {
        alert("Please upload a valid video file (.mp4, .avi, .mov, .mkv)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMessage("");
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const res = await fetch("http://localhost:8000/api/v1/video-analysis/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setTaskId(data.task_id);
        setStatus(data.status);
      } else {
        const data = await res.json();
        setErrorMessage(data.detail || "Failed to initiate video analysis.");
        setStatus("failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to the backend server.");
      setStatus("failed");
    } finally {
      setUploading(false);
    }
  };

  const cancelAnalysis = async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/video-analysis/cancel/${taskId}`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("cancelled");
      }
    } catch (err) {
      console.error("Failed to cancel analysis:", err);
    }
  };

  const deleteJob = async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/video-analysis/jobs/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        resetState();
      }
    } catch (err) {
      console.error("Failed to delete analysis job:", err);
    }
  };

  const resetState = () => {
    setFile(null);
    setTaskId(null);
    setStatus(null);
    setProgress(0);
    setCurrentFrame(0);
    setTotalFrames(0);
    setElapsedTime(0);
    setEta(0);
    setProcessingFps(0);
    setErrorMessage("");
    setResults(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Head title="AI Video Analysis" sub="Offline processing of recorded crowd videos to validate model performance." />

      {!status && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col justify-between" style={{ border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Upload Crowd Video</p>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[220px] ${
                  dragActive ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-500"
                }`}
                style={{ borderColor: dragActive ? C.orange : undefined }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".mp4,.avi,.mov,.mkv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <UploadCloud size={48} className="text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700">
                  {file ? file.name : "Drag & drop your video file here"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports MP4, AVI, MOV, MKV files (Max size: 500MB)
                </p>
                {file && (
                  <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-green-500">
                    File selected ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                disabled={!file || uploading}
                onClick={startAnalysis}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50"
                style={{ backgroundColor: file ? C.orange : "#ccc", cursor: file ? "pointer" : "not-allowed" }}
              >
                {uploading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <><Play size={14} /> Start Analysis</>
                )}
              </button>
            </div>
          </div>

          {/* Settings panel */}
          <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Analysis Settings</p>
            
            <div className="space-y-4">


              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-2">Output Visualization Mode</label>
                <div className="space-y-2">
                  {[
                    { id: "overlay", label: "Overlay Video", desc: "Density heatmap superimposed over original frame" },
                    { id: "density", label: "Density Map Only", desc: "Pure crowd density map on black backdrop" },
                    { id: "side-by-side", label: "Side-by-Side Comparison", desc: "Original on left | Overlay on right" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setMode(opt.id as any)}
                      className="w-full text-left p-3 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: mode === opt.id ? C.orange : C.border,
                        backgroundColor: mode === opt.id ? "rgba(247,148,29,0.04)" : "transparent"
                      }}
                    >
                      <p className="text-xs font-bold text-gray-800">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress View */}
      {(status === "pending" || status === "processing") && (
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Analysis in progress</p>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Processing "{file?.name}"</h3>
            </div>
            <button
              onClick={cancelAnalysis}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
            >
              Cancel Analysis
            </button>
          </div>

          <div className="space-y-4">
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: C.orange }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border" style={{ borderColor: C.border }}>
                <p className="text-[10px] uppercase font-bold text-gray-500">Progress</p>
                <p className="text-xl font-extrabold mt-1 text-gray-800">{progress}%</p>
                <p className="text-[11px] text-gray-500 mt-1">Frame {currentFrame} / {totalFrames}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border" style={{ borderColor: C.border }}>
                <p className="text-[10px] uppercase font-bold text-gray-500">Elapsed Time</p>
                <p className="text-xl font-extrabold mt-1 text-gray-800">{formatTime(elapsedTime)}</p>
                <p className="text-[11px] text-gray-500 mt-1">Total process duration</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border" style={{ borderColor: C.border }}>
                <p className="text-[10px] uppercase font-bold text-gray-500">Estimated Remaining (ETA)</p>
                <p className="text-xl font-extrabold mt-1 text-gray-800">{formatTime(eta)}</p>
                <p className="text-[11px] text-gray-500 mt-1">Time remaining</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border" style={{ borderColor: C.border }}>
                <p className="text-[10px] uppercase font-bold text-gray-500">Processing Speed</p>
                <p className="text-xl font-extrabold mt-1 text-gray-800">{processingFps.toFixed(1)} FPS</p>
                <p className="text-[11px] text-gray-500 mt-1">Frames per second</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failure View */}
      {status === "failed" && (
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-bold">Analysis Failed</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 font-mono">
            {errorMessage || "An unexpected error occurred during processing."}
          </p>
          <button onClick={resetState} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.orange }}>
            Try Again
          </button>
        </div>
      )}

      {/* Cancelled View */}
      {status === "cancelled" && (
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-bold">Analysis Cancelled</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
            The offline analysis process was cancelled by the administrator. Output artifacts have been removed.
          </p>
          <button onClick={resetState} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.orange }}>
            Upload Another Video
          </button>
        </div>
      )}

      {/* Results View */}
      {status === "completed" && results && (
        <div className="space-y-6">
          {/* Main layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col justify-between" style={{ border: `1px solid ${C.border}` }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Processed Output Video</p>
                <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video
                    controls
                    className="w-full h-full max-h-[480px] object-contain"
                    src={`http://localhost:8000/api/v1/video-analysis/static/task_${taskId}/overlay.mp4`}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: C.border }}>
                <button
                  onClick={deleteJob}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200 flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Job File
                </button>

                <div className="flex gap-2">
                  <a
                    href={`http://localhost:8000/api/v1/video-analysis/downloads/${taskId}/video`}
                    download
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                    style={{ backgroundColor: C.darkBlue }}
                  >
                    <Download size={13} /> Download Video
                  </a>
                  <a
                    href={`http://localhost:8000/api/v1/video-analysis/downloads/${taskId}/csv`}
                    download
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                    style={{ backgroundColor: C.orange }}
                  >
                    <Download size={13} /> Download CSV
                  </a>
                  <button
                    onClick={resetState}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} /> Run New Video
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-2xl p-6 flex flex-col justify-between" style={{ border: `1px solid ${C.border}` }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Validation Statistics</p>
                
                <div className="space-y-4">
                  <div className="border-b pb-3" style={{ borderColor: C.border }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Input Filename</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{results.input_filename}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b pb-3" style={{ borderColor: C.border }}>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Average Count</p>
                      <p className="text-lg font-extrabold text-orange-500 mt-0.5">{results.average_count} ppl</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Peak Count</p>
                      <p className="text-lg font-extrabold text-red-600 mt-0.5">{results.maximum_count} ppl</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b pb-3" style={{ borderColor: C.border }}>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Minimum Count</p>
                      <p className="text-base font-extrabold text-green-600 mt-0.5">{results.minimum_count} ppl</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Total Frames</p>
                      <p className="text-base font-extrabold text-gray-800 mt-0.5">{results.frame_count}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b pb-3" style={{ borderColor: C.border }}>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Video Duration</p>
                      <p className="text-base font-extrabold text-gray-800 mt-0.5">{formatTime(results.duration)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Processing Time</p>
                      <p className="text-base font-extrabold text-gray-800 mt-0.5">{results.processing_time}s</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Average Processing Speed</p>
                    <p className="text-lg font-extrabold text-navy-800 mt-0.5" style={{ color: C.navy }}>{results.average_processing_fps} FPS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: ANNOUNCEMENTS — backend-wired
═══════════════════════════════════════════════════════════ */

function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [newText, setNew] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  /* ── Alert sender state ────────────────────────────────── */
  const [alertMsg, setAlertMsg] = useState("");
  const [alertSev, setAlertSev] = useState<"info" | "warning" | "critical">("info");
  const [alertSending, setAlertSending] = useState(false);
  const [alertDone, setAlertDone] = useState(false);
  const [alertError, setAlertError] = useState("");
  const [alertHistory, setAlertHistory] = useState<{ msg: string; sev: string; time: string; recipients: number }[]>([]);

  /* ── Load announcements from backend on mount ──────────── */
  useEffect(() => {
    api.getAnnouncements()
      .then(data => setItems(data))
      .catch(() => setFetchError("Failed to load announcements."))
      .finally(() => setLoading(false));
  }, []);

  /* ── Toggle active state ────────────────────────────────── */
  async function toggle(item: Announcement) {
    setSavingId(item.id);
    try {
      const updated = await api.updateAnnouncement(item.id, { active: !item.active });
      setItems(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch {
      // silently revert — no state change needed since UI hasn't changed yet
    } finally {
      setSavingId(null);
    }
  }

  /* ── Delete announcement ────────────────────────────────── */
  async function remove(id: number) {
    setSavingId(id);
    try {
      await api.deleteAnnouncement(id);
      setItems(prev => prev.filter(a => a.id !== id));
    } catch {
      // keep item in list on error
    } finally {
      setSavingId(null);
    }
  }

  /* ── Add new announcement ───────────────────────────────── */
  async function add() {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const created = await api.createAnnouncement(newText.trim());
      setItems(prev => [created, ...prev]);
      setNew("");
    } catch {
      // keep input so user can retry
    } finally {
      setSaving(false);
    }
  }

  async function sendAlert() {
    if (!alertMsg.trim()) return;
    setAlertSending(true);
    setAlertError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: alertMsg.trim(), severity: alertSev }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setAlertHistory(prev => [
        { msg: alertMsg.trim(), sev: alertSev, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), recipients: data.recipients ?? 0 },
        ...prev,
      ]);
      setAlertMsg("");
      setAlertDone(true);
      setTimeout(() => setAlertDone(false), 2500);
    } catch (err: unknown) {
      setAlertError(err instanceof Error ? err.message : "Failed to send alert");
    } finally {
      setAlertSending(false);
    }
  }

  const SEV_CFG = {
    info: { color: C.darkBlue, label: "ℹ️  Info", desc: "General information" },
    warning: { color: C.orange, label: "⚠️  Warning", desc: "Important notice" },
    critical: { color: C.red, label: "🚨 Critical", desc: "Urgent / emergency" },
  };

  return (
    <div>
      <Head title="Announcement Manager" sub="Control announcements shown on the devotee Home page." />

      {/* ══ SEND LIVE ALERT ══════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-5 mb-6" style={{ border: `2px solid ${C.darkBlue}22`, boxShadow: `0 4px 20px ${C.darkBlue}08` }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.darkBlue}, #2a3fa8)` }}>
            <Send size={14} color="white" />
          </div>
          <div>
            <p className="text-sm font-extrabold" style={{ color: C.text }}>Send Live Alert to Users</p>
            <p className="text-[10px]" style={{ color: C.muted }}>Broadcast a real-time notification to all active visitors</p>
          </div>
        </div>

        {/* Severity selector */}
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Alert Severity</p>
        <div className="flex gap-2 mb-4">
          {(["info", "warning", "critical"] as const).map(sev => {
            const cfg = SEV_CFG[sev];
            const active = alertSev === sev;
            return (
              <button key={sev} onClick={() => setAlertSev(sev)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                style={{
                  backgroundColor: active ? `${cfg.color}12` : "white",
                  borderColor: active ? cfg.color : C.border,
                  color: active ? cfg.color : C.muted,
                }}>
                <span className="block">{cfg.label}</span>
                <span className="text-[9px] font-normal opacity-70">{cfg.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Message input */}
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Alert Message</p>
        <textarea
          rows={3}
          value={alertMsg}
          onChange={e => setAlertMsg(e.target.value)}
          placeholder="e.g. Heavy crowd expected tomorrow — please plan your visit accordingly"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
          style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) sendAlert(); }}
        />

        {alertError && (
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: C.red }}>
            <AlertCircle size={13} />{alertError}
          </p>
        )}

        {/* Send button */}
        <button
          onClick={sendAlert}
          disabled={alertSending || !alertMsg.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: alertDone
              ? C.green
              : alertSending
                ? "#666"
                : `linear-gradient(90deg, ${SEV_CFG[alertSev].color}, ${alertSev === "info" ? "#2a3fa8" : alertSev === "warning" ? "#F59E0B" : "#EF4444"})`,
            cursor: alertSending ? "wait" : !alertMsg.trim() ? "not-allowed" : "pointer",
            opacity: !alertMsg.trim() && !alertSending ? 0.5 : 1,
          }}>
          {alertDone
            ? <><CheckCircle2 size={15} />Alert Sent Successfully!</>
            : alertSending
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
              : <><Send size={14} />Send Alert to All Users</>}
        </button>

        <p className="text-[10px] text-center mt-2" style={{ color: C.muted }}>Ctrl + Enter to send  •  Alert will appear instantly on all user screens</p>

        {/* Sent history */}
        {alertHistory.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Recently Sent Alerts</p>
            <div className="flex flex-col gap-2">
              {alertHistory.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  <span className="text-xs">{h.sev === "info" ? "ℹ️" : h.sev === "warning" ? "⚠️" : "🚨"}</span>
                  <p className="flex-1 text-xs font-medium truncate" style={{ color: C.text }}>{h.msg}</p>
                  <span className="text-[10px] flex-shrink-0" style={{ color: C.muted }}>{h.recipients} users · {h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: `1px solid ${C.border}` }}>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Add New Announcement</p>
        <div className="flex gap-3">
          <input value={newText} onChange={e => setNew(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="e.g. Sheegh Darshan Pass now available — Book online"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
          <button onClick={add} disabled={saving || !newText.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5"
            style={{ backgroundColor: saving ? "#999" : C.orange, cursor: saving ? "wait" : "pointer" }}>
            {saving ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={13} />}
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2" style={{ color: C.muted }}>
          <Loader2 size={18} className="animate-spin" /> Loading announcements…
        </div>
      ) : fetchError ? (
        <p className="text-sm text-center py-6" style={{ color: C.red }}>{fetchError}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: C.muted }}>No announcements yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map(a => {
            const busy = savingId === a.id;
            return (
              <div key={a.id} className="bg-white rounded-xl px-5 py-3.5 flex items-center gap-4 transition-all"
                style={{ border: `1px solid ${C.border}`, opacity: a.active ? 1 : 0.5 }}>
                <button onClick={() => !busy && toggle(a)}
                  className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
                  style={{ backgroundColor: a.active ? C.green : "#D1D5DB", cursor: busy ? "wait" : "pointer" }}>
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow top-0.5 transition-transform"
                    style={{ left: a.active ? "22px" : "2px" }} />
                </button>
                <p className="flex-1 text-sm font-medium" style={{ color: C.text }}>{a.text}</p>
                <span className="text-[10px] flex-shrink-0" style={{ color: C.muted }}>
                  {new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <button onClick={() => !busy && remove(a.id)} disabled={busy}
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${C.red}12`, color: busy ? C.muted : C.red, cursor: busy ? "wait" : "pointer" }}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Gallery() {
  const [items, setItems] = useState<api.GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [uploadedTitle, setUploadedTitle] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editItem, setEditItem] = useState<api.GalleryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Temple");
  const [editPhotographer, setEditPhotographer] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.getGalleryItems();
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Upload ────────────────────────────────────────────────
  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const autoTitle = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const autoType = selectedFile.type.startsWith("video/") ? "video" : "photo";
    setType(autoType);
    setUploadedTitle(autoTitle);
    setUploading(true);
    setUploadStatus("uploading");
    setUploadError("");
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", autoTitle);
      formData.append("type", autoType);
      await api.uploadGalleryItem(formData);
      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatus("success");
      e.target.value = "";
      await fetchItems();
      setTimeout(() => { setUploadStatus("idle"); setUploadProgress(0); setUploadedTitle(""); }, 2500);
    } catch (err: unknown) {
      clearInterval(interval);
      setUploadProgress(0);
      setUploadStatus("error");
      setUploadError((err as Error).message || "Upload failed. Please try again.");
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────
  const openEdit = (item: api.GalleryItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditCategory(item.category ?? "Temple");
    setEditPhotographer(item.photographer ?? "");
    setEditFile(null);
    setEditFilePreview(null);
    setEditError("");
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setEditFile(f);
    if (f.type.startsWith("image/")) {
      setEditFilePreview(URL.createObjectURL(f));
    } else {
      setEditFilePreview(null);
    }
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    if (!editTitle.trim()) { setEditError("Title is required."); return; }
    setEditSaving(true);
    setEditError("");
    try {
      const formData = new FormData();
      formData.append("title", editTitle.trim());
      formData.append("description", editDescription);
      formData.append("category", editCategory);
      formData.append("photographer", editPhotographer);
      if (editFile) formData.append("file", editFile);
      const updated = await api.updateGalleryItem(editItem.id, formData);
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setEditItem(null);
    } catch (err: unknown) {
      setEditError((err as Error).message || "Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await api.deleteGalleryItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setDeleteConfirmId(null);
    } catch { alert("Failed to delete item."); }
  };

  const zoneBorder = uploadStatus === "success" ? C.green : uploadStatus === "error" ? C.red : uploading ? C.orange : C.border;
  const zoneBg = uploadStatus === "success" ? `${C.green}08` : uploadStatus === "error" ? `${C.red}08` : uploading ? `${C.orange}06` : C.bg;

  return (
    <div>
      <Head title="Gallery Management" sub="Upload and manage photos and videos shown to devotees." />

      {/* ── Upload Zone ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 mb-6" style={{ border: `1px solid ${C.border}` }}>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Upload New Item</p>

        <input
          ref={fileInputRef}
          type="file"
          accept={type === "photo" ? "image/*" : "video/*"}
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadStatus === "idle" && (
          <div className="flex items-center gap-3 mb-3">
            {(["photo", "video"] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                style={{
                  borderColor: type === t ? C.darkBlue : C.border,
                  backgroundColor: type === t ? `${C.darkBlue}10` : "white",
                  color: type === t ? C.darkBlue : C.muted,
                }}
              >
                {t === "photo" ? <Camera size={13} /> : <Monitor size={13} />}
                {t === "photo" ? "Photo" : "Video"}
              </button>
            ))}
          </div>
        )}

        <div
          onClick={openFilePicker}
          className="flex flex-col items-center justify-center gap-3 w-full rounded-xl transition-all"
          style={{
            border: `2px dashed ${zoneBorder}`,
            backgroundColor: zoneBg,
            padding: "32px 16px",
            cursor: uploading ? "default" : "pointer",
          }}
        >
          {uploadStatus === "idle" && (
            <>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.darkBlue}12` }}>
                <Images size={22} color={C.darkBlue} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: C.text }}>Click here to choose a {type}</p>
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  {type === "photo" ? "JPG, PNG, WEBP, GIF" : "MP4, MOV, AVI, WEBM"} • Uploads automatically
                </p>
              </div>
            </>
          )}

          {uploadStatus === "uploading" && (
            <>
              <Loader2 size={28} className="animate-spin" style={{ color: C.orange }} />
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: C.text }}>Uploading "{uploadedTitle}"…</p>
                <p className="text-xs mt-1" style={{ color: C.muted }}>Please wait, do not close this page</p>
              </div>
              <div className="w-full max-w-xs rounded-full overflow-hidden" style={{ height: 6, backgroundColor: `${C.orange}22` }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.gold})` }} />
              </div>
              <p className="text-xs font-bold" style={{ color: C.orange }}>{Math.round(uploadProgress)}%</p>
            </>
          )}

          {uploadStatus === "success" && (
            <>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.green}15` }}>
                <CheckCircle2 size={26} color={C.green} />
              </div>
              <p className="text-sm font-bold" style={{ color: C.green }}>Uploaded successfully!</p>
              <p className="text-xs" style={{ color: C.muted }}>Click to upload another file</p>
            </>
          )}

          {uploadStatus === "error" && (
            <>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.red}12` }}>
                <XCircle size={26} color={C.red} />
              </div>
              <p className="text-sm font-bold" style={{ color: C.red }}>Upload failed</p>
              <p className="text-xs text-center max-w-xs" style={{ color: C.muted }}>{uploadError}</p>
              <p className="text-xs font-semibold" style={{ color: C.red }}>Click to try again</p>
            </>
          )}
        </div>
      </div>

      {/* ── Gallery Grid ─────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner msg="Loading gallery..." />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: C.muted }}>
          <Images size={40} color={C.border} />
          <p className="text-sm">No items in gallery yet. Upload your first photo or video above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden flex flex-col group transition-all hover:shadow-md"
              style={{ border: `1px solid ${C.border}` }}>
              {/* Media preview */}
              <div className="relative overflow-hidden" style={{ height: 160, backgroundColor: "#f3f4f6" }}>
                {item.type === "photo" ? (
                  <img
                    src={`http://localhost:8000${item.url}`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <video src={`http://localhost:8000${item.url}`} className="w-full h-full object-cover" />
                )}
                {/* Type badge */}
                <div className="absolute top-2 left-2 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold"
                  style={{ backgroundColor: item.type === "photo" ? `${C.darkBlue}cc` : `${C.orange}cc` }}>
                  {item.type}
                </div>
                {/* Hover action buttons */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                  <button
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ backgroundColor: C.darkBlue }}
                    title="Edit item"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ backgroundColor: C.red }}
                    title="Delete item"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {/* Card info + action buttons */}
              <div className="p-3 flex-1 flex flex-col gap-1">
                <p className="text-xs font-bold truncate" style={{ color: C.text }} title={item.title}>{item.title}</p>
                {item.description && (
                  <p className="text-[11px] leading-snug line-clamp-2" style={{ color: C.muted }}>{item.description}</p>
                )}
                <p className="text-[10px] mt-auto pt-1" style={{ color: C.muted }}>{fmtDate(item.created_at)}</p>
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                    style={{ backgroundColor: `${C.darkBlue}12`, color: C.darkBlue }}
                  >
                    <Edit2 size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
                    style={{ backgroundColor: `${C.red}10`, color: C.red }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────── */}
      {editItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl mx-4" style={{ border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-bold text-sm" style={{ color: C.text }}>Edit Gallery Item</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>Update title, description, or replace the {editItem.type}</p>
              </div>
              <button onClick={() => setEditItem(null)}><X size={18} color={C.muted} /></button>
            </div>

            {/* Current preview */}
            <div className="mb-4 rounded-xl overflow-hidden" style={{ height: 160, backgroundColor: "#f3f4f6" }}>
              {editFilePreview ? (
                <img src={editFilePreview} alt="New preview" className="w-full h-full object-cover" />
              ) : editItem.type === "photo" ? (
                <img src={`http://localhost:8000${editItem.url}`} alt={editItem.title} className="w-full h-full object-cover" />
              ) : (
                <video src={`http://localhost:8000${editItem.url}`} className="w-full h-full object-cover" />
              )}
            </div>

            {/* Replace file */}
            <input ref={editFileInputRef} type="file" accept={editItem.type === "photo" ? "image/*" : "video/*"}
              onChange={handleEditFileChange} className="hidden" />
            <button
              onClick={() => editFileInputRef.current?.click()}
              className="w-full py-2 rounded-xl text-xs font-bold mb-4 flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              style={{ backgroundColor: C.bg, color: C.muted, border: `1.5px dashed ${C.border}` }}
            >
              {editFile ? <><CheckCircle2 size={13} color={C.green} /><span style={{ color: C.green }}>New file selected: {editFile.name}</span></> : <><Camera size={13} />Click to replace {editItem.type}</>}
            </button>

            {/* Title */}
            <div className="mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.muted }}>Title *</label>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }}
                placeholder="e.g. Temple view during Phool Bangla"
              />
            </div>

            {/* Category / Tag */}
            <div className="mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.muted }}>Category / Tag</label>
              <select
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none font-semibold"
                style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }}
              >
                {editItem.type === "photo" ? (
                  <>
                    <option value="Temple">Temple</option>
                    <option value="Festivals">Festivals</option>
                    <option value="Devotees">Devotees</option>
                    <option value="Aarti & Rituals">Aarti & Rituals</option>
                  </>
                ) : (
                  <>
                    <option value="Temple">Temple</option>
                    <option value="Aarti">Aarti</option>
                    <option value="Festival">Festival</option>
                    <option value="Bhajan">Bhajan</option>
                    <option value="Devotees">Devotees</option>
                    <option value="Seva">Seva</option>
                    <option value="Ritual">Ritual</option>
                  </>
                )}
              </select>
            </div>

            {/* Photographer */}
            <div className="mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.muted }}>Photographer / Source</label>
              <input
                value={editPhotographer}
                onChange={e => setEditPhotographer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none font-semibold"
                style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }}
                placeholder="e.g. Temple Trust, Admin, Devotee name"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.muted }}>Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
                style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }}
                placeholder="Optional caption shown below the image in the gallery…"
              />
            </div>

            {editError && (
              <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: C.red }}>
                <AlertCircle size={13} />{editError}
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: editSaving ? "#999" : C.green }}>
                {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditItem(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────── */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4" style={{ border: `1px solid ${C.border}` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${C.red}12` }}>
              <Trash2 size={22} color={C.red} />
            </div>
            <p className="font-bold text-sm text-center mb-2" style={{ color: C.text }}>Delete this item?</p>
            <p className="text-xs text-center mb-5" style={{ color: C.muted }}>
              This will permanently remove the {items.find(i => i.id === deleteConfirmId)?.type ?? "item"} from the gallery and delete the file. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: C.red }}>Delete</button>
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LostFoundSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { lostFoundApi } = await import("../services/lostFoundApi");
      const data = await lostFoundApi.getAdminItems();
      setItems(data.lost_items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (id: number) => {
    try {
      const { lostFoundApi } = await import("../services/lostFoundApi");
      await lostFoundApi.notifyUser(id);
      alert("Notification sent to the user successfully.");
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Failed to send notification.");
    }
  };

  if (loading) return <LoadingSpinner msg="Loading Lost & Found data..." />;

  const cols = ["ID", "Category", "Item", "Reporter", "Contact", "Status", "Actions"];
  const rows = items.map(item => [
    `#${item.id}`,
    item.category,
    item.description || "N/A",
    item.contact_name,
    item.contact_phone,
    <Chip status={item.status.toLowerCase()} />,
    <div className="flex items-center gap-1" key={item.id}>
      {item.status !== "Found" && (
        <button onClick={() => handleNotify(item.id)} className="px-2 py-1 bg-[#1F2F8C] text-white rounded text-xs font-semibold">
          Notify User
        </button>
      )}
    </div>
  ]);

  return (
    <div>
      <Head title="Lost & Found" sub="Manage reported items and notify users" />
      <Table cols={cols} rows={rows} />
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════
   SECTION: PARKING (AI-powered vehicle detection)
═══════════════════════════════════════════════════════════ */
function ParkingAdmin() {
  const [lots, setLots] = useState<ParkingLotAdmin[]>([]);
  const [snapshots, setSnapshots] = useState<Record<number, ParkingSnapshot[]>>({});
  const [selectedLot, setSelectedLot] = useState<ParkingLotAdmin | null>(null);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editLot, setEditLot] = useState<ParkingLotAdmin | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlots, setFormSlots] = useState("100");
  const [formCamera, setFormCamera] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLots = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await api.getAdminParkingLots();
      setLots(data);
      if (data.length > 0) setSelectedLot(prev => prev ? (data.find(l => l.id === prev.id) ?? data[0]) : data[0]);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to load parking lots.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLots(); }, [loadLots]);

  const loadSnapshots = useCallback(async (lotId: number) => {
    try {
      const snaps = await api.getParkingSnapshots(lotId, 20);
      setSnapshots(prev => ({ ...prev, [lotId]: snaps }));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (selectedLot) loadSnapshots(selectedLot.id); }, [selectedLot, loadSnapshots]);

  async function handleAnalyze(lot: ParkingLotAdmin) {
    setAnalyzing(lot.id);
    try {
      await api.triggerParkingAnalysis(lot.id);
      const [updatedLots, snaps] = await Promise.all([
        api.getAdminParkingLots(),
        api.getParkingSnapshots(lot.id, 20),
      ]);
      setLots(updatedLots);
      setSnapshots(prev => ({ ...prev, [lot.id]: snaps }));
      const updated = updatedLots.find(l => l.id === lot.id);
      if (updated) setSelectedLot(updated);
    } catch (e: unknown) {
      alert((e as Error).message ?? "Analysis failed.");
    } finally {
      setAnalyzing(null);
    }
  }

  function openForm(lot?: ParkingLotAdmin) {
    setEditLot(lot ?? null);
    setFormName(lot?.name ?? "");
    setFormSlots(String(lot?.total_slots ?? 100));
    setFormCamera(lot?.camera_url ?? "");
    setFormDesc(lot?.location_description ?? "");
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editLot) {
        await api.updateParkingLot(editLot.id, {
          name: formName, total_slots: Number(formSlots),
          camera_url: formCamera || undefined,
          location_description: formDesc || undefined,
        });
      } else {
        await api.createParkingLot({
          name: formName, total_slots: Number(formSlots),
          camera_url: formCamera || undefined,
          location_description: formDesc || undefined,
        });
      }
      setShowForm(false);
      await loadLots();
    } catch (e: unknown) {
      alert((e as Error).message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deactivate this parking lot?")) return;
    try {
      await api.deleteParkingLot(id);
      await loadLots();
      if (selectedLot?.id === id) setSelectedLot(null);
    } catch (e: unknown) {
      alert((e as Error).message ?? "Delete failed.");
    }
  }

  function getYouTubeEmbed(url: string | null) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (!match) return null;
    return `https://www.youtube.com/embed/${match[1]}?autoplay=0&mute=1&controls=1&rel=0`;
  }

  function slotColor(pct: number) {
    if (pct >= 90) return "#ef4444";
    if (pct >= 70) return "#f97316";
    if (pct >= 40) return "#eab308";
    return "#22c55e";
  }

  const lotSnaps = selectedLot ? (snapshots[selectedLot.id] ?? []) : [];
  const embedUrl = selectedLot ? getYouTubeEmbed(selectedLot.camera_url) : null;

  if (loading) return <LoadingSpinner msg="Loading parking lots…" />;
  if (error) return <ErrorBanner msg={error} onRetry={loadLots} />;

  return (
    <div>
      <Head
        title="Parking Management (AI)"
        sub="AI-powered vehicle detection — monitor slots and camera feeds"
        right={
          <button id="parking-add-lot-btn" onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: C.darkBlue }}>
            <Plus size={14} /> Add Lot
          </button>
        }
      />

      {/* Add / Edit Lot Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>
              {editLot ? "Edit Parking Lot" : "Add New Parking Lot"}
            </h3>
            <div className="flex flex-col gap-3">
              {([
                ["Lot Name *", formName, setFormName, "e.g. Main Parking Zone A", "text"],
                ["Total Slots *", formSlots, setFormSlots, "e.g. 150", "number"],
                ["Camera URL (YouTube)", formCamera, setFormCamera, "https://youtube.com/watch?v=...", "url"],
                ["Location Description", formDesc, setFormDesc, "e.g. Near Gate 1, North Side", "text"],
              ] as [string, string, (v: string) => void, string, string][]).map(([label, val, setter, ph, type]) => (
                <div key={label}>
                  <label className="text-[11px] font-semibold mb-1 block" style={{ color: C.muted }}>{label}</label>
                  <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ border: `1px solid ${C.border}`, color: C.text }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving || !formName || !formSlots}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: C.darkBlue, opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-3 gap-5">
        {/* Left: Lot List */}
        <div className="xl:col-span-1 flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Parking Lots</p>
          {lots.length === 0 && (
            <div className="text-xs text-center py-8 rounded-2xl"
              style={{ background: C.bg, color: C.muted, border: `1px dashed ${C.border}` }}>
              No lots configured. Click "Add Lot" to get started.
            </div>
          )}
          {lots.map(lot => {
            const color = slotColor(lot.occupancy_pct);
            const isSelected = selectedLot?.id === lot.id;
            return (
              <div key={lot.id} id={`parking-lot-${lot.id}`}
                onClick={() => setSelectedLot(lot)}
                className="rounded-2xl p-4 cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected ? `${C.darkBlue}0f` : C.bg,
                  border: `1.5px solid ${isSelected ? C.darkBlue : C.border}`,
                  boxShadow: isSelected ? `0 0 0 3px ${C.darkBlue}18` : undefined,
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: C.text }}>{lot.name}</p>
                    {lot.location_description && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: C.muted }}>📍 {lot.location_description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <IconBtn col={C.darkBlue} icon={<Edit2 size={11} />} tip="Edit" onClick={e => { e.stopPropagation(); openForm(lot); }} />
                    <IconBtn col={C.red} icon={<Trash2 size={11} />} tip="Deactivate" onClick={e => { e.stopPropagation(); handleDelete(lot.id); }} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] mb-1" style={{ color: C.muted }}>
                    <span>Occupied: <b style={{ color: "#ef4444" }}>{lot.occupied_slots}</b></span>
                    <span>Free: <b style={{ color: "#22c55e" }}>{lot.available_slots}</b></span>
                  </div>
                  <div style={{ background: "#e5e7eb", borderRadius: 6, height: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${lot.occupancy_pct}%`, background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: C.muted }}>
                    <span>{Math.round(lot.occupancy_pct)}% occupied</span>
                    <span>/{lot.total_slots} total</span>
                  </div>
                </div>
                <button id={`parking-analyze-${lot.id}`}
                  onClick={e => { e.stopPropagation(); handleAnalyze(lot); }}
                  disabled={analyzing === lot.id}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                  style={{ backgroundColor: `${C.darkBlue}12`, color: C.darkBlue, border: `1px solid ${C.darkBlue}30`, opacity: analyzing === lot.id ? 0.6 : 1 }}>
                  {analyzing === lot.id
                    ? <><Loader2 size={11} className="animate-spin" /> Analyzing…</>
                    : <><Activity size={11} /> Run AI Detection</>}
                </button>
                {!lot.is_active && (
                  <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#f3f4f6", color: C.muted }}>Inactive</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Detail panel */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          {!selectedLot ? (
            <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
              style={{ background: C.bg, border: `1px dashed ${C.border}` }}>
              <Camera size={32} style={{ color: C.muted }} className="mb-3" />
              <p className="text-xs font-semibold" style={{ color: C.muted }}>Select a parking lot to view details</p>
            </div>
          ) : (
            <>
              {/* Camera Feed */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2">
                    <Camera size={14} style={{ color: C.darkBlue }} />
                    <p className="text-xs font-bold" style={{ color: C.text }}>Live Camera Feed</p>
                    <span className="flex items-center gap-1 text-[10px] font-semibold"
                      style={{ color: embedUrl ? "#22c55e" : C.muted }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: embedUrl ? "#22c55e" : "#9ca3af" }} />
                      {embedUrl ? "Feed Active" : "No Feed Configured"}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: C.muted }}>{selectedLot.name}</span>
                </div>
                {embedUrl ? (
                  <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
                    <iframe id={`parking-video-${selectedLot.id}`}
                      src={embedUrl} title={`Camera: ${selectedLot.name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14"
                    style={{ background: "#0f172a", minHeight: 200 }}>
                    <Monitor size={36} style={{ color: "rgba(255,255,255,0.15)" }} className="mb-3" />
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No camera URL configured</p>
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                      Edit this lot and paste a YouTube URL to enable the feed
                    </p>
                  </div>
                )}
              </div>

              {/* AI Stat Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Slots", value: selectedLot.total_slots, color: C.darkBlue },
                  { label: "Occupied", value: selectedLot.occupied_slots, color: "#ef4444" },
                  { label: "Available", value: selectedLot.available_slots, color: "#22c55e" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 text-center" style={{ border: `1px solid ${C.border}` }}>
                    <p className="text-3xl font-extrabold" style={{ color }}>{value}</p>
                    <p className="text-[11px] uppercase tracking-wider mt-1 font-semibold" style={{ color: C.muted }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* AI Confidence Bar */}
              {lotSnaps.length > 0 && lotSnaps[0].confidence_score != null && (
                <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4"
                  style={{ border: `1px solid ${C.border}` }}>
                  <ShieldCheck size={18} style={{ color: C.green, flexShrink: 0 }} />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold" style={{ color: C.muted }}>AI Detection Confidence</p>
                    <div style={{ background: "#e5e7eb", borderRadius: 6, height: 8, marginTop: 6 }}>
                      <div style={{
                        height: "100%", width: `${(lotSnaps[0].confidence_score * 100).toFixed(0)}%`,
                        background: `linear-gradient(90deg, ${C.green}, #4ade80)`,
                        borderRadius: 6, transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                  <span className="text-sm font-extrabold" style={{ color: C.green }}>
                    {(lotSnaps[0].confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Detection History Table */}
              {lotSnaps.length > 0 ? (
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                  <div className="px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <p className="text-xs font-bold" style={{ color: C.text }}>AI Detection History (last 20 scans)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr>{["Time", "Occupied", "Available", "Confidence", "Boxes Detected"].map(h => <Th key={h} ch={h} />)}</tr></thead>
                      <tbody>
                        {lotSnaps.map(snap => (
                          <tr key={snap.id} className="hover:bg-gray-50 transition-colors">
                            <Td>{new Date(snap.recorded_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
                            <Td><span className="font-bold" style={{ color: "#ef4444" }}>{snap.occupied_slots}</span></Td>
                            <Td><span className="font-bold" style={{ color: "#22c55e" }}>{snap.available_slots}</span></Td>
                            <Td>{snap.confidence_score != null ? <span className="font-semibold" style={{ color: C.green }}>{(snap.confidence_score * 100).toFixed(0)}%</span> : "—"}</Td>
                            <Td>{snap.vehicle_boxes ? snap.vehicle_boxes.length : snap.occupied_slots}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl flex flex-col items-center justify-center py-10 text-center"
                  style={{ background: C.bg, border: `1px dashed ${C.border}` }}>
                  <Activity size={24} style={{ color: C.muted }} className="mb-2" />
                  <p className="text-xs" style={{ color: C.muted }}>No AI scans yet — click "Run AI Detection" to start.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ROOT — AdminPage
═══════════════════════════════════════════════════════════ */
export function AdminPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  // Auth guard — check token on mount
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    // Load current user info
    api.getMe().then(me => {
      setAdminName(me.name ?? "Admin");
      setAdminEmail(me.email ?? "");
    }).catch(() => {
      // Token invalid — redirect
      api.clearToken();
      navigate("/login", { replace: true });
    });
    // Load badge counts
    api.getStats().then(s => {
      setBadgeCounts({
        support: s.open_tickets,
        vehicle: s.pending_permits,
        donations: s.total_donations,
      });
    }).catch(() => { });
  }, [navigate]);

  function logout() {
    api.clearToken();
    navigate("/login", { replace: true });
  }

  const SECTION_TITLE: Record<Section, string> = {
    dashboard: "Dashboard", users: "User Management", donations: "Donations",
    vehicle: "Vehicle Permits", permissions: "Permissions", epass: "E-Pass & Bookings",
    parking: "Parking Management (AI)",
    
    livestatus: "Live Status", videoanalysis: "AI Video Analysis", gallery: "Gallery", announcements: "Announcements",
    support: "Support Tickets", reports: "Reports", lostfound: "Lost & Found",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: C.bg, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{ width: collapsed ? 0 : 220, backgroundColor: C.navy }}>

        <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <img src={logoImg} alt="logo" className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0"
            style={{ borderColor: C.orange }} />
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-white truncate leading-tight">Khatu Shyam Ji</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.orange }}>Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all"
              style={{ backgroundColor: section === item.id ? "rgba(247,148,29,0.18)" : "transparent", color: section === item.id ? C.orange : "rgba(255,255,255,0.55)" }}
              onMouseEnter={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-xs font-semibold flex-1 truncate">{item.label}</span>
              {badgeCounts[item.id] > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: C.orange, color: "white" }}>{badgeCounts[item.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={logout}
          className="flex items-center gap-3 px-5 py-4 text-xs font-semibold transition-all hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.40)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <LogOut size={14} /> Log Out
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 bg-white"
          style={{ borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(c => !c)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: C.muted }}>
              <MenuIcon size={18} />
            </button>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>{SECTION_TITLE[section]}</p>
              <p className="text-[11px]" style={{ color: C.muted }}>Khatu Shyam Ji Temple · Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative" style={{ color: C.muted }}>
              <Bell size={17} />
              {(badgeCounts.support ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.orange }} />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: C.darkBlue }}>{adminName.charAt(0).toUpperCase()}</div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold" style={{ color: C.text }}>{adminName}</p>
                <p className="text-[10px]" style={{ color: C.muted }}>{adminEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          {section === "dashboard" && <Dashboard />}
          {section === "users" && <UsersSection />}
          {section === "donations" && <Donations />}
          {section === "vehicle" && <VehiclePermits />}
          {section === "permissions" && <Permissions />}
          {section === "epass" && <EPass />}
          {section === "livestatus" && <LiveStatus />}
          {section === "videoanalysis" && <VideoAnalysis />}
          {section === "gallery" && <Gallery />}
          {section === "announcements" && <Announcements />}
          {section === "support" && <Support />}
          {section === "reports" && <Reports />}
          {section === "lostfound" && <LostFoundSection />}
          {section === "parking" && <ParkingAdmin />}
        </main>
      </div>
    </div>
  );
}
