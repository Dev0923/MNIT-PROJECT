import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Users2,
  User,
  ChevronRight,
  ChevronLeft,
  Accessibility,
  Phone,
  MapPin,
  FileDown,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

/* ─── colour palette (project-wide tokens) ─── */
const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  green: "#28A745",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
  lightBlue: "#EEF1FF",
  red: "#DC3545",
};

/* ─── helpers ─── */
function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortDay(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

function dayNum(d: Date) {
  return d.getDate();
}

function monthStr(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "short" });
}

/** Generates a simple pseudo-random "already registered" count for a date */
function mockRegistered(d: Date) {
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return 120 + (seed % 380); // between 120 and 499
}

/** Generate a unique booking ID */
function generateBookingId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KSJ-${ts}-${rand}`;
}

/* ─── types ─── */
type BookingType = "individual" | "group";

interface IndividualData {
  name: string;
  age: string;
  phone: string;
  city: string;
  wheelchair: "yes" | "no";
}

interface GroupData {
  count: number;
  names: string[];
  wheelchairs: number;
  phone: string;
  city: string;
}

/* ─── tiny reusable input ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.darkBlue }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all focus-within:ring-2"
        style={{
          backgroundColor: C.white,
          border: `1.5px solid ${error ? C.red : C.border}`,
          // ring colour via CSS variable
          // @ts-expect-error custom prop
          "--tw-ring-color": C.orange + "55",
        }}
      >
        {icon && <span style={{ color: C.muted }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm"
          style={{ color: C.darkText }}
        />
      </div>
      {error && <p className="text-xs" style={{ color: C.red }}>{error}</p>}
    </div>
  );
}

/* ─── Indian cities list ─── */
const INDIAN_CITIES = [
  "Agra","Ahmedabad","Ahmednagar","Aizawl","Ajmer","Aligarh","Allahabad","Alwar",
  "Ambala","Amravati","Amritsar","Anand","Anantapur","Aurangabad","Ayodhya",
  "Bangalore","Bareilly","Bathinda","Belgaum","Bellary","Berhampore","Bettiah",
  "Bhagalpur","Bharatpur","Bharuch","Bhavnagar","Bhilai","Bhilwara","Bhiwandi",
  "Bhopal","Bhubaneswar","Bhuj","Bidar","Bijapur","Bikaner","Bilaspur","Bokaro",
  "Bundi","Burhanpur",
  "Calicut","Chandigarh","Chandrapur","Chennai","Chittorgarh","Coimbatore","Cuttack",
  "Darbhanga","Darjeeling","Dausa","Davangere","Dehradun","Delhi","Dewas","Dhanbad",
  "Dharamshala","Dhule","Dibrugarh","Dindigul","Durg","Durgapur",
  "Eluru","Erode","Etawah",
  "Faridabad","Faridkot","Fatehpur","Firozabad","Firozpur",
  "Gandhinagar","Gangtok","Gaya","Ghaziabad","Goa","Gondia","Gorakhpur","Gulbarga",
  "Guntur","Gurugram","Guwahati","Gwalior",
  "Hajipur","Haldwani","Haridwar","Hassan","Hisar","Hoshiarpur","Hospet","Howrah",
  "Hubli","Hyderabad",
  "Imphal","Indore","Itanagar","Itarsi",
  "Jabalpur","Jagdalpur","Jaipur","Jalandhar","Jalgaon","Jalna","Jammu","Jamnagar",
  "Jamshedpur","Jhansi","Jhunjhunu","Jodhpur","Junagadh",
  "Kadapa","Kakinada","Kalyan","Kanchipuram","Kannur","Kanpur","Karimnagar","Karnal",
  "Karur","Kasaragod","Katihar","Khammam","Khandwa","Kharagpur","Khatu",
  "Kochi","Kolar","Kolhapur","Kolkata","Kollam","Korba","Kota","Kottayam","Kozhikode",
  "Kumbakonam","Kurnool",
  "Latur","Leh","Lucknow","Ludhiana",
  "Madurai","Mahabubnagar","Malappuram","Mangalore","Mathura","Meerut","Mehsana",
  "Mirzapur","Moradabad","Morbi","Morena","Mumbai","Munger","Muzaffarnagar",
  "Muzaffarpur","Mysore",
  "Nadiad","Nagaur","Nagercoil","Nagpur","Naihati","Nainital","Nanded","Nashik",
  "Navsari","Nellore","New Delhi","Nizamabad","Noida",
  "Ongole","Orai",
  "Palakkad","Pali","Panaji","Panchkula","Panipat","Parbhani","Patan","Patna",
  "Phagwara","Pondicherry","Porbandar","Port Blair","Pune","Puri",
  "Raebareli","Raichur","Raipur","Rajahmundry","Rajkot","Rajsamand","Rampur",
  "Ranchi","Ratlam","Ratnagiri","Rewa","Rohtak","Roorkee","Rourkela",
  "Sagar","Saharanpur","Salem","Sambalpur","Sangli","Satara","Satna","Sawai Madhopur",
  "Secunderabad","Shahjahanpur","Shillong","Shimla","Shimoga","Sikar","Silchar",
  "Siliguri","Singrauli","Sirsa","Sitapur","Solapur","Sonipat","Sri Ganganagar",
  "Srinagar","Srikakulam","Sultanpur","Surat",
  "Tenali","Tezpur","Thanjavur","Thane","Thiruvananthapuram","Thoothukudi",
  "Thrissur","Tinsukia","Tirunelveli","Tirupati","Tiruppur","Tiruchirappalli",
  "Tonk","Tumkur",
  "Udaipur","Ujjain","Ulhasnagar","Unnao",
  "Vadodara","Valsad","Varanasi","Vellore","Vijayawada","Visakhapatnam",
  "Warangal","Wardha",
  "Yamunanagar","Yavatmal",
];

/* ─── Searchable city dropdown ─── */
function CitySelect({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return INDIAN_CITIES;
    const q = query.toLowerCase();
    return INDIAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={wrapperRef}>
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.darkBlue }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all focus-within:ring-2"
        style={{
          backgroundColor: C.white,
          border: `1.5px solid ${error ? C.red : C.border}`,
          // @ts-expect-error custom prop
          "--tw-ring-color": C.orange + "55",
        }}
      >
        <MapPin size={16} color={C.muted} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search city..."
          className="w-full bg-transparent outline-none text-sm"
          style={{ color: C.darkText }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setQuery(""); onChange(""); setOpen(true); }}
            className="text-xs flex-shrink-0 hover:opacity-70"
            style={{ color: C.muted }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 rounded-xl overflow-hidden"
          style={{
            top: "100%",
            marginTop: "4px",
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs" style={{ color: C.muted }}>
              No cities found
            </div>
          ) : (
            filtered.slice(0, 50).map((city) => {
              const isActive = city === value;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onChange(city);
                    setQuery(city);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: isActive ? C.orange + "15" : "transparent",
                    color: isActive ? C.orange : C.darkText,
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = C.lightBlue;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <MapPin size={12} color={isActive ? C.orange : C.muted} />
                  {city}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && <p className="text-xs" style={{ color: C.red }}>{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DARSHAN BOOKING PAGE
   ═══════════════════════════════════════════════════════════════ */
export function DarshanBookingPage() {
  const navigate = useNavigate();

  /* ---------- date picker state ---------- */
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  /** Max selectable: 2 months from now */
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 2);
    return d;
  }, [today]);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /** Get all calendar cells for the displayed month */
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    // leading blanks
    for (let i = 0; i < startDow; i++) cells.push(null);
    // actual days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(calYear, calMonth, d));
    }
    return cells;
  }, [calMonth, calYear]);

  function isFutureSelectable(d: Date) {
    return d > today && d <= maxDate;
  }

  function canGoPrev() {
    // Can't go before the current month
    return !(calYear === today.getFullYear() && calMonth === today.getMonth());
  }

  function canGoNext() {
    const nextMonth = calMonth === 11 ? 0 : calMonth + 1;
    const nextYear = calMonth === 11 ? calYear + 1 : calYear;
    return new Date(nextYear, nextMonth, 1) <= maxDate;
  }

  /* ---------- form state ---------- */
  const [bookingType, setBookingType] = useState<BookingType>("individual");

  const [indiv, setIndiv] = useState<IndividualData>({
    name: "",
    age: "",
    phone: "",
    city: "",
    wheelchair: "no",
  });

  const [group, setGroup] = useState<GroupData>({
    count: 2,
    names: ["", ""],
    wheelchairs: 0,
    phone: "",
    city: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* ---------- success / PDF state ---------- */
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  /* ---------- validation ---------- */
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!selectedDate) {
      e["date"] = "Please select a visit date.";
    }

    if (bookingType === "individual") {
      if (!indiv.name.trim()) e["name"] = "Name is required.";
      if (!indiv.age.trim() || isNaN(Number(indiv.age)) || Number(indiv.age) < 1)
        e["age"] = "Enter a valid age.";
      if (!indiv.phone.trim() || indiv.phone.trim().length < 10)
        e["phone"] = "Enter a valid 10-digit phone number.";
      if (!indiv.city.trim()) e["city"] = "City is required.";
    } else {
      if (group.count < 2) e["count"] = "Group must have at least 2 people.";
      group.names.forEach((n, i) => {
        if (!n.trim()) e[`gname_${i}`] = `Name for person ${i + 1} is required.`;
      });
      if (!group.phone.trim() || group.phone.trim().length < 10)
        e["gphone"] = "Enter a valid 10-digit phone number.";
      if (!group.city.trim()) e["gcity"] = "City is required.";
      if (group.wheelchairs < 0 || group.wheelchairs > group.count)
        e["gwheelchairs"] = `Must be between 0 and ${group.count}.`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ---------- PDF generation ---------- */
  function generatePDF(id: string) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Header band
    doc.setFillColor(31, 47, 140); // darkBlue
    doc.rect(0, 0, 210, 38, "F");

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("Khatu Shyam Ji Temple", 105, 16, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(247, 148, 29); // orange
    doc.text("Darshan Booking Confirmation", 105, 26, { align: "center" });

    // Booking ID
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Booking ID: ${id}`, 15, 48);
    doc.text(`Visit Date: ${selectedDate ? formatDate(selectedDate) : ""}`, 15, 55);
    doc.text(`Booking Type: ${bookingType === "individual" ? "Individual" : "Group"}`, 15, 62);

    let yPos = 75;

    // Devotee details
    doc.setFontSize(12);
    doc.setTextColor(31, 47, 140);
    doc.text("Devotee Details", 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);

    if (bookingType === "individual") {
      doc.text(`Name: ${indiv.name}`, 15, yPos);
      yPos += 7;
      doc.text(`Age: ${indiv.age}`, 15, yPos);
      yPos += 7;
      doc.text(`Phone: ${indiv.phone}`, 15, yPos);
      yPos += 7;
      doc.text(`City: ${indiv.city}`, 15, yPos);
      yPos += 7;
      doc.text(`Wheelchair Required: ${indiv.wheelchair === "yes" ? "Yes" : "No"}`, 15, yPos);
      yPos += 12;
    } else {
      doc.text(`Total Members: ${group.count}`, 15, yPos);
      yPos += 7;
      doc.text(`Phone: ${group.phone}`, 15, yPos);
      yPos += 7;
      doc.text(`City: ${group.city}`, 15, yPos);
      yPos += 7;
      doc.text(`Wheelchairs Required: ${group.wheelchairs}`, 15, yPos);
      yPos += 10;

      doc.setTextColor(31, 47, 140);
      doc.text("Group Members:", 15, yPos);
      yPos += 7;
      doc.setTextColor(51, 51, 51);

      group.names.forEach((n, i) => {
        doc.text(`${i + 1}. ${n}`, 20, yPos);
        yPos += 6;
      });
      yPos += 6;
    }

    // QR Code
    const qrCanvas = qrRef.current;
    if (qrCanvas) {
      const qrData = qrCanvas.toDataURL("image/png");
      doc.setTextColor(31, 47, 140);
      doc.setFontSize(11);
      doc.text("Scan QR at Temple Entry", 105, yPos, { align: "center" });
      yPos += 5;
      doc.addImage(qrData, "PNG", 72.5, yPos, 65, 65);
      yPos += 72;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a system-generated document. Please carry this pass during your temple visit.", 105, 282, {
      align: "center",
    });
    doc.text("Jai Shree Shyam 🙏", 105, 288, { align: "center" });

    doc.save(`Darshan_Pass_${id}.pdf`);
  }

  /* ---------- submit handler ---------- */
  async function handleSubmit() {
    if (!validate()) return;
    setSubmitLoading(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        booking_type: bookingType,
        date: selectedDate?.toISOString(),
        phone: bookingType === "individual" ? indiv.phone : group.phone,
        city: bookingType === "individual" ? indiv.city : group.city,
        individual_details: bookingType === "individual" ? {
          name: indiv.name,
          age: parseInt(indiv.age, 10),
          wheelchair: indiv.wheelchair,
        } : null,
        group_details: bookingType === "group" ? {
          count: group.count,
          names: group.names,
          wheelchairs: group.wheelchairs,
        } : null,
      };

      const res = await fetch("http://localhost:8000/api/bookings/create", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit booking");
      }

      setBookingId(data.booking_id);
      setSubmitted(true);
      setTimeout(() => generatePDF(data.booking_id), 400);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  /* ---------- group count change ---------- */
  function handleGroupCountChange(val: string) {
    const n = Math.max(2, Math.min(50, Number(val) || 2));
    const newNames = [...group.names];
    while (newNames.length < n) newNames.push("");
    setGroup({ ...group, count: n, names: newNames.slice(0, n) });
  }

  /* ════════ RENDER ════════ */

  /* --- SUCCESS SCREEN --- */
  if (submitted) {
    const qrPayload = JSON.stringify({
      id: bookingId,
      date: selectedDate?.toISOString(),
      type: bookingType,
      name: bookingType === "individual" ? indiv.name : group.names.join(", "),
    });

    return (
      <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
        {/* Top bar */}
        <div className="w-full px-6 py-4 flex items-center" style={{ backgroundColor: C.darkBlue }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white text-sm font-semibold hover:opacity-80"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        <div className="max-w-xl mx-auto px-6 py-16 flex flex-col items-center text-center">
          {/* Success animation circle */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{
              background: `linear-gradient(135deg, ${C.green}, #34D058)`,
              boxShadow: `0 8px 32px rgba(40,167,69,0.35)`,
              animation: "popIn 0.5s cubic-bezier(.36,1.2,.5,1)",
            }}
          >
            <CheckCircle2 size={48} color={C.white} />
          </div>

          <h1 className="text-3xl font-bold mb-2" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
            Booking Confirmed!
          </h1>
          <p className="text-sm mb-1" style={{ color: C.muted }}>
            Your Darshan pass has been booked successfully.
          </p>
          <p className="text-xs font-mono px-4 py-1.5 rounded-full mb-8" style={{ backgroundColor: C.lightBlue, color: C.darkBlue }}>
            Booking ID: {bookingId}
          </p>

          {/* QR Code */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: C.orange }}>
              Your Entry QR Code
            </p>
            <QRCodeCanvas
              value={qrPayload}
              size={200}
              level="H"
              bgColor={C.white}
              fgColor={C.darkBlue}
              ref={(el: HTMLCanvasElement | null) => {
                qrRef.current = el;
              }}
              style={{ margin: "0 auto" }}
            />
            <p className="text-xs mt-4" style={{ color: C.muted }}>
              Show this QR code at the temple entrance
            </p>
          </div>

          <p className="text-sm mb-6" style={{ color: C.muted }}>
            <strong>Visit Date:</strong> {selectedDate ? formatDate(selectedDate) : ""}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => generatePDF(bookingId)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: C.orange, boxShadow: `0 4px 14px rgba(247,148,29,0.40)` }}
            >
              <FileDown size={16} /> Download PDF Pass
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ border: `1.5px solid ${C.darkBlue}`, color: C.darkBlue, backgroundColor: C.white }}
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Hidden QR for PDF - always mounted for generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <QRCodeCanvas
            value={qrPayload}
            size={250}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#1F2F8C"
            ref={(el: HTMLCanvasElement | null) => {
              qrRef.current = el;
            }}
          />
        </div>

        <style>{`
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

              </div>
    );
  }

  /* --- MAIN BOOKING FORM --- */
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      {/* Top bar */}
      <div className="w-full px-6 py-4 flex items-center" style={{ backgroundColor: C.darkBlue }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white text-sm font-semibold hover:opacity-80"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="ml-4 text-white text-sm font-bold tracking-wide">Darshan Booking</h2>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Step 1: Pick a Date ── */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: C.orange }}
            >
              1
            </div>
            <h2 className="text-lg font-bold" style={{ color: C.darkBlue }}>
              Select Date of Visit
            </h2>
          </div>

          {/* Full-size Calendar */}
          <div
            className="rounded-2xl p-6"
            style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
            }}
          >
            {/* Month navigation header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                  else setCalMonth(calMonth - 1);
                }}
                disabled={!canGoPrev()}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-110"
                style={{ backgroundColor: C.lightBlue }}
              >
                <ChevronLeft size={20} color={C.darkBlue} />
              </button>
              <h3 className="text-lg font-bold tracking-wide" style={{ color: C.darkBlue }}>
                {new Date(calYear, calMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </h3>
              <button
                onClick={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                  else setCalMonth(calMonth + 1);
                }}
                disabled={!canGoNext()}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:scale-110"
                style={{ backgroundColor: C.lightBlue }}
              >
                <ChevronRight size={20} color={C.darkBlue} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-xs font-bold uppercase tracking-wider py-2"
                  style={{ color: C.muted }}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((d, idx) => {
                if (!d) {
                  return <div key={`blank-${idx}`} className="py-3" />;
                }

                const isSelected = selectedDate?.toDateString() === d.toDateString();
                const isToday = d.toDateString() === today.toDateString();
                const selectable = isFutureSelectable(d);

                return (
                  <button
                    key={d.toISOString()}
                    disabled={!selectable}
                    onClick={() => {
                      setSelectedDate(d);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next["date"];
                        return next;
                      });
                    }}
                    className="relative flex flex-col items-center justify-center py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: isSelected
                        ? C.darkBlue
                        : isToday
                        ? C.orange + "15"
                        : selectable
                        ? C.lightBlue
                        : "transparent",
                      color: isSelected
                        ? C.white
                        : selectable
                        ? C.darkText
                        : C.border,
                      border: isSelected
                        ? `2px solid ${C.orange}`
                        : isToday
                        ? `2px solid ${C.orange}55`
                        : `1px solid transparent`,
                      boxShadow: isSelected
                        ? `0 4px 14px rgba(31,47,140,0.3)`
                        : "none",
                      cursor: selectable ? "pointer" : "default",
                      opacity: selectable ? 1 : 0.4,
                      ...(selectable && !isSelected
                        ? { }
                        : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (selectable && !isSelected) {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = C.orange + "22";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectable && !isSelected) {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = isToday ? C.orange + "15" : C.lightBlue;
                      }
                    }}
                  >
                    <span className="text-base font-bold leading-tight">
                      {d.getDate()}
                    </span>
                    {isToday && (
                      <span
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: C.orange }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Today indicator legend */}
            <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.orange }} />
                <span className="text-xs" style={{ color: C.muted }}>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md" style={{ backgroundColor: C.darkBlue }} />
                <span className="text-xs" style={{ color: C.muted }}>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md" style={{ backgroundColor: C.lightBlue }} />
                <span className="text-xs" style={{ color: C.muted }}>Available</span>
              </div>
            </div>

            {errors["date"] && (
              <p className="text-xs mt-3" style={{ color: C.red }}>
                {errors["date"]}
              </p>
            )}
          </div>

          {/* Registered count */}
          {selectedDate && (
            <div
              className="mt-4 flex items-center gap-3 rounded-xl px-5 py-3.5"
              style={{
                backgroundColor: C.lightBlue,
                border: `1px solid ${C.darkBlue}22`,
              }}
            >
              <Info size={18} color={C.darkBlue} />
              <div>
                <p className="text-sm font-semibold" style={{ color: C.darkBlue }}>
                  {mockRegistered(selectedDate)} devotees already registered
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  for {formatDate(selectedDate)}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Step 2: Booking Details ── */}
        {selectedDate && (
          <section
            className="mb-8"
            style={{ animation: "fadeUp 0.4s ease-out" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: C.orange }}
              >
                2
              </div>
              <h2 className="text-lg font-bold" style={{ color: C.darkBlue }}>
                Devotee Details
              </h2>
            </div>

            {/* Type toggle */}
            <div
              className="flex rounded-full p-1 mb-6"
              style={{
                backgroundColor: C.lightBlue,
                border: `1px solid ${C.border}`,
              }}
            >
              {(["individual", "group"] as BookingType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setBookingType(t);
                    setErrors({});
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: bookingType === t ? C.darkBlue : "transparent",
                    color: bookingType === t ? C.white : C.muted,
                    boxShadow:
                      bookingType === t
                        ? "0 2px 8px rgba(31,47,140,0.25)"
                        : "none",
                  }}
                >
                  {t === "individual" ? <User size={16} /> : <Users2 size={16} />}
                  {t === "individual" ? "Individual" : "Group"}
                </button>
              ))}
            </div>

            {/* ─── Individual form ─── */}
            {bookingType === "individual" && (
              <div
                className="rounded-2xl p-6 flex flex-col gap-5"
                style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <Field
                  label="Full Name"
                  value={indiv.name}
                  onChange={(v) => setIndiv({ ...indiv, name: v })}
                  placeholder="Enter your full name"
                  icon={<User size={16} />}
                  error={errors["name"]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Age"
                    value={indiv.age}
                    onChange={(v) => setIndiv({ ...indiv, age: v })}
                    placeholder="e.g. 28"
                    type="number"
                    error={errors["age"]}
                  />
                  <Field
                    label="Phone Number"
                    value={indiv.phone}
                    onChange={(v) => setIndiv({ ...indiv, phone: v })}
                    placeholder="10-digit number"
                    type="tel"
                    icon={<Phone size={16} />}
                    error={errors["phone"]}
                  />
                </div>
                <CitySelect
                  label="City"
                  value={indiv.city}
                  onChange={(v) => setIndiv({ ...indiv, city: v })}
                  error={errors["city"]}
                />

                {/* Wheelchair toggle */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: C.darkBlue }}
                  >
                    Wheelchair Required?
                  </label>
                  <div className="flex gap-3">
                    {(["yes", "no"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setIndiv({ ...indiv, wheelchair: opt })}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          backgroundColor:
                            indiv.wheelchair === opt
                              ? opt === "yes"
                                ? C.orange + "18"
                                : C.lightBlue
                              : C.white,
                          border: `1.5px solid ${
                            indiv.wheelchair === opt
                              ? opt === "yes"
                                ? C.orange
                                : C.darkBlue
                              : C.border
                          }`,
                          color:
                            indiv.wheelchair === opt
                              ? opt === "yes"
                                ? C.orange
                                : C.darkBlue
                              : C.muted,
                        }}
                      >
                        <Accessibility size={16} />
                        {opt === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Group form ─── */}
            {bookingType === "group" && (
              <div
                className="rounded-2xl p-6 flex flex-col gap-5"
                style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                {/* Stepper: Number of People */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.darkBlue }}>
                      Number of People
                    </label>
                    <div
                      className="flex items-center rounded-xl overflow-hidden"
                      style={{ border: `1.5px solid ${errors["count"] ? C.red : C.border}`, backgroundColor: C.white }}
                    >
                      <button
                        type="button"
                        onClick={() => handleGroupCountChange(String(group.count - 1))}
                        disabled={group.count <= 2}
                        className="w-12 h-12 flex items-center justify-center text-lg font-bold transition-all hover:opacity-80 disabled:opacity-30 flex-shrink-0"
                        style={{ backgroundColor: C.lightBlue, color: C.darkBlue }}
                      >
                        −
                      </button>
                      <div className="flex-1 flex items-center justify-center gap-2 px-2">
                        <Users2 size={16} color={C.muted} />
                        <input
                          type="number"
                          value={group.count}
                          onChange={(e) => handleGroupCountChange(e.target.value)}
                          className="w-12 text-center bg-transparent outline-none text-base font-bold"
                          style={{ color: C.darkText }}
                          min={2}
                          max={50}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGroupCountChange(String(group.count + 1))}
                        disabled={group.count >= 50}
                        className="w-12 h-12 flex items-center justify-center text-lg font-bold transition-all hover:opacity-80 disabled:opacity-30 flex-shrink-0"
                        style={{ backgroundColor: C.orange + "20", color: C.orange }}
                      >
                        +
                      </button>
                    </div>
                    {errors["count"] && <p className="text-xs" style={{ color: C.red }}>{errors["count"]}</p>}
                  </div>

                  {/* Stepper: Wheelchairs Needed */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.darkBlue }}>
                      Wheelchairs Needed
                    </label>
                    <div
                      className="flex items-center rounded-xl overflow-hidden"
                      style={{ border: `1.5px solid ${errors["gwheelchairs"] ? C.red : C.border}`, backgroundColor: C.white }}
                    >
                      <button
                        type="button"
                        onClick={() => setGroup({ ...group, wheelchairs: Math.max(0, group.wheelchairs - 1) })}
                        disabled={group.wheelchairs <= 0}
                        className="w-12 h-12 flex items-center justify-center text-lg font-bold transition-all hover:opacity-80 disabled:opacity-30 flex-shrink-0"
                        style={{ backgroundColor: C.lightBlue, color: C.darkBlue }}
                      >
                        −
                      </button>
                      <div className="flex-1 flex items-center justify-center gap-2 px-2">
                        <Accessibility size={16} color={C.muted} />
                        <input
                          type="number"
                          value={group.wheelchairs}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(group.count, Number(e.target.value) || 0));
                            setGroup({ ...group, wheelchairs: v });
                          }}
                          className="w-12 text-center bg-transparent outline-none text-base font-bold"
                          style={{ color: C.darkText }}
                          min={0}
                          max={group.count}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroup({ ...group, wheelchairs: Math.min(group.count, group.wheelchairs + 1) })}
                        disabled={group.wheelchairs >= group.count}
                        className="w-12 h-12 flex items-center justify-center text-lg font-bold transition-all hover:opacity-80 disabled:opacity-30 flex-shrink-0"
                        style={{ backgroundColor: C.orange + "20", color: C.orange }}
                      >
                        +
                      </button>
                    </div>
                    {errors["gwheelchairs"] && <p className="text-xs" style={{ color: C.red }}>{errors["gwheelchairs"]}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Contact Phone Number"
                    value={group.phone}
                    onChange={(v) => setGroup({ ...group, phone: v })}
                    placeholder="10-digit number"
                    type="tel"
                    icon={<Phone size={16} />}
                    error={errors["gphone"]}
                  />
                  <CitySelect
                    label="City"
                    value={group.city}
                    onChange={(v) => setGroup({ ...group, city: v })}
                    error={errors["gcity"]}
                  />
                </div>

                {/* Dynamic name fields */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: C.darkBlue }}
                  >
                    Names of All Members
                  </label>
                  <div className="flex flex-col gap-3">
                    {group.names.map((n, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: C.orange + "20",
                            color: C.orange,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div
                            className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all focus-within:ring-2"
                            style={{
                              backgroundColor: C.white,
                              border: `1.5px solid ${
                                errors[`gname_${i}`] ? C.red : C.border
                              }`,
                              // @ts-expect-error custom prop
                              "--tw-ring-color": C.orange + "55",
                            }}
                          >
                            <User size={14} color={C.muted} />
                            <input
                              type="text"
                              value={n}
                              onChange={(e) => {
                                const newNames = [...group.names];
                                newNames[i] = e.target.value;
                                setGroup({ ...group, names: newNames });
                              }}
                              placeholder={`Person ${i + 1} name`}
                              className="w-full bg-transparent outline-none text-sm"
                              style={{ color: C.darkText }}
                            />
                          </div>
                          {errors[`gname_${i}`] && (
                            <p className="text-xs mt-1" style={{ color: C.red }}>
                              {errors[`gname_${i}`]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <div
                className="mt-4 p-4 rounded-xl text-xs flex items-center gap-2"
                style={{ backgroundColor: C.red + "15", border: `1.5px solid ${C.red}`, color: C.red }}
              >
                <span>⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="w-full mt-6 py-4 rounded-full text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${C.orange}, #F4C430)`,
                boxShadow: `0 6px 24px rgba(247,148,29,0.40)`,
              }}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Booking Slot...
                </>
              ) : (
                <>
                  <CalendarDays size={18} />
                  Confirm Booking & Get Pass
                </>
              )}
            </button>

            {/* Info note */}
            <p
              className="text-xs text-center mt-3"
              style={{ color: C.muted }}
            >
              A PDF pass with a unique QR code will be generated for temple entry.
            </p>
          </section>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

          </div>
  );
}
