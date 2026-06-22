import { useNavigate, useParams } from "react-router";
import { Footer } from "../components/Footer";
import { ArrowLeft, Calendar, Clock, IndianRupee, CheckCircle2 } from "lucide-react";

const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  green: "#28A745",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
};

type Service = {
  title: string;
  tagline: string;
  img: string;
  about: string;
  highlights: string[];
  priceLabel: string;
  price: string;
  timing: string;
};

const SERVICES: Record<string, Service> = {
  "e-pass-registration": {
    title: "E-Pass Registration",
    tagline: "Skip the queue with a digital pass",
    img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    about:
      "Register online to obtain your digital entry pass for darshan during the Mela season. The E-Pass guarantees a time-slot and a smooth temple visit, avoiding long physical queues.",
    highlights: ["QR-coded digital pass", "Guaranteed time slot", "SMS / Email confirmation"],
    priceLabel: "Per devotee",
    price: "₹ 0",
    timing: "Valid for chosen slot",
  },
  "vehicle-permits": {
    title: "Vehicle Permits",
    tagline: "Mela zone entry permits",
    img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    about:
      "Apply for official vehicle permits to enter restricted Mela zones. Permits are issued for cars, buses and emergency vehicles after credential verification.",
    highlights: ["Cars, buses, emergency vehicles", "RC & ID verification", "Permit valid for Mela window"],
    priceLabel: "Per vehicle",
    price: "₹ 200",
    timing: "Mela season",
  },
  "puja-booking": {
    title: "Puja Booking",
    tagline: "Personal puja in your name",
    img: "https://images.unsplash.com/photo-1567361808960-dec9cb578182?auto=format&fit=crop&w=1200&q=80",
    about:
      "Book personal pujas, abhishek and special sevas performed by temple priests in your name. Sankalp will be performed with your gotra and prasad delivered to your home.",
    highlights: ["Performed by temple priests", "Sankalp in devotee's name", "Prasad couriered to your home"],
    priceLabel: "Starting at",
    price: "₹ 1,100",
    timing: "06:00 AM – 11:00 AM",
  },
  "darshan-pass": {
    title: "Darshan Pass",
    tagline: "Sheegh Darshan & aarti pass",
    img: "https://images.unsplash.com/photo-1609858181231-c8e96f4b2c2c?auto=format&fit=crop&w=1200&q=80",
    about:
      "Reserve your Sheegh Darshan and aarti passes online for hassle-free entry. Choose a preferred time-slot and receive your QR-coded pass instantly on email.",
    highlights: ["Sheegh Darshan entry", "Choose Aarti slot", "Instant QR-coded pass"],
    priceLabel: "Per devotee",
    price: "₹ 251",
    timing: "All aarti timings",
  },
  "officer-login": {
    title: "Officer Login",
    tagline: "Restricted administrative access",
    img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    about:
      "Secure portal for temple administration, police and emergency officers to manage permits, crowd movement, control-room duties and live alerts.",
    highlights: ["Role-based access", "Two-factor authentication", "Live operations dashboard"],
    priceLabel: "Access",
    price: "Officers only",
    timing: "24×7",
  },
  "traffic-command-center": {
    title: "Traffic Command Center",
    tagline: "Live Mela traffic dashboard",
    img: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?auto=format&fit=crop&w=1200&q=80",
    about:
      "Real-time traffic, parking and crowd-density dashboard for Mela operations. Used by officers to monitor and divert flow across temple sectors and parking lots.",
    highlights: ["Live CCTV feeds", "Sector-wise crowd density", "Diversion alerts"],
    priceLabel: "Access",
    price: "Authorized staff",
    timing: "24×7",
  },
  "donation-portal": {
    title: "Donation Portal",
    tagline: "Seva to Baba Shyam",
    img: "https://images.unsplash.com/photo-1604608672516-f1b9b1d1f1ef?auto=format&fit=crop&w=1200&q=80",
    about:
      "Offer your humble contribution to the Khatu Shyam Ji Temple and be a part of preserving this sacred heritage. Your donations help in the maintenance, rituals, and community services associated with the temple.",
    highlights: ["80G tax exemption certificate", "Receipt issued instantly", "Multiple payment options"],
    priceLabel: "Minimum",
    price: "₹ 51",
    timing: "Anytime",
  },
  "lost-and-found": {
    title: "Lost & Found",
    tagline: "Mela control room registry",
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    about:
      "Report lost items or missing persons during the Mela and search the live registry of recovered belongings. Reports are coordinated with the Mela control room and local police.",
    highlights: ["Live recovered-items registry", "Coordinated with police", "SMS alerts on match"],
    priceLabel: "Service",
    price: "Free",
    timing: "Mela season, 24×7",
  },
};

export function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const service = slug ? SERVICES[slug] : undefined;

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <h1 className="text-2xl font-bold mb-3" style={{ color: C.darkBlue }}>Service not found</h1>
        <button onClick={() => navigate("/")} className="px-6 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: C.orange }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      {/* Top bar */}
      <div className="w-full px-6 py-4 flex items-center" style={{ backgroundColor: C.darkBlue }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white text-sm font-semibold hover:opacity-80">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
          <div className="relative" style={{ height: "280px" }}>
            <img src={service.img} alt={service.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.darkBlue}cc 0%, transparent 60%)` }} />
            <div className="absolute bottom-0 left-0 right-0 px-8 py-6">
              <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: C.orange }}>{service.tagline}</p>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Georgia', serif" }}>{service.title}</h1>
            </div>
          </div>

          <div className="p-8 grid lg:grid-cols-3 gap-8">
            {/* Left: about + highlights */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold mb-3" style={{ color: C.darkBlue }}>About this seva</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: C.muted }}>{service.about}</p>

              <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: C.darkBlue }}>What's Included</h3>
              <ul className="flex flex-col gap-2.5">
                {service.highlights.map(h => (
                  <li key={h} className="flex items-start gap-2 text-sm" style={{ color: C.darkText }}>
                    <CheckCircle2 size={18} color={C.green} className="flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: booking card */}
            <div className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
              <div>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: C.muted }}>{service.priceLabel}</p>
                <p className="flex items-center text-2xl font-extrabold" style={{ color: C.darkBlue }}>
                  <IndianRupee size={18} className="mr-0.5" /> {service.price.replace("₹ ", "")}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: C.darkText }}>
                <Clock size={14} color={C.orange} /> {service.timing}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: C.darkText }}>
                <Calendar size={14} color={C.orange} /> Booking available daily
              </div>
              <button className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: C.orange, boxShadow: `0 4px 14px rgba(247,148,29,0.40)` }}
                onClick={() => { 
                  if (slug === "darshan-pass") navigate("/darshan-booking"); 
                  else if (slug === "vehicle-permits") navigate("/services/vehicle-registration");
                  else if (slug === "officer-login") navigate("/login");
                }}
              >
                Proceed to Book
              </button>
              <button className="w-full py-2.5 rounded-full text-xs font-semibold transition-all"
                style={{ border: `1.5px solid ${C.darkBlue}`, color: C.darkBlue, backgroundColor: C.white }}
                onClick={() => navigate("/help")}
              >
                Need Help? Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
