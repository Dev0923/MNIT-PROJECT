import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowLeft, Network, Printer, ChevronDown, ChevronRight } from "lucide-react";
import { Footer } from "../components/Footer";
import logoImg from "../../imports/image-21.png";

/* ─────────────────────────────────────────────────────────
   Tree data
───────────────────────────────────────────────────────── */
type RawNode = {
  id: string;
  label: string;
  sub?: string;
  path?: string;
  feature?: boolean;
  children?: RawNode[];
};

const TREE_DATA: RawNode = {
  id: "root", label: "Khatu Shyam Ji", sub: "Temple Portal",
  children: [
    {
      id: "home", label: "Home", path: "/",
      children: [
        { id: "h1", label: "Live Status",        feature: true },
        { id: "h2", label: "Aarti Timings",      feature: true },
        { id: "h3", label: "Online Services",    feature: true },
        { id: "h4", label: "Announcements",      feature: true },
      ],
    },
    {
      id: "gallery", label: "Gallery",
      children: [
        { id: "g1", label: "Photos",       path: "/gallery" },
        { id: "g2", label: "Videos",       path: "/gallery/videos" },
        { id: "g3", label: "Virtual Tour", path: "/gallery/virtual-tour" },
      ],
    },
    {
      id: "donation", label: "Donation",
      children: [
        { id: "d1", label: "Online Donation", path: "/services/donation-portal" },
        { id: "d2", label: "Annadaan Seva",   path: "/services/annadaan-seva" },
      ],
    },
    {
      id: "permission", label: "Permission",
      children: [
        { id: "p1", label: "Vehicle Permission",  path: "/services/vehicle-permits" },
        { id: "p2", label: "Bandhara Permission", path: "/services/bandhara-permission" },
        { id: "p3", label: "Medical Camp",        path: "/services/medical-camp" },
        { id: "p4", label: "Other Permissions",   path: "/services/other-permissions" },
      ],
    },
    {
      id: "about", label: "About Us",
      children: [
        { id: "a1", label: "About Temple",   path: "/services/about-temple" },
        { id: "a2", label: "Temple Timings", path: "/services/temple-timings" },
        { id: "a3", label: "Temple History", path: "/services/temple-history" },
        { id: "a4", label: "About Khatu",    path: "/services/about-khatu" },
      ],
    },
    {
      id: "darshan", label: "Live Darshan", path: "/live-darshan",
      children: [
        { id: "dr1", label: "Live Stream",    feature: true },
        { id: "dr2", label: "Aarti Schedule", feature: true },
      ],
    },
    {
      id: "mela", label: "Map", path: "/mela-map",
      children: [
        { id: "m1", label: "Interactive Map", feature: true },
        { id: "m2", label: "POI Filters",     feature: true },
      ],
    },
    {
      id: "help", label: "Help & Support", path: "/help",
      children: [
        { id: "hp1", label: "Search FAQs",  feature: true },
        { id: "hp2", label: "Helplines",    feature: true },
        { id: "hp3", label: "Contact Form", feature: true },
        { id: "hp4", label: "Visit Info",   feature: true },
      ],
    },
    {
      id: "login", label: "Login", path: "/login",
      children: [
        { id: "l1", label: "Devotee Portal", feature: true },
        { id: "l2", label: "Admin Portal",   feature: true },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────
   Accordion component
───────────────────────────────────────────────────────── */
function AccordionNode({ node, depth = 0, navigate }: { node: RawNode; depth?: number; navigate: (p: string) => void }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = !!node.children?.length;
  const isLink = !!node.path && !node.feature;

  let bg = "#ffffff";
  let txt = "#1F2F8C";
  let border = "1px solid #E5E5E5";
  if (depth === 0) { bg = "#1F2F8C"; txt = "#ffffff"; border = "none"; }
  else if (depth === 1) { bg = "#F7941D"; txt = "#ffffff"; border = "none"; }
  else if (node.feature) { bg = "#FDF5E6"; txt = "#1F2F8C"; border = "1px dashed #F7941D"; }
  else { bg = "#ffffff"; txt = "#1F2F8C"; border = "1px solid #1F2F8C"; }

  return (
    <div className="w-full flex flex-col mb-2">
      <div 
        className={`flex items-center justify-between p-3.5 rounded-lg transition-all ${isLink || hasChildren ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
        style={{ backgroundColor: bg, color: txt, border }}
        onClick={() => {
          if (isLink) navigate(node.path!);
          else if (hasChildren) setOpen(!open);
        }}
      >
        <div className="flex flex-col">
           <span className="font-bold text-[13px]">{node.label}</span>
           {node.sub && <span className="text-[11px] opacity-80 mt-0.5">{node.sub}</span>}
        </div>
        <div className="flex items-center gap-2">
          {node.feature && <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Section</span>}
          {hasChildren && (
            <span className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && open && (
        <div className="flex flex-col border-l-2 ml-4 pl-4 mt-2" style={{ borderColor: depth === 0 ? "#1F2F8C30" : "#E5E5E5" }}>
          {node.children!.map(child => (
            <AccordionNode key={child.id} node={child} depth={depth + 1} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Page component
───────────────────────────────────────────────────────── */
export function SiteMapPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#ffffff" }}>

      {/* Back bar */}
      <div className="w-full px-6 py-4 flex items-center gap-2 print:hidden" style={{ backgroundColor: "#1F2F8C" }}>
        <img src={logoImg} alt="Logo" className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: "#F7941D" }} />
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white text-sm font-semibold hover:opacity-80 ml-2">
          <ArrowLeft size={15} /> Back to Home
        </button>
        <span className="ml-auto text-white text-xs opacity-60 hidden sm:block">Shri Khatu Shyam Ji Temple Trust</span>
      </div>

      {/* Page header */}
      <div className="px-8 pt-10 pb-6 text-center border-b" style={{ borderColor: "#e8e8e8" }}>
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border print:hidden"
          style={{ borderColor: "#d0d0d0", backgroundColor: "#f8f8f8" }}>
          <Network size={13} color="#555" />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#555" }}>Navigation Structure</span>
        </div>
        <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#0a0a0a", fontFamily: "'Georgia',serif" }}>
          Site Map
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#777" }}>
          Complete flowchart of the Khatu Shyam Ji Temple Portal
        </p>

        {/* Print button */}
        <div className="flex items-center justify-center gap-3 mt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all hover:bg-gray-50"
            style={{ borderColor: "#cccccc", color: "#333" }}
          >
            <Printer size={14} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ── Accordion List ───────────────────────────────────────── */}
      <div className="flex-1 max-w-3xl mx-auto w-full py-8 px-6">
        <AccordionNode node={TREE_DATA} navigate={navigate} />
      </div>

      <Footer />

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
