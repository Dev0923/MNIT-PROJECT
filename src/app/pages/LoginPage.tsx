import { useState } from "react";
import {
  Eye, EyeOff, User, Mail, Lock, Phone,
  Shield, AlertTriangle, KeyRound, Smartphone, CheckCircle2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import templeImg from "../../imports/khatu-shyam-ji.jpg";

const C = {
  orange:    "#F7941D",
  darkBlue:  "#1F2F8C",
  green:     "#28A745",
  darkText:  "#333333",
  panelBg:   "#FDF5E6",
  cardBg:    "#FFFFFF",
  inputBg:   "#FDF5E6",
  border:    "#E5E5E5",
  textMuted: "#888888",
  textLight: "#333333",
  red:       "#DC2626",
};

const API_BASE = "http://localhost:8000";

type Portal      = "devotee" | "admin";
type AuthStep    = "identifier" | "otp" | "success";
type AdminMethod = "password"| "otp";

export function LoginPage() {
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal>("devotee");
  const [adminMethod, setAdminMethod] = useState<AdminMethod>("password");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex w-full" style={{ height: "100dvh", overflow: "hidden" }}>

      {/* LEFT: image panel */}
      <div className="relative w-1/2 h-full flex-shrink-0 overflow-hidden">
        <img src={templeImg} alt="Khatu Shyam Ji" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,4,20,0.88) 0%, rgba(8,4,20,0.25) 40%, transparent 65%)" }} />
        <div className="absolute bottom-8 left-8">
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: "1.5rem", fontWeight: 700, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.8)", marginBottom: "4px" }}>
            खाटू श्याम जी
          </h2>
          <p style={{ fontFamily: "'Georgia', serif", fontSize: "0.8rem", fontStyle: "italic", color: "rgba(255,255,255,0.7)", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            Haare Ka Sahara, <span style={{ color: C.orange }}>Baba Shyam Hamara</span>
          </p>
        </div>
      </div>

      {/* RIGHT: form panel */}
      <div className="w-1/2 h-full flex flex-col items-center justify-center px-6 py-4" style={{ backgroundColor: C.panelBg, overflowY: "auto" }}>
        <div className="w-full max-w-sm flex flex-col gap-3">

          {/* Back to home */}
          <button onClick={() => navigate("/")} className="self-start text-xs hover:underline" style={{ color: C.textMuted }}>
            ← Back to Home
          </button>

          {/* Header */}
          <div className="text-center">
            <p style={{ color: C.orange, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
              श्री खाटू श्री श्याम जी
            </p>
            <h1 style={{ color: C.darkBlue, fontSize: "0.95rem", fontWeight: 600, marginBottom: "2px" }}>
              Welcome to Shyam Baba's
            </h1>
            <p style={{ color: C.textMuted, fontSize: "0.72rem" }}>
              Digital Darshan &amp; Temple Services Platform
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-2 gap-3">
            <PortalCard active={portal === "devotee"} onClick={() => setPortal("devotee")} icon={<User size={18} />} title="Devotee Portal" subtitle="Pilgrims & visitors" />
            <PortalCard active={portal === "admin"} onClick={() => setPortal("admin")} icon={<Shield size={18} />} title="Admin Portal" subtitle="Authorized personnel" showBadge />
          </div>

          {/* Form Card */}
          <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
            {portal === "admin"
              ? <AdminForm method={adminMethod} setMethod={setAdminMethod} showPassword={showPassword} setShowPassword={setShowPassword} onLogin={() => { sessionStorage.setItem("adminAuth", "true"); navigate("/admin"); }} />
              : <DevoteeOTPForm />
            }
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ── Portal Card ──────────────────────────────── */

function PortalCard({ active, onClick, icon, title, subtitle, showBadge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; showBadge?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 transition-all duration-200 w-full"
      style={{ backgroundColor: active ? C.darkBlue : C.cardBg, borderColor: active ? C.darkBlue : C.border, color: active ? "#fff" : C.darkText, boxShadow: active ? "0 4px 18px rgba(31,47,140,0.20)" : "none" }}>
      {showBadge && active && <CheckCircle2 size={14} className="absolute top-2 right-2" style={{ color: C.orange }} fill="none" />}
      <span style={{ color: active ? C.orange : "#aaa" }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: "0.78rem", color: active ? "#fff" : C.darkText }}>{title}</span>
      <span style={{ fontSize: "0.65rem", color: active ? "rgba(255,255,255,0.65)" : C.textMuted }}>{subtitle}</span>
    </button>
  );
}

/* ── Devotee OTP Login Form ────────────────────── */

function DevoteeOTPForm() {
  const navigate = useNavigate();
  
  // UI states
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [step, setStep] = useState<"form" | "otp" | "success">("form");

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [identifier, setIdentifier] = useState(""); // login email/phone
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Send OTP for Register
  async function handleSendRegisterOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit Indian phone number");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send verification OTP");
      }

      setOtpSentTo(phone.trim());
      setSuccessMsg(data.message);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Network error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  // Send OTP for Login
  async function handleSendLoginOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!identifier.trim()) {
      setError("Please enter your phone number or email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }

      setOtpSentTo(identifier.trim());
      setSuccessMsg(data.message);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Network error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  // Submit Password Login
  async function handleLoginPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!identifier.trim() || !password) {
      setError("Please enter all login credentials");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setStep("success");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setError(err.message || "Network error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP (Registers new user, or logs in existing user)
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === "signup") {
        res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            otp: otp.trim(),
            password: password,
            confirm_password: confirmPassword,
            email: email.trim() ? email.trim() : null,
            receive_updates: receiveUpdates,
          }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: identifier.trim(),
            otp: otp.trim()
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setStep("success");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid OTP code or verification failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── 1. SUCCESS RENDER ──
  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center animate-bounce"
          style={{ backgroundColor: `${C.green}20` }}>
          <CheckCircle2 size={32} color={C.green} />
        </div>
        <p style={{ color: C.darkBlue, fontSize: "0.95rem", fontWeight: 700 }}>
          {mode === "signup" ? "Registration Successful!" : "Login Successful!"}
        </p>
        <p style={{ color: C.textMuted, fontSize: "0.72rem" }}>Blessings of Shyam Baba are with you. Redirecting...</p>
      </div>
    );
  }

  // ── 2. OTP INPUT STEP ──
  if (step === "otp") {
    return (
      <>
        <div className="text-center mb-3">
          <p style={{ color: C.darkBlue, fontSize: "0.85rem", fontWeight: 600 }}>Verify OTP</p>
          <p style={{ color: C.textMuted, fontSize: "0.72rem", marginTop: "2px" }}>
            A 6-digit code has been sent to <strong style={{ color: C.orange }}>{otpSentTo}</strong>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ backgroundColor: `${C.red}10`, border: `1px solid ${C.red}30` }}>
            <AlertTriangle size={13} style={{ color: C.red, flexShrink: 0 }} />
            <p style={{ color: C.red, fontSize: "0.72rem" }}>{error}</p>
          </div>
        )}

        {successMsg && !error && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ backgroundColor: `${C.green}10`, border: `1px solid ${C.green}30` }}>
            <CheckCircle2 size={13} style={{ color: C.green, flexShrink: 0 }} />
            <p style={{ color: C.green, fontSize: "0.72rem" }}>{successMsg}</p>
          </div>
        )}

        <form className="flex flex-col gap-3" onSubmit={handleVerifyOTP}>
          <div>
            <label className="block mb-1" style={{ color: C.textMuted, fontSize: "0.72rem", fontWeight: 500 }}>OTP Code</label>
            <div className="flex items-center rounded-lg border px-3 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              <KeyRound size={15} color={C.orange} />
              <input
                type="text"
                value={otp}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(val);
                }}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="flex-1 py-2.5 outline-none text-sm bg-transparent tracking-[0.3em] text-center font-bold"
                style={{ color: C.darkText, fontSize: "1.1rem" }}
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={otp.length !== 6 || loading}
            className="w-full py-2 rounded-lg transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: C.green, color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Verify & {mode === "signup" ? "Register" : "Login"}
          </button>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); }}
              className="text-xs hover:underline" style={{ color: C.textMuted }}>
              ← Back to Details
            </button>
            <button type="button" 
              onClick={(e) => { 
                setOtp(""); 
                setError(""); 
                if (mode === "signup") {
                  handleSendRegisterOTP(e);
                } else {
                  handleSendLoginOTP(e);
                }
              }}
              className="text-xs hover:underline" style={{ color: C.orange, fontWeight: 600 }}>
              Resend OTP
            </button>
          </div>
        </form>
      </>
    );
  }

  // ── 3. MAIN FORM STEP (LOGIN OR SIGNUP) ──
  return (
    <>
      {/* Auth Tab Toggle */}
      <div className="flex mb-4 rounded-lg p-0.5" style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}` }}>
        <button type="button" onClick={() => { setMode("login"); setError(""); }}
          className="flex-1 py-1.5 px-2 rounded-md transition-all text-xs font-semibold text-center"
          style={{ backgroundColor: mode === "login" ? C.cardBg : "transparent", color: mode === "login" ? C.darkBlue : C.textMuted, boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.10)" : "none" }}>
          Log In
        </button>
        <button type="button" onClick={() => { setMode("signup"); setError(""); }}
          className="flex-1 py-1.5 px-2 rounded-md transition-all text-xs font-semibold text-center"
          style={{ backgroundColor: mode === "signup" ? C.cardBg : "transparent", color: mode === "signup" ? C.darkBlue : C.textMuted, boxShadow: mode === "signup" ? "0 1px 4px rgba(0,0,0,0.10)" : "none" }}>
          Sign Up (New Devotee)
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
          style={{ backgroundColor: `${C.red}10`, border: `1px solid ${C.red}30` }}>
          <AlertTriangle size={13} style={{ color: C.red, flexShrink: 0 }} />
          <p style={{ color: C.red, fontSize: "0.72rem" }}>{error}</p>
        </div>
      )}

      {/* ── SIGNUP FORM ── */}
      {mode === "signup" && (
        <form className="flex flex-col gap-3 animate-fade-in" onSubmit={handleSendRegisterOTP}>
          <div className="text-center mb-1">
            <p style={{ color: C.darkBlue, fontSize: "0.8rem", fontWeight: 600 }}>Create Devotee Account</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block mb-0.5" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Full Name *</label>
            <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              <User size={14} color={C.orange} />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="flex-1 outline-none text-xs bg-transparent"
                style={{ color: C.darkText }}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block mb-0.5" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Mobile Number (requires OTP verification) *</label>
            <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              <Phone size={14} color={C.orange} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                className="flex-1 outline-none text-xs bg-transparent"
                style={{ color: C.darkText }}
                required
              />
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block mb-0.5" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Email Address (Optional)</label>
            <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              <Mail size={14} color={C.orange} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Updates & receipts email"
                className="flex-1 outline-none text-xs bg-transparent"
                style={{ color: C.darkText }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block mb-0.5" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Set Password *</label>
            <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              <Lock size={14} color={C.orange} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="flex-1 outline-none text-xs bg-transparent"
                style={{ color: C.darkText }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: C.textMuted, lineHeight: 0 }}>
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-0.5" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Confirm Password *</label>
            <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              <Lock size={14} color={C.orange} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="flex-1 outline-none text-xs bg-transparent"
                style={{ color: C.darkText }}
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ color: C.textMuted, lineHeight: 0 }}>
                {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Receive Updates check */}
          <label className="flex items-start gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={receiveUpdates}
              onChange={e => setReceiveUpdates(e.target.checked)}
              style={{ accentColor: C.orange, marginTop: "2px" }}
            />
            <span style={{ color: C.textMuted, fontSize: "0.68rem", lineHeight: 1.3 }}>
              I want to receive updates and news from Shri Khatu Shyam Ji Trust on email
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            style={{ backgroundColor: C.orange, color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Verify Mobile &amp; Sign Up
          </button>
        </form>
      )}

      {/* ── LOGIN FORM ── */}
      {mode === "login" && (
        <form className="flex flex-col gap-3 animate-fade-in" onSubmit={loginMethod === "password" ? handleLoginPassword : handleSendLoginOTP}>
          <div className="text-center mb-1">
            <p style={{ color: C.darkBlue, fontSize: "0.8rem", fontWeight: 600 }}>Log In to Devotee Portal</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex rounded-md p-0.5 border" style={{ backgroundColor: C.inputBg, borderColor: C.border }}>
            <button type="button" onClick={() => { setLoginMethod("password"); setError(""); }}
              className="flex-1 py-1 px-1.5 rounded transition-all text-[11px]"
              style={{ backgroundColor: loginMethod === "password" ? C.cardBg : "transparent", color: loginMethod === "password" ? C.darkBlue : C.textMuted, fontWeight: loginMethod === "password" ? 600 : 400 }}>
              Password Login
            </button>
            <button type="button" onClick={() => { setLoginMethod("otp"); setError(""); }}
              className="flex-1 py-1 px-1.5 rounded transition-all text-[11px]"
              style={{ backgroundColor: loginMethod === "otp" ? C.cardBg : "transparent", color: loginMethod === "otp" ? C.darkBlue : C.textMuted, fontWeight: loginMethod === "otp" ? 600 : 400 }}>
              OTP Login
            </button>
          </div>

          {/* Phone or Email Identifier */}
          <div>
            <label className="block mb-0.5" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Registered Phone or Email</label>
            <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
              {identifier.includes("@") ? <Mail size={14} color={C.orange} /> : <Phone size={14} color={C.orange} />}
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543210 or devotee@gmail.com"
                className="flex-1 outline-none text-xs bg-transparent"
                style={{ color: C.darkText }}
                required
              />
            </div>
          </div>

          {/* Password field (only for password method) */}
          {loginMethod === "password" && (
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <label className="block" style={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Password</label>
                <button
                  type="button"
                  onClick={() => { setLoginMethod("otp"); setError(""); }}
                  className="hover:underline text-[10px] font-semibold"
                  style={{ color: C.orange, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center rounded-lg border px-2.5 py-1.5 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
                <Lock size={14} color={C.orange} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="flex-1 outline-none text-xs bg-transparent"
                  style={{ color: C.darkText }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: C.textMuted, lineHeight: 0 }}>
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            style={{ backgroundColor: C.orange, color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loginMethod === "password" ? "Log In" : "Send Login OTP"}
          </button>

          <p className="text-center" style={{ color: C.textMuted, fontSize: "0.68rem" }}>
            {loginMethod === "password" ? (
              <>
                Forgot password?{" "}
                <button
                  type="button"
                  onClick={() => { setLoginMethod("otp"); setError(""); }}
                  className="hover:underline font-semibold"
                  style={{ color: C.orange, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  Try logging in via OTP
                </button>
              </>
            ) : (
              "We'll send a 6-digit code to verify your identity."
            )}
          </p>
        </form>
      )}
    </>
  );
}

/* ── Admin Form (unchanged) ────────────────────── */

function AdminForm({ method, setMethod, showPassword, setShowPassword, onLogin }: {
  method: AdminMethod; setMethod: (m: AdminMethod) => void; showPassword: boolean; setShowPassword: (v: boolean) => void; onLogin: () => void;
}) {
  return (
    <>
      <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: "rgba(247,148,29,0.10)", border: "1px solid rgba(247,148,29,0.40)" }}>
        <AlertTriangle size={13} style={{ color: C.orange, marginTop: "2px", flexShrink: 0 }} />
        <p style={{ color: "#9a5a00", fontSize: "0.72rem", lineHeight: 1.5 }}>
          <strong>Authorized personnel only.</strong> Unauthorized access is strictly prohibited.
        </p>
      </div>
      <div className="flex mb-3 rounded-lg p-0.5" style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}` }}>
        <MethodTab active={method === "password"} onClick={() => setMethod("password")} icon={<KeyRound size={12} />} label="Password Login" />
        <MethodTab active={method === "otp"} onClick={() => setMethod("otp")} icon={<Smartphone size={12} />} label="OTP Login" />
      </div>
      <form className="flex flex-col gap-2.5" onSubmit={e => { e.preventDefault(); onLogin(); }}>
        <DarkInput label="Admin Email" icon={<Mail size={15} color={C.orange} />} type="email" placeholder="admin@shyamsarathi.gov.in" />
        {method === "password" ? (
          <>
            <PasswordField label="Password" placeholder="Enter admin password" show={showPassword} toggle={() => setShowPassword(!showPassword)} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" style={{ accentColor: C.orange }} />
                <span style={{ color: C.textMuted, fontSize: "0.72rem" }}>Remember me</span>
              </label>
              <a href="#" style={{ color: C.orange, fontSize: "0.72rem" }}>Forgot Password?</a>
            </div>
            <SubmitBtn color={C.darkBlue} label="Secure Login" />
          </>
        ) : (
          <>
            <DarkInput label="Phone Number" icon={<Phone size={15} color={C.orange} />} type="tel" placeholder="Registered phone number" />
            <button type="button" className="w-full py-2 rounded-lg border transition-all hover:opacity-80"
              style={{ borderColor: C.darkBlue, color: C.darkBlue, fontWeight: 600, fontSize: "0.82rem", backgroundColor: "transparent" }}>
              Send OTP
            </button>
            <DarkInput label="Enter OTP" icon={<KeyRound size={15} color={C.orange} />} type="text" placeholder="6-digit OTP" />
            <SubmitBtn color={C.darkBlue} label="Verify & Login" />
          </>
        )}
      </form>
    </>
  );
}

function MethodTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md transition-all text-xs"
      style={{ backgroundColor: active ? C.cardBg : "transparent", color: active ? C.darkBlue : C.textMuted, fontWeight: active ? 600 : 400, boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none" }}>
      {icon}{label}
    </button>
  );
}
function DarkInput({ label, icon, type, placeholder, value, onChange }: { label: string; icon: React.ReactNode; type: string; placeholder: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="block mb-1" style={{ color: C.textMuted, fontSize: "0.72rem", fontWeight: 500 }}>{label}</label>
      <div className="flex items-center rounded-lg border px-3 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
        {icon}
        <input type={type} placeholder={placeholder} className="flex-1 py-2 outline-none text-sm bg-transparent" style={{ color: C.darkText }} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function PasswordField({ label, placeholder, show, toggle, value, onChange }: { label: string; placeholder: string; show: boolean; toggle: () => void; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="block mb-1" style={{ color: C.textMuted, fontSize: "0.72rem", fontWeight: 500 }}>{label}</label>
      <div className="flex items-center rounded-lg border px-3 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
        <Lock size={15} color={C.orange} />
        <input type={show ? "text" : "password"} placeholder={placeholder} className="flex-1 py-2 outline-none text-sm bg-transparent" style={{ color: C.darkText }} value={value} onChange={onChange} />
        <button type="button" onClick={toggle} style={{ color: C.textMuted, lineHeight: 0 }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function SubmitBtn({ color, label }: { color: string; label: string }) {
  return (
    <button type="submit" className="w-full py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
      style={{ backgroundColor: color, color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>
      {label}
    </button>
  );
}
