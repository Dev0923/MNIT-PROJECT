import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, AlertCircle } from "lucide-react";

const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  border: "#E5E5E5",
  green: "#28A745",
  muted: "#666666"
};

export function VehicleRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    owner_name: "",
    contact_number: "",
    license_plate: "",
    vehicle_type: "CAR",
    vehicle_category: "GENERAL"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Authentication required. Please set 'access_token' in localStorage.");
      setLoading(false);
      return;
    }

    try {
      const vehicleRes = await fetch("http://127.0.0.1:8000/api/v1/vehicles/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          license_plate: form.license_plate,
          vehicle_type: form.vehicle_type,
          vehicle_category: form.vehicle_category,
          owner_name: form.owner_name,
          contact_number: form.contact_number
        })
      });

      if (!vehicleRes.ok) {
        const errData = await vehicleRes.json();
        throw new Error(errData.detail || "Failed to register vehicle.");
      }
      
      const vehicleData = await vehicleRes.json();
      
      // Proceed to Step 2
      navigate(`/services/vehicle-permits/apply?vehicle_id=${vehicleData.id}`);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ backgroundColor: C.cream }}>
      <div className="w-full max-w-xl rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: C.white }}>
        <div className="p-6 text-white flex items-center" style={{ backgroundColor: C.darkBlue }}>
          <button onClick={() => navigate(-1)} className="mr-4 hover:opacity-80">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Step 1: Vehicle Registration</h1>
            <p className="text-xs opacity-80">Register your vehicle details once</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                Owner Name
                <input required name="owner_name" value={form.owner_name} onChange={handleChange} className="mt-1 p-2 border rounded" placeholder="John Doe" />
              </label>
              <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                Contact Number
                <input required name="contact_number" value={form.contact_number} onChange={handleChange} className="mt-1 p-2 border rounded" placeholder="9876543210" />
              </label>
            </div>

            <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
              Vehicle Number (License Plate)
              <input required name="license_plate" value={form.license_plate} onChange={handleChange} className="mt-1 p-2 border rounded" placeholder="RJ-23-AB-1234" />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                Vehicle Type
                <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} className="mt-1 p-2 border rounded bg-white">
                  <option value="CAR">Car</option>
                  <option value="BUS">Bus</option>
                  <option value="TRUCK">Truck</option>
                  <option value="AMBULANCE">Ambulance</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                Vehicle Category
                <select name="vehicle_category" value={form.vehicle_category} onChange={handleChange} className="mt-1 p-2 border rounded bg-white">
                  <option value="GENERAL">General</option>
                  <option value="VIP">VIP</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="STAFF">Staff</option>
                  <option value="VENDOR">Vendor</option>
                </select>
              </label>
            </div>

            <button type="submit" disabled={loading} className="mt-4 w-full py-3 rounded-full text-white font-bold transition-all disabled:opacity-50" style={{ backgroundColor: C.orange }}>
              {loading ? "Registering..." : "Continue to Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
