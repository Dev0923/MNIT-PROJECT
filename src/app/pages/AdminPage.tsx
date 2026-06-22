import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, IndianRupee, Users2, ClipboardList,
  Radio, Images, Megaphone, MessageCircle, BarChart2,
  LogOut, Search, Plus, Download, Check, X, Eye,
  TrendingUp, TrendingDown, Bell, Edit2, Trash2, RefreshCw,
  CheckCircle2, Menu as MenuIcon, UserCheck,
  Clock, Car, Stethoscope, Landmark, AlertCircle,
  Monitor, Camera, Maximize2, Wifi, Activity, Send, Signal,
} from "lucide-react";
import logoImg from "../../imports/image-21.png";

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
type Section = "dashboard" | "donations" | "vehicle" | "permissions" | "epass" | "livestatus" | "gallery" | "announcements" | "support" | "reports";
type St = "pending" | "approved" | "rejected" | "completed" | "active" | "inactive" | "used" | "expired" | "open" | "resolved" | "in-progress" | "new";

/* ─── mock data ─────────────────────────────────────────── */
const DONATIONS: { id: string; name: string; mobile: string; purpose: string; amount: number; want80G: boolean; date: string; status: St }[] = [
  { id: "DON001", name: "Ramesh Sharma", mobile: "98765 43210", purpose: "Temple Maintenance", amount: 5001, want80G: true, date: "20 Jun 2026", status: "completed" },
  { id: "DON002", name: "Priya Agarwal", mobile: "91234 56789", purpose: "Annadaan (Food Seva)", amount: 1001, want80G: false, date: "20 Jun 2026", status: "completed" },
  { id: "DON003", name: "Suresh Gupta", mobile: "99887 76655", purpose: "Special Puja & Havan", amount: 11000, want80G: true, date: "19 Jun 2026", status: "completed" },
  { id: "DON004", name: "Meena Verma", mobile: "95678 90123", purpose: "Gau Seva", amount: 501, want80G: false, date: "19 Jun 2026", status: "pending" },
  { id: "DON005", name: "Anil Kumar", mobile: "97654 32109", purpose: "Education Fund", amount: 2100, want80G: true, date: "18 Jun 2026", status: "completed" },
  { id: "DON006", name: "Kavita Joshi", mobile: "96543 21098", purpose: "Flower & Decoration", amount: 301, want80G: false, date: "18 Jun 2026", status: "completed" },
  { id: "DON007", name: "Deepak Mishra", mobile: "95432 10987", purpose: "General Donation", amount: 1100, want80G: true, date: "17 Jun 2026", status: "pending" },
  { id: "DON008", name: "Sunita Pandey", mobile: "94321 09876", purpose: "Langar Seva", amount: 5000, want80G: false, date: "17 Jun 2026", status: "completed" },
  { id: "DON009", name: "Vijay Yadav", mobile: "93210 98765", purpose: "Disaster Relief", amount: 2001, want80G: true, date: "16 Jun 2026", status: "completed" },
  { id: "DON010", name: "Anita Singh", mobile: "92109 87654", purpose: "Temple Maintenance", amount: 11000, want80G: true, date: "16 Jun 2026", status: "completed" },
];

const PERMISSIONS: { id: string; name: string; vehicle: string; type: string; subtype: string; date: string; purpose: string; status: St }[] = [
  { id: "VEH001", name: "Rajesh Patel", vehicle: "RJ-14-AB-1234", type: "Vehicle", subtype: "Car", date: "22 Jun 2026", purpose: "Pilgrimage", status: "pending" },
  { id: "VEH002", name: "Sita Devi", vehicle: "RJ-21-CD-5678", type: "Vehicle", subtype: "Bus", date: "22 Jun 2026", purpose: "Group Darshan", status: "approved" },
  { id: "BAN001", name: "Mahesh Trust", vehicle: "—", type: "Bandhara", subtype: "Community", date: "21 Jun 2026", purpose: "Langar Ekadashi", status: "pending" },
  { id: "MED001", name: "Dr. A. Sharma", vehicle: "—", type: "Medical", subtype: "Health Camp", date: "20 Jun 2026", purpose: "Free OPD", status: "approved" },
  { id: "VEH003", name: "Krishna Goswami", vehicle: "MP-09-EF-9012", type: "Vehicle", subtype: "Car", date: "20 Jun 2026", purpose: "Pilgrimage", status: "rejected" },
  { id: "OTH001", name: "Shyam Sena", vehicle: "—", type: "Other", subtype: "Stall", date: "19 Jun 2026", purpose: "Prasad Stall", status: "pending" },
  { id: "VEH004", name: "Lalita Prasad", vehicle: "UP-32-GH-3456", type: "Vehicle", subtype: "Tempo", date: "19 Jun 2026", purpose: "Group Visit", status: "pending" },
  { id: "BAN002", name: "Agarwal Parivar", vehicle: "—", type: "Bandhara", subtype: "Family", date: "18 Jun 2026", purpose: "Bhandara Seva", status: "approved" },
];

const EPASSES: { id: string; devotee: string; mobile: string; date: string; slot: string; type: string; status: St }[] = [
  { id: "EP001", devotee: "Ramesh Sharma", mobile: "98765 43210", date: "21 Jun 2026", slot: "06:00 AM", type: "Sheegh Darshan", status: "active" },
  { id: "EP002", devotee: "Priya Gupta", mobile: "97654 32100", date: "21 Jun 2026", slot: "08:00 AM", type: "General", status: "active" },
  { id: "EP003", devotee: "Suresh Verma", mobile: "96543 21000", date: "21 Jun 2026", slot: "10:00 AM", type: "VIP Darshan", status: "used" },
  { id: "EP004", devotee: "Meena Singh", mobile: "95432 10000", date: "22 Jun 2026", slot: "06:00 AM", type: "Sheegh Darshan", status: "active" },
  { id: "EP005", devotee: "Anil Pandey", mobile: "94321 00000", date: "22 Jun 2026", slot: "12:00 PM", type: "General", status: "active" },
  { id: "EP006", devotee: "Kavita Tiwari", mobile: "93210 00000", date: "20 Jun 2026", slot: "04:00 AM", type: "Bhasma Aarti", status: "expired" },
];

