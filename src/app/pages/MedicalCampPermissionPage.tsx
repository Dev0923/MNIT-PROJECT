import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { DivIcon, type Map as LeafletMap, type LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Building,
  Phone,
  FileText,
  User,
  HeartPulse,
  Clock3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Themes / Colors
const C = {
  orange: "#F7941D",
  darkBlue: "#1F2F8C",
  cream: "#FDF5E6",
  white: "#FFFFFF",
  border: "#E5E5E5",
  green: "#28A745",
  red: "#DC3545",
  muted: "#666666",
  darkText: "#333333",
  lightBlue: "#EBF3FF"
};

const KHATU_CENTER: [number, number] = [27.448, 75.401];

function MapFocus({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

// Subcomponent to handle clicking on map to place marker
function MapEvents({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
  const map = useMap();
  useEffect(() => {
    const handleEvents = (e: LeafletMouseEvent) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    };
    map.on("click", handleEvents);
    return () => {
      map.off("click", handleEvents);
    };
  }, [map, onMapClick]);
  return null;
}

export function MedicalCampPermissionPage() {
  const navigate = useNavigate();
  const mapRef = useRef<LeafletMap | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"apply" | "applications">("apply");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedCode, setSubmittedCode] = useState("");

  // Applications List State
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    orgName: "",
    orgAddress: "",
    contactNumber: "",
    organiserType: "",
    campType: "General Checkup",
    preferredLocation: "",
    startDate: "",
    endDate: "",
    description: ""
  });

  // Map Coordinates State
  const [markerPos, setMarkerPos] = useState<[number, number]>([27.366926, 75.403002]);

  // Upload Files State
  const [regFile, setRegFile] = useState<File | null>(null);
  const [regError, setRegError] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idError, setIdError] = useState("");

  // Set default dates on load (start date is tomorrow, end date is day after)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(tomorrow.getDate() + 2);
    
    setForm(prev => ({
      ...prev,
      startDate: tomorrow.toISOString().split("T")[0],
      endDate: dayAfter.toISOString().split("T")[0]
    }));
  }, []);

  // Fetch submitted applications when on "applications" tab
  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch("http://127.0.0.1:8000/api/general-permissions/my-applications?type=Medical", { headers });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching medical camp applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const getMarkerIcon = () => {
    return new DivIcon({
      html: `<div style="
        width: 32px;
        height: 32px;
        border-radius: 999px;
        border: 3px solid #ffffff;
        background: ${C.red};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 16px;
        font-weight: bold;
      ">
        ✚
      </div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegError("");
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf" && ext !== "jpg" && ext !== "jpeg") {
        setRegError("Only .jpg, .jpeg, and .pdf files are allowed.");
        setRegFile(null);
        return;
      }
      if (file.size > 500 * 1024) {
        setRegError("File size must be under 500 KB.");
        setRegFile(null);
        return;
      }
      setRegFile(file);
    }
  };

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdError("");
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf" && ext !== "jpg" && ext !== "jpeg") {
        setIdError("Only .jpg, .jpeg, and .pdf files are allowed.");
        setIdFile(null);
        return;
      }
      if (file.size > 500 * 1024) {
        setIdError("File size must be under 500 KB.");
        setIdFile(null);
        return;
      }
      setIdFile(file);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPos([lat, lng]);
          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 15);
          }
        },
        (error) => {
          console.error("Error finding geolocation, using default Khatu coordinates:", error);
          // Set to a mock devotee location near the temple
          setMarkerPos([27.4478, 75.4022]);
        }
      );
    } else {
      setMarkerPos([27.4478, 75.4022]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.orgName ||
      !form.orgAddress ||
      !form.contactNumber ||
      !form.organiserType ||
      !form.preferredLocation ||
      !form.startDate ||
      !form.endDate ||
      !form.description
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    if (!regFile || !idFile) {
      setSubmitError("Please upload both required verification documents.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    const formData = new FormData();
    formData.append("name", form.orgName);
    formData.append("type", "Medical");
    formData.append("subtype", form.campType);
    
    // Combine description, mobile, address, and coordinates into purpose field
    const combinedPurpose = `Location: ${form.preferredLocation} (Lat: ${markerPos[0].toFixed(6)}, Lng: ${markerPos[1].toFixed(6)}) | Contact: ${form.contactNumber} | Address: ${form.orgAddress} | Services: ${form.description}`;
    formData.append("purpose", combinedPurpose);
    
    formData.append("date", `${form.startDate} to ${form.endDate}`);
    formData.append("registration_file", regFile);
    formData.append("doctor_id_file", idFile);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch("http://127.0.0.1:8000/api/general-permissions/apply", {
        method: "POST",
        headers,
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedCode(data.permission_code);
        setSuccess(true);
      } else {
        setSubmitError(data.detail || "Failed to submit medical camp application.");
      }
    } catch (err) {
      setSubmitError("Failed to communicate with server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = useMemo(() => {
    return (
      form.orgName.trim() !== "" &&
      form.orgAddress.trim() !== "" &&
      form.contactNumber.trim() !== "" &&
      form.organiserType !== "" &&
      form.preferredLocation.trim() !== "" &&
      form.startDate !== "" &&
      form.endDate !== "" &&
      form.description.trim() !== "" &&
      regFile !== null &&
      idFile !== null &&
      !regError &&
      !idError
    );
  }, [form, regFile, idFile, regError, idError]);

  return (
    <div className="min-h-screen py-10 px-4 md:px-8" style={{ backgroundColor: C.cream }}>
{/* Main card */}
      <main className="max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-100 min-h-[500px]">
        
        {/* Tab switcher */}
        <div className="flex border-b" style={{ borderColor: C.border }}>
          <button
            onClick={() => {
              setActiveTab("apply");
              setSuccess(false);
            }}
            className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "apply"
                ? "border-orange-500 text-orange-500 bg-white"
                : "border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600"
            }`}
            style={{ borderColor: activeTab === "apply" ? C.orange : "transparent" }}
          >
            <HeartPulse size={18} /> Apply for Medical Camp Permission
          </button>
          <button
            onClick={() => {
              setActiveTab("applications");
              setSuccess(false);
            }}
            className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "applications"
                ? "border-orange-500 text-orange-500 bg-white"
                : "border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600"
            }`}
            style={{ borderColor: activeTab === "applications" ? C.orange : "transparent" }}
          >
            <FileText size={18} /> My Applications
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 flex flex-col items-center text-center max-w-xl mx-auto"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 text-green-600 mb-6">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: C.darkBlue }}>
                  Application Submitted Successfully!
                </h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Your application for a Medical Camp permit has been securely logged. The administration and medical verification board will review the submitted license copies, doctor credentials, and setup location details.
                </p>

                <div className="w-full bg-[#fafaf8] p-5 rounded-2xl border mb-8 text-left text-xs" style={{ borderColor: C.border }}>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                    <span className="font-semibold text-gray-500">Permission Code</span>
                    <span className="font-bold text-gray-800 uppercase">{submittedCode}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                    <span className="font-semibold text-gray-500">Organizer Name</span>
                    <span className="font-bold text-gray-800">{form.orgName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                    <span className="font-semibold text-gray-500">Camp Type</span>
                    <span className="font-bold text-gray-800">{form.campType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                    <span className="font-semibold text-gray-500">Date Range</span>
                    <span className="font-bold text-gray-800">{form.startDate} to {form.endDate}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-500">Location coordinates</span>
                    <span className="font-bold text-gray-800">{markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setActiveTab("applications");
                    }}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white transition-all shadow-md hover:scale-105"
                    style={{ backgroundColor: C.darkBlue }}
                  >
                    View My Applications
                  </button>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setForm({
                        orgName: "",
                        orgAddress: "",
                        contactNumber: "",
                        organiserType: "",
                        campType: "General Checkup",
                        preferredLocation: "",
                        startDate: "",
                        endDate: "",
                        description: ""
                      });
                      setRegFile(null);
                      setIdFile(null);
                    }}
                    className="px-6 py-2.5 rounded-full text-xs font-bold border transition-all hover:bg-gray-50"
                    style={{ borderColor: C.border, color: C.darkBlue }}
                  >
                    Apply New
                  </button>
                </div>
              </motion.div>
            ) : activeTab === "apply" ? (
              <motion.div
                key="apply-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* General Info & Form Header */}
                  <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: C.border }}>
                    <div className="p-3 rounded-2xl bg-red-50 text-red-500">
                      <HeartPulse size={30} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: C.darkBlue }}>Medical Camp Permission</h3>
                      <p className="text-xs text-gray-400">Register your medical camp for the Mela securely</p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-4 rounded-xl text-xs font-bold flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
                      <AlertCircle size={16} /> {submitError}
                    </div>
                  )}

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Text Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Organizer Name / Organization *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Building size={16} />
                          </span>
                          <input
                            type="text"
                            name="orgName"
                            value={form.orgName}
                            onChange={handleFormChange}
                            placeholder="NAME OF ORGANIZATION OR LEAD DOCTOR"
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                            style={{ borderColor: C.border }}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Organizer Address *
                        </label>
                        <textarea
                          name="orgAddress"
                          value={form.orgAddress}
                          onChange={handleFormChange}
                          placeholder="FULL ADDRESS OF THE ORGANIZER/ORGANIZATION"
                          rows={3}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white resize-none"
                          style={{ borderColor: C.border }}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            Organizer Mobile Number *
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                              <Phone size={16} />
                            </span>
                            <input
                              type="tel"
                              name="contactNumber"
                              value={form.contactNumber}
                              onChange={handleFormChange}
                              placeholder="10-digit mobile number"
                              maxLength={10}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                              style={{ borderColor: C.border }}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            Organizer Type *
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                              <User size={16} />
                            </span>
                            <select
                              name="organiserType"
                              value={form.organiserType}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                              style={{ borderColor: C.border }}
                              required
                            >
                              <option value="">Select Type</option>
                              <option value="Individual">Individual (Doctor)</option>
                              <option value="NGO">NGO</option>
                              <option value="Trust">Trust / Seva Samiti</option>
                              <option value="Society">Society</option>
                              <option value="Others">Others</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Type of Camp *
                        </label>
                        <select
                          name="campType"
                          value={form.campType}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                          style={{ borderColor: C.border }}
                          required
                        >
                          <option value="General Checkup">General Checkup Camp</option>
                          <option value="First Aid Camp">First Aid & Emergency Center</option>
                          <option value="Specialized Medical Camp">Specialized Medical Camp (Cardiology, Ortho, etc.)</option>
                          <option value="Ambulance / Emergency Support">Ambulance & Disaster Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Preferred Location *
                        </label>
                        <textarea
                          name="preferredLocation"
                          value={form.preferredLocation}
                          onChange={handleFormChange}
                          placeholder="DESCRIBE WHERE YOU WANT TO SET UP THE CAMP (E.G., NEAR BUS STAND, TEMPLE ROAD)"
                          rows={2}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white resize-none"
                          style={{ borderColor: C.border }}
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column: Map & Files & Dates */}
                    <div className="space-y-4">
                      {/* Leaflet Map Pinpoint */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-gray-600">
                            Location on Map * <span className="text-[10px] text-gray-400 font-normal">(Click map or drag pin to adjust)</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            className="text-[11px] font-bold transition-all px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            📍 Use Current Location
                          </button>
                        </div>
                        <div className="h-[210px] rounded-xl overflow-hidden border relative" style={{ borderColor: C.border }}>
                          <MapContainer
                            center={markerPos}
                            zoom={13}
                            className="h-full w-full"
                            whenReady={(event) => {
                              mapRef.current = event.target;
                            }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapFocus center={markerPos} zoom={14} />
                            <MapEvents onMapClick={(latlng) => setMarkerPos(latlng)} />
                            <Marker
                              position={markerPos}
                              icon={getMarkerIcon()}
                              draggable={true}
                              eventHandlers={{
                                dragend: (e) => {
                                  const marker = e.target;
                                  const position = marker.getLatLng();
                                  setMarkerPos([position.lat, position.lng]);
                                }
                              }}
                            />
                          </MapContainer>
                          <div className="absolute bottom-2 left-2 z-[1000] bg-white px-2 py-1 rounded shadow text-[10px] font-bold text-gray-700 border">
                            Lat: {markerPos[0].toFixed(6)}, Lng: {markerPos[1].toFixed(6)}
                          </div>
                        </div>
                      </div>

                      {/* Camp Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Start Date *</label>
                          <div className="relative">
                            <input
                              type="date"
                              name="startDate"
                              value={form.startDate}
                              onChange={handleFormChange}
                              className="w-full px-3 py-2 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                              style={{ borderColor: C.border }}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">End Date *</label>
                          <div className="relative">
                            <input
                              type="date"
                              name="endDate"
                              value={form.endDate}
                              onChange={handleFormChange}
                              className="w-full px-3 py-2 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                              style={{ borderColor: C.border }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description of Services */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Description of Services *
                        </label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleFormChange}
                          placeholder="LIST THE SERVICES, DOCTORS, AND FACILITIES YOU WILL PROVIDE..."
                          rows={2}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white resize-none"
                          style={{ borderColor: C.border }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload verification documents */}
                  <div className="bg-[#fafaf8] p-5 rounded-2xl border" style={{ borderColor: C.border }}>
                    <p className="text-xs font-bold text-gray-700 mb-4 text-center uppercase tracking-wide">
                      Attach Verification Documents
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* File 1: Reg License */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 text-center">
                          Registration / License Copy *
                        </label>
                        <div
                          className="relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer bg-white"
                          style={{
                            borderColor: regError ? C.red : regFile ? C.green : C.border
                          }}
                        >
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.pdf"
                            onChange={handleRegFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {regFile ? (
                            <div className="flex flex-col items-center text-center">
                              <FileCheck size={28} color={C.green} className="mb-1" />
                              <p className="text-xs font-bold text-gray-700 max-w-[180px] truncate">{regFile.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {(regFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <UploadCloud size={28} className="mb-1 text-gray-400" />
                              <p className="text-xs font-semibold text-gray-700">Click to upload Registration Copy</p>
                              <p className="text-[9px] text-gray-400">.jpg, .pdf (Max 500KB)</p>
                            </div>
                          )}
                        </div>
                        {regError && (
                          <p className="text-[10px] text-red-500 font-medium flex items-center justify-center gap-1 mt-1">
                            <AlertCircle size={12} /> {regError}
                          </p>
                        )}
                      </div>

                      {/* File 2: Doctor ID */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1.5 text-center">
                          Lead Doctor / Organizer ID *
                        </label>
                        <div
                          className="relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer bg-white"
                          style={{
                            borderColor: idError ? C.red : idFile ? C.green : C.border
                          }}
                        >
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.pdf"
                            onChange={handleIdFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {idFile ? (
                            <div className="flex flex-col items-center text-center">
                              <FileCheck size={28} color={C.green} className="mb-1" />
                              <p className="text-xs font-bold text-gray-700 max-w-[180px] truncate">{idFile.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {(idFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <UploadCloud size={28} className="mb-1 text-gray-400" />
                              <p className="text-xs font-semibold text-gray-700">Click to upload Doctor ID</p>
                              <p className="text-[9px] text-gray-400">.jpg, .pdf (Max 500KB)</p>
                            </div>
                          )}
                        </div>
                        {idError && (
                          <p className="text-[10px] text-red-500 font-medium flex items-center justify-center gap-1 mt-1">
                            <AlertCircle size={12} /> {idError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission buttons */}
                  <div className="flex justify-end gap-4 border-t pt-6" style={{ borderColor: C.border }}>
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-gray-50"
                      style={{ borderColor: C.border, color: C.darkBlue }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="px-8 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
                      style={{
                        backgroundColor: C.orange,
                        boxShadow: `0 4px 14px rgba(247, 148, 29, 0.4)`
                      }}
                    >
                      {loading ? "Submitting Application..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="apps-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: C.border }}>
                  <div className="p-3 rounded-2xl bg-orange-50 text-orange-500">
                    <Clock3 size={30} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: C.darkBlue }}>Application Registry</h3>
                    <p className="text-xs text-gray-400">Track the status of your medical camp permission requests</p>
                  </div>
                </div>

                {loadingApps ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="py-16 text-center text-xs text-gray-400 border rounded-2xl bg-[#fafaf8] border-dashed border-gray-200">
                    No medical camp permission applications found. Apply using the form tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {applications.map((app) => (
                      <div
                        key={app.id || app.permission_code}
                        className="p-5 rounded-2xl border transition-shadow bg-white hover:shadow-md flex flex-col justify-between"
                        style={{ borderColor: C.border }}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">
                              #{app.permission_code}
                            </span>
                            <span
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                              style={{
                                backgroundColor:
                                  app.status?.toLowerCase() === "approved"
                                    ? "#e6f8ec"
                                    : app.status?.toLowerCase() === "rejected"
                                    ? "#fff5f5"
                                    : "#fbf2e6",
                                color:
                                  app.status?.toLowerCase() === "approved"
                                    ? C.green
                                    : app.status?.toLowerCase() === "rejected"
                                    ? C.red
                                    : C.orange
                              }}
                            >
                              {app.status || "pending"}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm mb-1 text-gray-800" style={{ color: C.darkBlue }}>
                            {app.name}
                          </h4>
                          <p className="text-xs font-semibold text-orange-500 mb-3">{app.subtype}</p>

                          <div className="space-y-2 text-xs border-t pt-3" style={{ borderColor: C.border }}>
                            <p className="text-gray-500 flex items-center gap-1.5">
                              <CalendarIcon size={12} className="text-gray-400" />
                              <span className="font-medium text-gray-700">Dates: {app.date}</span>
                            </p>
                            <p className="text-gray-500 flex items-start gap-1.5 leading-relaxed">
                              <MapPin size={12} className="text-gray-400 mt-0.5" />
                              <span className="font-medium text-gray-700 max-w-[400px] block truncate">
                                {app.purpose?.split(" | ")[0] || app.purpose}
                              </span>
                            </p>
                          </div>
                        </div>

                        {app.status?.toLowerCase() === "approved" && (
                          <div className="mt-4 pt-3 border-t text-[11px] text-green-700 bg-green-50 px-3 py-2 rounded-lg font-medium flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Permit active. Access allowed to specified sector.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
