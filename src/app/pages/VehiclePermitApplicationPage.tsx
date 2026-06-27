import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  border: "#E5E5E5",
  green: "#28A745",
  muted: "#666666"
};

export function VehiclePermitApplicationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get("vehicle_id");

  const [step, setStep] = useState<2 | 3>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    purpose: "",
    purpose_category: "GENERAL",
    valid_from: "",
    valid_until: "",
    time_from: "",
    time_to: "",
    driver_name: "",
    driver_mobile_number: "",
    driver_license_number: "",
    license_valid_until: "",
    start_point: "",
    end_point: "",
    route_details: "",
    expected_occupants: "1",
    organization_name: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    insurance_policy_number: "",
    insurance_valid_until: "",
  });

  const [files, setFiles] = useState<{
    rc_file: File | null;
    dl_file: File | null;
    vehicle_photo: File | null;
  }>({
    rc_file: null,
    dl_file: null,
    vehicle_photo: null
  });

  useEffect(() => {
    if (!vehicleId) {
      setError("No vehicle selected. Please register a vehicle first.");
    }
    // Set default dates for MVP
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    setForm(prev => ({
      ...prev,
      valid_from: now.toISOString().slice(0,16),
      valid_until: tomorrow.toISOString().slice(0,16)
    }));
  }, [vehicleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => ({ ...prev, [e.target.name]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return;

    setLoading(true);
    setError("");

    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication required. Please log in first.");
      setLoading(false);
      return;
    }

    try {
      const gateRes = await fetch("http://127.0.0.1:8000/api/v1/gates/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!gateRes.ok) throw new Error("Failed to fetch entry gates.");
      const gates = await gateRes.json();
      if (!gates.length) throw new Error("No gates configured in the backend.");
      const gateId = gates[0].id;

      const formData = new FormData();
      formData.append("vehicle_id", vehicleId);
      formData.append("allowed_gate_ids", JSON.stringify([gateId]));
      
      // Append form fields
      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          if (key === 'valid_from' || key === 'valid_until') {
             formData.append(key, new Date(value).toISOString());
          } else {
             formData.append(key, value.toString());
          }
        }
      });

      // Append files
      if (files.rc_file) formData.append("rc_file", files.rc_file);
      if (files.dl_file) formData.append("dl_file", files.dl_file);
      if (files.vehicle_photo) formData.append("vehicle_photo", files.vehicle_photo);

      const permRes = await fetch("http://127.0.0.1:8000/api/v1/permissions/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!permRes.ok) {
        const errData = await permRes.json().catch(() => ({}));
        let errMsg = errData.detail || "Failed to submit permission request.";
        if (Array.isArray(errData.detail)) {
          errMsg = errData.detail.map((d: any) => `${d.loc?.[1] || 'Field'}: ${d.msg}`).join(" | ");
        }
        throw new Error(errMsg);
      }
      
      setStep(3); // Transition to success state

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ backgroundColor: C.cream }}>
      <div className="w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: C.white }}>
        
        <div className="p-6 text-white flex items-center" style={{ backgroundColor: C.darkBlue }}>
          <button onClick={() => navigate(-1)} className="mr-4 hover:opacity-80">
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-xl font-bold">Step 2: Permit Application</h1>
             <p className="text-xs opacity-80">Provide operation and driver details</p>
          </div>
        </div>

        <div className="p-8">
          {step === 3 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 size={64} color={C.green} className="mb-4" />
              <h2 className="text-2xl font-bold mb-2" style={{ color: C.darkBlue }}>Application Submitted</h2>
              <p className="font-semibold text-lg" style={{ color: C.orange }}>Status: Pending Approval</p>
              <p className="mt-4 text-sm" style={{ color: C.muted }}>Your vehicle details and permit request have been logged successfully. Administrators will review your application shortly.</p>
              <button onClick={() => navigate("/")} className="mt-8 px-8 py-3 rounded-full text-white font-bold" style={{ backgroundColor: C.darkBlue }}>
                Return to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Duration section */}
              <div>
                 <h3 className="text-sm font-bold border-b pb-1 mb-3" style={{ color: C.darkBlue, borderColor: C.border }}>Duration & Timing</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Valid From
                      <input type="datetime-local" required name="valid_from" value={form.valid_from} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" />
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Valid Until
                      <input type="datetime-local" required name="valid_until" value={form.valid_until} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" />
                    </label>
                 </div>
              </div>

              {/* Driver Information section */}
              <div>
                 <h3 className="text-sm font-bold border-b pb-1 mb-3" style={{ color: C.darkBlue, borderColor: C.border }}>Driver Information</h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Driver Name
                      <input name="driver_name" value={form.driver_name} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" placeholder="Driver Full Name" />
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Mobile Number
                      <input name="driver_mobile_number" value={form.driver_mobile_number} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" placeholder="10-digit number" />
                    </label>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      License Number
                      <input name="driver_license_number" value={form.driver_license_number} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" placeholder="DL Number" />
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      License Valid Until
                      <input type="date" name="license_valid_until" value={form.license_valid_until} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" />
                    </label>
                 </div>
              </div>

              {/* Purpose and Operations */}
              <div>
                 <h3 className="text-sm font-bold border-b pb-1 mb-3" style={{ color: C.darkBlue, borderColor: C.border }}>Purpose & Operations</h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Purpose Category
                      <select name="purpose_category" value={form.purpose_category} onChange={handleChange} className="mt-1 p-2 border rounded bg-white font-normal">
                        <option value="VIP">VIP</option>
                        <option value="EMERGENCY">Emergency</option>
                        <option value="STAFF">Staff</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="GENERAL">General</option>
                        <option value="GOVERNMENT">Government</option>
                        <option value="MEDIA">Media</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Expected Occupants
                      <input type="number" name="expected_occupants" value={form.expected_occupants} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" min="1" />
                    </label>
                 </div>
                 <label className="flex flex-col text-sm font-semibold mb-4" style={{ color: C.darkBlue }}>
                   Detailed Purpose
                   <textarea required name="purpose" value={form.purpose} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" rows={2} placeholder="Explain the reason for entry..."></textarea>
                 </label>
              </div>

              {/* Insurance */}
              <div>
                 <h3 className="text-sm font-bold border-b pb-1 mb-3" style={{ color: C.darkBlue, borderColor: C.border }}>Insurance Details</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Policy Number
                      <input name="insurance_policy_number" value={form.insurance_policy_number} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" placeholder="Insurance Policy Number" />
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Valid Until
                      <input type="date" name="insurance_valid_until" value={form.insurance_valid_until} onChange={handleChange} className="mt-1 p-2 border rounded font-normal" />
                    </label>
                 </div>
              </div>

              {/* File Uploads */}
              <div>
                 <h3 className="text-sm font-bold border-b pb-1 mb-3" style={{ color: C.darkBlue, borderColor: C.border }}>Document Uploads</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      RC Document
                      <input type="file" name="rc_file" onChange={handleFileChange} className="mt-1 text-xs" accept="image/*,.pdf" />
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Driving License
                      <input type="file" name="dl_file" onChange={handleFileChange} className="mt-1 text-xs" accept="image/*,.pdf" />
                    </label>
                    <label className="flex flex-col text-sm font-semibold" style={{ color: C.darkBlue }}>
                      Vehicle Photo
                      <input type="file" name="vehicle_photo" onChange={handleFileChange} className="mt-1 text-xs" accept="image/*" />
                    </label>
                 </div>
              </div>

              <button type="submit" disabled={loading || !vehicleId} className="mt-6 w-full py-3 rounded-full text-white font-bold transition-all disabled:opacity-50" style={{ backgroundColor: C.orange }}>
                {loading ? "Submitting Application..." : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
