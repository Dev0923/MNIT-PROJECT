import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Footer } from "../components/Footer";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Utensils,
  CheckCircle2,
  Info,
  Sparkles,
  ShieldCheck,
  Download,
  Calendar,
  Heart,
  User,
  Gift,
  Award,
} from "lucide-react";
import { jsPDF } from "jspdf";
import confetti from "canvas-confetti";

const C = {
  saffron: "#F7941D",
  gold: "#F4C430",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  green: "#28A745",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
  error: "#DC2626",
};

interface SevaType {
  id: string;
  title: string;
  price: number;
  icon: string;
  description: string;
}

const SEVA_TYPES: SevaType[] = [
  {
    id: "full-day",
    title: "Full-Day Bhojan Prasad",
    price: 51000,
    icon: "🍛",
    description: "Feed all visiting devotees a complete wholesome meal for the entire day.",
  },
  {
    id: "half-day",
    title: "Half-Day Bhojan Prasad",
    price: 21000,
    icon: "🥗",
    description: "Contribute to meal services for devotees during half-day temple operations.",
  },
  {
    id: "sweet-prasad",
    title: "Sweet Prasad (Meetha Prasad)",
    price: 11000,
    icon: "🍮",
    description: "Offer special sweet prasad (churma/halwa) distributed to devotees at the exit.",
  },
];

// Helper to calculate mock Hindu Tithis dynamically based on calendar day
const TITHIS = [
  "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
  "Krishna Paksha Dwitiya", "Krishna Paksha Chaturthi", "Krishna Paksha Saptami",
  "Krishna Paksha Dashami", "Krishna Paksha Ekadashi", "Krishna Paksha Amavasya"
];

function getHinduTithi(date: Date): string {
  const seed = date.getDate() + date.getMonth();
  const tithiName = TITHIS[seed % TITHIS.length];
  const monthName = date.toLocaleDateString("en-IN", { month: "long" });
  return `Shri Khatu Dham ${monthName} Shukla ${tithiName}`;
}

