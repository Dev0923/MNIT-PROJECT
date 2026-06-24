import { useState } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import {
  ArrowLeft, Heart, CheckCircle2, IndianRupee,
  ShieldCheck, HeartHandshake, Utensils, Flower2,
  GraduationCap, PawPrint, Flame, Copy, Check, Loader2,
} from "lucide-react";
import logoImg from "../../imports/image-21.png";

const C = {
  orange:   "#F7941D",
  saffron:  "#F89A1C",
  gold:     "#F4C430",
  darkBlue: "#1F2F8C",
  footerBg: "#152060",
  cream:    "#FDF5E6",
  white:    "#FFFFFF",
  green:    "#28A745",
  pink:     "#E97B8C",
  darkText: "#333333",
  border:   "#E5E5E5",
  muted:    "#666666",
  error:    "#DC2626",
};

const DONATION_PURPOSES = [
  "Temple Maintenance",
  "Annadaan (Food Seva)",
  "Langar Seva",
  "Flower & Decoration",
  "Special Puja & Havan",
  "Gau Seva (Cow Protection)",
  "Education Fund",
  "Disaster Relief Fund",
  "General Donation",
];

const QUICK_AMOUNTS = [101, 501, 1001, 2100, 5001, 11000];

const IMPACT_CARDS = [
  { icon: <Utensils size={22} />, color: C.orange,   title: "Annadaan",       desc: "Feed 50 devotees a wholesome meal" },
  { icon: <Flower2  size={22} />, color: C.pink,     title: "Pushp Seva",     desc: "Adorn the deity with fresh flowers" },
  { icon: <Flame    size={22} />, color: "#EF4444",  title: "Deepdan",        desc: "Illuminate the sacred Garbhagriha" },
  { icon: <PawPrint size={22} />, color: C.green,    title: "Gau Seva",       desc: "Nourish the sacred cows of the temple" },
  { icon: <GraduationCap size={22} />, color: C.darkBlue, title: "Vidya Daan", desc: "Support underprivileged students" },
  { icon: <HeartHandshake size={22} />, color: "#9333EA",  title: "General Seva", desc: "Contribute to all temple activities" },
];

type FormValues = {
  fullName: string;
  mobile: string;
  purpose: string;
  amount: string;
  want80G: boolean;
  panCard: string;
};

type Step = "form" | "confirm" | "success";

