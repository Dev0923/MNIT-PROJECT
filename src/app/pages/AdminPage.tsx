import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import logoImg from "../../imports/image-21.png";
import * as api from "../services/adminApi";
import type {
  AdminUser, AdminDonation, AdminBooking,
  AdminSupportTicket, AdminVehiclePermit, AdminStats, Announcement,
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
  | "livestatus" | "gallery" | "announcements" | "support" | "reports"
  | "users" | "lostfound";

/* ─── sidebar nav ───────────────────────────────────────── */
const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "users", label: "Users", icon: <Users size={16} /> },
  { id: "donations", label: "Donations", icon: <IndianRupee size={16} /> },
  { id: "epass", label: "E-Pass & Bookings", icon: <UserCheck size={16} /> },
  { id: "vehicle", label: "Vehicle Permits", icon: <Car size={16} /> },
  { id: "permissions", label: "Permissions", icon: <ClipboardList size={16} /> },
  { id: "livestatus", label: "Live Status", icon: <Radio size={16} /> },
  { id: "gallery", label: "Gallery", icon: <Images size={16} /> },
  { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
  { id: "support", label: "Support", icon: <MessageCircle size={16} /> },
  { id: "reports", label: "Reports", icon: <BarChart2 size={16} /> },
  { id: "lostfound", label: "Lost & Found", icon: <Search size={16} /> },
];

