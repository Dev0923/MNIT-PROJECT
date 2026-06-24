import { useState } from "react";
import { motion } from "framer-motion";
import { lostFoundApi, LostItemData, LostPersonData } from "../services/lostFoundApi";
import { ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";

export function ReportLostItemPage() {
  const [type, setType] = useState<"item" | "person">("item");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: "",
    date_lost: "",
    location: "",
    description: "",
    contact_name: "",
    contact_phone: "",
    name: "",
    age: "",
    gender: "",
    last_seen_time: "",
    photo_url: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (type === "item") {
        await lostFoundApi.reportLostItem({
          category: formData.category || "Other",
          date_lost: new Date(formData.date_lost).toISOString(),
          location: formData.location,
          description: formData.description,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          photo_url: formData.photo_url,
        } as LostItemData);
      } else {
        await lostFoundApi.reportLostPerson({
          name: formData.name,
          age: Number(formData.age),
          gender: formData.gender,
          last_seen_location: formData.location,
          last_seen_time: new Date(formData.last_seen_time).toISOString(),
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          photo_url: formData.photo_url,
        } as LostPersonData);
      }
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Error submitting report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDF5E6] flex flex-col items-center justify-center p-4">
        <CheckCircle2 size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-[#1F2F8C] mb-2">Report Submitted</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Your report has been received. Our team will contact you at {formData.contact_phone} if a match is found.
        </p>
        <button
          onClick={() => navigate("/services/lost-and-found")}
          className="bg-[#F7941D] text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          Return to Lost & Found
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF5E6] font-sans flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-[#1F2F8C]" />
          </button>
          <h1 className="text-xl font-bold text-[#1F2F8C]">Report Lost</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setType("item")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                type === "item" ? "bg-[#1F2F8C] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              Lost Item
            </button>
            <button
              type="button"
              onClick={() => setType("person")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                type === "person" ? "bg-[#1F2F8C] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              Missing Person
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {type === "item" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Category *</label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="Wallet/Purse">Wallet / Purse</option>
                      <option value="Electronics">Electronics (Mobile, Camera)</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Documents">Documents / ID Cards</option>
                      <option value="Baggage">Baggage / Bags</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Lost *</label>
                    <input
                      type="datetime-local"
                      name="date_lost"
                      required
                      value={formData.date_lost}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Where Lost *</label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="e.g. Near Entry Gate 1, Main Temple"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Color, brand, identifying marks..."
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#1F2F8C] hover:file:bg-blue-100"
                    />
                    {formData.photo_url && (
                      <img src={formData.photo_url} alt="Preview" className="mt-4 h-32 rounded-lg shadow object-cover border border-gray-200" />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Person's Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input
                      type="number"
                      name="age"
                      required
                      min={1}
                      max={120}
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Seen Time *</label>
                    <input
                      type="datetime-local"
                      name="last_seen_time"
                      required
                      value={formData.last_seen_time}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Seen Location *</label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="e.g. Food Court"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#1F2F8C] hover:file:bg-blue-100"
                    />
                    {formData.photo_url && (
                      <img src={formData.photo_url} alt="Preview" className="mt-4 h-32 rounded-lg shadow object-cover border border-gray-200" />
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    name="contact_name"
                    required
                    value={formData.contact_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    required
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1F2F8C] outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1F2F8C] text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 mt-8"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {isLoading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </main>
          </div>
  );
}
