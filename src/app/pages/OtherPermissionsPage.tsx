import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Paperclip, AlertCircle, CheckCircle2, ClipboardList, X, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  blueBorder: "#3B82F6",
  blueBg: "#EFF6FF",
  blueText: "#1D4ED8",
};

export function OtherPermissionsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [applicantName, setApplicantName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Stall Setup");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // API Integration States
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [activeTab, setActiveTab] = useState<"apply" | "applications">("apply");
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch("http://127.0.0.1:8000/api/general-permissions/my-applications?type=Other", { headers });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching other permissions:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    }
  }, [activeTab]);

  // File validator helper
  const validateAndSetFile = (file: File) => {
    setFileError("");
    
    // Check format
    const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    
    if (!allowedExtensions.includes(fileExtension)) {
      setFileError("Invalid format. Allowed formats: PDF, DOC, DOCX, JPG, PNG");
      setUploadedFile(null);
      return false;
    }

    // Check size limit: 512000 bytes (500KB)
    if (file.size > 512000) {
      setFileError("File is too large. Max size allowed is 500KB");
      setUploadedFile(null);
      return false;
    }

    setUploadedFile(file);
    return true;
  };

  // Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Reset logic
  const handleReset = () => {
    setApplicantName("");
    setDescription("");
    setCategory("Stall Setup");
    setUploadedFile(null);
    setFileError("");
    setSubmitError("");
    setSubmittedCode("");
    setIsDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit check: both text fields must be filled, and a valid file must be present.
  const canSubmit = useMemo(() => {
    return (
      applicantName.trim() !== "" &&
      description.trim() !== "" &&
      uploadedFile !== null &&
      fileError === ""
    );
  }, [applicantName, description, uploadedFile, fileError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setSubmitError("");

    const formData = new FormData();
    formData.append("name", applicantName);
    formData.append("type", "Other");
    formData.append("subtype", category);
    formData.append("purpose", description);
    
    // Format date as DD MMM YYYY, e.g. "25 Jun 2026"
    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    formData.append("date", todayStr);
    
    if (uploadedFile) {
      formData.append("registration_file", uploadedFile);
    }

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
        setIsSubmitted(true);
      } else {
        setSubmitError(data.detail || "Failed to submit other permission application.");
      }
    } catch (err) {
      setSubmitError("Failed to communicate with server. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 md:px-8 relative" style={{ backgroundColor: C.cream }}>
      {/* Back to Home Button */}
      <button 
        onClick={() => navigate("/")} 
        className="absolute top-6 left-6 lg:top-8 lg:left-8 z-10 flex items-center gap-2 text-black text-sm font-semibold hover:bg-neutral-100 transition-colors w-fit bg-white px-5 py-2.5 rounded-full shadow-md border border-neutral-200"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      {/* Main card matching mock layout */}
      <main className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl bg-white border border-gray-150 mt-12">
        {/* Tab switcher */}
        <div className="flex border-b" style={{ borderColor: C.border }}>
          <button
            onClick={() => {
              setActiveTab("apply");
              setIsSubmitted(false);
            }}
            className={`flex-1 py-4 text-center font-bold text-xs flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "apply"
                ? "border-orange-500 text-orange-500 bg-white font-extrabold"
                : "border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 font-semibold"
            }`}
            style={{ borderColor: activeTab === "apply" ? C.orange : "transparent" }}
          >
            <ClipboardList size={14} /> Apply for Other Permissions
          </button>
          <button
            onClick={() => {
              setActiveTab("applications");
              setIsSubmitted(false);
            }}
            className={`flex-1 py-4 text-center font-bold text-xs flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "applications"
                ? "border-orange-500 text-orange-500 bg-white font-extrabold"
                : "border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 font-semibold"
            }`}
            style={{ borderColor: activeTab === "applications" ? C.orange : "transparent" }}
          >
            <Clock size={14} /> My Applications
          </button>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === "apply" ? (
              !isSubmitted ? (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Form Title & Subtitle Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="p-3.5 rounded-xl bg-amber-50 text-amber-500">
                      <ClipboardList size={26} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "sans-serif" }}>Other Permissions</h2>
                      <p className="text-xs text-gray-400">Fill in the details below to apply for other permissions</p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-150 text-red-600 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle size={16} />
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {/* Section 1: Applicant Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-5 rounded-sm" style={{ backgroundColor: C.orange }} />
                        <h3 className="text-sm font-bold text-gray-800">Applicant Information</h3>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">
                          Name of Applicant <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-2.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 bg-white"
                          style={{ borderColor: C.border }}
                          required
                        />
                      </div>

                      <div className="space-y-1 mt-4">
                        <label className="block text-xs font-bold text-gray-700">
                          Permission Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 bg-white"
                          style={{ borderColor: C.border }}
                          required
                        >
                          <option value="Stall Setup">Stall Setup</option>
                          <option value="Stage / Pandal">Stage / Pandal</option>
                          <option value="Sound / Loudspeaker">Sound / Loudspeaker</option>
                          <option value="Event / Rally">Event / Rally</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 2: Application Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-5 rounded-sm" style={{ backgroundColor: C.orange }} />
                        <h3 className="text-sm font-bold text-gray-800">Application Details</h3>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">
                          Description of Application <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Please provide a detailed description of your permission request"
                          rows={5}
                          className="w-full px-4 py-2.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 bg-white resize-y min-h-[100px]"
                          style={{ borderColor: C.border }}
                          required
                        />
                      </div>
                    </div>

                    {/* Section 3: Attach Required Document */}
                    <div>
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <h3 className="text-xs font-bold text-gray-800">Attach Required Document</h3>
                      </div>

                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-neutral-50 hover:bg-neutral-100 ${
                          isDragActive ? "border-orange-400 bg-orange-50/20" : ""
                        }`}
                        style={{
                          borderColor: fileError ? C.red : uploadedFile ? C.green : C.border,
                        }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        
                        <div className="flex flex-col items-center text-center">
                          <div className="p-2.5 rounded-full bg-white shadow-sm border border-gray-150 mb-2">
                            <Paperclip size={20} className="text-gray-500 rotate-45" />
                          </div>
                          
                          {uploadedFile ? (
                            <div>
                              <p className="text-xs font-bold text-green-600">File Selected</p>
                              <p className="text-[11px] font-semibold text-gray-700 max-w-[280px] truncate mt-1">
                                {uploadedFile.name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {(uploadedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-bold text-gray-700">Upload Document</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                PDF, DOC, DOCX, JPG, PNG (Max 500KB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Validation Error Message */}
                      {fileError && (
                        <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-2">
                          <AlertCircle size={13} /> {fileError}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2.5 rounded-lg text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-blue-400 text-center"
                        style={{
                          borderColor: C.blueBorder,
                          backgroundColor: C.blueBg,
                          color: C.blueText,
                        }}
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={!canSubmit || loading}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-white transition-all text-center select-none ${
                          canSubmit && !loading
                            ? "bg-green-600 hover:bg-green-700 cursor-pointer shadow-md"
                            : "bg-green-300 cursor-not-allowed"
                        }`}
                      >
                        {loading ? "Submitting Application..." : "Submit Application"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-10 flex flex-col items-center text-center max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 text-green-600 mb-6">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Application Submitted Successfully!
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">
                    Your application for other permissions has been securely logged on the backend. You can review or apply for other permissions using the buttons below.
                  </p>

                  <div className="w-full bg-neutral-50 p-4 rounded-xl border border-gray-150 mb-6 text-left text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="font-semibold text-gray-400">Permission Code</span>
                      <span className="font-bold text-gray-700 uppercase">{submittedCode}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="font-semibold text-gray-400">Applicant Name</span>
                      <span className="font-bold text-gray-700">{applicantName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="font-semibold text-gray-400">Category</span>
                      <span className="font-bold text-gray-700">{category}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="font-semibold text-gray-400">Document File</span>
                      <span className="font-bold text-gray-700 truncate max-w-[200px]">{uploadedFile?.name}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold text-gray-400">File Size</span>
                      <span className="font-bold text-gray-700">
                        {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        handleReset();
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all bg-orange-500 hover:bg-orange-600 shadow-sm"
                    >
                      Apply New
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("applications");
                        setIsSubmitted(false);
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold border border-gray-250 transition-all hover:bg-gray-50 text-gray-600"
                    >
                      View Applications
                    </button>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                key="apps-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="p-3.5 rounded-xl bg-amber-50 text-amber-500">
                    <Clock size={26} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "sans-serif" }}>Application Registry</h2>
                    <p className="text-xs text-gray-400">Track status of your other permission requests</p>
                  </div>
                </div>

                {loadingApps ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="py-16 text-center text-xs text-gray-400 border rounded-2xl bg-[#fafaf8] border-dashed border-gray-200">
                    No permission applications found. Apply using the form tab.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app.id || app.permission_code}
                        className="p-4 rounded-xl border bg-white flex flex-col justify-between hover:shadow-sm transition-shadow"
                        style={{ borderColor: C.border }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold uppercase">
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

                        <h4 className="font-bold text-sm text-gray-800">
                          {app.name}
                        </h4>
                        <p className="text-xs font-semibold text-orange-500 mb-2">{app.subtype}</p>
                        
                        <div className="text-[11px] text-gray-600 border-t pt-2 mt-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" />
                            <span className="font-semibold text-gray-700">Applied Date: {app.date}</span>
                          </div>
                          <div className="text-gray-500 mt-1 italic pl-1 border-l-2 border-orange-200">
                            "{app.purpose}"
                          </div>
                        </div>
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
