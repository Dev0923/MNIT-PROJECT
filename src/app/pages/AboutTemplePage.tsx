import { useNavigate } from "react-router";
import { Footer } from "../components/Footer";
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
    <div className="min-h-screen font-sans" style={{ backgroundColor: C.cream }}>
      {/* Top bar */}
      <div className="w-full px-6 py-4 flex items-center shadow-md sticky top-0 z-50" style={{ backgroundColor: C.darkBlue }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white text-sm font-semibold hover:opacity-80 transition-opacity">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl overflow-hidden shadow-2xl mb-16 relative" 
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, height: "450px" }}
        >
          <img src="/khatu-shyam-temple.png" alt="Khatu Shyam Ji Temple" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2F8C] via-[#1F2F8C]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-10 md:p-14">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-sm md:text-base uppercase tracking-[0.2em] font-bold mb-3" style={{ color: C.orange }}
            >
              Sacred Heritage
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-4xl md:text-6xl font-extrabold text-white" style={{ fontFamily: "'Georgia', serif" }}
            >
              About Temple
            </motion.h1>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-12 gap-12">
          
          {/* Main Content */}
          <div className="md:col-span-8 space-y-12">
            
            {/* Introduction */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 md:p-10 rounded-2xl shadow-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                  <MapPin size={28} style={{ color: C.orange }} />
                </div>
                <h2 className="text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                  The Khatu Shyam Ji Temple
                </h2>
              </div>
              <p className="text-lg leading-relaxed" style={{ color: C.darkText }}>
                The Khatu Shyam Ji Temple is one of the most famous Hindu pilgrimage sites in Rajasthan. 
                Located in Khatu village of Sikar district, the temple is dedicated to Khatu Shyam Ji, 
                who is believed to be Barbarika, the grandson of Bhima from the Mahabharata. Every year 
                millions of devotees visit the temple, especially during the famous Phalgun Mela.
              </p>
            </motion.section>

            {/* Who is Khatu Shyam Ji */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 md:p-10 rounded-2xl shadow-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                  <BookOpen size={28} style={{ color: C.orange }} />
                </div>
                <h2 className="text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                  Who is Khatu Shyam Ji?
                </h2>
              </div>
              <p className="text-lg leading-relaxed mb-4" style={{ color: C.darkText }}>
                According to Hindu mythology, Barbarika was a mighty warrior possessing three divine arrows. 
                Before the Kurukshetra war, he vowed to support the weaker side. 
              </p>
              <div className="p-6 rounded-xl my-6 border-l-4" style={{ backgroundColor: C.cream, borderColor: C.orange }}>
                <p className="text-base italic leading-relaxed" style={{ color: C.darkBlue }}>
                  Lord Krishna realized that this would lead to endless destruction and asked Barbarika for his head 
                  as a sacrifice (Sheesh Daan). Barbarika willingly agreed. 
                </p>
              </div>
              <p className="text-lg leading-relaxed" style={{ color: C.darkText }}>
                Impressed by his devotion, Krishna blessed him that in the Kali Yuga he would be worshipped 
                by Krishna's own name, <strong>Shyam</strong>.
              </p>
            </motion.section>

            {/* Architecture */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 md:p-10 rounded-2xl shadow-sm"
              style={{ border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${C.orange}15` }}>
                  <Sun size={28} style={{ color: C.orange }} />
                </div>
                <h2 className="text-3xl font-bold" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                  Architecture
                </h2>
              </div>
              <p className="text-lg leading-relaxed" style={{ color: C.darkText }}>
                The temple is built primarily with white Makrana marble and showcases traditional 
                Rajasthani architecture. The prayer hall, known as <em>Jagmohan</em>, contains beautiful 
                artwork depicting scenes from Hindu mythology.
              </p>
            </motion.section>

          </div>

          {/* Sidebar / Quick Links */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="md:col-span-4"
          >
            <div className="sticky top-24 bg-white rounded-2xl p-8 shadow-xl" style={{ border: `1px solid ${C.border}` }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
                Plan Your Visit
              </h3>
              
              <div className="space-y-4">
                <button onClick={() => navigate("/darshan-booking")} className="w-full py-4 rounded-xl text-white font-bold transition-transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: C.orange }}>
                  Darshan Booking
                </button>
                <button onClick={() => navigate("/live-darshan")} className="w-full py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: C.cream, color: C.darkBlue, border: `1px solid ${C.orange}40` }}>
                  Live Darshan
                </button>
                <button onClick={() => navigate("/mela-map")} className="w-full py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: C.cream, color: C.darkBlue, border: `1px solid ${C.orange}40` }}>
                  Mela Map
                </button>
              </div>

              <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${C.border}` }}>
                <p className="text-sm font-semibold mb-2" style={{ color: C.muted }}>Temple Timings</p>
                <p className="text-base font-bold" style={{ color: C.darkText }}>Winter: 5:30 AM - 9:00 PM</p>
                <p className="text-base font-bold" style={{ color: C.darkText }}>Summer: 4:30 AM - 10:00 PM</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