export function AnnadaanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSeva, setSelectedSeva] = useState<SevaType | null>(null);

  // Form State
  const [donorName, setDonorName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [want80G, setWant80G] = useState(false);
  const [panCard, setPanCard] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Success / Receipt Info
  const [txnId, setTxnId] = useState("");

  // Calendar display state
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 3);
    return d;
  }, [today]);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(calYear, calMonth, d));
    }
    return cells;
  }, [calMonth, calYear]);

  // Dynamic mock availability: weekends and dates divisible by 4 are full
  const isDateAvailable = (d: Date) => {
    if (d <= today || d > maxDate) return false;
    const dateNum = d.getDate();
    return !(dateNum % 4 === 0 || d.getDay() === 0); // Full on Sundays and dates divisible by 4
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const isPrevMonthDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();
  const isNextMonthDisabled = new Date(calYear, calMonth + 1, 1) > maxDate;

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!donorName.trim()) errs.donorName = "Full Name is required";
    if (!occasion.trim()) errs.occasion = "Occasion/Sankalp is required";
    if (want80G) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panCard.trim()) {
        errs.panCard = "PAN Card is required for 80G tax benefit";
      } else if (!panRegex.test(panCard.toUpperCase())) {
        errs.panCard = "Enter a valid PAN (e.g., ABCDE1234F)";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // State for celebration popup
  const [showCelebration, setShowCelebration] = useState(false);

  // Hurray Rose Petal Shower Visual Helper
  const triggerRosePetalShower = () => {
    const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });

    // Custom rose petal shape path
    const petal = confetti.shapeFromPath({
      path: 'M0 10 C 0 17, 3 20, 10 20 C 17 20, 20 17, 20 10 C 20 3, 17 0, 10 0 C 3 0, 0 3, 0 10'
    });

    const roseColors = [
      '#e63946', // Rose Red
      '#d62828', // Crimson Red
      '#c1121f', // Dark Crimson
      '#ff4d6d', // Deep Pink
      '#ff758f', // Rose Pink
      '#ff85a1', // Soft Pink
      '#f7a4b0', // Light Rose Petal Pink
    ];

    const commonConfig = {
      shapes: [petal],
      colors: roseColors,
      scalar: 2.2, // Make petals larger and more visible
      drift: 0.5,  // Slight drift for realistic falling motion
      gravity: 0.7, // Slower fall speed to mimic petals falling
    };

    // Left cannon
    myConfetti({
      ...commonConfig,
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.8 }
    });

    // Right cannon
    myConfetti({
      ...commonConfig,
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.8 }
    });

    // Center burst falling downwards
    setTimeout(() => {
      myConfetti({
        ...commonConfig,
        particleCount: 80,
        spread: 90,
        origin: { y: 0.4 }
      });
    }, 250);
  };

  // Payment triggers mock success
  const handleProceedToDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setTxnId(`TXN-ANN-${Date.now().toString().slice(-8)}`);
    setStep(5);
    setShowCelebration(true);
    // Fire rose petal shower
    triggerRosePetalShower();
  };

  // PDF Certificate Generator
  const generateCertificate = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Outer border decoration
    doc.setDrawColor(247, 148, 29); // Saffron
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 281, 194);

    doc.setDrawColor(31, 47, 140); // Navy Blue
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 277, 190);

    // Decorative corners
    doc.setFillColor(247, 148, 29);
    doc.rect(8, 8, 12, 12, "F");
    doc.rect(277, 8, 12, 12, "F");
    doc.rect(8, 190, 12, 12, "F");
    doc.rect(277, 190, 12, 12, "F");

    // Header Content
    doc.setFont("Georgia", "bold");
    doc.setFontSize(24);
    doc.setTextColor(31, 47, 140); // Navy
    doc.text("SHRI KHATU SHYAM JI TEMPLE TRUST", 148.5, 30, { align: "center" });

    doc.setFont("Georgia", "italic");
    doc.setFontSize(14);
    doc.setTextColor(247, 148, 29); // Saffron
    doc.text("Sikar, Rajasthan, India", 148.5, 38, { align: "center" });

    // Certificate Title
    doc.setFont("Georgia", "bold");
    doc.setFontSize(28);
    doc.setTextColor(31, 47, 140);
    doc.text("ANNADAAN PRASAD CERTIFICATE", 148.5, 58, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(102, 102, 102);
    doc.text("This certificate of honor is proudly presented to", 148.5, 72, { align: "center" });

    // Donor Name
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(31, 47, 140);
    doc.text(donorName.toUpperCase(), 148.5, 86, { align: "center" });

    // Seva info text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(102, 102, 102);
    doc.text(`In humble contribution of ${selectedSeva?.title || "Bhojan Prasad"}`, 148.5, 108, { align: "center" });
    doc.text(`amounting to INR ${selectedSeva?.price.toLocaleString("en-IN") || "0"}/-`, 148.5, 114, { align: "center" });

    // Occasion Details
    doc.setFont("Helvetica", "oblique");
    doc.setFontSize(13);
    doc.setTextColor(247, 148, 29);
    doc.text(`On the auspicious occasion of: ${occasion}`, 148.5, 126, { align: "center" });

    // Date & Tithi
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(102, 102, 102);
    doc.text(`Sewa Date: ${selectedDate ? selectedDate.toLocaleDateString("en-IN", { dateStyle: "long" }) : ""}`, 60, 148, { align: "left" });
    doc.text(`Tithi: ${selectedDate ? getHinduTithi(selectedDate) : ""}`, 60, 155, { align: "left" });
    doc.text(`Receipt Reference: ${txnId}`, 60, 162, { align: "left" });

    // Stamp / Sign placeholder
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(31, 47, 140);
    doc.text("Shri Khatu Shyam Ji Trust", 230, 158, { align: "center" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Authorized Signatory", 230, 163, { align: "center" });

    // Quote at bottom
    doc.setFont("Helvetica", "oblique");
    doc.setFontSize(11);
    doc.setTextColor(247, 148, 29);
    doc.text('"Annam Pranah Manushyanam — Seva Parmo Dharmah"', 148.5, 180, { align: "center" });
    doc.setFontSize(9);
    doc.text('"Food is the life of humans — Service is the supreme duty"', 148.5, 186, { align: "center" });

    doc.save(`Annadaan_Certificate_${txnId}.pdf`);
    // Celebration confetti on download
    triggerRosePetalShower();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>
      {/* Top back navigation bar */}
      <div className="w-full px-6 py-4 flex items-center shadow-sm" style={{ backgroundColor: C.darkBlue }}>
        <button
          onClick={() => {
            if (step > 1 && step < 5) setStep(step - 1);
            else navigate(-1);
          }}
          className="flex items-center gap-2 text-white text-sm font-semibold hover:opacity-85 transition-opacity"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="ml-auto text-white/70 text-xs font-semibold uppercase tracking-wider hidden sm:inline-block">
          Shri Khatu Shyam Ji Temple Trust
        </span>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Step Indicator Header (Hide on Success Step 5) */}
        {step < 5 && (
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center gap-4 bg-white px-6 py-3 rounded-full border border-border shadow-sm mb-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      backgroundColor: step === num ? C.saffron : step > num ? C.darkBlue : "transparent",
                      color: step >= num ? C.white : C.muted,
                      border: step < num ? `2px solid ${C.border}` : "none",
                      boxShadow: step === num ? `0 0 10px ${C.saffron}66` : "none",
                    }}
                  >
                    {step > num ? <CheckCircle2 size={16} /> : num}
                  </div>
                  {num < 4 && (
                    <div
                      className="w-6 sm:w-12 h-0.5 mx-2 transition-all duration-300"
                      style={{
                        backgroundColor: step > num ? C.darkBlue : C.border,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs uppercase tracking-widest font-bold opacity-60" style={{ color: C.darkBlue }}>
              {step === 1 && "Introduction"}
              {step === 2 && "Select Date"}
              {step === 3 && "Select Seva"}
              {step === 4 && "Donor & Payment Details"}
            </p>
          </div>
        )}

        {/* ── STEP 1: ANNADAAN INTRODUCTION ────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Banner */}
            <div
              className="relative rounded-3xl overflow-hidden py-12 px-6 sm:px-12 text-center text-white shadow-xl flex flex-col items-center justify-center border-4 border-double"
              style={{
                background: `linear-gradient(135deg, ${C.darkBlue} 0%, #0c154a 100%)`,
                borderColor: C.saffron,
              }}
            >
              {/* Diya/spiritual ornament SVGs */}
              <div className="absolute top-4 left-4 w-12 h-12 opacity-25">
                <svg viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5">
                  <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" strokeLinecap="round" />
                </svg>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 opacity-25">
                <svg viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5">
                  <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" strokeLinecap="round" />
                </svg>
              </div>

              <div className="mb-4 inline-flex items-center gap-1 bg-white/10 px-4 py-1 rounded-full border border-white/20">
                <Sparkles size={14} color={C.gold} fill={C.gold} />
                <span className="text-xs font-semibold tracking-wider uppercase text-white/95">Sacred Seva Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 tracking-wide" style={{ fontFamily: "Georgia, serif", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                महा दान - अन्नदान सेवा
              </h1>
              <p className="text-sm sm:text-base italic text-white/80 max-w-xl mb-6">
                “अन्नं वै प्राणाः” - Food is indeed life. Offering food to devotees visiting Khatu Dham is one of the highest spiritual virtues.
              </p>

              <button
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-full font-bold text-white transition-all shadow-lg hover:scale-105 hover:shadow-xl hover:shadow-saffron/30 active:scale-95"
                style={{
                  background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`,
                }}
              >
                Offer Annadaan Seva
              </button>
            </div>

            {/* Scriptural Significance & Impact Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Scriptural block */}
              <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${C.saffron}15`, color: C.saffron }}>
                    <Heart size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: C.darkBlue }}>Significance of Annadaan</h3>
                  <p className="text-sm leading-relaxed mb-4 text-gray-600">
                    According to Hindu scriptures, feeding hungry souls and visiting pilgrims directly pleases the divine. At Khatu Shyam Ji Temple, Bhandara is served daily to devotees traveling from far away.
                  </p>
                </div>
                <div className="text-xs font-semibold italic border-t border-border pt-3 mt-2" style={{ color: C.saffron }}>
                  "Giver of food is the giver of life, and there is no gift equal to it."
                </div>
              </div>

              {/* Impact block */}
              <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${C.darkBlue}15`, color: C.darkBlue }}>
                  <Utensils size={20} />
                </div>
                <h3 className="text-lg font-bold mb-3" style={{ color: C.darkBlue }}>Sewa Impact Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100" style={{ backgroundColor: `${C.cream}40` }}>
                    <span className="text-sm font-semibold text-gray-700">Feed 1 Devotee</span>
                    <span className="text-base font-bold text-white px-3 py-1 rounded-full text-xs" style={{ backgroundColor: C.saffron }}>₹ 101</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100" style={{ backgroundColor: `${C.cream}40` }}>
                    <span className="text-sm font-semibold text-gray-700">Feed 5 Devotees</span>
                    <span className="text-base font-bold text-white px-3 py-1 rounded-full text-xs" style={{ backgroundColor: C.saffron }}>₹ 501</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100" style={{ backgroundColor: `${C.cream}40` }}>
                    <span className="text-sm font-semibold text-gray-700">Feed 10 Devotees</span>
                    <span className="text-base font-bold text-white px-3 py-1 rounded-full text-xs" style={{ backgroundColor: C.saffron }}>₹ 1,001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: SELECT DATE ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: C.darkBlue }}>
                Choose Your Auspicious Seva Date
              </h2>
              <p className="text-sm text-gray-600">
                Select a date for the Annadaan Bhandara. Available dates are highlighted in soft green.
              </p>
            </div>

            {/* Calendar */}
            <div
              className="bg-white rounded-3xl p-6 border border-border shadow-md max-w-md mx-auto"
            >
              {/* Month Selector header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={isPrevMonthDisabled}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-20 transition-all border border-gray-200"
                >
                  <ChevronLeft size={20} color={C.darkBlue} />
                </button>
                <span className="text-md font-bold tracking-wide" style={{ color: C.darkBlue }}>
                  {new Date(calYear, calMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextMonthDisabled}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-20 transition-all border border-gray-200"
                >
                  <ChevronRight size={20} color={C.darkBlue} />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase mb-2" style={{ color: C.muted }}>
                {WEEKDAYS.map(w => <div key={w} className="py-1">{w}</div>)}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((d, index) => {
                  if (!d) return <div key={`blank-${index}`} />;

                  const isSelected = selectedDate?.toDateString() === d.toDateString();
                  const isAvailable = isDateAvailable(d);

                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedDate(d)}
                      className="relative py-2.5 rounded-xl text-sm font-semibold flex flex-col items-center justify-center transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected
                          ? C.saffron
                          : isAvailable
                            ? "rgba(40,167,69,0.12)"
                            : "rgba(0,0,0,0.03)",
                        color: isSelected
                          ? C.white
                          : isAvailable
                            ? C.green
                            : "#9CA3AF",
                        boxShadow: isSelected
                          ? `0 4px 16px ${C.saffron}66`
                          : "none",
                        border: isSelected
                          ? `2.5px solid ${C.gold}`
                          : "1.5px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable && !isSelected) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = `${C.saffron}22`;
                          (e.currentTarget as HTMLElement).style.color = C.saffron;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isAvailable && !isSelected) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(40,167,69,0.12)";
                          (e.currentTarget as HTMLElement).style.color = C.green;
                        }
                      }}
                    >
                      <span>{d.getDate()}</span>
                      {isAvailable && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-green-500 absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Details Panel */}
            {selectedDate && (
              <div className="max-w-md mx-auto bg-white rounded-2xl p-5 border border-border shadow-sm text-center animate-fadeIn">
                <p className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: C.saffron }}>Selected Tithi & Date</p>
                <p className="text-md font-bold" style={{ color: C.darkBlue }}>
                  {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-xs italic text-gray-500 mt-1">
                  🕉 {getHinduTithi(selectedDate)}
                </p>

                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-4 py-3 rounded-full text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: C.darkBlue }}
                >
                  Continue to Select Seva
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: CHOOSE SEVA TYPE ────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: C.darkBlue }}>
                Choose Your Seva Type
              </h2>
              <p className="text-sm text-gray-600">
                Select one of the premium catering/prasad levels for the bhandara.
              </p>
            </div>

            {/* Seva selection grid */}
            <div className="grid sm:grid-cols-3 gap-6">
              {SEVA_TYPES.map((seva) => {
                const isSelected = selectedSeva?.id === seva.id;
                return (
                  <button
                    key={seva.id}
                    type="button"
                    onClick={() => setSelectedSeva(seva)}
                    className="bg-white rounded-3xl p-6 text-left border-2 transition-all relative flex flex-col justify-between h-64 hover:shadow-lg active:scale-98"
                    style={{
                      borderColor: isSelected ? C.saffron : C.border,
                      boxShadow: isSelected ? `0 8px 30px ${C.saffron}25` : "0 4px 10px rgba(0,0,0,0.02)",
                    }}
                  >
                    {/* Selected badge */}
                    {isSelected && (
                      <span
                        className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: C.saffron }}
                      >
                        <CheckCircle2 size={14} />
                      </span>
                    )}

                    <div>
                      <span className="text-4xl block mb-4">{seva.icon}</span>
                      <h4 className="text-md font-bold mb-2 pr-4 leading-snug" style={{ color: C.darkBlue }}>
                        {seva.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {seva.description}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-gray-400">Contribution</span>
                      <span className="text-lg font-black" style={{ color: C.saffron }}>
                        ₹ {seva.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedSeva && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setStep(4)}
                  className="px-10 py-3.5 rounded-full text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`,
                    boxShadow: `0 6px 20px ${C.saffron}44`,
                  }}
                >
                  Continue to Donor Details
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: DONOR DETAILS & SUMMARY & PAYMENT ── */}
        {step === 4 && (
          <form onSubmit={handleProceedToDonate} className="space-y-8 animate-fadeIn" noValidate>
            {/* Step Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: C.darkBlue }}>
                Donor Information & Donation Summary
              </h2>
              <p className="text-sm text-gray-600">
                Complete your details below. The certificate will be issued with these details.
              </p>
            </div>

            {/* Donation Summary Card */}
            <div
              className="bg-white rounded-3xl overflow-hidden border border-border shadow-md"
            >
              <div className="px-6 py-4 flex items-center gap-3 border-b border-border" style={{ backgroundColor: `${C.cream}20` }}>
                <Gift size={18} color={C.saffron} />
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: C.darkBlue }}>Donation Summary</span>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-6">
                {/* Details list */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-400">Sewa Type</span>
                    <p className="text-sm font-bold text-gray-800">{selectedSeva?.title}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400">Scheduled Date</span>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedDate ? selectedDate.toLocaleDateString("en-IN", { dateStyle: "long" }) : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400">Sankalp Tithi</span>
                    <p className="text-xs italic text-gray-500">
                      {selectedDate ? getHinduTithi(selectedDate) : ""}
                    </p>
                  </div>
                </div>

                {/* Amount Box */}
                <div
                  className="rounded-2xl p-6 text-white flex flex-col justify-center items-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${C.saffron} 0%, ${C.gold} 100%)`,
                    boxShadow: `0 4px 15px ${C.saffron}44`,
                  }}
                >
                  <span className="text-xs font-extrabold uppercase tracking-widest text-white/90">Amount Highlight</span>
                  <span className="text-3xl font-black mt-2" style={{ fontFamily: "Georgia, serif" }}>
                    ₹ {selectedSeva?.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-white/80 mt-1">Inclusive of all prasad ingredients</span>
                </div>
              </div>
            </div>

            {/* Bilingual Form Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-md space-y-6">
              <h3 className="text-lg font-bold pb-2 border-b border-gray-100" style={{ color: C.darkBlue }}>
                Donor Credentials
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.saffron }}>
                    Full Name / दाता का नाम <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl px-4 py-3 border bg-white focus-within:ring-2 focus-within:ring-saffron/50 transition-all" style={{ borderColor: errors.donorName ? C.error : C.border }}>
                    <User size={16} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Chandra Sharma / रमेश चंद्र शर्मा"
                      value={donorName}
                      onChange={(e) => {
                        setDonorName(e.target.value);
                        setErrors((prev) => ({ ...prev, donorName: "" }));
                      }}
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: C.darkText }}
                    />
                  </div>
                  {errors.donorName && <span className="text-xs mt-0.5" style={{ color: C.error }}>{errors.donorName}</span>}
                </div>

                {/* Occasion / Sankalp */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.saffron }}>
                    Occasion / अवसर / संकल्प <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl px-4 py-3 border bg-white focus-within:ring-2 focus-within:ring-saffron/50 transition-all" style={{ borderColor: errors.occasion ? C.error : C.border }}>
                    <Gift size={16} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Birthday Celebration / जन्मदिन के उपलक्ष्य में"
                      value={occasion}
                      onChange={(e) => {
                        setOccasion(e.target.value);
                        setErrors((prev) => ({ ...prev, occasion: "" }));
                      }}
                      className="w-full bg-transparent outline-none text-sm"
                      style={{ color: C.darkText }}
                    />
                  </div>
                  {errors.occasion && <span className="text-xs mt-0.5" style={{ color: C.error }}>{errors.occasion}</span>}
                </div>
              </div>

              {/* Informative alert box */}
              <div
                className="rounded-xl px-4 py-3.5 flex items-start gap-3"
                style={{ backgroundColor: "rgba(31,47,140,0.06)", border: `1px solid rgba(31,47,140,0.15)` }}
              >
                <Info size={16} color={C.darkBlue} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-normal">
                  The Annadaan certificate will be issued with the details entered above. Please ensure the name and occasion information are correct.
                </p>
              </div>

              {/* Tax certificate Section */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={want80G}
                    onChange={(e) => setWant80G(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer transition-all"
                    style={{ accentColor: C.darkBlue }}
                  />
                  <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.darkBlue }}>
                    Request 80G Tax Exemption Certificate
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: C.green }}>
                      Tax Benefit
                    </span>
                  </span>
                </label>

                {want80G && (
                  <div className="max-w-xs mt-4 flex flex-col gap-1.5 animate-fadeIn">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.saffron }}>
                      PAN Card Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={panCard}
                      onChange={(e) => {
                        setPanCard(e.target.value.toUpperCase());
                        setErrors((prev) => ({ ...prev, panCard: "" }));
                      }}
                      className="rounded-xl px-4 py-3 border bg-white focus:ring-2 focus:ring-saffron/50 outline-none text-sm uppercase placeholder-gray-300"
                      style={{ borderColor: errors.panCard ? C.error : C.border, color: C.darkText }}
                    />
                    {errors.panCard && <span className="text-xs mt-0.5" style={{ color: C.error }}>{errors.panCard}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Payment CTA block */}
            <div className="flex flex-col items-center gap-5">
              <button
                type="submit"
                className="px-12 py-4 rounded-full text-white font-extrabold text-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer w-full sm:w-auto"
                style={{
                  background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`,
                  boxShadow: `0 8px 30px ${C.saffron}55`,
                }}
              >
                Proceed to Donate ₹ {selectedSeva?.price.toLocaleString("en-IN")}
              </button>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-6 text-gray-500 text-xs mt-2 border-t border-border pt-4 w-full">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-600" />
                  🔒 Secure Payment
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-600" />
                  🧾 Official Temple Receipt
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-600" />
                  🏛 80G Tax Benefits
                </span>
              </div>
            </div>
          </form>
        )}

        {/* ── STEP 5: SUCCESS & CERTIFICATE DOWNLOAD ────────── */}
        {step === 5 && (
          <div className="max-w-xl mx-auto text-center py-10 space-y-8 animate-fadeIn">
            {/* Success icon */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `linear-gradient(135deg, ${C.green}, #34d058)`,
                boxShadow: "0 10px 30px rgba(40,167,69,0.3)",
              }}
            >
              <CheckCircle2 size={48} color={C.white} />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold" style={{ color: C.darkBlue, fontFamily: "Georgia, serif" }}>
                Jai Shree Shyam!
              </h1>
              <p className="text-md text-slate-600">
                Your Annadaan donation has been processed successfully.
              </p>
              <p className="text-xs font-mono bg-white px-4 py-1.5 rounded-full inline-block border border-border" style={{ color: C.muted }}>
                Reference ID: {txnId}
              </p>
            </div>

            {/* Certificate Highlight Card preview */}
            <div
              className="bg-white rounded-3xl p-6 border-2 border-dashed relative text-left"
              style={{ borderColor: C.saffron, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}
            >
              <div className="absolute top-3 right-3 text-xs font-bold text-white px-3 py-1 rounded-full uppercase flex items-center gap-1" style={{ backgroundColor: C.saffron }}>
                <Award size={12} /> Certificate Generated
              </div>
              <h4 className="text-sm font-extrabold uppercase tracking-wide mb-2 text-slate-400">Annadaan Seva Recipient</h4>
              <p className="text-lg font-bold" style={{ color: C.darkBlue }}>{donorName}</p>

              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-100 pt-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Seva Type</span>
                  <p className="font-bold text-gray-700">{selectedSeva?.title}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Sewa Date & Tithi</span>
                  <p className="font-bold text-gray-700">
                    {selectedDate ? selectedDate.toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
                  </p>
                  <p className="text-[10px] text-gray-500 italic">{selectedDate ? getHinduTithi(selectedDate) : ""}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={generateCertificate}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-white text-sm font-bold shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`,
                  boxShadow: `0 6px 20px ${C.saffron}44`,
                }}
              >
                <Download size={16} /> Download Seva Certificate
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3.5 rounded-full font-bold text-sm bg-white border transition-all hover:bg-slate-50 active:scale-98 cursor-pointer"
                style={{ borderColor: C.darkBlue, color: C.darkBlue }}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Celebration Popup Modal */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative border-4 border-double animate-scaleUp"
            style={{ borderColor: C.saffron }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spiritual background circles/diya layout */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-saffron/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-xl pointer-events-none" />

            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 z-10"
            >
              ✕
            </button>

            <div className="px-6 py-8 text-center space-y-6">
              {/* Devotional / Success Badge */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
                  boxShadow: "0 8px 24px rgba(247,148,29,0.35)",
                }}
              >
                <Sparkles size={38} color={C.white} className="animate-pulse" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: C.darkBlue, fontFamily: "Georgia, serif" }}>
                  दान स्वीकार हुआ!
                </h2>
                <p className="text-xs uppercase tracking-wider font-bold mt-1" style={{ color: C.saffron }}>
                  Sacred Seva Confirmed
                </p>
              </div>

              <div className="bg-cream/40 border border-border rounded-2xl p-5 space-y-3 text-left text-sm relative">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Devotee Name:</span>
                  <span className="font-bold text-gray-800">{donorName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Seva Offering:</span>
                  <span className="font-bold text-gray-800">{selectedSeva?.title}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Sankalp Date:</span>
                  <span className="font-bold text-gray-800">
                    {selectedDate ? selectedDate.toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-xs" style={{ color: C.darkBlue }}>{txnId}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
                Thank you for your generous contribution. Your Annadaan prasad will be distributed to devotees. Your certificate is ready!
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => {
                    generateCertificate();
                  }}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-full text-white text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`,
                    boxShadow: `0 6px 20px ${C.saffron}44`,
                  }}
                >
                  <Download size={16} /> Download Seva Certificate
                </button>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="py-3 rounded-full font-bold text-xs bg-gray-50 hover:bg-gray-100 border text-gray-600 transition-all cursor-pointer"
                >
                  Close & View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Canvas to ensure it renders on top of the blurred popup overlay */}
      <canvas
        id="confetti-canvas"
        className="fixed inset-0 w-screen h-screen pointer-events-none z-[1000]"
      />

      <Footer />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scaleUp {
          animation: scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