const TICKETS: { id: string; name: string; email: string; subject: string; message: string; date: string; status: St }[] = [
  { id: "TKT001", name: "Rohit Jain", email: "rohit@gmail.com", subject: "E-Pass not received", message: "I booked an E-Pass on 18th June but haven't received the confirmation email yet. Please help.", date: "20 Jun 2026", status: "open" },
  { id: "TKT002", name: "Seema Agarwal", email: "seema@yahoo.com", subject: "Donation refund request", message: "Payment deducted but booking failed on 19th June. Transaction ref: 98765. Please process refund.", date: "19 Jun 2026", status: "resolved" },
  { id: "TKT003", name: "Amit Sharma", email: "amit@gmail.com", subject: "Vehicle permit rejected", message: "My vehicle permit VEH003 was rejected. I am a registered devotee travelling from Madhya Pradesh.", date: "19 Jun 2026", status: "open" },
  { id: "TKT004", name: "Nisha Gupta", email: "nisha@outlook.com", subject: "80G certificate pending", message: "I donated ₹11,000 on 16 June. The 80G certificate has not arrived in my email (XYZAB5678G).", date: "18 Jun 2026", status: "in-progress" },
  { id: "TKT005", name: "Pawan Mishra", email: "pawan@gmail.com", subject: "Darshan pass reschedule", message: "Requesting to reschedule pass EP006 from 20 June to 25 June due to a family emergency.", date: "17 Jun 2026", status: "resolved" },
];

const ANN_INIT = [
  { id: "A1", text: "Jai Shree Shyam  •  Online Puja Booking Now Available", active: true },
  { id: "A2", text: "Sheegh Darshan Pass — Book Online", active: true },
  { id: "A3", text: "Sandhya Aarti: 7:30 PM  •  Bhasma Aarti: 4:00 AM", active: true },
  { id: "A4", text: "Donation Portal Open  •  Annual Shyam Mahotsav — 15 June", active: true },
  { id: "A5", text: "Road diversion near Main Gate — plan your visit accordingly", active: false },
];

const GALLERY_THUMBS = [
  { url: "https://images.unsplash.com/photo-1768731764777-de5860f41126?w=400&q=70", title: "Sacred Shikhara", type: "photo" },
  { url: "https://images.unsplash.com/photo-1605302977545-3a09913be1dd?w=400&q=70", title: "Sacred Diya", type: "photo" },
  { url: "https://images.unsplash.com/photo-1767278608250-e87182850006?w=400&q=70", title: "Festival by River", type: "photo" },
  { url: "https://images.unsplash.com/photo-1636227597176-c554bcbee419?w=400&q=70", title: "Evening Diyas", type: "photo" },
  { url: "https://images.unsplash.com/photo-1616787671779-eed71117a65e?w=400&q=70", title: "Hands Raised", type: "photo" },
  { url: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?w=400&q=70", title: "Bhajan Sandhya", type: "video" },
  { url: "https://images.unsplash.com/photo-1617184003107-0df15fea4903?w=400&q=70", title: "Procession", type: "photo" },
  { url: "https://images.unsplash.com/photo-1663154048558-2510385fee89?w=400&q=70", title: "Crowd of Bhakts", type: "video" },
];

/* ─── sidebar nav ───────────────────────────────────────── */
const NAV: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "donations", label: "Donations", icon: <IndianRupee size={16} />, badge: 2 },
  { id: "vehicle", label: "Vehicle Permits", icon: <Car size={16} />, badge: 4 },
  { id: "permissions", label: "Permissions", icon: <ClipboardList size={16} />, badge: 3 },
  { id: "epass", label: "E-Pass & Passes", icon: <UserCheck size={16} /> },
  { id: "livestatus", label: "Live Status", icon: <Radio size={16} /> },
  { id: "gallery", label: "Gallery", icon: <Images size={16} /> },
  { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
  { id: "support", label: "Support", icon: <MessageCircle size={16} />, badge: 2 },
  { id: "reports", label: "Reports", icon: <BarChart2 size={16} /> },
];

/* ─── tiny helpers ──────────────────────────────────────── */
const STATUS_MAP: Record<string, { bg: string; tc: string; dot: string }> = {
  pending: { bg: "#FEF9C3", tc: "#854D0E", dot: "#EAB308" },
  approved: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  completed: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  active: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  rejected: { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  expired: { bg: "#F3F4F6", tc: "#6B7280", dot: "#9CA3AF" },
  inactive: { bg: "#F3F4F6", tc: "#6B7280", dot: "#9CA3AF" },
  used: { bg: "#EDE9FE", tc: "#5B21B6", dot: "#8B5CF6" },
  open: { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  resolved: { bg: "#DCFCE7", tc: "#166534", dot: "#22C55E" },
  "in-progress": { bg: "#DBEAFE", tc: "#1D4ED8", dot: "#3B82F6" },
  new: { bg: "#DBEAFE", tc: "#1D4ED8", dot: "#3B82F6" },
};

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
      style={{ backgroundColor: color }}>{name.charAt(0)}</div>
  );
}

