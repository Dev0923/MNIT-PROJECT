import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Clock, Sun, Snowflake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  darkText: "#333333",
  border: "#E5E5E5",
  muted: "#666666",
};

export function TempleTimingsPage() {
  const navigate = useNavigate();
  const [activeSeason, setActiveSeason] = useState<"summer" | "winter">("summer");

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
            Sacred Schedule
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl lg:text-6xl xl:text-7xl font-extrabold leading-tight" 
            style={{ fontFamily: "'Georgia', serif", textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            Temple Timings
          </motion.h1>
        </div>
      </div>

      {/* Right Half - Information (Scrollable) */}
      <div className="lg:w-1/2 overflow-y-auto" style={{ backgroundColor: C.cream }}>
        <div className="p-8 lg:p-14 xl:p-20 max-w-3xl mx-auto space-y-14">
          
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Clock size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Darshan Timings
              </h2>
            </div>
            
            <p className="text-lg lg:text-xl leading-relaxed mb-8" style={{ color: C.darkText }}>
              The temple timings vary by season to accommodate devotees comfortably. Please select a season below to view the detailed schedule.
            </p>

            {/* Interactive Season Toggle */}
            <div className="flex p-1.5 rounded-2xl bg-white shadow-sm border mb-10" style={{ borderColor: C.border }}>
              <button 
                onClick={() => setActiveSeason("summer")}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${activeSeason === "summer" ? "shadow-md" : "hover:bg-gray-50"}`}
                style={{ 
                  backgroundColor: activeSeason === "summer" ? C.orange : "transparent",
                  color: activeSeason === "summer" ? C.white : C.muted
                }}
              >
                <Sun size={20} />
                Summer
              </button>
              <button 
                onClick={() => setActiveSeason("winter")}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${activeSeason === "winter" ? "shadow-md" : "hover:bg-gray-50"}`}
                style={{ 
                  backgroundColor: activeSeason === "winter" ? C.darkBlue : "transparent",
                  color: activeSeason === "winter" ? C.white : C.muted
                }}
              >
                <Snowflake size={20} />
                Winter
              </button>
            </div>

            {/* Timings Display with Animation */}
            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait">
                {activeSeason === "summer" && (
                  <motion.div
                    key="summer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-6"
                  >
                    <div className="p-8 rounded-2xl border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group" style={{ borderColor: C.orange }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full pointer-events-none"></div>
                      <p className="text-sm uppercase tracking-wider font-bold mb-1" style={{ color: C.orange }}>April – September</p>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: C.darkBlue }}>Morning Darshan</h3>
                      <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: C.darkText }}>4:30 AM <span className="text-xl text-gray-400 font-normal mx-2">–</span> 12:30 PM</p>
                    </div>
                    
                    <div className="p-8 rounded-2xl border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group" style={{ borderColor: C.orange }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full pointer-events-none"></div>
                      <p className="text-sm uppercase tracking-wider font-bold mb-1" style={{ color: C.orange }}>April – September</p>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: C.darkBlue }}>Evening Darshan</h3>
                      <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: C.darkText }}>4:00 PM <span className="text-xl text-gray-400 font-normal mx-2">–</span> 10:00 PM</p>
                    </div>
                  </motion.div>
                )}

                {activeSeason === "winter" && (
                  <motion.div
                    key="winter"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-6"
                  >
                    <div className="p-8 rounded-2xl border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group" style={{ borderColor: C.darkBlue }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full pointer-events-none"></div>
                      <p className="text-sm uppercase tracking-wider font-bold mb-1" style={{ color: C.darkBlue }}>October – March</p>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: C.darkBlue }}>Morning Darshan</h3>
                      <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: C.darkText }}>5:30 AM <span className="text-xl text-gray-400 font-normal mx-2">–</span> 1:00 PM</p>
                    </div>
                    
                    <div className="p-8 rounded-2xl border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group" style={{ borderColor: C.darkBlue }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full pointer-events-none"></div>
                      <p className="text-sm uppercase tracking-wider font-bold mb-1" style={{ color: C.darkBlue }}>October – March</p>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: C.darkBlue }}>Evening Darshan</h3>
                      <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: C.darkText }}>5:00 PM <span className="text-xl text-gray-400 font-normal mx-2">–</span> 9:00 PM</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-10 border-t" style={{ borderColor: `${C.darkBlue}20` }}
          >
            <h3 className="text-xl lg:text-2xl font-bold mb-6" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
              Plan Your Visit
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => navigate("/darshan-booking")} className="w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: C.orange }}>
                Book Darshan Pass
              </button>
              <button onClick={() => navigate("/live-darshan")} className="w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center bg-white shadow-sm gap-2" style={{ color: C.darkBlue, border: `1px solid ${C.orange}50` }}>
                Watch Live Darshan
              </button>
            </div>
            <p className="text-center mt-6 text-sm italic" style={{ color: C.muted }}>
              Note: Temple doors may close briefly during Aarti preparations.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
