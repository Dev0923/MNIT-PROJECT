import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { lostFoundApi } from "../services/lostFoundApi";
import { Search, MapPin, Calendar, HelpCircle, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export function LostFoundPage() {
  const navigate = useNavigate();
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFoundItems();
  }, []);

  const fetchFoundItems = async () => {
    try {
      const data = await lostFoundApi.getFoundItems();
      setFoundItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = foundItems.filter(item => 
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FDF5E6] font-sans flex flex-col">
      {/* HEADER HERO */}
      <div className="bg-[#1F2F8C] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Lost & Found</h1>
            <p className="text-blue-100 max-w-2xl mx-auto text-lg">
              Lost something at the temple? Report it here, or check our database of found items. We are here to help.
            </p>
          </motion.div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate("/services/lost-and-found/report")}
              className="bg-[#F7941D] hover:bg-orange-500 text-white px-6 py-3 rounded-full font-bold transition shadow-lg flex items-center gap-2"
            >
              Report Lost Item
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 py-12">
        
        {/* PHYSICAL COUNTER INFO */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-12 flex items-start gap-4 border border-gray-100">
          <div className="bg-blue-50 p-3 rounded-full text-[#1F2F8C]">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Physical Lost & Found Counter</h3>
            <p className="text-gray-600">
              You can also visit our physical counter located near <strong>Entry Gate 2</strong>. 
              Open from <strong>8:00 AM to 8:00 PM</strong> daily. Please bring a valid ID when claiming your items.
            </p>
          </div>
        </div>

        {/* FOUND ITEMS DB */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-[#1F2F8C] flex items-center gap-2">
            <Package className="text-[#F7941D]" />
            Recently Found Items
          </h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by category or keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-[#1F2F8C] outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading found items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No found items matching your search right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="bg-gray-100 h-40 flex items-center justify-center">
                  {/* Placeholder for photo */}
                  <Package size={48} className="text-gray-300" />
                </div>
                <div className="p-5">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-[#1F2F8C] rounded-full text-xs font-semibold mb-3">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{item.description || "No description provided"}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(item.date_found).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      Found near: {item.location_found}
                    </div>
                  </div>
                  <button className="w-full py-2 border border-[#1F2F8C] text-[#1F2F8C] rounded-lg font-semibold hover:bg-blue-50 transition">
                    How to Claim
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>
          </div>
  );
}