function Kpi({ label, value, sub, icon, color, trend }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string; trend?: "up" | "down" }) {
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
function IconBtn({ col, icon, tip, onClick }: { col: string; icon: React.ReactNode; tip: string; onClick?: () => void }) {
  return (
    <button title={tip} onClick={onClick}
      className="p-1.5 rounded-lg transition-all hover:opacity-75"
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

/* ═══════════════════════════════════════════════════════════
   SECTION: DASHBOARD
═══════════════════════════════════════════════════════════ */
function Dashboard() {
  const totalDonated = DONATIONS.filter(d => d.status === "completed").reduce((s, d) => s + d.amount, 0);
  const pendingPerms = PERMISSIONS.filter(p => p.status === "pending").length;
  const openTickets = TICKETS.filter(t => t.status === "open").length;

  return (
    <div>
      <Head title="Dashboard" sub="Welcome back, Admin — here's today at a glance." />

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total Donations" value={`₹${(totalDonated / 1000).toFixed(0)}K`} sub="+12% from last week" icon={<IndianRupee size={20} />} color={C.green} trend="up" />
        <Kpi label="Pending Approvals" value={String(pendingPerms)} sub="Need your review" icon={<ClipboardList size={20} />} color={C.orange} trend="down" />
        <Kpi label="Active E-Passes" value="847" sub="Online + offline today" icon={<UserCheck size={20} />} color={C.darkBlue} trend="up" />
        <Kpi label="Open Support Tickets" value={String(openTickets)} sub="Awaiting response" icon={<MessageCircle size={20} />} color={C.pink} />
      </div>

      {/* Live pulse row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Darshan Wait", value: "45 Mins", color: C.darkBlue, icon: <Clock size={14} /> },
          { label: "Crowd Level", value: "Moderate", color: C.orange, icon: <Users2 size={14} /> },
          { label: "Parking", value: "Available", color: C.green, icon: <Car size={14} /> },
          { label: "Active Passes", value: "847", color: "#8B5CF6", icon: <UserCheck size={14} /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ border: `1px solid ${C.border}`, borderTop: `3px solid ${s.color}` }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{s.label}</p>
              <p className="text-sm font-extrabold" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent donations */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Recent Donations</p>
          <div className="flex flex-col gap-3">
            {DONATIONS.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center gap-3">
                <Avatar name={d.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{d.name}</p>
                  <p className="text-[11px] truncate" style={{ color: C.muted }}>{d.purpose}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: C.green }}>₹{d.amount.toLocaleString("en-IN")}</p>
                  <Chip status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending permissions */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Pending Approvals</p>
          <div className="flex flex-col gap-2">
            {PERMISSIONS.filter(p => p.status === "pending").map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: C.text }}>{p.name}</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>{p.type} · {p.purpose}</p>
                </div>
                <div className="flex gap-1.5">
                  <button className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    style={{ backgroundColor: `${C.green}15`, color: C.green }}><Check size={10} />OK</button>
                  <button className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    style={{ backgroundColor: `${C.red}15`, color: C.red }}><X size={10} />No</button>
                </div>
              </div>
            ))}
            {TICKETS.filter(t => t.status === "open").map(t => (
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
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: DONATIONS
═══════════════════════════════════════════════════════════ */
function Donations() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "completed" | "pending">("all");
  const rows = DONATIONS.filter(d => (f === "all" || d.status === f) && (q === "" || d.name.toLowerCase().includes(q.toLowerCase())));
  const total = rows.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <Head title="Donation Management" sub={`₹${total.toLocaleString("en-IN")} across ${rows.length} records`}
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.darkBlue }}><Download size={13} />Export CSV</button>} />
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchBar value={q} onChange={setQ} ph="Search donor name or ID…" />
        {(["all", "completed", "pending"] as const).map(v => (
          <button key={v} onClick={() => setF(v)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ backgroundColor: f === v ? C.darkBlue : "white", color: f === v ? "white" : C.muted, border: `1px solid ${f === v ? C.darkBlue : C.border}` }}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <Table
        cols={["ID", "Donor", "Mobile", "Purpose", "Amount", "80G", "Date", "Status", "Actions"]}
        rows={rows.map(d => [
          <span className="font-mono" style={{ color: C.muted }}>{d.id}</span>,
          <div className="flex items-center gap-2"><Avatar name={d.name} /><span style={{ color: C.text }}>{d.name}</span></div>,
          <span style={{ color: C.muted }}>{d.mobile}</span>,
          <span style={{ color: C.text }}>{d.purpose}</span>,
          <span className="font-bold" style={{ color: C.green }}>₹{d.amount.toLocaleString("en-IN")}</span>,
          d.want80G ? <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: `${C.green}15`, color: C.green }}>Yes</span>
            : <span style={{ color: C.muted }}>No</span>,
          <span style={{ color: C.muted }}>{d.date}</span>,
          <Chip status={d.status} />,
          <div className="flex gap-1"><IconBtn col={C.darkBlue} icon={<Eye size={12} />} tip="View" /><IconBtn col={C.orange} icon={<Edit2 size={12} />} tip="Edit" /></div>,
        ])}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: VEHICLE PERMITS
═══════════════════════════════════════════════════════════ */

const VEHICLE_DATA = PERMISSIONS.filter(p => p.type === "Vehicle");

const VEHICLE_TYPES = ["Car", "Bus", "Tempo", "Bike", "Other"];

function VehiclePermits() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | St>("all");
  const [ovr, setOvr] = useState<Record<string, St>>({});
  const [typeFilter, setTypeFilter] = useState("all");

  const getStatus = (p: typeof VEHICLE_DATA[0]): St => ovr[p.id] ?? p.status;

  const active = VEHICLE_DATA.filter(p => getStatus(p) === "approved");
  const pending = VEHICLE_DATA.filter(p => getStatus(p) === "pending");
  const rejected = VEHICLE_DATA.filter(p => getStatus(p) === "rejected");

  const visible = VEHICLE_DATA.filter(p =>
    (filter === "all" || getStatus(p) === filter) &&
    (typeFilter === "all" || p.subtype === typeFilter) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.vehicle.toLowerCase().includes(q.toLowerCase()))
  );

  const TODAY = "20 Jun 2026";

  return (
    <div>
      <Head title="Vehicle Permits"
        sub={`All vehicle permission requests for ${TODAY}`}
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.darkBlue }}><Download size={13} />Export</button>} />

      {/* ── Summary cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Applications", value: VEHICLE_DATA.length, color: C.darkBlue, sub: "all requests" },
          { label: "Approved — Active", value: active.length, color: C.green, sub: "on premises today" },
          { label: "Pending Review", value: pending.length, color: "#D97706", sub: "awaiting decision" },
          { label: "Rejected", value: rejected.length, color: C.red, sub: "not permitted" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center"
            style={{ border: `1.5px solid ${C.border}`, borderTop: `3px solid ${s.color}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] mt-1" style={{ color: C.muted }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Vehicle-type breakdown ───────────────────────── */}
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: `1px solid ${C.border}` }}>
        <p className="text-xs font-bold mb-3" style={{ color: C.text }}>Breakdown by Vehicle Type</p>
        <div className="flex flex-wrap gap-3">
          {VEHICLE_TYPES.map(vt => {
            const cnt = VEHICLE_DATA.filter(p => p.subtype === vt).length;
            const act = VEHICLE_DATA.filter(p => p.subtype === vt && getStatus(p) === "approved").length;
            if (cnt === 0) return null;
            return (
              <button key={vt} onClick={() => setTypeFilter(typeFilter === vt ? "all" : vt)}
                className="flex flex-col items-center px-5 py-3 rounded-xl transition-all"
                style={{
                  backgroundColor: typeFilter === vt ? `${C.darkBlue}10` : C.bg,
                  border: `1.5px solid ${typeFilter === vt ? C.darkBlue : C.border}`,
                  minWidth: 80,
                }}>
                <p className="text-xl font-extrabold" style={{ color: typeFilter === vt ? C.darkBlue : C.text }}>{cnt}</p>
                <p className="text-[11px] font-bold" style={{ color: typeFilter === vt ? C.darkBlue : C.muted }}>{vt}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.green }}>{act} active</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter + search bar ──────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchBar value={q} onChange={setQ} ph="Search by name or vehicle number…" />
        {(["all", "approved", "pending", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: filter === f ? C.darkBlue : C.white,
              color: filter === f ? "white" : C.muted,
              border: `1px solid ${filter === f ? C.darkBlue : C.border}`,
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <Table
        cols={["ID", "Applicant", "Vehicle No.", "Type", "Date", "Purpose", "Status", "Actions"]}
        rows={visible.map(p => {
          const st = getStatus(p);
          return [
            <span className="font-mono" style={{ color: C.muted }}>{p.id}</span>,
            <div className="flex items-center gap-2">
              <Avatar name={p.name} color={C.darkBlue} />
              <span style={{ color: C.text }}>{p.name}</span>
            </div>,
            <span className="font-mono font-semibold" style={{ color: C.darkBlue }}>{p.vehicle !== "—" ? p.vehicle : "—"}</span>,
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: `${C.darkBlue}12`, color: C.darkBlue }}>{p.subtype}</span>,
            <span style={{ color: C.muted }}>{p.date}</span>,
            <span style={{ color: C.text }}>{p.purpose}</span>,
            <Chip status={st} />,
            st === "pending"
              ? <div className="flex gap-1">
                <button onClick={() => setOvr(o => ({ ...o, [p.id]: "approved" }))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{ backgroundColor: `${C.green}15`, color: C.green }}><Check size={10} />Approve</button>
                <button onClick={() => setOvr(o => ({ ...o, [p.id]: "rejected" }))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{ backgroundColor: `${C.red}15`, color: C.red }}><X size={10} />Reject</button>
              </div>
              : <IconBtn col={C.muted} icon={<RefreshCw size={12} />} tip="Reset"
                onClick={() => setOvr(o => ({ ...o, [p.id]: "pending" }))} />,
          ];
        })}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: PERMISSIONS
═══════════════════════════════════════════════════════════ */
function Permissions() {
  const [tab, setTab] = useState<"all" | "Bandhara" | "Medical" | "Other">("all");
  const [ovr, setOvr] = useState<Record<string, St>>({});

  const getStatus = (p: typeof PERMISSIONS[0]): St => ovr[p.id] ?? p.status;

  const activeOf = (type: string) => PERMISSIONS.filter(p => p.type === type && getStatus(p) === "approved").length;
  const pendingOf = (type: string) => PERMISSIONS.filter(p => p.type === type && getStatus(p) === "pending").length;
  const totalOf = (type: string) => PERMISSIONS.filter(p => p.type === type).length;

  const TODAY = "20 Jun 2026";

  const SUMMARY = [
    {
      type: "Bandhara", label: "Active Bhandara", icon: <Users2 size={20} />, color: "#7C3AED",
      active: activeOf("Bandhara"), pending: pendingOf("Bandhara"), total: totalOf("Bandhara"),
      desc: "Community & family langars",
    },
    {
      type: "Medical", label: "Medical Camps", icon: <Stethoscope size={20} />, color: C.pink,
      active: activeOf("Medical"), pending: pendingOf("Medical"), total: totalOf("Medical"),
      desc: "Health camps & OPDs",
    },
    {
      type: "Other", label: "Other Permissions", icon: <Landmark size={20} />, color: C.orange,
      active: activeOf("Other"), pending: pendingOf("Other"), total: totalOf("Other"),
      desc: "Stalls, events & misc.",
    },
  ];

  // Exclude Vehicle — they have their own section
  const rows = PERMISSIONS.filter(p => p.type !== "Vehicle" && (tab === "all" || p.type === tab));

  return (
    <div>
      <Head title="Permission Management"
        sub={`Bandhara, Medical Camp & Other permissions — ${TODAY}. Vehicle permits have their own section.`} />

      {/* ── Today's active summary ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {SUMMARY.map(s => (
          <button
            key={s.type}
            onClick={() => setTab(s.type as any)}
            className="text-left rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
              backgroundColor: C.white,
              border: `1.5px solid ${tab === s.type ? s.color : C.border}`,
              boxShadow: tab === s.type ? `0 4px 16px ${s.color}22` : "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Icon + active badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${s.color}14`, color: s.color }}>
                {s.icon}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Active today</p>
                <p className="text-2xl font-extrabold leading-none" style={{ color: s.active > 0 ? s.color : C.muted }}>
                  {s.active}
                </p>
              </div>
            </div>

            {/* Label + desc */}
            <p className="text-xs font-bold mb-0.5" style={{ color: C.text }}>{s.label}</p>
            <p className="text-[10px] mb-3" style={{ color: C.muted }}>{s.desc}</p>

            {/* Mini stats row */}
            <div className="flex items-center gap-3 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="text-center">
                <p className="text-[10px]" style={{ color: C.muted }}>Total</p>
                <p className="text-xs font-bold" style={{ color: C.text }}>{s.total}</p>
              </div>
              <div className="w-px h-5" style={{ backgroundColor: C.border }} />
              <div className="text-center">
                <p className="text-[10px]" style={{ color: C.muted }}>Pending</p>
                <p className="text-xs font-bold" style={{ color: s.pending > 0 ? "#D97706" : C.muted }}>{s.pending}</p>
              </div>
              <div className="w-px h-5" style={{ backgroundColor: C.border }} />
              <div className="text-center">
                <p className="text-[10px]" style={{ color: C.muted }}>Approved</p>
                <p className="text-xs font-bold" style={{ color: s.active > 0 ? C.green : C.muted }}>{s.active}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Tab filter ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "Bandhara", "Medical", "Other"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: tab === t ? C.darkBlue : C.white,
              color: tab === t ? "white" : C.muted,
              border: `1px solid ${tab === t ? C.darkBlue : C.border}`,
            }}>
            {t}{t !== "all" && ` (${PERMISSIONS.filter(p => p.type === t).length})`}
          </button>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <Table
        cols={["ID", "Applicant", "Type", "Detail", "Purpose", "Date", "Status", "Actions"]}
        rows={rows.map(p => {
          const st = getStatus(p);
          const typeColor = p.type === "Medical" ? C.pink : p.type === "Bandhara" ? "#7C3AED" : C.orange;
          return [
            <span className="font-mono" style={{ color: C.muted }}>{p.id}</span>,
            <span style={{ color: C.text }}>{p.name}</span>,
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>{p.type}</span>,
            <span style={{ color: C.muted }}>{p.vehicle !== "—" ? p.vehicle : p.subtype}</span>,
            <span style={{ color: C.text }}>{p.purpose}</span>,
            <span style={{ color: C.muted }}>{p.date}</span>,
            <Chip status={st} />,
            st === "pending"
              ? <div className="flex gap-1">
                <button onClick={() => setOvr(o => ({ ...o, [p.id]: "approved" }))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{ backgroundColor: `${C.green}15`, color: C.green }}><Check size={10} />Approve</button>
                <button onClick={() => setOvr(o => ({ ...o, [p.id]: "rejected" }))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{ backgroundColor: `${C.red}15`, color: C.red }}><X size={10} />Reject</button>
              </div>
              : <IconBtn col={C.muted} icon={<RefreshCw size={12} />} tip="Reset"
                onClick={() => setOvr(o => ({ ...o, [p.id]: "pending" }))} />,
          ];
        })}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: E-PASS
═══════════════════════════════════════════════════════════ */

type SlotRow = {
  id: string; name: string; color: string;
  total: number; onlineLimit: number; onlineRegistered: number; offlineEnrolled: number;
};

const SLOT_INIT: SlotRow[] = [
  { id: "s1", name: "04:00 AM — Bhasma Aarti", color: C.red, total: 50, onlineLimit: 30, onlineRegistered: 30, offlineEnrolled: 20 },
  { id: "s2", name: "06:00 AM — Sheegh Darshan", color: C.green, total: 200, onlineLimit: 150, onlineRegistered: 87, offlineEnrolled: 45 },
  { id: "s3", name: "08:00 AM — General", color: C.orange, total: 500, onlineLimit: 350, onlineRegistered: 312, offlineEnrolled: 85 },
  { id: "s4", name: "12:00 PM — Afternoon", color: C.darkBlue, total: 300, onlineLimit: 200, onlineRegistered: 145, offlineEnrolled: 60 },
];

function EPass() {
  const [slots, setSlots] = useState<SlotRow[]>(SLOT_INIT);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftLimit, setDraft] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  function startEdit(s: SlotRow) { setEditing(s.id); setDraft(String(s.onlineLimit)); }

  function saveLimit(id: string) {
    const val = Math.max(0, parseInt(draftLimit) || 0);
    setSlots(prev => prev.map(s => s.id === id ? { ...s, onlineLimit: val } : s));
    setEditing(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  }

  const totalOnline = slots.reduce((a, s) => a + s.onlineRegistered, 0);
  const totalOffline = slots.reduce((a, s) => a + s.offlineEnrolled, 0);
  const totalAll = totalOnline + totalOffline;

  return (
    <div>
      <Head title="E-Pass & Darshan Passes"
        sub="Online registrations, offline enrolments, and capacity management per slot."
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.darkBlue }}><Plus size={13} />Issue Pass</button>} />

      {/* ── Summary KPI strip ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Online Registered</p>
          <p className="text-3xl font-extrabold" style={{ color: C.darkBlue }}>{totalOnline}</p>
          <p className="text-[11px] mt-1" style={{ color: C.muted }}>via website / app</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Offline Enrolled</p>
          <p className="text-3xl font-extrabold" style={{ color: C.orange }}>{totalOffline}</p>
          <p className="text-[11px] mt-1" style={{ color: C.muted }}>at counter / camp</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Total Today</p>
          <p className="text-3xl font-extrabold" style={{ color: C.green }}>{totalAll}</p>
          <p className="text-[11px] mt-1" style={{ color: C.muted }}>across all slots</p>
        </div>
      </div>

      {/* ── Per-slot cards ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-6">
        {slots.map(s => {
          const remaining = Math.max(0, s.onlineLimit - s.onlineRegistered);
          const totalUsed = s.onlineRegistered + s.offlineEnrolled;
          const onlinePct = Math.min(100, (s.onlineRegistered / s.total) * 100);
          const offlinePct = Math.min(100, (s.offlineEnrolled / s.total) * 100);
          const isFull = remaining === 0;
          const isEditing = editing === s.id;

          return (
            <div key={s.id} className="bg-white rounded-2xl p-5" style={{ border: `1.5px solid ${C.border}`, borderLeft: `4px solid ${s.color}` }}>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <p className="font-bold text-sm" style={{ color: C.text }}>{s.name}</p>
                  <p className="text-xs" style={{ color: C.muted }}>Total capacity: <strong style={{ color: C.text }}>{s.total}</strong> &nbsp;·&nbsp; Used: <strong style={{ color: C.text }}>{totalUsed}</strong></p>
                </div>
                <Chip status={isFull ? "expired" : "active"} />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {/* Online registered */}
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${C.darkBlue}08`, border: `1px solid ${C.darkBlue}20` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.darkBlue }}>Online Registered</p>
                  <p className="text-xl font-extrabold" style={{ color: C.darkBlue }}>{s.onlineRegistered}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>via website / app</p>
                </div>

                {/* Offline enrolled */}
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${C.orange}08`, border: `1px solid ${C.orange}20` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.orange }}>Offline Enrolled</p>
                  <p className="text-xl font-extrabold" style={{ color: C.orange }}>{s.offlineEnrolled}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>at counter / camp</p>
                </div>

                {/* Remaining online slots */}
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: isFull ? `${C.red}08` : `${C.green}08`, border: `1px solid ${isFull ? C.red : C.green}20` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: isFull ? C.red : C.green }}>Remaining Online</p>
                  <p className="text-xl font-extrabold" style={{ color: isFull ? C.red : C.green }}>{remaining}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>slots still open</p>
                </div>

                {/* Online limit — editable */}
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${C.muted}08`, border: `1px solid ${C.border}`, position: "relative" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Online Limit</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" value={draftLimit}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveLimit(s.id)}
                        className="w-16 text-lg font-extrabold outline-none px-1 rounded border"
                        style={{ color: C.text, borderColor: C.orange }}
                        autoFocus
                        min={s.onlineRegistered} max={s.total}
                      />
                      <button onClick={() => saveLimit(s.id)}
                        className="p-1 rounded-lg" style={{ backgroundColor: `${C.green}18`, color: C.green }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="p-1 rounded-lg" style={{ backgroundColor: `${C.red}12`, color: C.red }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-extrabold" style={{ color: saved === s.id ? C.green : C.text }}>
                        {s.onlineLimit}
                      </p>
                      <button onClick={() => startEdit(s)}
                        className="p-1 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: `${C.orange}12`, color: C.orange }}>
                        <Edit2 size={12} />
                      </button>
                      {saved === s.id && <CheckCircle2 size={14} color={C.green} />}
                    </div>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>max online bookings</p>
                </div>
              </div>

              {/* Stacked progress bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: C.muted }}>
                  <span>Capacity utilisation</span>
                  <span>{totalUsed} / {s.total}</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: `${C.border}` }}>
                  <div className="h-full transition-all" style={{ width: `${onlinePct}%`, backgroundColor: C.darkBlue }} title={`Online: ${s.onlineRegistered}`} />
                  <div className="h-full transition-all" style={{ width: `${offlinePct}%`, backgroundColor: C.orange }} title={`Offline: ${s.offlineEnrolled}`} />
                </div>
                <div className="flex gap-4 mt-1.5">
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C.darkBlue }} />Online
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C.orange }} />Offline
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C.border }} />Available
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pass table ─────────────────────────────────────── */}
      <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Individual Passes</p>
      <Table
        cols={["Pass ID", "Registrant", "Mobile", "Date", "Slot", "Type", "Mode", "Status", "Actions"]}
        rows={EPASSES.map((p, i) => [
          <span className="font-mono" style={{ color: C.muted }}>{p.id}</span>,
          <span style={{ color: C.text }}>{p.devotee}</span>,
          <span style={{ color: C.muted }}>{p.mobile}</span>,
          <span style={{ color: C.muted }}>{p.date}</span>,
          <span className="font-semibold" style={{ color: C.darkBlue }}>{p.slot}</span>,
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: `${C.darkBlue}12`, color: C.darkBlue }}>{p.type}</span>,
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: i % 2 === 0 ? `${C.darkBlue}12` : `${C.orange}12`, color: i % 2 === 0 ? C.darkBlue : C.orange }}>
            {i % 2 === 0 ? "Online" : "Offline"}
          </span>,
          <Chip status={p.status} />,
          <div className="flex gap-1"><IconBtn col={C.darkBlue} icon={<Eye size={12} />} tip="View" /><IconBtn col={C.orange} icon={<Edit2 size={12} />} tip="Edit" /></div>,
        ])}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: LIVE STATUS
═══════════════════════════════════════════════════════════ */
/* CCTV camera data */
const CAMERAS = [
  { id: "C1", label: "Main Entrance (Singhdwar)", location: "Gate 1", img: "https://images.unsplash.com/photo-1711547979445-a72c87dfd004?w=800&q=70", count: 847, status: "online" },
  { id: "C2", label: "Garbhagriha Queue", location: "Inner", img: "https://images.unsplash.com/photo-1634351356743-05de62a4b80b?w=800&q=70", count: 312, status: "online" },
  { id: "C3", label: "Parikrama Path", location: "Outer", img: "https://images.unsplash.com/photo-1777222218992-27b952b6b276?w=800&q=70", count: 203, status: "online" },
  { id: "C4", label: "Parking Area — Sector 4", location: "Parking", img: "https://images.unsplash.com/photo-1616787671779-eed71117a65e?w=800&q=70", count: 156, status: "online" },
  { id: "C5", label: "Prasad Hall (Bhandara)", location: "Hall", img: "https://images.unsplash.com/photo-1684049348966-e947c61152cd?w=800&q=70", count: 98, status: "offline" },
  { id: "C6", label: "Temple Garden", location: "Garden", img: "https://images.unsplash.com/photo-1639575668834-e0fd81f744ad?w=800&q=70", count: 124, status: "online" },
];

const CROWD_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  "Low": { color: C.green, bg: "#DCFCE7", label: "LOW", emoji: "🟢" },
  "Moderate": { color: C.orange, bg: "#FEF3C7", label: "MODERATE", emoji: "🟡" },
  "High": { color: "#D97706", bg: "#FEF9C3", label: "HIGH", emoji: "🟠" },
  "Very High": { color: C.red, bg: "#FEE2E2", label: "VERY HIGH", emoji: "🔴" },
};

function LiveStatus() {
  const [selCam, setSelCam] = useState("C1");
  const [crowd, setCrowd] = useState("Moderate");
  const [wait, setWait] = useState("45");
  const [parking, setParking] = useState("Available");
  const [counts, setCounts] = useState(CAMERAS.map(c => c.count));
  const [time, setTime] = useState(new Date());
  const [smartMsg, setSmartMsg] = useState("");
  const [screenMode, setScreenMode] = useState<"crowd" | "wait" | "both" | "custom">("both");
  const [broadcast, setBroadcast] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  /* Simulate live count fluctuation */
  useEffect(() => {
    const t = setInterval(() => {
      setCounts(prev => prev.map(n => Math.max(0, n + Math.floor((Math.random() - 0.4) * 8))));
      setTime(new Date());
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

  const RadioBtn = ({ val, checked, onChange, color }: { val: string; checked: boolean; onChange: () => void; color: string }) => (
    <button onClick={onChange} className="flex items-center gap-2.5 w-full text-left">
      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
        style={{ borderColor: checked ? color : C.border, backgroundColor: checked ? color : "white" }}>
        {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <span className="text-sm font-semibold" style={{ color: checked ? C.text : C.muted }}>{val}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <Head title="Live Status Control" sub="CCTV feeds, crowd AI count, and smart screen broadcast." />

      {/* ── Section 1: CCTV Feeds ──────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          <div className="flex items-center gap-2">
            <Camera size={15} color={C.red} />
            <p className="text-xs font-bold" style={{ color: C.text }}>CCTV Live Feeds</p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${C.red}15`, color: C.red }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.red }} />
              LIVE
            </span>
          </div>
          <p className="text-[11px] font-mono" style={{ color: C.muted }}>
            {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-0">
          {/* Main feed */}
          <div className="lg:col-span-2 relative" style={{ aspectRatio: "16/9", backgroundColor: "#0a0a0a", minHeight: 220 }}>
            <img src={activeCam.img} alt={activeCam.label}
              className="w-full h-full object-cover opacity-85" style={{ aspectRatio: "16/9" }} />

            {/* Overlay overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              {[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"],
              ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, brd], i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 ${brd}`} style={{ borderColor: "rgba(247,148,29,0.8)" }} />
              ))}
              {/* LIVE badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "rgba(220,38,38,0.88)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-bold tracking-widest">LIVE</span>
              </div>
              {/* Camera label */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,0.80) 0%,transparent 100%)" }}>
                <p className="text-white text-xs font-bold">{activeCam.label}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <Activity size={10} color={C.orange} /> AI Count:
                    <strong className="text-white ml-1">{selCount.toLocaleString()} people</strong>
                  </span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>{activeCam.location}</span>
                </div>
              </div>
              {/* Camera ID */}
              <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)" }}>{activeCam.id}</div>
            </div>
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 lg:grid-cols-1 border-l" style={{ borderColor: C.border }}>
            {CAMERAS.map((cam, i) => (
              <button key={cam.id} onClick={() => setSelCam(cam.id)}
                className="relative overflow-hidden transition-all"
                style={{
                  aspectRatio: "16/9",
                  borderBottom: `1px solid ${C.border}`,
                  outline: selCam === cam.id ? `2px solid ${C.orange}` : "none",
                  outlineOffset: "-2px",
                }}>
                <img src={cam.img} alt={cam.label}
                  className="w-full h-full object-cover"
                  style={{ filter: cam.status === "offline" ? "grayscale(1) brightness(0.4)" : selCam === cam.id ? "brightness(1)" : "brightness(0.6)" }} />
                <div className="absolute inset-0 px-1.5 py-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: cam.status === "offline" ? "rgba(0,0,0,0.7)" : "rgba(220,38,38,0.85)", color: "white" }}>
                      {cam.status === "offline" ? "OFF" : "●  LIVE"}
                    </span>
                    <span className="text-[9px] font-bold" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "1px 4px", borderRadius: 3 }}>{cam.id}</span>
                  </div>
                  <div style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent)", padding: "4px 4px 2px" }}>
                    <p className="text-white text-[9px] font-bold leading-tight truncate">{cam.label}</p>
                    {cam.status === "online" && (
                      <p className="text-[9px]" style={{ color: C.orange }}>{counts[i]} ppl</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: AI Crowd Count ──────────────────────── */}
      <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={15} color={C.darkBlue} />
            <p className="text-xs font-bold" style={{ color: C.text }}>AI Crowd Count — All Cameras</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.green }} />
            Live · updates every 3s
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center gap-6 mb-5 px-5 py-4 rounded-2xl"
          style={{ background: `linear-gradient(135deg,${C.darkBlue} 0%,#2a3fa8 100%)` }}>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-white opacity-70 mb-1">Total People on Premises</p>
            <p className="text-4xl font-extrabold text-white">{totalCount.toLocaleString("en-IN")}</p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-[10px] text-white opacity-60">Online Registered</p>
              <p className="text-xl font-bold text-white">847</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white opacity-60">Walk-in / Offline</p>
              <p className="text-xl font-bold" style={{ color: C.gold }}>{(totalCount - 847).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Per-camera bar */}
        <div className="grid sm:grid-cols-2 gap-3">
          {CAMERAS.map((cam, i) => (
            <div key={cam.id} className="flex items-center gap-3">
              <button onClick={() => setSelCam(cam.id)}
                className="text-[10px] font-bold w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: selCam === cam.id ? C.orange : C.bg, color: selCam === cam.id ? "white" : C.muted, border: `1px solid ${C.border}` }}>
                {cam.id}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] font-semibold truncate" style={{ color: cam.status === "offline" ? C.muted : C.text }}>{cam.label}</p>
                  <p className="text-[10px] font-bold flex-shrink-0 ml-2" style={{ color: cam.status === "offline" ? C.muted : C.darkBlue }}>
                    {cam.status === "offline" ? "OFFLINE" : counts[i]}
                  </p>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
                  {cam.status === "online" && (
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (counts[i] / 1200) * 100)}%`, backgroundColor: counts[i] > 700 ? C.red : counts[i] > 400 ? C.orange : C.green }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Controls + Smart Screen ────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Controls */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Homepage & System Controls</p>
          <div className="flex flex-col gap-5">
            {/* Crowd density */}
            <div>
              <p className="text-[11px] font-semibold mb-2" style={{ color: C.text }}>Crowd Density Level</p>
              <div className="grid grid-cols-2 gap-2">
                {["Low", "Moderate", "High", "Very High"].map(v => (
                  <button key={v} onClick={() => setCrowd(v)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all border-2"
                    style={{
                      backgroundColor: crowd === v ? CROWD_CONFIG[v].bg : "white",
                      borderColor: crowd === v ? CROWD_CONFIG[v].color : C.border,
                      color: crowd === v ? CROWD_CONFIG[v].color : C.muted,
                    }}>
                    {CROWD_CONFIG[v].emoji} {v}
                  </button>
                ))}
              </div>
            </div>
            {/* Wait time */}
            <div>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: C.text }}>Darshan Wait Time (mins)</p>
              <input type="number" value={wait} onChange={e => setWait(e.target.value)} min={0} max={300}
                className="w-full px-4 py-2.5 rounded-xl font-extrabold text-xl outline-none"
                style={{ border: `2px solid ${C.orange}`, color: C.darkBlue, backgroundColor: C.cream }} />
            </div>
            {/* Parking */}
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

        {/* Smart Screen */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={15} color={C.darkBlue} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Outdoor Smart Screen</p>
            <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${C.green}15`, color: C.green }}>
              <Signal size={10} /> Connected
            </div>
          </div>

          {/* Display mode selector */}
          <p className="text-[11px] font-semibold mb-2" style={{ color: C.text }}>What to display on screen:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {([
              { id: "crowd", label: "Crowd Density Only" },
              { id: "wait", label: "Wait Time Only" },
              { id: "both", label: "Crowd + Wait Time" },
              { id: "custom", label: "Custom Message" },
            ] as const).map(m => (
              <button key={m.id} onClick={() => setScreenMode(m.id)}
                className="px-3 py-2 rounded-xl text-[11px] font-bold border-2 transition-all text-left"
                style={{
                  backgroundColor: screenMode === m.id ? `${C.darkBlue}10` : "white",
                  borderColor: screenMode === m.id ? C.darkBlue : C.border,
                  color: screenMode === m.id ? C.darkBlue : C.muted,
                }}>{m.label}</button>
            ))}
          </div>

          {screenMode === "custom" && (
            <input value={smartMsg} onChange={e => setSmartMsg(e.target.value)}
              placeholder="e.g. Heavy rush — please use Gate 3"
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none mb-4"
              style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
          )}

          {/* Smart screen preview */}
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: `3px solid #1a1a1a`, backgroundColor: "#111" }}>
            {/* Screen bezel top */}
            <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: "#1a1a1a" }}>
              <p className="text-[9px] text-white opacity-50 tracking-widest uppercase">Khatu Shyam Ji · Smart Display</p>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.green }} />
            </div>
            {/* Screen content */}
            <div className="px-5 py-5 text-center" style={{ background: `linear-gradient(135deg, ${C.darkBlue} 0%, #0f1d5e 100%)` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                🕐 {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Khatu Shyam Ji Temple
              </p>

              {(screenMode === "crowd" || screenMode === "both") && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Crowd Density</p>
                  <div className="inline-block px-6 py-2 rounded-xl"
                    style={{ backgroundColor: crowdCfg.bg, border: `2px solid ${crowdCfg.color}` }}>
                    <p className="text-xl font-extrabold" style={{ color: crowdCfg.color }}>
                      {crowdCfg.emoji} {crowd.toUpperCase()}
                    </p>
                  </div>
                </div>
              )}

              {(screenMode === "wait" || screenMode === "both") && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>Estimated Wait Time</p>
                  <p className="text-3xl font-extrabold" style={{ color: C.gold }}>{wait} <span className="text-lg">mins</span></p>
                </div>
              )}

              {screenMode === "custom" && (
                <p className="text-base font-extrabold text-white px-4">{smartMsg || "Enter a message above…"}</p>
              )}

              <p className="text-[9px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                AI Count: {totalCount.toLocaleString()} people on premises · Parking: {parking}
              </p>
            </div>
            {/* Screen bezel bottom */}
            <div className="flex items-center justify-center py-1.5" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "#333" }} />
            </div>
          </div>

          {/* Broadcast button */}
          <button onClick={doBroadcast} disabled={broadcast}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: broadcastDone ? C.green : broadcast ? "#666" : `linear-gradient(90deg,${C.darkBlue},#2a3fa8)`, cursor: broadcast ? "wait" : "pointer" }}>
            {broadcastDone
              ? <><CheckCircle2 size={15} />Broadcast Sent!</>
              : broadcast
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Broadcasting…</>
                : <><Send size={14} />Broadcast to Smart Screen</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: GALLERY
═══════════════════════════════════════════════════════════ */
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
   SECTION: ANNOUNCEMENTS
═══════════════════════════════════════════════════════════ */
function Announcements() {
  const [items, setItems] = useState(ANN_INIT);
  const [newText, setNew] = useState("");

  function toggle(id: string) { setItems(p => p.map(a => a.id === id ? { ...a, active: !a.active } : a)); }
  function remove(id: string) { setItems(p => p.filter(a => a.id !== id)); }
  function add() {
    if (!newText.trim()) return;
    setItems(p => [...p, { id: `A${p.length + 1}`, text: newText.trim(), active: true }]);
    setNew("");
  }

  return (
    <div>
      <Head title="Announcement Manager" sub="Control the scrolling ticker shown on the Home page." />
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: `1px solid ${C.border}` }}>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Add New Announcement</p>
        <div className="flex gap-3">
          <input value={newText} onChange={e => setNew(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="e.g. Sheegh Darshan Pass now available — Book online"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
          <button onClick={add} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5" style={{ backgroundColor: C.orange }}>
            <Plus size={13} />Add
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map(a => (
          <div key={a.id} className="bg-white rounded-xl px-5 py-3.5 flex items-center gap-4 transition-all"
            style={{ border: `1px solid ${C.border}`, opacity: a.active ? 1 : 0.5 }}>
            {/* Toggle */}
            <button onClick={() => toggle(a.id)}
              className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
              style={{ backgroundColor: a.active ? C.green : "#D1D5DB" }}>
              <div className="absolute w-4 h-4 bg-white rounded-full shadow top-0.5 transition-transform"
                style={{ left: a.active ? "22px" : "2px" }} />
            </button>
            <p className="flex-1 text-sm font-medium" style={{ color: C.text }}>{a.text}</p>
            <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${C.red}12`, color: C.red }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: SUPPORT
═══════════════════════════════════════════════════════════ */
function Support() {
  const [sel, setSel] = useState<typeof TICKETS[0] | null>(null);
  const [reply, setReply] = useState("");
  const [done, setDone] = useState<Set<string>>(new Set());

  const resolve = (id: string) => { setDone(p => new Set(p).add(id)); setSel(null); };

  return (
    <div>
      <Head title="Support Tickets" sub={`${TICKETS.filter(t => t.status === "open" && !done.has(t.id)).length} open tickets awaiting response.`} />
      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          {TICKETS.map(t => {
            const resolved = done.has(t.id) || t.status === "resolved";
            return (
              <button key={t.id} onClick={() => setSel(t)}
                className="text-left p-4 rounded-xl w-full transition-all"
                style={{
                  backgroundColor: sel?.id === t.id ? `${C.darkBlue}08` : C.white,
                  border: `1.5px solid ${sel?.id === t.id ? C.darkBlue : C.border}`
                }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold leading-snug" style={{ color: C.text }}>{t.subject}</p>
                  <Chip status={resolved ? "resolved" : t.status} />
                </div>
                <p className="text-[11px]" style={{ color: C.muted }}>{t.name} · {t.date}</p>
              </button>
            );
          })}
        </div>
        {/* Detail */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
          {sel ? (
            <>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <p className="font-bold text-sm" style={{ color: C.text }}>{sel.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sel.name} · {sel.email} · {sel.date}</p>
                </div>
                <Chip status={done.has(sel.id) ? "resolved" : sel.status} />
              </div>
              <div className="px-4 py-3.5 rounded-xl mb-5 text-sm leading-relaxed"
                style={{ backgroundColor: C.cream, border: `1px solid ${C.border}`, color: C.text }}>{sel.message}</div>
              {!done.has(sel.id) && sel.status !== "resolved" ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Reply to Devotee</p>
                  <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="Type your response…"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
                    style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.cream }} />
                  <div className="flex gap-2">
                    <button onClick={() => resolve(sel.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: C.green }}><CheckCircle2 size={14} />Mark Resolved</button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: `${C.darkBlue}12`, color: C.darkBlue }}>Send Reply</button>
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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION: REPORTS
═══════════════════════════════════════════════════════════ */
function Reports() {
  const byPurpose = DONATIONS.reduce<Record<string, number>>((a, d) => ({ ...a, [d.purpose]: (a[d.purpose] ?? 0) + d.amount }), {});
  const sorted = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div>
      <Head title="Reports & Analytics" sub="Donation trends, visitor stats, and permission summaries."
        right={<button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: C.darkBlue }}><Download size={13} />Export Report</button>} />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Donations", value: `₹${DONATIONS.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}`, sub: `${DONATIONS.length} transactions`, color: C.green },
          { label: "Permissions Processed", value: String(PERMISSIONS.length), sub: `${PERMISSIONS.filter(p => p.status === "approved").length} approved · ${PERMISSIONS.filter(p => p.status === "rejected").length} rejected`, color: C.darkBlue },
          { label: "Total Passes Issued", value: String(EPASSES.length), sub: `${EPASSES.filter(p => p.status === "active").length} active today`, color: C.orange },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 text-center" style={{ border: `1px solid ${C.border}` }}>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${C.border}` }}>
        <p className="font-bold text-sm mb-5" style={{ color: C.text }}>Donations by Purpose</p>
        <div className="flex flex-col gap-4">
          {sorted.map(([purpose, amount]) => (
            <div key={purpose} className="flex items-center gap-3">
              <p className="text-xs font-semibold flex-shrink-0 truncate" style={{ color: C.muted, width: 180 }}>{purpose}</p>
              <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ backgroundColor: C.bg }}>
                <div className="h-full rounded-lg flex items-center px-3 transition-all"
                  style={{ width: `${(amount / max) * 100}%`, background: `linear-gradient(90deg,${C.darkBlue},${C.orange})`, minWidth: 72 }}>
                  <span className="text-white text-xs font-bold">₹{amount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          ))}
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

  /* Route guard (disabled for preview/testing)
  useEffect(() => {
    if (sessionStorage.getItem("adminAuth") !== "true") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
  */

  function logout() {
    sessionStorage.removeItem("adminAuth");
    navigate("/login", { replace: true });
  }

  const SECTION_TITLE: Record<Section, string> = {
    dashboard: "Dashboard", donations: "Donations", vehicle: "Vehicle Permits",
    permissions: "Permissions", epass: "E-Pass & Passes", livestatus: "Live Status",
    gallery: "Gallery", announcements: "Announcements", support: "Support Tickets", reports: "Reports",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: C.bg, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{ width: collapsed ? 0 : 220, backgroundColor: C.navy }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <img src={logoImg} alt="logo" className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0"
            style={{ borderColor: C.orange }} />
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-white truncate leading-tight">Khatu Shyam Ji</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.orange }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all"
              style={{
                backgroundColor: section === item.id ? "rgba(247,148,29,0.18)" : "transparent",
                color: section === item.id ? C.orange : "rgba(255,255,255,0.55)",
              }}
              onMouseEnter={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-xs font-semibold flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: C.orange, color: "white" }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
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
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.orange }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: C.darkBlue }}>A</div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold" style={{ color: C.text }}>Admin</p>
                <p className="text-[10px]" style={{ color: C.muted }}>admin@khatushyam.gov.in</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          {section === "dashboard" && <Dashboard />}
          {section === "donations" && <Donations />}
          {section === "vehicle" && <VehiclePermits />}
          {section === "permissions" && <Permissions />}
          {section === "epass" && <EPass />}
          {section === "livestatus" && <LiveStatus />}
          {section === "gallery" && <Gallery />}
          {section === "announcements" && <Announcements />}
          {section === "support" && <Support />}
          {section === "reports" && <Reports />}
        </main>
      </div>
    </div>
  );
}