export function DonationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { want80G: false, purpose: "", amount: "" } });

  const want80G = watch("want80G");
  const amountVal = watch("amount");

  function handleQuickAmount(amt: number) {
    setSelectedQuick(amt);
    setValue("amount", String(amt), { shouldValidate: true });
  }

  function onSubmit() {
    setStep("confirm");
  }

  async function handleConfirmPay() {
    setSubmitLoading(true);
    setSubmitError("");
    try {
      const vals = getValues();
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:8000/api/donations/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fullName: vals.fullName,
          mobile: vals.mobile,
          purpose: vals.purpose,
          amount: parseFloat(vals.amount),
          want80G: vals.want80G,
          panCard: vals.want80G ? vals.panCard : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to register donation");
      }

      const returnedTxnId = data.donation_id;
      setTxnId(returnedTxnId);
      generatePDF(returnedTxnId);
      setStep("success");
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  function generatePDF(id: string) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const vals = getValues();
    
    // Header
    doc.setFillColor(31, 47, 140);
    doc.rect(0, 0, 210, 38, "F");
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("Khatu Shyam Ji Temple", 105, 16, { align: "center" });
    
    doc.setFontSize(11);
    doc.setTextColor(247, 148, 29);
    doc.text("Official Donation Receipt", 105, 26, { align: "center" });
    
    // Body
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Receipt No: ${id}`, 15, 48);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);
    
    doc.setFontSize(12);
    doc.setTextColor(31, 47, 140);
    doc.text("Donor Details", 15, 70);
    
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    
    let y = 80;
    doc.text(`Name: ${vals.fullName}`, 15, y); y += 7;
    doc.text(`Mobile: ${vals.mobile}`, 15, y); y += 7;
    doc.text(`Purpose: ${vals.purpose}`, 15, y); y += 7;
    doc.text(`Amount: INR ${Number(vals.amount).toLocaleString("en-IN")}`, 15, y); y += 7;
    
    if (vals.want80G) {
      doc.text(`PAN: ${vals.panCard}`, 15, y); y += 7;
      doc.text(`80G Certificate requested: Yes`, 15, y); y += 7;
    }
    
    doc.setFontSize(11);
    doc.setTextColor(31, 47, 140);
    doc.text("Thank you for your generous contribution.", 105, y + 15, { align: "center" });
    
    doc.save(`Donation_Receipt_${id}.pdf`);
  }

  function handleCopyUPI() {
    navigator.clipboard.writeText("khatushyamji.temple@sbi");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const vals = getValues();

  /* ── STEP: SUCCESS ─────────────────────────── */
  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.cream} 0%, #FFF8E7 100%)` }}>
        <div className="bg-white rounded-2xl shadow-xl px-10 py-12 max-w-md w-full mx-4 text-center" style={{ border: `1.5px solid ${C.border}` }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${C.green}15` }}>
            <CheckCircle2 size={44} color={C.green} />
          </div>
          <h2 className="mb-2" style={{ color: C.darkBlue, fontSize: "1.45rem", fontWeight: 800, fontFamily: "Georgia,serif" }}>
            Donation Successful!
          </h2>
          <p className="text-sm mb-1" style={{ color: C.muted }}>Transaction ID</p>
          <p className="mb-4 font-bold" style={{ color: C.darkText, letterSpacing: "0.04em" }}>{txnId || `TXN${Date.now().toString().slice(-10)}`}</p>
          <div className="rounded-xl px-5 py-4 mb-6 text-left space-y-2" style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
            {[
              ["Donor", vals.fullName],
              ["Amount", `₹${Number(vals.amount).toLocaleString("en-IN")}`],
              ["Purpose", vals.purpose],
              ...(vals.want80G ? [["PAN", vals.panCard]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span style={{ color: C.muted }}>{k}</span>
                <span style={{ color: C.darkText, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          {vals.want80G && (
            <p className="text-xs mb-5 rounded-lg px-4 py-2" style={{ backgroundColor: `${C.green}15`, color: C.green, border: `1px solid ${C.green}40` }}>
              80G certificate will be emailed within 3–5 working days.
            </p>
          )}
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-full text-white text-sm font-bold transition-all hover:opacity-90"
            style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})` }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ── STEP: CONFIRM ─────────────────────────── */
  if (step === "confirm") {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${C.cream} 0%, #FFF8E7 100%)` }}>
        <div className="w-full px-6 py-4 flex items-center gap-3" style={{ backgroundColor: C.darkBlue }}>
          <button onClick={() => setStep("form")} className="flex items-center gap-2 text-white text-sm font-semibold hover:opacity-80">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-white text-sm opacity-60">/ Confirm Donation</span>
        </div>

        <div className="max-w-lg mx-auto px-4 py-12">
          <h2 className="text-center mb-1" style={{ color: C.darkBlue, fontSize: "1.6rem", fontWeight: 800, fontFamily: "Georgia,serif" }}>
            Confirm Donation
          </h2>
          <div className="w-16 h-0.5 mx-auto mb-8 rounded-full" style={{ backgroundColor: C.orange }} />

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ border: `1.5px solid ${C.border}` }}>
            {/* amount highlight */}
            <div className="px-8 py-6 text-center" style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})` }}>
              <p className="text-white text-xs font-semibold uppercase tracking-widest mb-1 opacity-80">You are donating</p>
              <p className="text-white font-extrabold" style={{ fontSize: "2.2rem", fontFamily: "Georgia,serif" }}>
                ₹{Number(vals.amount).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="px-8 py-6 space-y-4">
              {[
                ["Full Name", vals.fullName],
                ["Mobile", vals.mobile],
                ["Purpose", vals.purpose],
                ...(vals.want80G ? [["PAN Card", vals.panCard], ["80G Certificate", "Yes — will be emailed"]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: C.border }}>
                  <span className="text-sm" style={{ color: C.muted }}>{k}</span>
                  <span className="text-sm font-semibold" style={{ color: C.darkText }}>{v}</span>
                </div>
              ))}
            </div>

            {/* UPI section */}
            <div className="mx-6 mb-4 rounded-xl px-5 py-4" style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.darkBlue }}>Pay via UPI</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: C.darkText }}>khatushyamji.temple@sbi</span>
                <button onClick={handleCopyUPI} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={{ backgroundColor: copied ? `${C.green}15` : `${C.orange}15`, color: copied ? C.green : C.orange }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: C.muted }}>or scan the QR at the temple counter</p>
            </div>

            {submitError && (
              <div
                className="mx-6 mb-4 p-4 rounded-xl text-xs flex items-center gap-2"
                style={{ backgroundColor: C.error + "15", border: `1.5px solid ${C.error}`, color: C.error }}
              >
                <span>⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                onClick={handleConfirmPay}
                disabled={submitLoading}
                className="w-full py-3.5 rounded-full text-white text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`, boxShadow: `0 8px 24px ${C.orange}55` }}
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  "Confirm & Donate"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP: FORM ────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, ${C.cream} 0%, #FFF8E7 60%, #FEF3C7 100%)` }}>

      {/* Back bar */}
      <div className="w-full px-6 py-4 flex items-center gap-2" style={{ backgroundColor: C.darkBlue }}>
        <img src={logoImg} alt="Logo" className="w-7 h-7 rounded-full object-cover border-2" style={{ borderColor: C.orange }} />
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white text-sm font-semibold hover:opacity-80 ml-2">
          <ArrowLeft size={15} /> Back to Home
        </button>
        <span className="ml-auto text-white text-xs opacity-60 hidden sm:block">Shri Khatu Shyam Ji Temple Trust</span>
      </div>

      {/* ── Page Title ───────────────────────────── */}
      <div className="text-center pt-10 pb-6 px-4">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
          style={{ backgroundColor: `${C.orange}18`, border: `1px solid ${C.orange}40` }}>
          <Heart size={13} color={C.orange} fill={C.orange} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.orange }}>Seva & Daan</span>
        </div>
        <h1
          style={{
            color: "#7B3F00",
            fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
            fontWeight: 800,
            fontFamily: "'Georgia', serif",
          }}
        >
          Online Donation
        </h1>
        <div className="w-20 h-0.5 mx-auto mt-3 rounded-full" style={{ backgroundColor: C.orange }} />
        <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: C.muted }}>
          Your contribution helps serve millions of devotees and maintain the sacred traditions of Khatu Dham.
        </p>

        {/* Premium Annadaan Banner */}
        <div className="max-w-xl mx-auto mt-6 bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left border" style={{ backgroundColor: "#FFFBF2", borderColor: `${C.orange}40` }}>
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full" style={{ backgroundColor: C.orange }}>Premium Seva</span>
            <h4 className="text-sm font-bold mt-1.5" style={{ color: C.darkBlue }}>Dedicated Annadaan Seva</h4>
            <p className="text-xs text-gray-500 mt-0.5">Offer Full/Half-Day Bhojan Prasad or Sweet Prasad on specific auspicious dates.</p>
          </div>
          <button type="button" onClick={() => navigate("/services/annadaan-seva")} className="px-5 py-2.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105 shrink-0 cursor-pointer" style={{ backgroundColor: C.darkBlue }}>
            Book Seva →
          </button>
        </div>
      </div>

      {/* ── Quick Amount Chips ───────────────────── */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: C.darkBlue }}>
          Select a Quick Amount
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => handleQuickAmount(amt)}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all border-2"
              style={{
                borderColor: selectedQuick === amt ? C.orange : C.border,
                backgroundColor: selectedQuick === amt ? C.orange : C.white,
                color: selectedQuick === amt ? C.white : C.darkText,
                boxShadow: selectedQuick === amt ? `0 4px 14px ${C.orange}50` : "none",
              }}
            >
              ₹{amt.toLocaleString("en-IN")}
            </button>
          ))}
          <button
            onClick={() => { setSelectedQuick(null); setValue("amount", ""); }}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all border-2"
            style={{
              borderColor: selectedQuick === null && amountVal ? C.orange : C.border,
              backgroundColor: selectedQuick === null && amountVal ? `${C.orange}10` : C.white,
              color: C.muted,
            }}
          >
            Custom
          </button>
        </div>
      </div>

      {/* ── Main Form Card ───────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-2xl shadow-lg" style={{ border: `1.5px solid ${C.border}` }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-8 pt-8 pb-6">

              {/* Row 1: 4 fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 mb-6">

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.orange }}>
                    Full Name <span style={{ color: C.error }}>*</span>
                  </label>
                  <input
                    {...register("fullName", {
                      required: "Full Name is required",
                      minLength: { value: 2, message: "Minimum 2 characters" },
                    })}
                    placeholder="Enter your full name"
                    className="w-full text-sm bg-transparent outline-none pb-2 placeholder-gray-300"
                    style={{
                      borderBottom: `1.5px solid ${errors.fullName ? C.error : C.border}`,
                      color: C.darkText,
                    }}
                  />
                  {errors.fullName && (
                    <p className="text-xs mt-1" style={{ color: C.error }}>{errors.fullName.message}</p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.orange }}>
                    Mobile Number <span style={{ color: C.error }}>*</span>
                  </label>
                  <input
                    {...register("mobile", {
                      required: "Mobile number is required",
                      pattern: { value: /^[6-9]\d{9}$/, message: "Enter valid 10-digit mobile" },
                    })}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className="w-full text-sm bg-transparent outline-none pb-2 placeholder-gray-300"
                    style={{
                      borderBottom: `1.5px solid ${errors.mobile ? C.error : C.border}`,
                      color: C.darkText,
                    }}
                  />
                  {errors.mobile && (
                    <p className="text-xs mt-1" style={{ color: C.error }}>{errors.mobile.message}</p>
                  )}
                </div>

                {/* Donation Purpose */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.orange }}>
                    Donation Purpose <span style={{ color: C.error }}>*</span>
                  </label>
                  <select
                    {...register("purpose", { required: "Please select a purpose" })}
                    className="w-full text-sm bg-transparent outline-none pb-2 appearance-none cursor-pointer"
                    style={{
                      borderBottom: `1.5px solid ${errors.purpose ? C.error : C.border}`,
                      color: watch("purpose") ? C.darkText : "#9CA3AF",
                    }}
                  >
                    <option value="" disabled>Select *</option>
                    {DONATION_PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.purpose && (
                    <p className="text-xs mt-1" style={{ color: C.error }}>{errors.purpose.message}</p>
                  )}
                </div>

                {/* Donation Amount */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.orange }}>
                    Donation Amount <span style={{ color: C.error }}>*</span>
                  </label>
                  <div className="relative flex items-center">
                    <IndianRupee size={13} color={C.muted} className="absolute left-0 bottom-2" />
                    <input
                      {...register("amount", {
                        required: "Amount is required",
                        min: { value: 1, message: "Minimum ₹1" },
                        pattern: { value: /^\d+$/, message: "Numbers only" },
                        onChange: (e) => setSelectedQuick(null)
                      })}
                      placeholder="Enter amount"
                      className="w-full text-sm bg-transparent outline-none pb-2 pl-5 placeholder-gray-300"
                      style={{
                        borderBottom: `1.5px solid ${errors.amount ? C.error : C.border}`,
                        color: C.darkText,
                      }}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs mt-1" style={{ color: C.error }}>{errors.amount.message}</p>
                  )}
                </div>
              </div>

              {/* 80G Checkbox */}
              <div className="flex items-center gap-2.5 mb-5">
                <input
                  type="checkbox"
                  id="want80G"
                  {...register("want80G")}
                  className="w-4 h-4 rounded cursor-pointer accent-blue-700"
                  style={{ accentColor: C.darkBlue }}
                />
                <label htmlFor="want80G" className="text-sm font-semibold cursor-pointer select-none flex items-center gap-1.5"
                  style={{ color: C.darkBlue }}>
                  <ShieldCheck size={15} color={C.darkBlue} />
                  Request 80G Certificate
                  <span className="text-xs font-normal ml-1 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${C.green}18`, color: C.green }}>
                    Tax Benefit
                  </span>
                </label>
              </div>

              {/* PAN Card — conditional */}
              {want80G && (
                <div className="max-w-xs mb-5">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.orange }}>
                    PAN Card Number <span style={{ color: C.error }}>*</span>
                  </label>
                  <input
                    {...register("panCard", {
                      required: want80G ? "PAN Card is required for 80G certificate" : false,
                      pattern: {
                        value: want80G ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ : /.*/,
                        message: "Enter valid PAN (e.g. ABCDE1234F)",
                      },
                    })}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    className="w-full text-sm bg-transparent outline-none pb-2 placeholder-gray-300 uppercase"
                    style={{
                      borderBottom: `1.5px solid ${errors.panCard ? C.error : C.border}`,
                      color: C.darkText,
                    }}
                  />
                  {errors.panCard && (
                    <p className="text-xs mt-1" style={{ color: C.error }}>{errors.panCard.message}</p>
                  )}
                </div>
              )}
            </div>

                        <div className="px-8 pb-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.25rem" }}>
              <p className="text-xs" style={{ color: C.muted }}>
                All donations are secured via SSL encryption. Official receipts will be sent via email/SMS.
              </p>
              <button
                type="submit"
                className="px-8 py-3 rounded-full text-white text-sm font-bold shrink-0 transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`,
                  boxShadow: `0 8px 24px ${C.orange}55`,
                }}
              >
                Continue →
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Impact Section ───────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-center mb-1" style={{ color: C.darkBlue, fontSize: "1.3rem", fontWeight: 800, fontFamily: "Georgia,serif" }}>
          Your Donation Makes a Difference
        </h2>
        <div className="w-14 h-0.5 mx-auto mb-7 rounded-full" style={{ backgroundColor: C.orange }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {IMPACT_CARDS.map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-center text-center p-4 rounded-xl transition-all hover:-translate-y-1"
              style={{ backgroundColor: C.white, border: `1.5px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${card.color}18`, color: card.color }}>
                {card.icon}
              </div>
              <p className="text-xs font-bold mb-1" style={{ color: C.darkText }}>{card.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bank Details ─────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}` }}>
          <div className="px-6 py-4" style={{ backgroundColor: C.darkBlue }}>
            <p className="text-white font-bold text-sm">Offline Donation — Bank Details</p>
          </div>
          <div className="bg-white px-6 py-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
            {[
              ["Account Name",   "Shri Khatu Shyam Ji Temple Trust"],
              ["Account Number", "3987 0010 0012 547"],
              ["IFSC Code",      "SBIN0031042"],
              ["Bank Branch",    "SBI, Khatu Shyam Ji, Rajasthan"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: C.orange }}>{k}</p>
                <p className="text-sm font-bold" style={{ color: C.darkText }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

          </div>
  );
}
