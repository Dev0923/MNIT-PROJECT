import { useNavigate } from "react-router";
import { ArrowLeft, BookOpen, Sun, MapPin } from "lucide-react";
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

export function AboutTemplePage() {
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
            Sacred Heritage
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl lg:text-6xl xl:text-7xl font-extrabold leading-tight" 
            style={{ fontFamily: "'Georgia', serif", textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            About Temple
          </motion.h1>
        </div>
      </div>

      {/* Right Half - Information (Scrollable) */}
      <div className="lg:w-1/2 overflow-y-auto" style={{ backgroundColor: C.cream }}>
        <div className="p-8 lg:p-14 xl:p-20 max-w-3xl mx-auto space-y-14">
          
          {/* The Khatu Shyam Ji Temple */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <MapPin size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                The Khatu Shyam Ji Temple
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              The Khatu Shyam Ji Temple is one of the most famous Hindu pilgrimage sites in Rajasthan. 
              Located in Khatu village of Sikar district, the temple is dedicated to Khatu Shyam Ji, 
              who is believed to be Barbarika, the grandson of Bhima from the Mahabharata. Every year 
              millions of devotees visit the temple, especially during the famous Phalgun Mela.
            </p>
          </motion.section>

          {/* Who is Khatu Shyam Ji? */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <BookOpen size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Who is Khatu Shyam Ji?
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed mb-6" style={{ color: C.darkText }}>
              According to Hindu mythology, Barbarika was a mighty warrior possessing three divine arrows. 
              Before the Kurukshetra war, he vowed to support the weaker side. 
            </p>
            <div className="p-6 lg:p-8 rounded-2xl my-8 border-l-4 shadow-sm relative overflow-hidden" style={{ backgroundColor: C.white, borderColor: C.orange }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 opacity-5 rounded-bl-full pointer-events-none"></div>
              <p className="text-lg lg:text-xl italic leading-relaxed relative z-10" style={{ color: C.darkBlue }}>
                Lord Krishna realized that this would lead to endless destruction and asked Barbarika for his head 
                as a sacrifice (Sheesh Daan). Barbarika willingly agreed. 
              </p>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              Impressed by his devotion, Krishna blessed him that in the Kali Yuga he would be worshipped 
              by Krishna's own name, <strong>Shyam</strong>.
            </p>
          </motion.section>

          {/* Architecture */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                <Sun size={28} style={{ color: C.orange }} />
              </div>
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Architecture
              </h2>
            </div>
            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: C.darkText }}>
              The temple is built primarily with white Makrana marble and showcases traditional 
              Rajasthani architecture. The prayer hall, known as <em>Jagmohan</em>, contains beautiful 
              artwork depicting scenes from Hindu mythology.
            </p>
          </motion.section>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
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
