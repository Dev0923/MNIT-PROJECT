import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Menu, X, Bell, Clock,
  Phone, MapPin, Shield, Heart,
  Users2, Car, Sun, ChevronDown, Cloud, CloudRain, CloudSun, CloudLightning,
  Landmark, Stethoscope, ClipboardList,
  HandCoins, UtensilsCrossed,
  Building2, ScrollText,
  ChevronRight, Info as InfoIcon, CalendarDays, Star as StarIcon, Newspaper,
  BookOpen, MapPinned, Images, Video, Rotate3d, Network, ShieldAlert,
} from "lucide-react";
import templeImg from "../../imports/khatu-shyam-ji.jpg";
import logoImg from "../../imports/image-21.png";
import imgLostFound from "../../imports/lost and found.avif";
import imgVehicle from "../../imports/vehicle permission.jpg.jpeg";
import imgDarshan from "../../imports/darshan booking.webp";
import imgDonation from "../../imports/donation.png";
import imgHealth from "../../imports/health camp.jpg.jpeg";

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

export function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const setLang = (l: "en" | "hi") => i18n.changeLanguage(l);

  // Live Weather Logic
  const [weatherTemp, setWeatherTemp] = useState<string>("24°C");
  const [weatherCode, setWeatherCode] = useState<number>(800); // OpenWeather code for Clear Sky

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

  const weatherInfo = useMemo(() => {
    let descEn = "Clear sky";
    let descHi = "साफ आसमान";
    let iconName = "sun";

    const code = weatherCode;
    // Map OpenWeather weather codes (see https://openweathermap.org/weather-conditions)
    if (code === 800) {
      descEn = "Clear sky";
      descHi = "साफ आसमान";
      iconName = "sun";
    } else if (code === 801) {
      descEn = "Partly cloudy";
      descHi = "आंशिक रूप से बादल";
      iconName = "cloud-sun";
    } else if (code >= 802 && code <= 804) {
      descEn = "Cloudy";
      descHi = "बादल";
      iconName = "cloud";
    } else if (code >= 700 && code < 800) {
      descEn = "Foggy / Mist";
      descHi = "कोहरा / धुंध";
      iconName = "cloud";
    } else if ((code >= 300 && code < 400) || (code >= 500 && code < 600)) {
      descEn = "Rainy";
      descHi = "बारिश";
      iconName = "cloud-rain";
    } else if (code >= 200 && code < 300) {
      descEn = "Thunderstorm";
      descHi = "आंधी-तूफान";
      iconName = "cloud-lightning";
    } else {
      descEn = "Cloudy";
      descHi = "बादल";
      iconName = "cloud";
    }

    return {
      desc: lang === "hi" ? `${descHi}, खाटू` : `${descEn}, Khatu`,
      iconName
    };
  }, [weatherCode, lang]);

  const isLoggedIn = !!localStorage.getItem("token");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>

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
          <div className="flex items-center gap-3 flex-shrink-0">
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
              <button onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="px-4 py-1.5 rounded-md text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: C.muted }}>
                Logout
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
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 py-2 rounded-md text-xs font-bold text-white" style={{ backgroundColor: C.muted }}>Logout</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Marquee Bar ─────────────────────────────────── */}
      <div className="w-full overflow-hidden py-2" style={{ backgroundColor: C.cream, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex whitespace-nowrap animate-marquee">
          {[t('marquee'), t('marquee')].map((text, i) => (
            <span key={i} className="inline-block px-6 text-xs tracking-wide font-medium" style={{ color: C.darkBlue }}>
              &#9733;&#9733; {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative w-full" style={{ height: "75vh", minHeight: "420px" }}>
        <img src={templeImg} alt="Khatu Shyam Ji Temple" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(21,32,96,0.92) 0%, rgba(21,32,96,0.45) 45%, transparent 100%)` }} />

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 text-center">
          <p className="mb-3 uppercase tracking-widest text-xs font-semibold" style={{ color: C.orange }}>
            {t('hero.subtitle')}
          </p>
          <h1 className="mb-3" style={{ color: C.white, fontSize: "clamp(1.8rem, 5vw, 3.2rem)", fontWeight: 700, textShadow: "0 2px 16px rgba(0,0,0,0.5)", fontFamily: "'Georgia', serif" }}>
            {t('hero.title')}
          </h1>
          <p className="mb-6 mx-auto max-w-lg text-sm" style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.8 }}>
            {t('hero.desc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate("/darshan-booking")}
              className="px-7 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: C.orange, boxShadow: `0 4px 18px rgba(247,148,29,0.45)` }}>
              {t('hero.bookBtn')}
            </button>
            {!isLoggedIn && (
              <button onClick={() => navigate("/login")}
                className="px-7 py-2.5 rounded-full text-sm font-bold border-2 transition-all"
                style={{ borderColor: C.white, color: C.white, backgroundColor: "rgba(255,255,255,0.10)" }}>
                {t('hero.loginBtn')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── About Strip ─────────────────────────────────── */}
      <section className="py-16 px-6" style={{ backgroundColor: C.white }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: C.orange }}>{t('about.subtitle')}</p>
            <h2 className="text-2xl font-bold mb-5" style={{ color: C.darkBlue }}>{t('about.title')}</h2>
            <div className="pl-4 mb-4" style={{ borderLeft: `3px solid ${C.orange}` }}>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                {t('about.p1')}
              </p>
            </div>
            <p className="text-sm leading-relaxed mb-7" style={{ color: C.muted }}>
              {t('about.p2')}
            </p>
            <button className="px-7 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: C.darkBlue, boxShadow: `0 4px 14px rgba(31,47,140,0.30)` }}>
              {t('about.btn')}
            </button>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ height: "340px" }}>
            <img src={templeImg} alt="Khatu Shyam Ji" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.darkBlue}cc 0%, transparent 55%)` }} />
            <div className="absolute bottom-0 left-0 right-0 px-6 py-5" style={{ background: `linear-gradient(to top, ${C.darkBlue} 0%, transparent 100%)` }}>
              <p className="font-bold text-white text-base" style={{ fontFamily: "serif" }}>{t('about.imageText')}</p>
              <p className="text-xs mt-0.5" style={{ color: C.orange }}>{t('about.imageSub')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Info + Timings + Stats ──────────────────────── */}
      <section className="w-full py-14 px-6 relative overflow-hidden" style={{
        background: `linear-gradient(180deg, ${C.cream} 0%, #FFFFFF 100%)`,
      }}>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, ${C.darkBlue} 1.2px, transparent 1.2px)`,
          backgroundSize: "26px 26px",
        }} />
        {/* Soft accent blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.orange} 0%, transparent 70%)` }} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.darkBlue} 0%, transparent 70%)` }} />

        {/* Section heading */}
        <div className="relative max-w-7xl mx-auto text-center mb-8">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: C.orange }}>{t('info.subtitle')}</p>
          <h2 className="inline-flex items-center gap-4 text-2xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
            <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
            {t('info.title')}
            <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
          </h2>
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col gap-6">

          {/* Row 1: Notifications + Aarti Timings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Notifications Panel */}
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ backgroundColor: C.darkBlue }}>
                <div className="flex items-center gap-2">
                  <Bell size={15} color={C.orange} />
                  <span className="text-sm font-bold text-white">{t('info.notifTitle')}</span>
                </div>
                <button className="text-xs font-semibold px-3 py-1 rounded-full transition-all hover:opacity-90"
                  style={{ backgroundColor: C.orange, color: C.white }}>
                  {t('info.viewAll')}
                </button>
              </div>
              <div>
                {[
                  { date: "31 May 2026", text: "Shyam Mahotsav special darshan — extra tokens available from 5 AM." },
                  { date: "30 May 2026", text: "Parking at Sector 4 & 6 operational. Sector 2 closed for maintenance." },
                  { date: "28 May 2026", text: "Online prasad booking now open for outstation devotees." },
                  { date: "25 May 2026", text: "Mangala Aarti timing shifted to 4:30 AM effective June 1 (Summer schedule)." },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 px-5 py-3.5 border-b cursor-pointer transition-colors"
                    style={{ borderColor: C.border, backgroundColor: i % 2 === 0 ? C.white : C.cream }}>
                    <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: C.orange }} />
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: C.darkText }}>{n.text}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{n.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aarti Timings Panel */}
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 px-5 py-3.5" style={{ backgroundColor: C.darkBlue }}>
                <Clock size={15} color={C.orange} />
                <span className="text-sm font-bold text-white">{t('info.aartiTitle')}</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: C.cream }}>
                    <th className="text-left px-5 py-2.5 text-xs font-bold" style={{ color: C.darkText }}>Aarti</th>
                    <th className="text-center px-4 py-2.5 text-xs font-bold" style={{ color: C.darkBlue }}>{t('info.winter')}</th>
                    <th className="text-center px-4 py-2.5 text-xs font-bold" style={{ color: C.orange }}>{t('info.summer')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Mangala Aarti", winter: "05:30 AM", summer: "04:30 AM" },
                    { name: "Shringar Aarti", winter: "08:00 AM", summer: "07:00 AM" },
                    { name: "Bhog Aarti", winter: "12:30 PM", summer: "12:00 PM" },
                    { name: "Sandhya Aarti", winter: "06:30 PM", summer: "07:30 PM" },
                    { name: "Shayan Aarti", winter: "09:00 PM", summer: "10:00 PM" },
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.cream, borderTop: `1px solid ${C.border}` }}>
                      <td className="px-5 py-3 text-xs font-medium" style={{ color: C.darkText }}>{row.name}</td>
                      <td className="text-center px-4 py-3 text-xs font-bold" style={{ color: C.darkBlue }}>{row.winter}</td>
                      <td className="text-center px-4 py-3 text-xs font-bold" style={{ color: C.orange }}>{row.summer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 2: Live Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('stats.darshan.label')} value={t('stats.darshan.value')} sub={t('stats.darshan.sub')} bg={C.darkBlue} icon={<Clock size={18} color="#fff" />} />
            <StatCard label={t('stats.crowd.label')} value={t('stats.crowd.value')} sub={t('stats.crowd.sub')} bg={C.green} icon={<Users2 size={18} color="#fff" />} />
            <StatCard label={t('stats.parking.label')} value={t('stats.parking.value')} sub={t('stats.parking.sub')} bg={C.orange} icon={<Car size={18} color="#fff" />} />
            <StatCard
              label={t('stats.weather.label')}
              value={weatherTemp}
              sub={weatherInfo.desc}
              bg={C.pink}
              icon={
                weatherInfo.iconName === "sun" ? (
                  <Sun size={18} color="#fff" />
                ) : weatherInfo.iconName === "cloud-sun" ? (
                  <CloudSun size={18} color="#fff" />
                ) : weatherInfo.iconName === "cloud-rain" ? (
                  <CloudRain size={18} color="#fff" />
                ) : weatherInfo.iconName === "cloud-lightning" ? (
                  <CloudLightning size={18} color="#fff" />
                ) : (
                  <Cloud size={18} color="#fff" />
                )
              }
            />
          </div>

        </div>
      </section>

      {/* ── Online Services ─────────────────────────────── */}
      <section className="py-16 px-6" style={{ backgroundColor: C.cream }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="inline-flex items-center gap-4 text-2xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
              <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
              {t('services.title')}
              <span className="h-px w-10" style={{ backgroundColor: C.orange }} />
            </h2>
          </div>

          <Slider
            dots
            infinite
            speed={500}
            slidesToShow={5}
            slidesToScroll={1}
            autoplay
            autoplaySpeed={4000}
            responsive={[
              { breakpoint: 1280, settings: { slidesToShow: 4 } },
              { breakpoint: 1024, settings: { slidesToShow: 3 } },
              { breakpoint: 768, settings: { slidesToShow: 2 } },
              { breakpoint: 540, settings: { slidesToShow: 1 } },
            ]}
          >
            {[
              {
                slug: "bandhara-permission",
                title: t('services.bhandaraTitle'),
                cta: t('services.btnApply'),
                img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
                desc: t('services.bhandaraDesc'),
              },
              {
                slug: "medical-camp",
                title: t('services.medicalTitle'),
                cta: t('services.btnRegister'),
                img: imgHealth,
                desc: t('services.medicalDesc'),
              },
              {
                slug: "accommodation-booking",
                title: t('services.accomodationTitle'),
                cta: t('services.btnBook'),
                img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
                desc: t('services.accomodationDesc'),
              },
              {
                slug: "vehicle-permits",
                title: t('services.vehicleTitle'),
                cta: t('services.btnApply'),
                img: imgVehicle,
                desc: t('services.vehicleDesc'),
              },
              {
                slug: "darshan-pass",
                title: t('services.darshanTitle'),
                cta: t('services.btnBook'),
                img: imgDarshan,
                desc: t('services.darshanDesc'),
              },
              {
                slug: "officer-login",
                title: t('services.officerTitle'),
                cta: t('services.btnLogin'),
                img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80",
                desc: t('services.officerDesc'),
              },
              {
                slug: "traffic-command-center",
                title: t('services.trafficTitle'),
                cta: t('services.btnOpen'),
                img: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?auto=format&fit=crop&w=600&q=80",
                desc: t('services.trafficDesc'),
              },
              {
                slug: "donation-portal",
                title: t('services.donationTitle'),
                cta: t('services.btnDonate'),
                img: imgDonation,
                desc: t('services.donationDesc'),
              },
              {
                slug: "annadaan-seva",
                path: "/services/annadaan-seva",
                title: "Premium Annadaan Seva",
                cta: "Offer Food Seva",
                img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
                desc: "Feed visiting devotees with Full-Day, Half-Day Bhojan or Sweet Prasad distributed at the temple.",
              },
              {
                slug: "lost-and-found",
                title: t('services.lostTitle'),
                cta: t('services.btnReport'),
                img: imgLostFound,
                desc: t('services.lostDesc'),
              },
              {
                slug: "yatra-planning",
                title: t('services.yatraTitle'),
                cta: t('services.btnPlan'),
                img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
                desc: t('services.yatraDesc'),
              },
              {
                slug: "crowd-status",
                title: t('services.crowdTitle'),
                cta: t('services.btnView'),
                img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
                desc: t('services.crowdDesc'),
              },
            ].map(s => (
              <div key={s.title} className="px-2 pb-2 h-full">
                <div
                  className="rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-full"
                  style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(31,47,140,0.06)" }}>
                  <div className="text-center pt-4 pb-3 px-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <h3 className="font-bold text-sm" style={{ color: C.orange, fontFamily: "'Georgia', serif" }}>{s.title}</h3>
                  </div>
                  <div className="w-full" style={{ height: "140px" }}>
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex-1">
                    <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => navigate((s as any).path ?? (s.slug === "darshan-pass" ? "/darshan-booking" : s.slug === "officer-login" ? "/login" : `/services/${s.slug}`))}
                      className="w-full py-2.5 rounded-md text-sm font-bold text-white transition-all hover:opacity-95 cursor-pointer"
                      style={{
                        background: `linear-gradient(90deg, #F7941D 0%, #F26A21 100%)`,
                        color: C.white,
                        boxShadow: `0 4px 12px rgba(247,148,29,0.35)`,
                        fontFamily: "'Georgia', serif",
                      }}>
                      {s.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────── */}
      {!isLoggedIn && (
        <section className="py-12 px-6 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.darkBlue} 0%, #2a3fa8 100%)` }}>
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: C.orange }}>{t('cta.subtitle')}</p>
            <h2 className="text-2xl font-bold text-white mb-2">{t('cta.title')}</h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
              {t('cta.desc')}
            </p>
            <button onClick={() => navigate("/login")}
              className="px-8 py-3 rounded-full text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: C.orange, color: C.white, boxShadow: `0 4px 18px rgba(247,148,29,0.45)` }}>
              {t('cta.btn')}
            </button>
          </div>
        </section>
      )}

      
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 30s linear infinite; }

        .slick-dots { bottom: -34px; }
        .slick-dots li button:before {
          font-size: 9px;
          color: #F7941D;
          opacity: 0.35;
        }
        .slick-dots li.slick-active button:before {
          color: #F7941D;
          opacity: 1;
        }
        .slick-prev, .slick-next { z-index: 2; width: 32px; height: 32px; }
        .slick-prev { left: -8px; }
        .slick-next { right: -8px; }
        .slick-prev:before, .slick-next:before {
          color: #1F2F8C;
          font-size: 28px;
          opacity: 0.85;
        }
        .slick-track { display: flex !important; align-items: stretch; }
        .slick-slide { height: auto !important; }
        .slick-slide > div { height: 100%; display: flex; }
        .slick-slide > div > div { width: 100%; display: flex; }
      `}</style>

      {/* ── SOS Modal ────────────────────────────────────── */}
      {isSOSOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 relative" style={{ backgroundColor: C.white, border: `2px solid ${C.pink}` }}>
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
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */
function StatCard({ label, value, sub, bg, icon }: { label: string; value: string; sub: string; bg: string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
      style={{
        backgroundColor: C.white,
        boxShadow: `0 6px 24px rgba(31,47,140,0.13), 0 1px 4px rgba(0,0,0,0.08)`,
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Coloured top accent strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: bg }} />

      <div className="p-5">
        {/* Label row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>{label}</p>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bg, boxShadow: `0 4px 12px ${bg}55` }}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <p className="text-2xl font-extrabold mb-2" style={{ color: C.darkText }}>{value}</p>

        {/* Sub-label with pulse dot */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: bg }} />
          <p className="text-xs" style={{ color: C.muted }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