/* ─── Status maps ───────────────────────────────────────── */
const STATUS_MAP: Record<string, { bg: string; tc: string; dot: string }> = {
  pending:     { bg: "#FEF9C3", tc: "#854D0E", dot: "#EAB308" },
  Pending:     { bg: "#FEF9C3", tc: "#854D0E", dot: "#EAB308" },
  approved:    { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  Approved:    { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  completed:   { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  active:      { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  rejected:    { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  Denied:      { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  expired:     { bg: "#F3F4F6", tc: "#6B7280", dot: "#9CA3AF" },
  inactive:    { bg: "#F3F4F6", tc: "#6B7280", dot: "#9CA3AF" },
  used:        { bg: "#EDE9FE", tc: "#5B21B6", dot: "#8B5CF6" },
  open:        { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  resolved:    { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  "in-progress": { bg: "#DBEAFE", tc: "#1D4ED8", dot: "#3B82F6" },
  new:         { bg: "#DBEAFE", tc: "#1D4ED8", dot: "#3B82F6" },
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
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setBookings(await api.getBookings(q || undefined)); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [q]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const individual = bookings.filter(b => b.booking_type === "individual").length;
  const group = bookings.filter(b => b.booking_type === "group").length;

  return (
    <div>
      <Head title="E-Pass & Darshan Bookings"
        sub={`${bookings.length} total bookings — ${individual} individual, ${group} group`}
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: C.darkBlue }}><Download size={13} />Export</button>}
      />
      {error && <ErrorBanner msg={error} onRetry={load} />}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Bookings", value: bookings.length, color: C.darkBlue },
          { label: "Individual", value: individual, color: C.green },
          { label: "Group", value: group, color: C.orange },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center"
            style={{ border: `1.5px solid ${C.border}`, borderTop: `3px solid ${s.color}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} ph="Search by booking ID, phone, or city…" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <Table
          cols={["Booking ID", "Type", "Visit Date", "Phone", "City", "Booked On"]}
          rows={bookings.map(b => [
            <span className="font-mono font-semibold" style={{ color: C.darkBlue }}>{b.booking_id}</span>,
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: b.booking_type === "group" ? `${C.orange}15` : `${C.darkBlue}12`, color: b.booking_type === "group" ? C.orange : C.darkBlue }}>
              {b.booking_type}
            </span>,
            <span style={{ color: C.text }}>{fmtDate(b.date)}</span>,
            <span style={{ color: C.muted }}>{b.phone}</span>,
            <span style={{ color: C.muted }}>{b.city}</span>,
            <span style={{ color: C.muted }}>{fmtDate(b.created_at)}</span>,
          ])}
        />
      )}
      {!loading && bookings.length === 0 && (
        <p className="text-center text-xs py-12" style={{ color: C.muted }}>No bookings found.</p>
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
  return (
    <div>
      <Head title="Permission Management"
        sub="Bandhara, Medical Camp & Other permissions — managed via Vehicle Permits section." />
      <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center gap-3"
        style={{ border: `1px solid ${C.border}` }}>
        <ClipboardList size={36} color={C.border} />
        <p className="text-sm font-semibold" style={{ color: C.muted }}>
          Permission types (Bandhara, Medical Camps, etc.) are managed through the Vehicle Permits section.
        </p>
        <p className="text-xs text-center max-w-sm" style={{ color: C.muted }}>
          Switch to "Vehicle Permits" in the sidebar to approve or deny permission requests.
        </p>
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
  const [counts, setCounts] = useState(CAMERAS.map(c => c.count));
  const [liveTime, setLiveTime] = useState(new Date());
  const [smartMsg, setSmartMsg] = useState("");
  const [screenMode, setScreenMode] = useState<"crowd" | "wait" | "both" | "custom">("both");
  const [broadcast, setBroadcast] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCounts(prev => prev.map(n => Math.max(0, n + Math.floor((Math.random() - 0.4) * 8))));
      setLiveTime(new Date());
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const totalCount = counts.reduce((a, b) => a + b, 0);
  const activeCam = CAMERAS.find(c => c.id === selCam) ?? CAMERAS[0];
  const selCount = counts[CAMERAS.findIndex(c => c.id === selCam)];
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
          <p className="text-[11px] font-mono" style={{ color: C.muted }}>
            {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 relative" style={{ aspectRatio: "16/9", backgroundColor: "#0a0a0a", minHeight: 220 }}>
            <img src={activeCam.img} alt={activeCam.label} className="w-full h-full object-cover opacity-85" />
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
                  <Activity size={10} color={C.orange} />AI Count: <strong className="text-white ml-1">{selCount?.toLocaleString()} people</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 border-l" style={{ borderColor: C.border }}>
            {CAMERAS.map((cam, i) => (
              <button key={cam.id} onClick={() => setSelCam(cam.id)}
                className="relative overflow-hidden transition-all"
                style={{ aspectRatio: "16/9", borderBottom: `1px solid ${C.border}`, outline: selCam === cam.id ? `2px solid ${C.orange}` : "none", outlineOffset: "-2px" }}>
                <img src={cam.img} alt={cam.label} className="w-full h-full object-cover"
                  style={{ filter: cam.status === "offline" ? "grayscale(1) brightness(0.4)" : selCam === cam.id ? "brightness(1)" : "brightness(0.6)" }} />
                <div className="absolute inset-0 px-1.5 py-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: cam.status === "offline" ? "rgba(0,0,0,0.7)" : "rgba(220,38,38,0.85)", color: "white" }}>
                      {cam.status === "offline" ? "OFF" : "● LIVE"}
                    </span>
                    <span className="text-[9px] font-bold" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "1px 4px", borderRadius: 3 }}>{cam.id}</span>
                  </div>
                  <div style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent)", padding: "4px 4px 2px" }}>
                    <p className="text-white text-[9px] font-bold leading-tight truncate">{cam.label}</p>
                    {cam.status === "online" && <p className="text-[9px]" style={{ color: C.orange }}>{counts[i]} ppl</p>}
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
                AI Count: {totalCount.toLocaleString()} people · Parking: {parking}
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
   SECTION: GALLERY (unchanged)
═══════════════════════════════════════════════════════════ */
const GALLERY_THUMBS = [
  { url: "https://images.unsplash.com/photo-1768731764777-de5860f41126?w=400&q=70", title: "Sacred Shikhara", type: "photo" },
  { url: "https://images.unsplash.com/photo-1605302977545-3a09913be1dd?w=400&q=70", title: "Sacred Diya", type: "photo" },
  { url: "https://images.unsplash.com/photo-1767278608250-e87182850006?w=400&q=70", title: "Festival by River", type: "photo" },
  { url: "https://images.unsplash.com/photo-1636227597176-c554bcbee419?w=400&q=70", title: "Evening Diyas", type: "photo" },
  { url: "https://images.unsplash.com/photo-1616787671779-eed71117a65e?w=400&q=70", title: "Hands Raised", type: "photo" },
  { url: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?w=400&q=70", title: "Bhajan Sandhya", type: "video" },
];

function Gallery() {
  return (
    <div>
      <Head title="Gallery Management" sub="Upload, organise and remove temple photos and videos."
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.darkBlue }}><Plus size={13} />Upload Media</button>} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY_THUMBS.map((item, i) => (
          <div key={i} className="group relative rounded-xl overflow-hidden bg-gray-100" style={{ border: `1px solid ${C.border}`, aspectRatio: "4/3" }}>
            <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3"
              style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)" }}>
              <div className="flex justify-end gap-1.5">
                <button className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: C.orange }}><Edit2 size={12} /></button>
                <button className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: C.red }}><Trash2 size={12} /></button>
              </div>
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: item.type === "video" ? C.pink : C.orange }}>{item.type}</span>
                <p className="text-white text-xs font-semibold mt-1">{item.title}</p>
              </div>
            </div>
          </div>
        ))}
        <button className="rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-orange-400"
          style={{ border: `2px dashed ${C.border}`, aspectRatio: "4/3" }}>
          <Plus size={22} color={C.border} /><span className="text-xs font-semibold" style={{ color: C.muted }}>Upload</span>
        </button>
      </div>
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
    info:     { color: C.darkBlue, label: "ℹ️  Info",     desc: "General information" },
    warning:  { color: C.orange,   label: "⚠️  Warning",  desc: "Important notice" },
    critical: { color: C.red,      label: "🚨 Critical",  desc: "Urgent / emergency" },
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
    }).catch(() => {});
  }, [navigate]);

  function logout() {
    api.clearToken();
    navigate("/login", { replace: true });
  }

  const SECTION_TITLE: Record<Section, string> = {
    dashboard: "Dashboard", users: "User Management", donations: "Donations",
    vehicle: "Vehicle Permits", permissions: "Permissions", epass: "E-Pass & Bookings",
    livestatus: "Live Status", gallery: "Gallery", announcements: "Announcements",
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
          {section === "gallery" && <Gallery />}
          {section === "announcements" && <Announcements />}
          {section === "support" && <Support />}
          {section === "reports" && <Reports />}
          {section === "lostfound" && <LostFoundSection />}
        </main>
      </div>
    </div>
  );
}
