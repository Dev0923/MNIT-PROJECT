import { useNavigate } from "react-router";
import { ArrowLeft, Moon, Star, Sparkles, Sun, Palette, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
};

export function ImportantDaysPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-sans bg-white">
      {/* Left Half - Image & Hero Title */}
      <div className="lg:w-1/2 relative lg:sticky lg:top-0 h-[50vh] lg:h-screen">
        <img 
          src="/khatu-shyam-temple.png" 
          alt="Khatu Shyam Ji Temple" 
          className="w-full h-full object-cover" 
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#1F2F8C] via-[#1F2F8C]/40 to-transparent" />
        
        {/* Back to Home Button */}
        <button 
          onClick={() => navigate("/")} 
          className="absolute top-6 left-6 lg:top-8 lg:left-8 z-10 flex items-center gap-2 text-black text-sm font-semibold hover:bg-neutral-100 transition-colors w-fit bg-white px-5 py-2.5 rounded-full shadow-md border border-neutral-200"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 p-8 lg:p-12 text-white w-full">
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm lg:text-base uppercase tracking-[0.2em] font-bold mb-3" style={{ color: C.orange }}
          >
            Festivals & Events
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl lg:text-6xl xl:text-7xl font-extrabold leading-tight" 
            style={{ fontFamily: "'Georgia', serif", textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            Important Days
          </motion.h1>
        </div>
      </div>

      {/* Right Half - Information (Scrollable) */}
      <div className="lg:w-1/2 overflow-y-auto" style={{ backgroundColor: C.cream }}>
        <div className="p-8 lg:p-14 xl:p-20 max-w-3xl mx-auto space-y-14">
          
          {/* Monthly Shukla Paksha Ekadashi */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Moon size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Monthly Shukla Paksha Ekadashi
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Temple stays open 24 hours; recurring every lunar month. This is a special day for devotees to seek blessings of Baba Shyam.
            </p>
          </motion.section>

          {/* Phalgun Shukla Ekadashi */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Star size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Phalgun Shukla Ekadashi
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed mb-6" style={{ color: C.darkText }}>
              Also known as Phalgun Mela or Lakkhi Mela, this is the biggest annual fair. The 2026 dates were Feb 21–28, with the peak day on Feb 27. Millions of devotees gather during this time.
            </p>
          </motion.section>

          {/* Kartik Shukla Ekadashi */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Sparkles size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Kartik Shukla Ekadashi
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Also known as Devuthani Ekadashi. This is linked to Baba Shyam's janmotsav (birthday) celebrations; it usually falls in late Oct/early Nov (was Nov 1 in 2025).
            </p>
          </motion.section>

          {/* Janmashtami */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Moon size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Janmashtami
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Extended darshan hours till midnight to celebrate the birth of Lord Krishna.
            </p>
          </motion.section>

          {/* Diwali */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Sun size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Diwali
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Extended darshan hours till midnight for the festival of lights.
            </p>
          </motion.section>
          
          {/* New Year */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <CalendarDays size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                New Year's Eve & Day
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Dec 31–Jan 1 is a major crowd day featuring special celebrations and fireworks to welcome the new year.
            </p>
          </motion.section>
          
          {/* Holi */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Palette size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Holi
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Occurring around the Phalgun Mela period, Holi brings vibrant colors and joyous festivities alongside the fair.
            </p>
          </motion.section>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="pt-10 border-t" style={{ borderColor: `${C.darkBlue}20` }}
          >
            <h3 className="text-xl lg:text-2xl font-bold mb-6" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
              Plan Your Visit
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => navigate("/darshan-booking")} className="w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center" style={{ backgroundColor: C.orange }}>
                Darshan Booking
              </button>
              <button onClick={() => navigate("/live-darshan")} className="w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center bg-white shadow-sm" style={{ color: C.darkBlue, border: `1px solid ${C.orange}50` }}>
                Live Darshan
              </button>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-between items-center p-6 rounded-2xl bg-white shadow-sm border" style={{ borderColor: `${C.darkBlue}10` }}>
              <div className="text-center sm:text-left">
                <p className="font-semibold text-sm uppercase tracking-wider mb-2" style={{ color: C.orange }}>Winter Timings</p>
                <p className="font-bold text-lg" style={{ color: C.darkBlue }}>5:30 AM - 9:00 PM</p>
              </div>
              <div className="hidden sm:block w-px h-12" style={{ backgroundColor: `${C.darkBlue}20` }}></div>
              <div className="text-center sm:text-left">
                <p className="font-semibold text-sm uppercase tracking-wider mb-2" style={{ color: C.orange }}>Summer Timings</p>
                <p className="font-bold text-lg" style={{ color: C.darkBlue }}>4:30 AM - 10:00 PM</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
