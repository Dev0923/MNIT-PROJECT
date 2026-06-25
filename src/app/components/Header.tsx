import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Menu, X, Phone, MapPin, Shield, Heart,
  Car, ChevronDown, Landmark, Stethoscope, ClipboardList,
  HandCoins, UtensilsCrossed, Building2, ScrollText,
  ChevronRight, Info as InfoIcon, Clock, Star as StarIcon, Newspaper,
  BookOpen, MapPinned, Images, Video, Rotate3d, Network, ShieldAlert, User
} from "lucide-react";
import logoImg from "../../imports/image-21.png";
import { ProfilePanel } from "./ProfilePanel";

const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  footerBg: "#152060",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  green: "#28A745",
  pink: "#E97B8C",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
};

const NAV_KEYS = ["home", "about", "crowd", "permission", "liveDarshan", "melaMap", "gallery", "donation", "help"];

interface LiveAnnouncement { id: number; text: string; active: boolean; created_at: string; }

export function Header() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const setLang = (l: "en" | "hi") => i18n.changeLanguage(l);

  // Live Weather Logic
  const [weatherTemp, setWeatherTemp] = useState<string>("24°C");
  const [weatherCode, setWeatherCode] = useState<number>(800);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || "8d2de98e089f1c28e1a22fc19a24ef04";
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=27.3667&lon=75.4000&units=metric&appid=${apiKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.main && data.weather && data.weather[0]) {
            setWeatherTemp(`${Math.round(data.main.temp)}°C`);
            setWeatherCode(data.weather[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
      }
    }
    fetchWeather();
  }, []);

  const isLoggedIn = !!(localStorage.getItem("token") || localStorage.getItem("authToken"));
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  // Read user name for avatar initials
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();
  const userInitials = storedUser?.name
    ? storedUser.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : (storedUser?.phone ? storedUser.phone.slice(-2) : "U");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(
    window.location.pathname === "/" ? "home" :
    window.location.pathname.includes("about") ? "about" :
    window.location.pathname.includes("permission") ? "permission" :
    window.location.pathname.includes("live-darshan") ? "liveDarshan" :
    window.location.pathname.includes("mela-map") ? "melaMap" :
    window.location.pathname.includes("gallery") ? "gallery" :
    window.location.pathname.includes("donation") ? "donation" :
    window.location.pathname.includes("help") ? "help" : "home"
  );
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  
  const [permOpen, setPermOpen] = useState(false);
  const [mobilePermOpen, setMobilePermOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [mobileDonationOpen, setMobileDonationOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mobileGalleryOpen, setMobileGalleryOpen] = useState(false);
  const [templeSubOpen, setTempleSubOpen] = useState(false);
  const [mobileTempleSubOpen, setMobileTempleSubOpen] = useState(false);
  const [historySubOpen, setHistorySubOpen] = useState(false);
  const [mobileHistorySubOpen, setMobileHistorySubOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<LiveAnnouncement[]>([]);

  useEffect(() => {
    const fetchAnn = () =>
      fetch("http://localhost:8000/api/admin/announcements?active_only=true")
        .then(r => r.ok ? r.json() : [])
        .then((data: LiveAnnouncement[]) => setAnnouncements(data))
        .catch(() => { /* keep previous */ });
    fetchAnn();
    const timer = setInterval(fetchAnn, 60_000);
    return () => clearInterval(timer);
  }, []);

  const PERMISSION_ITEMS = [
    { label: "Vehicle Permission", icon: <Car size={16} color={C.pink} />, slug: "vehicle-permits" },
    { label: "Bandhara Permission", icon: <Landmark size={16} color={C.darkBlue} />, slug: "bandhara-permission" },
    { label: "Medical Camp", icon: <Stethoscope size={16} color="#9333EA" />, slug: "medical-camp" },
    { label: "Other Permissions", icon: <ClipboardList size={16} color={C.orange} />, slug: "other-permissions" },
  ];

  const DONATION_ITEMS = [
    { label: "Donation", icon: <HandCoins size={16} color={C.orange} />, slug: "donation-portal" },
    { label: "Annadaan", icon: <UtensilsCrossed size={16} color={C.green} />, path: "/services/annadaan-seva" },
  ];

  const GALLERY_ITEMS = [
    { label: "Photos", icon: <Images size={16} color={C.orange} />, path: "/gallery" },
    { label: "Videos", icon: <Video size={16} color={C.darkBlue} />, path: "/gallery/videos" },
    { label: "Virtual Tour", icon: <Rotate3d size={16} color="#9333EA" />, path: "/gallery/virtual-tour" },
  ];

  const TEMPLE_SUB_ITEMS = [
    { label: "About Temple", icon: <InfoIcon size={15} color={C.orange} />, slug: "about-temple" },
    { label: "Temple Timings", icon: <Clock size={15} color={C.darkBlue} />, slug: "temple-timings" },
    { label: "Important Days", icon: <StarIcon size={15} color={C.pink} />, slug: "important-days" },
    { label: "News And Events", icon: <Newspaper size={15} color={C.green} />, slug: "news-events" },
  ];

  const HISTORY_SUB_ITEMS = [
    { label: "Temple History", icon: <BookOpen size={15} color={C.darkBlue} />, slug: "temple-history" },
    { label: "About Khatu", icon: <MapPinned size={15} color={C.green} />, slug: "about-khatu" },
  ];

  const ABOUT_ITEMS: Array<{ label: string; icon: React.ReactNode; slug: string; subItems?: typeof TEMPLE_SUB_ITEMS }> = [
    { label: "Temple", icon: <Building2 size={16} color={C.orange} />, slug: "about-temple", subItems: TEMPLE_SUB_ITEMS },
    { label: "History", icon: <ScrollText size={16} color={C.darkBlue} />, slug: "about-history", subItems: HISTORY_SUB_ITEMS },
  ];

  return (
    <>
      {/* ── Top Language Bar ────────────────────────────── */}
      <div className="w-full flex justify-between items-center px-6 py-1.5" style={{ backgroundColor: C.darkBlue }}>
        {/* Site Map button — left side */}
        <button
          onClick={() => navigate("/sitemap")}
          className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.70)" }}
        >
          <Network size={13} />
          {t('header.siteMap')}
        </button>

        {/* Language switcher — right side */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <button onClick={() => setLang("hi")} className="transition-all"
            style={{ color: lang === "hi" ? C.orange : "rgba(255,255,255,0.55)", fontWeight: lang === "hi" ? 700 : 400 }}>
            हिंदी
          </button>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <button onClick={() => setLang("en")} className="transition-all"
            style={{ color: lang === "en" ? C.orange : "rgba(255,255,255,0.55)", fontWeight: lang === "en" ? 700 : 400 }}>
            English
          </button>
        </div>
      </div>

      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full" style={{ backgroundColor: C.white, borderBottom: `2px solid ${C.orange}`, boxShadow: "0 2px 12px rgba(31,47,140,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo + Name */}
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
              style={{ backgroundColor: C.cream, boxShadow: `0 0 0 2px ${C.darkBlue}` }}>
              <img src={logoImg} alt="Khatu Shyam Ji" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="leading-tight font-bold text-sm" style={{ color: C.darkBlue }}>Khatu Shyam Ji Temple</div>
              <div className="text-xs" style={{ color: C.muted }}>Shri Shyam Mandir, Khatu, Rajasthan</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_KEYS.map(link => (link === "permission" || link === "donation" || link === "about" || link === "gallery") ? (
              (() => {
                const open = link === "permission" ? permOpen : link === "donation" ? donationOpen : link === "gallery" ? galleryOpen : aboutOpen;
                const setOpen = link === "permission" ? setPermOpen : link === "donation" ? setDonationOpen : link === "gallery" ? setGalleryOpen : setAboutOpen;
                const items = link === "permission" ? PERMISSION_ITEMS : link === "donation" ? DONATION_ITEMS : link === "gallery" ? GALLERY_ITEMS : ABOUT_ITEMS;
                const minW = link === "permission" ? "230px" : "160px";
                return (
                  <div key={link} className="relative"
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}>
                    <button onClick={() => setActiveNav(link)}
                      className="px-3 py-2 text-xs font-semibold rounded-md transition-all relative flex items-center gap-1"
                      style={{ color: activeNav === link ? C.darkBlue : C.muted }}>
                      {t(`nav.${link}`)}
                      <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      {activeNav === link && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full" style={{ backgroundColor: C.orange }} />
                      )}
                    </button>
                    {open && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50" style={{ minWidth: minW }}>
                        <div className="rounded-lg shadow-xl"
                          style={{ backgroundColor: C.white, border: `2px solid ${C.orange}` }}>
                          {items.map((item: any, i) => {
                            const hasSub = !!item.subItems;
                            const subKey = item.label;
                            const subOpen = subKey === "Temple" ? templeSubOpen : subKey === "History" ? historySubOpen : false;
                            const setSubOpen = subKey === "Temple" ? setTempleSubOpen : subKey === "History" ? setHistorySubOpen : () => { };
                            return (
                              <div key={item.label} className="relative"
                                onMouseEnter={() => hasSub && setSubOpen(true)}
                                onMouseLeave={() => hasSub && setSubOpen(false)}>
                                <button
                                  onClick={() => { setActiveNav(link); if (!hasSub) { navigate(item.path ?? `/services/${item.slug}`); setOpen(false); } }}
                                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
                                  style={{
                                    color: C.darkText,
                                    borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none",
                                    backgroundColor: C.white,
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.cream)}
                                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.white)}>
                                  <span className="flex items-center gap-3">
                                    {item.icon}
                                    <span className="text-xs font-semibold">{item.label}</span>
                                  </span>
                                  {hasSub && <ChevronRight size={13} color={C.muted} />}
                                </button>
                                {hasSub && subOpen && (
                                  <div className="absolute left-full top-0 pl-1 z-50" style={{ minWidth: "200px" }}>
                                    <div className="rounded-lg overflow-hidden shadow-xl"
                                      style={{ backgroundColor: C.white, border: `2px solid ${C.orange}` }}>
                                      {item.subItems.map((sub: any, j: number) => (
                                        <button key={sub.label}
                                          onClick={() => { setActiveNav(link); navigate(`/services/${sub.slug}`); setOpen(false); setSubOpen(false); }}
                                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                          style={{
                                            color: C.darkText,
                                            borderBottom: j < item.subItems.length - 1 ? `1px solid ${C.border}` : "none",
                                            backgroundColor: C.white,
                                          }}
                                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.cream)}
                                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.white)}>
                                          {sub.icon}
                                          <span className="text-xs font-semibold">{sub.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <button key={link} onClick={() => {
                setActiveNav(link);
                if (link === "melaMap") navigate("/mela-map");
                if (link === "help") navigate("/help");
                if (link === "liveDarshan") navigate("/live-darshan");
                if (link === "home") navigate("/");
              }}
                className="px-3 py-2 text-xs font-semibold rounded-md transition-all relative"
                style={{ color: activeNav === link ? C.darkBlue : C.muted }}>
                {t(`nav.${link}`)}
                {activeNav === link && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full" style={{ backgroundColor: C.orange }} />
                )}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setIsSOSOpen(true)} className="px-4 py-1.5 rounded-md text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: C.pink }}>
              {t('header.sos')}
            </button>
            {!isLoggedIn ? (
              <button onClick={() => navigate("/login")}
                className="px-4 py-1.5 rounded-md text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: C.green }}>
                {t('header.login')}
              </button>
            ) : (
              <button
                onClick={() => setProfilePanelOpen(true)}
                title="View Profile"
                className="flex items-center gap-2 px-2 py-1 rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: C.darkBlue }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${C.orange}, #fbbf24)`, color: C.white }}
                >
                  {userInitials}
                </div>
                <span className="text-xs font-semibold max-w-[80px] truncate" style={{ color: C.white }}>
                  {storedUser?.name?.split(" ")[0] || "Profile"}
                </span>
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 rounded-md" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: C.darkBlue }}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pb-4 flex flex-col gap-2" style={{ backgroundColor: C.white, borderTop: `1px solid ${C.border}` }}>
            {NAV_KEYS.map(link => (link === "permission" || link === "donation" || link === "about" || link === "gallery") ? (
              (() => {
                const open = link === "permission" ? mobilePermOpen : link === "donation" ? mobileDonationOpen : link === "gallery" ? mobileGalleryOpen : mobileAboutOpen;
                const setOpen = link === "permission" ? setMobilePermOpen : link === "donation" ? setMobileDonationOpen : link === "gallery" ? setMobileGalleryOpen : setMobileAboutOpen;
                const items = link === "permission" ? PERMISSION_ITEMS : link === "donation" ? DONATION_ITEMS : link === "gallery" ? GALLERY_ITEMS : ABOUT_ITEMS;
                return (
                  <div key={link}>
                    <button onClick={() => setOpen(!open)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-md text-sm font-medium"
                      style={{ color: activeNav === link ? C.orange : C.darkText, backgroundColor: activeNav === link ? `${C.orange}15` : "transparent" }}>
                      {t(`nav.${link}`)}
                      <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    {open && (
                      <div className="pl-3 mt-1 flex flex-col gap-1">
                        {items.map((item: any) => {
                          const hasSub = !!item.subItems;
                          const subKey = item.label;
                          const subOpen = subKey === "Temple" ? mobileTempleSubOpen : subKey === "History" ? mobileHistorySubOpen : false;
                          const setSubOpen = subKey === "Temple" ? setMobileTempleSubOpen : subKey === "History" ? setMobileHistorySubOpen : (_: boolean) => { };
                          return (
                            <div key={item.label}>
                              <button
                                onClick={() => {
                                  if (hasSub) { setSubOpen(!subOpen); }
                                  else { setActiveNav(link); navigate(item.path ?? `/services/${item.slug}`); setMobileMenuOpen(false); setOpen(false); }
                                }}
                                className="w-full flex items-center justify-between gap-3 py-2 px-3 rounded-md text-xs"
                                style={{ color: C.darkText, backgroundColor: C.cream }}>
                                <span className="flex items-center gap-3">
                                  {item.icon}
                                  <span className="font-semibold">{item.label}</span>
                                </span>
                                {hasSub && <ChevronDown size={12} style={{ transform: subOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />}
                              </button>
                              {hasSub && subOpen && (
                                <div className="pl-4 mt-1 flex flex-col gap-1">
                                  {item.subItems.map((sub: any) => (
                                    <button key={sub.label}
                                      onClick={() => { setActiveNav(link); navigate(`/services/${sub.slug}`); setMobileMenuOpen(false); setOpen(false); setSubOpen(false); }}
                                      className="flex items-center gap-3 py-2 px-3 rounded-md text-xs"
                                      style={{ color: C.darkText, backgroundColor: C.white, border: `1px solid ${C.border}` }}>
                                      {sub.icon}
                                      <span className="font-semibold">{sub.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <button key={link} onClick={() => {
                setActiveNav(link); setMobileMenuOpen(false);
                if (link === "melaMap") navigate("/mela-map");
                if (link === "help") navigate("/help");
                if (link === "liveDarshan") navigate("/live-darshan");
                if (link === "home") navigate("/");
              }}
                className="text-left py-2 px-3 rounded-md text-sm font-medium"
                style={{ color: activeNav === link ? C.orange : C.darkText, backgroundColor: activeNav === link ? `${C.orange}15` : "transparent" }}>
                {t(`nav.${link}`)}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setIsSOSOpen(true); setMobileMenuOpen(false); }} className="flex-1 py-2 rounded-md text-xs font-bold text-white" style={{ backgroundColor: C.pink }}>{t('header.sos')}</button>
              {!isLoggedIn ? (
                <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="flex-1 py-2 rounded-md text-xs font-bold text-white" style={{ backgroundColor: C.green }}>{t('header.login')}</button>
              ) : (
                <button
                  onClick={() => { setProfilePanelOpen(true); setMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: C.darkBlue }}
                >
                  <User size={13} /> Profile
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Marquee Bar ─────────────────────────────────── */}
      <div className="w-full overflow-hidden py-2" style={{ backgroundColor: C.cream, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex whitespace-nowrap animate-marquee">
          {announcements.length > 0
            ? [0, 1].map(i => (
                <span key={i} className="inline-block px-6 text-xs tracking-wide font-medium" style={{ color: C.darkBlue }}>
                  {announcements.map(a => `★★ ${a.text}`).join("  ·  ")}
                </span>
              ))
            : [t('marquee'), t('marquee')].map((text, i) => (
                <span key={i} className="inline-block px-6 text-xs tracking-wide font-medium" style={{ color: C.darkBlue }}>
                  &#9733;&#9733; {text}
                </span>
              ))}
        </div>
      </div>

      {/* Profile Panel */}
      <ProfilePanel isOpen={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} />

      {/* SOS Modal */}
      {isSOSOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(31,47,140,0.8)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200" style={{ backgroundColor: C.white, border: `2px solid ${C.pink}` }}>
            <button onClick={() => setIsSOSOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center gap-2 mb-6 mt-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${C.pink}20`, color: C.pink }}>
                <ShieldAlert size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide" style={{ color: C.pink }}>EMERGENCY SOS</h2>
                <p className="text-sm" style={{ color: C.muted }}>Immediate assistance for devotees</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <a href="tel:112" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50" style={{ border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.pink}15`, color: C.pink }}><Phone size={18} /></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: C.darkText }}>Police & General SOS</p>
                  <p className="text-xs" style={{ color: C.muted }}>Dial 112 or 100</p>
                </div>
              </a>
              <a href="tel:108" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50" style={{ border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.orange}15`, color: C.orange }}><Heart size={18} /></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: C.darkText }}>Medical Emergency</p>
                  <p className="text-xs" style={{ color: C.muted }}>Dial 108</p>
                </div>
              </a>
              <a href="tel:01576221000" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50" style={{ border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.darkBlue}15`, color: C.darkBlue }}><Shield size={18} /></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: C.darkText }}>Mela Control Room</p>
                  <p className="text-xs" style={{ color: C.muted }}>Dial 01576-221000</p>
                </div>
              </a>
            </div>

            <button onClick={() => {
              alert("Your GPS location and distress signal have been sent to the Temple Control Room. Help is on the way.");
              setIsSOSOpen(false);
            }} className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: C.pink, boxShadow: `0 4px 12px ${C.pink}40` }}>
              <MapPin size={18} />
              SHARE MY LOCATION
            </button>
          </div>
        </div>
      )}
    </>
  );
}
