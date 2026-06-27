import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { DivIcon, type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  FileCheck,
  X,
  Info
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
  pink: "#E97B8C"
};

const KHATU_CENTER: [number, number] = [27.448, 75.401];

interface BhandaraSpot {
  id: number;
  name: string;
  capacity: number;
  latitude: number;
  longitude: number;
  description: string;
}

interface BusySlot {
  id: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
  org_name: string;
  status: string;
}

interface AltSuggestion {
  start_time: string;
  end_time: string;
  label: string;
}

function MapFocus({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

export function BandharaPermissionPage() {
  const navigate = useNavigate();
  const mapRef = useRef<LeafletMap | null>(null);

  // Flow State Machine: 'selection' | 'form' | 'success'
  const [step, setStep] = useState<"selection" | "form" | "success">("selection");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Spots Data
  const [spots, setSpots] = useState<BhandaraSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<BhandaraSpot | null>(null);

  // Step 1: Scheduling inputs
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [duration, setDuration] = useState("4"); // default 4 hours
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [alternatives, setAlternatives] = useState<AltSuggestion[]>([]);

  // Location-first scheduling drawer info
  const [spotBookings, setSpotBookings] = useState<BusySlot[]>([]);

  // Step 2: Form fields
  const [orgForm, setOrgForm] = useState({
    orgName: "",
    orgAddress: "",
    organiserType: "",
    expectedMeals: "",
    purpose: ""
  });

  const mealRanges = useMemo(() => {
    if (!selectedSpot) return [];
    const cap = selectedSpot.capacity;
    const list = [
      { label: "500 - 1,000 meals", value: "1000" },
      { label: "1,000 - 2,000 meals", value: "2000" },
    ];
    if (cap > 2000) {
      if (cap <= 5000) {
        list.push({ label: `2,000 - ${cap.toLocaleString()} meals (Max Capacity)`, value: String(cap) });
      } else {
        list.push({ label: "2,000 - 5,000 meals", value: "5000" });
        list.push({ label: `5,000 - ${cap.toLocaleString()} meals (Max Capacity)`, value: String(cap) });
      }
    }
    return list;
  }, [selectedSpot]);

  const [nocFile, setNocFile] = useState<File | null>(null);
  const [nocError, setNocError] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idError, setIdError] = useState("");

  // Success response info
  const [bookingId, setBookingId] = useState("");

  // Init Data: Fetch Spots
  useEffect(() => {
    fetchSpots();
    // Default start date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const fetchSpots = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/bhandara/spots");
      if (res.ok) {
        const data = await res.json();
        setSpots(data);
        if (data.length > 0) {
          setSelectedSpot(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching Bhandara spots:", err);
    }
  };

  // Fetch busy slots when a spot is selected to show availability timeline
  useEffect(() => {
    if (selectedSpot) {
      fetchSpotAvailability(selectedSpot.id);
    }
  }, [selectedSpot]);

  const fetchSpotAvailability = async (spotId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bhandara/spots/${spotId}/availability`);
      if (res.ok) {
        const data = await res.json();
        setSpotBookings(data);
      }
    } catch (err) {
      console.error("Error fetching spot availability:", err);
    }
  };

  // Build the complete combined ISO datetime string from input fields
  const getCombinedISOString = () => {
    if (!startDate || !startTime) return "";
    return `${startDate}T${startTime}:00`;
  };

  // Path A: Time-First Query
  const checkAvailability = async (spotId: number, isoStart: string, durationHours: number) => {
    setChecking(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/bhandara/check?spot_id=${spotId}&start_time=${encodeURIComponent(
          isoStart
        )}&duration_hours=${durationHours}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setIsAvailable(data.available);
        if (!data.available) {
          setAlternatives(data.alternatives || []);
        } else {
          setAlternatives([]);
        }
      }
    } catch (err) {
      console.error("Error checking availability:", err);
    } finally {
      setChecking(false);
    }
  };

  // Trigger check when inputs change
  useEffect(() => {
    const isoStart = getCombinedISOString();
    if (selectedSpot && isoStart && duration) {
      checkAvailability(selectedSpot.id, isoStart, parseInt(duration, 10));
    }
  }, [selectedSpot, startDate, startTime, duration]);

  // Leaflet Custom Icons Creator
  const getMarkerIcon = (spotId: number) => {
    const isCurrent = selectedSpot?.id === spotId;
    const size = isCurrent ? 36 : 28;
    // Color logic: if checked and this is selected, show green/red. Otherwise orange/darkBlue
    let color = C.orange;
    if (isCurrent) {
      if (isAvailable === true) color = C.green;
      else if (isAvailable === false) color = C.red;
      else color = C.darkBlue;
    }

    return new DivIcon({
      html: `<div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        border:3px solid #ffffff;
        background:${color};
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        box-shadow:0 4px 12px rgba(0,0,0,0.35);
        font-weight:bold;
        font-size:12px;
        transition: all 0.3s ease;
      ">
        ${spotId}
      </div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  // Handle alternative slot click
  const selectAlternative = (alt: AltSuggestion) => {
    try {
      const dt = new Date(alt.start_time);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      const hours = String(dt.getHours()).padStart(2, "0");
      const minutes = String(dt.getMinutes()).padStart(2, "0");

      setStartDate(`${year}-${month}-${day}`);
      setStartTime(`${hours}:${minutes}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Document validations
  const handleNocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNocError("");
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf" && ext !== "jpg" && ext !== "jpeg") {
        setNocError("Only .jpg, .jpeg, and .pdf files are allowed.");
        setNocFile(null);
        return;
      }
      if (file.size > 500 * 1024) {
        setNocError("File size must be under 500 KB.");
        setNocFile(null);
        return;
      }
      setNocFile(file);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setOrgForm({ ...orgForm, [e.target.name]: e.target.value });
  };

  // Submit whole form
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot || isAvailable !== true) return;
    if (!orgForm.orgName || !orgForm.orgAddress || !orgForm.organiserType || !orgForm.expectedMeals || !orgForm.purpose) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    if (!nocFile || !idFile) {
      setSubmitError("Please upload both required documents.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    const formData = new FormData();
    formData.append("spot_id", String(selectedSpot.id));
    formData.append("start_time", getCombinedISOString());
    formData.append("duration_hours", duration);
    formData.append("org_name", orgForm.orgName);
    formData.append("org_address", orgForm.orgAddress);
    formData.append("organiser_type", orgForm.organiserType);
    formData.append("expected_meals", orgForm.expectedMeals);
    formData.append("purpose", orgForm.purpose);
    formData.append("noc_file", nocFile);
    formData.append("id_proof_file", idFile);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch("http://127.0.0.1:8000/api/bhandara/book", {
        method: "POST",
        headers,
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setBookingId(data.booking_id);
        setStep("success");
      } else {
        setSubmitError(data.detail || "Failed to submit booking application.");
      }
    } catch (err) {
      setSubmitError("Failed to communicate with server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if Form is completely valid to submit
  const isFormValid = useMemo(() => {
    return (
      orgForm.orgName.trim() !== "" &&
      orgForm.orgAddress.trim() !== "" &&
      orgForm.organiserType !== "" &&
      orgForm.expectedMeals.trim() !== "" &&
      orgForm.purpose.trim() !== "" &&
      nocFile !== null &&
      idFile !== null &&
      !nocError &&
      !idError
    );
  }, [orgForm, nocFile, idFile, nocError, idError]);

  return (
    <div className="min-h-screen py-10 px-4 md:px-8" style={{ backgroundColor: C.cream }}>
{/* Main card */}
      <main className="max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-100 min-h-[500px]">
        {/* Step tracker banner */}
        <div className="px-8 py-5 flex items-center justify-between border-b" style={{ borderColor: C.border, backgroundColor: "#fafaf8" }}>
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={{
                backgroundColor: step === "selection" ? C.orange : C.green,
                color: C.white
              }}
            >
              {step === "selection" ? "1" : <CheckCircle2 size={16} />}
            </span>
            <div>
              <p className="text-xs font-bold" style={{ color: C.darkText }}>Select Slot & Spot</p>
              <p className="text-[10px]" style={{ color: C.muted }}>Configure time and spot location</p>
            </div>
          </div>
          <div className="h-0.5 flex-1 mx-4 bg-gray-200 relative">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-500"
              style={{
                width: step === "selection" ? "0%" : step === "form" ? "100%" : "100%",
                backgroundColor: C.green
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={{
                backgroundColor: step === "form" ? C.orange : step === "success" ? C.green : "#E5E7EB",
                color: step === "form" || step === "success" ? C.white : C.muted
              }}
            >
              {step === "success" ? <CheckCircle2 size={16} /> : "2"}
            </span>
            <div>
              <p className="text-xs font-bold" style={{ color: step === "selection" ? C.muted : C.darkText }}>Organiser Details</p>
              <p className="text-[10px]" style={{ color: C.muted }}>Submit docs & purpose details</p>
            </div>
          </div>
        </div>

        {/* Step Switcher */}
        <AnimatePresence mode="wait">
          {step === "selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 md:p-8 grid lg:grid-cols-[1fr_400px] gap-8"
            >
              {/* Left side: Inputs + Leaflet Map */}
              <div className="flex flex-col gap-6">
                <div className="bg-[#fafaf8] p-5 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: C.darkBlue }}>
                    <Clock size={16} color={C.orange} /> Time-First Discovery Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wide mb-1 text-gray-500">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wide mb-1 text-gray-500">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wide mb-1 text-gray-500">Duration (Hours)</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                        style={{ borderColor: C.border }}
                      >
                        <option value="2">2 Hours</option>
                        <option value="4">4 Hours</option>
                        <option value="6">6 Hours</option>
                        <option value="12">12 Hours</option>
                        <option value="24">1 Day (24 hrs)</option>
                        <option value="48">2 Days (48 hrs)</option>
                        <option value="72">3 Days (72 hrs)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Map Section */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: C.darkBlue }}>
                      <MapPin size={16} color={C.orange} /> Interactive Spot Map
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold">Select markers on map to view individual slot schedules</p>
                  </div>

                  <div className="h-[360px] rounded-2xl overflow-hidden border relative" style={{ borderColor: C.border }}>
                    <MapContainer
                      center={selectedSpot ? [selectedSpot.latitude, selectedSpot.longitude] : KHATU_CENTER}
                      zoom={14}
                      className="h-full w-full"
                      whenReady={(event) => {
                        mapRef.current = event.target;
                      }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {selectedSpot && (
                        <MapFocus center={[selectedSpot.latitude, selectedSpot.longitude]} zoom={14} />
                      )}
                      {spots.map((spot) => (
                        <Marker
                          key={spot.id}
                          position={[spot.latitude, spot.longitude]}
                          icon={getMarkerIcon(spot.id)}
                          eventHandlers={{
                            click: () => setSelectedSpot(spot)
                          }}
                        />
                      ))}
                    </MapContainer>
                  </div>
                </div>
              </div>

              {/* Right side: Discovery side drawer info */}
              <div className="flex flex-col gap-6 border-l pl-0 lg:pl-8" style={{ borderColor: C.border }}>
                {selectedSpot ? (
                  <div className="flex flex-col gap-5">
                    <div className="p-5 rounded-2xl border relative bg-white" style={{ borderColor: C.orange + "30" }}>
                      <span
                        className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-black text-white"
                        style={{ backgroundColor: C.orange }}
                      >
                        Selected Location
                      </span>
                      <h4 className="text-base font-bold mb-1" style={{ color: C.darkBlue }}>
                        {selectedSpot.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        {selectedSpot.description}
                      </p>
                      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: C.border }}>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Daily Meal Capacity</span>
                        <span className="text-sm font-extrabold flex items-center gap-1" style={{ color: C.orange }}>
                          <UtensilsCrossed size={14} /> {selectedSpot.capacity.toLocaleString()} meals
                        </span>
                      </div>
                    </div>

                    {/* Path A conflict checker display */}
                    <div className="p-4 rounded-xl border flex flex-col gap-3" style={{ backgroundColor: isAvailable === true ? "#f4fcf6" : isAvailable === false ? "#fff5f5" : "#fafaf8" }}>
                      <div className="flex items-start gap-2">
                        {checking ? (
                          <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mt-0.5" />
                        ) : isAvailable === true ? (
                          <CheckCircle2 size={20} color={C.green} className="mt-0.5 flex-shrink-0" />
                        ) : isAvailable === false ? (
                          <AlertCircle size={20} color={C.red} className="mt-0.5 flex-shrink-0" />
                        ) : (
                          <Info size={20} color={C.muted} className="mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold" style={{ color: C.darkText }}>
                            {checking ? "Checking Slot Availability..." : isAvailable === true ? "Selected Slot Available!" : isAvailable === false ? "Slot Busy / Not Available" : "Configure Time & Date to check"}
                          </p>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            {isAvailable === true
                              ? "You can lock in this slot and proceed to organiser details."
                              : isAvailable === false
                              ? "Another organiser has already registered a Bhandara during this timeframe."
                              : "Enter a valid start date & time to confirm."}
                          </p>
                        </div>
                      </div>

                      {/* Display suggestions if slot is busy */}
                      {!checking && isAvailable === false && alternatives.length > 0 && (
                        <div className="border-t pt-3 mt-1 flex flex-col gap-2">
                          <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: C.red }}>
                            Available alternate slots nearby:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {alternatives.map((alt, idx) => (
                              <button
                                key={idx}
                                onClick={() => selectAlternative(alt)}
                                className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold text-center transition-all bg-white hover:border-orange-500 hover:text-orange-500"
                              >
                                {alt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Path B: Spot Timeline/Calendar */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Spot Booking Log</p>
                      <div className="max-h-[180px] overflow-y-auto border rounded-xl divide-y bg-white" style={{ borderColor: C.border }}>
                        {spotBookings.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">
                            No current bookings registered for this location.
                          </div>
                        ) : (
                          spotBookings.map((b) => (
                            <div key={b.id} className="p-3 text-xs flex justify-between items-center hover:bg-gray-50">
                              <div>
                                <p className="font-semibold text-gray-700">{b.org_name}</p>
                                <p className="text-[10px] text-gray-400">
                                  {new Date(b.start_time).toLocaleString()} ({b.duration_hours}h)
                                </p>
                              </div>
                              <span
                                className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                style={{
                                  backgroundColor: b.status === "Approved" ? "#e6f8ec" : "#fbf2e6",
                                  color: b.status === "Approved" ? C.green : C.orange
                                }}
                              >
                                {b.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      disabled={isAvailable !== true || checking}
                      onClick={() => setStep("form")}
                      className="w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
                      style={{
                        backgroundColor: C.darkBlue,
                        boxShadow: `0 4px 14px rgba(31, 47, 140, 0.35)`
                      }}
                    >
                      Lock Slot & Proceed
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center h-full">
                    <MapPin size={24} className="mb-2 text-gray-300" />
                    Select a marker on the map to view details.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 md:p-8"
            >
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-8">
                {/* Info summary banner */}
                <div className="p-4 rounded-xl border flex items-center justify-between text-xs" style={{ backgroundColor: "#f4fcf6", borderColor: C.green + "40" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-700">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: C.darkText }}>Locked Slot Details</p>
                      <p className="text-[10px] text-gray-500">
                        {selectedSpot?.name} | {new Date(getCombinedISOString()).toLocaleString()} ({duration} hours)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("selection")}
                    className="text-[10px] font-bold uppercase transition-colors"
                    style={{ color: C.orange }}
                  >
                    Change Slot
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: C.darkBlue, borderColor: C.border }}>
                      Organiser Details
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Name of the Organisation / Individual *
                      </label>
                      <input
                        type="text"
                        name="orgName"
                        value={orgForm.orgName}
                        onChange={handleFormChange}
                        placeholder="ENTER THE NAME OF THE ORGANISATION OR INDIVIDUAL"
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                        style={{ borderColor: C.border }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Address of Organiser/Applicant *
                      </label>
                      <textarea
                        name="orgAddress"
                        value={orgForm.orgAddress}
                        onChange={handleFormChange}
                        placeholder="ENTER THE COMPLETE ADDRESS"
                        rows={3}
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white resize-none"
                        style={{ borderColor: C.border }}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Organizer Type *
                        </label>
                        <select
                          name="organiserType"
                          value={orgForm.organiserType}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                          style={{ borderColor: C.border }}
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="Individual">Individual</option>
                          <option value="NGO">NGO</option>
                          <option value="Trust">Trust</option>
                          <option value="Society">Society</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Expected Daily Meals *
                        </label>
                        <select
                          name="expectedMeals"
                          value={orgForm.expectedMeals}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white"
                          style={{ borderColor: C.border }}
                          required
                        >
                          <option value="">Select Meal Range</option>
                          {mealRanges.map((range, idx) => (
                            <option key={idx} value={range.value}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Purpose & File Uploads */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider pb-2 border-b" style={{ color: C.darkBlue, borderColor: C.border }}>
                      Purpose & Documentation
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Purpose *
                      </label>
                      <textarea
                        name="purpose"
                        value={orgForm.purpose}
                        onChange={handleFormChange}
                        placeholder="DESCRIBE THE PURPOSE AND DETAILS..."
                        rows={3}
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-orange-400 text-xs bg-white resize-none"
                        style={{ borderColor: C.border }}
                        required
                      />
                    </div>

                    {/* Upload NOC File */}
                    <div className="flex flex-col gap-1">
                      <label className="block text-[11px] font-bold text-gray-600">
                        NOC of Property Owner *
                      </label>
                      <div
                        className="relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer"
                        style={{
                          borderColor: nocError ? C.red : nocFile ? C.green : C.border,
                          backgroundColor: "#fafaf8"
                        }}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.pdf"
                          onChange={handleNocChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {nocFile ? (
                          <div className="flex flex-col items-center text-center">
                            <FileCheck size={28} color={C.green} className="mb-1" />
                            <p className="text-xs font-bold text-gray-700">{nocFile.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {(nocFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <UploadCloud size={28} className="mb-1 text-gray-400" />
                            <p className="text-xs font-semibold text-gray-700">Click to upload NOC</p>
                            <p className="text-[9px] text-gray-400">.jpg, .pdf (Max 500KB)</p>
                          </div>
                        )}
                      </div>
                      {nocError && (
                        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {nocError}
                        </p>
                      )}
                    </div>

                    {/* Upload ID File */}
                    <div className="flex flex-col gap-1">
                      <label className="block text-[11px] font-bold text-gray-600">
                        ID Proof of Organiser *
                      </label>
                      <div
                        className="relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer"
                        style={{
                          borderColor: idError ? C.red : idFile ? C.green : C.border,
                          backgroundColor: "#fafaf8"
                        }}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.pdf"
                          onChange={handleIdChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {idFile ? (
                          <div className="flex flex-col items-center text-center">
                            <FileCheck size={28} color={C.green} className="mb-1" />
                            <p className="text-xs font-bold text-gray-700">{idFile.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {(idFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <UploadCloud size={28} className="mb-1 text-gray-400" />
                            <p className="text-xs font-semibold text-gray-700">Click to upload ID Proof</p>
                            <p className="text-[9px] text-gray-400">.jpg, .pdf (Max 500KB)</p>
                          </div>
                        )}
                      </div>
                      {idError && (
                        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {idError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="p-4 rounded-xl text-xs font-bold flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
                    <AlertCircle size={16} /> {submitError}
                  </div>
                )}

                <div className="flex justify-end gap-4 border-t pt-6" style={{ borderColor: C.border }}>
                  <button
                    type="button"
                    onClick={() => setStep("selection")}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-gray-50"
                    style={{ borderColor: C.border, color: C.darkBlue }}
                  >
                    Go Back
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
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 md:p-12 flex flex-col items-center text-center max-w-xl mx-auto"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 text-green-600 mb-6">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: C.darkBlue }}>
                Application Submitted!
              </h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Your application for Bhandara Permission has been received. Our administrative team will review your submitted NOC and ID Proof documents and update you shortly.
              </p>

              <div className="w-full bg-[#fafaf8] p-5 rounded-2xl border mb-8 text-left text-xs" style={{ borderColor: C.border }}>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                  <span className="font-semibold text-gray-500">Booking ID / Code</span>
                  <span className="font-bold text-gray-800 uppercase">KSJ-BHD-{bookingId}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                  <span className="font-semibold text-gray-500">Organisation</span>
                  <span className="font-bold text-gray-800">{orgForm.orgName}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: C.border }}>
                  <span className="font-semibold text-gray-500">Location</span>
                  <span className="font-bold text-gray-800">{selectedSpot?.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-gray-500">Scheduled Date</span>
                  <span className="font-bold text-gray-800">{new Date(getCombinedISOString()).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/")}
                className="px-8 py-3 rounded-full text-xs font-bold text-white transition-all shadow-md hover:scale-105"
                style={{ backgroundColor: C.darkBlue }}
              >
                Return to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
