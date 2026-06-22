import { useNavigate } from "react-router";
import { ArrowLeft, Crown, Droplets, Hammer, Building2 } from "lucide-react";
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

export function TempleHistoryPage() {
  const navigate = useNavigate();

  const historyPoints = [
    {
      icon: <Crown size={24} style={{ color: C.orange }} />,
      title: "Discovery & Divine Vision",
      text: "The temple is believed to have originated after Barbarika's head was discovered in Khatu village. According to tradition, King Roop Singh Chauhan received a divine vision instructing him to build a shrine and install the sacred head.",
    },
    {
      icon: <Droplets size={24} style={{ color: C.orange }} />,
      title: "Shyam Kund",
      text: "The sacred head of Barbarika is believed to have been discovered at the site now known as Shyam Kund, a holy pond where devotees take a dip before darshan.",
    },
    {
      icon: <Hammer size={24} style={{ color: C.orange }} />,
      title: "18th Century Expansion",
      text: "A larger temple was later constructed and beautifully expanded by the Marwari community around the 18th century, adding to its grandeur and capacity.",
    },
    {
      icon: <Building2 size={24} style={{ color: C.orange }} />,
      title: "Modern Reconstruction",
      text: "The present magnificent marble structure was extensively renovated and reconstructed in 1975, utilizing pristine Makrana marble to preserve its architectural glory.",
    },
  ];

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
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 p-8 lg:p-12 text-white w-full">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 text-white/90 text-sm font-semibold hover:text-white transition-colors mb-6 lg:mb-10 w-fit backdrop-blur-md bg-black/20 px-5 py-2.5 rounded-full border border-white/10"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm lg:text-base uppercase tracking-[0.2em] font-bold mb-3" style={{ color: C.orange }}
          >
            Timeless Legacy
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl lg:text-6xl xl:text-7xl font-extrabold leading-tight" 
            style={{ fontFamily: "'Georgia', serif", textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
          >
            Temple History
          </motion.h1>
        </div>
      </div>

      {/* Right Half - Information (Scrollable) */}
      <div className="lg:w-1/2 overflow-y-auto" style={{ backgroundColor: C.cream }}>
        <div className="p-8 lg:p-14 xl:p-20 max-w-3xl mx-auto space-y-12">
          
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-10" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
              History of the Temple
            </h2>
            
            {/* Timeline / History Cards */}
            <div className="relative border-l-2 ml-6 space-y-10" style={{ borderColor: `${C.orange}40` }}>
              {historyPoints.map((point, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative pl-8 lg:pl-10"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[23px] top-2 p-1.5 rounded-full bg-white border-4" style={{ borderColor: C.cream }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ border: `2px solid ${C.orange}` }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.orange }} />
                    </div>
                  </div>

                  <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden group" style={{ borderColor: C.border }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity rounded-bl-full pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: `${C.orange}10` }}>
                        {point.icon}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold" style={{ color: C.darkBlue }}>{point.title}</h3>
                    </div>
                    <p className="text-lg leading-relaxed" style={{ color: C.darkText }}>
                      {point.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-8 border-t mt-12" style={{ borderColor: `${C.darkBlue}20` }}
          >
            <h3 className="text-xl lg:text-2xl font-bold mb-6" style={{ color: C.darkBlue, fontFamily: "'Georgia', serif" }}>
              Explore More
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => navigate("/services/about-temple")} className="w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: C.orange }}>
                About Temple
              </button>
              <button onClick={() => navigate("/services/temple-timings")} className="w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center bg-white shadow-sm gap-2" style={{ color: C.darkBlue, border: `1px solid ${C.orange}50` }}>
                Temple Timings
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
