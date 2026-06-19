import { useState } from "react";
import {
  Eye, EyeOff, User, Mail, Lock, Phone,
  Shield, AlertTriangle, KeyRound, Smartphone, CheckCircle2,
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
};

type Portal      = "devotee" | "admin";
type AuthTab     = "login"   | "signup";
type AdminMethod = "password"| "otp";

export function LoginPage() {
  const navigate = useNavigate();
  const [portal,              setPortal]              = useState<Portal>("devotee");
  const [authTab,             setAuthTab]             = useState<AuthTab>("login");
  const [adminMethod,         setAdminMethod]         = useState<AdminMethod>("password");
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <PortalCard active={portal === "devotee"} onClick={() => { setPortal("devotee"); setAuthTab("login"); }} icon={<User size={18} />} title="Devotee Portal" subtitle="Pilgrims & visitors" />
            <PortalCard active={portal === "admin"} onClick={() => setPortal("admin")} icon={<Shield size={18} />} title="Admin Portal" subtitle="Authorized personnel" showBadge />
          </div>

          {/* Form Card */}
          <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}` }}>
            {portal === "admin"
              ? <AdminForm method={adminMethod} setMethod={setAdminMethod} showPassword={showPassword} setShowPassword={setShowPassword} />
              : <DevoteeForm tab={authTab} setTab={setAuthTab} showPassword={showPassword} setShowPassword={setShowPassword} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} />
            }
          </div>

          {portal === "devotee" && (
            <p className="text-center" style={{ color: C.textMuted, fontSize: "0.75rem" }}>
              {authTab === "login" ? "New here? " : "Already registered? "}
              <button onClick={() => setAuthTab(authTab === "login" ? "signup" : "login")} className="hover:underline" style={{ color: C.orange, fontWeight: 600 }}>
                {authTab === "login" ? "Register Here" : "Login"}
              </button>
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

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

function AdminForm({ method, setMethod, showPassword, setShowPassword }: {
  method: AdminMethod; setMethod: (m: AdminMethod) => void; showPassword: boolean; setShowPassword: (v: boolean) => void;
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
      <form className="flex flex-col gap-2.5" onSubmit={e => e.preventDefault()}>
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

function DevoteeForm({ tab, setTab, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword }: {
  tab: AuthTab; setTab: (t: AuthTab) => void; showPassword: boolean; setShowPassword: (v: boolean) => void; showConfirmPassword: boolean; setShowConfirmPassword: (v: boolean) => void;
}) {
  return (
    <>
      <div className="flex mb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        {(["login", "signup"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="flex-1 pb-2 text-sm transition-all relative"
            style={{ color: tab === t ? C.darkBlue : C.textMuted, fontWeight: tab === t ? 600 : 400 }}>
            {t === "login" ? "Login" : "Sign Up"}
            {tab === t && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full" style={{ width: "50%", height: "2px", backgroundColor: C.orange, display: "block" }} />}
          </button>
        ))}
      </div>
      <form className="flex flex-col gap-2.5" onSubmit={e => e.preventDefault()}>
        {tab === "signup" && <DarkInput label="Full Name" icon={<User size={15} color={C.orange} />} type="text" placeholder="Enter your full name" />}
        <DarkInput label="Email Address" icon={<Mail size={15} color={C.orange} />} type="email" placeholder="Enter your email" />
        {tab === "signup" && <DarkInput label="Phone Number" icon={<Phone size={15} color={C.orange} />} type="tel" placeholder="+91 Enter phone number" />}
        <PasswordField label="Password" placeholder="Enter your password" show={showPassword} toggle={() => setShowPassword(!showPassword)} />
        {tab === "signup" && <PasswordField label="Confirm Password" placeholder="Confirm your password" show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />}
        {tab === "login" && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" style={{ accentColor: C.orange }} />
              <span style={{ color: C.textMuted, fontSize: "0.72rem" }}>Remember me</span>
            </label>
            <a href="#" style={{ color: C.orange, fontSize: "0.72rem" }}>Forgot Password?</a>
          </div>
        )}
        <SubmitBtn color={tab === "login" ? C.green : C.orange} label={tab === "login" ? "Sign In" : "Create Account"} />
        {tab === "login" && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
              <span style={{ color: C.textMuted, fontSize: "0.68rem" }}>OR</span>
              <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
            </div>
            <button type="button" className="w-full py-1.5 rounded-lg border flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ borderColor: C.border, color: C.darkText, fontSize: "0.82rem", backgroundColor: C.inputBg }}>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </form>
    </>
  );
}

function DarkInput({ label, icon, type, placeholder }: { label: string; icon: React.ReactNode; type: string; placeholder: string }) {
  return (
    <div>
      <label className="block mb-1" style={{ color: C.textMuted, fontSize: "0.72rem", fontWeight: 500 }}>{label}</label>
      <div className="flex items-center rounded-lg border px-3 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
        {icon}
        <input type={type} placeholder={placeholder} className="flex-1 py-2 outline-none text-sm bg-transparent" style={{ color: C.darkText }} />
      </div>
    </div>
  );
}

function PasswordField({ label, placeholder, show, toggle }: { label: string; placeholder: string; show: boolean; toggle: () => void }) {
  return (
    <div>
      <label className="block mb-1" style={{ color: C.textMuted, fontSize: "0.72rem", fontWeight: 500 }}>{label}</label>
      <div className="flex items-center rounded-lg border px-3 gap-2" style={{ borderColor: C.border, backgroundColor: C.inputBg }}>
        <Lock size={15} color={C.orange} />
        <input type={show ? "text" : "password"} placeholder={placeholder} className="flex-1 py-2 outline-none text-sm bg-transparent" style={{ color: C.darkText }} />
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
