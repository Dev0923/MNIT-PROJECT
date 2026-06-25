import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, IdCard, Home, FileText, CheckCircle, 
  ArrowRight, ArrowLeft, Upload, Loader2, PhoneCall, QrCode, 
  Download, Printer, AlertTriangle, ShieldCheck, CreditCard
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { AccommodationProperty, AccommodationRoom, accommodationApi } from '../services/accommodationApi';

interface BookingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: AccommodationProperty;
  checkInDate: string;
  checkOutDate: string;
}

const STEPS = [
  { id: 1, name: 'Room', icon: Home },
  { id: 2, name: 'Guest Info', icon: Users },
  { id: 3, name: 'Verification', icon: IdCard },
  { id: 4, name: 'Pilgrimage', icon: ShieldCheck },
  { id: 5, name: 'Emergency', icon: PhoneCall },
  { id: 6, name: 'Payment', icon: CreditCard },
  { id: 7, name: 'Success', icon: CheckCircle },
];

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({ isOpen, onClose, property, checkInDate, checkOutDate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Visit Details
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0,
    seniors: 0,
    
    // Step 2: Room selection
    selectedRoomId: null as number | null,
    
    // Step 3: Guest details
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    
    // Step 4: ID Verification
    id_type: 'Aadhaar Card',
    id_number: '',
    id_file_name: '',
    
    // Step 5: Pilgrimage Details
    darshan_date: '',
    transport: 'Train',
    
    // Step 6: Emergency Contact
    emergency_name: '',
    emergency_relation: 'Spouse',
    emergency_phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when property changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setBookingResult(null);
      setFormData({
        check_in: checkInDate,
        check_out: checkOutDate,
        adults: 1,
        children: 0,
        seniors: 0,
        selectedRoomId: property.rooms[0]?.id || null,
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        id_type: 'Aadhaar Card',
        id_number: '',
        id_file_name: '',
        darshan_date: checkInDate,
        transport: 'Train',
        emergency_name: '',
        emergency_relation: 'Spouse',
        emergency_phone: '',
      });
      setErrors({});
    }
  }, [isOpen, property]);

  if (!isOpen) return null;

  const selectedRoom = property.rooms.find(r => r.id === formData.selectedRoomId);

  // Nights calculation
  const getNightsCount = () => {
    if (!formData.check_in || !formData.check_out) return 1;
    const start = new Date(formData.check_in);
    const end = new Date(formData.check_out);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const nights = getNightsCount();
  const roomPrice = selectedRoom ? selectedRoom.base_price : 0;
  const baseTotal = roomPrice * nights;
  const tax = Math.round(baseTotal * 0.05); // 5% GST for demo
  const grandTotal = baseTotal + tax;

  // Validation per step
  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.selectedRoomId) stepErrors.selectedRoomId = 'Please select a room type';
    } 
    
    else if (step === 2) {
      if (!formData.guest_name.trim()) stepErrors.guest_name = 'Name is required';
      else if (formData.guest_name.length < 3) stepErrors.guest_name = 'Name must be at least 3 characters';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.guest_email.trim()) stepErrors.guest_email = 'Email is required';
      else if (!emailRegex.test(formData.guest_email)) stepErrors.guest_email = 'Invalid email address';
      
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!formData.guest_phone.trim()) stepErrors.guest_phone = 'Phone number is required';
      else if (!phoneRegex.test(formData.guest_phone)) stepErrors.guest_phone = 'Invalid Indian phone number (10 digits)';
    } 
    
    else if (step === 3) {
      if (!formData.id_number.trim()) stepErrors.id_number = 'ID Number is required';
      else if (formData.id_type === 'Aadhaar Card' && !/^\d{12}$/.test(formData.id_number.replace(/\s/g, ''))) {
        stepErrors.id_number = 'Aadhaar card must be a 12-digit number';
      } else if (formData.id_type === 'PAN Card' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.id_number.toUpperCase())) {
        stepErrors.id_number = 'Invalid PAN card format (e.g. ABCDE1234F)';
      }
      
      if (!formData.id_file_name) stepErrors.id_file = 'Please upload a copy of your ID card';
    } 
    
    else if (step === 4) {
      if (!formData.transport) stepErrors.transport = 'Please select your mode of transport';
    } 
    
    else if (step === 5) {
      if (!formData.emergency_name.trim()) stepErrors.emergency_name = 'Emergency contact name is required';
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!formData.emergency_phone.trim()) stepErrors.emergency_phone = 'Emergency contact phone is required';
      else if (!phoneRegex.test(formData.emergency_phone)) stepErrors.emergency_phone = 'Invalid 10-digit phone number';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, id_file_name: file.name }));
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.id_file;
        return copy;
      });
    }
  };

  const handleBook = async () => {
    setIsSubmitting(true);
    try {
      const roomTypeLabel = selectedRoom ? `${selectedRoom.type} (${selectedRoom.category})` : 'Room';
      
      const payload = {
        property_id: property.id,
        room_type: roomTypeLabel,
        check_in: formData.check_in,
        check_out: formData.check_out,
        adults: formData.adults,
        children: formData.children,
        seniors: formData.seniors,
        guest_details: {
          name: formData.guest_name,
          email: formData.guest_email,
          phone: formData.guest_phone,
          id_type: formData.id_type,
          id_number: formData.id_number,
        },
        pilgrimage_details: {
          darshan_date: formData.darshan_date || undefined,
          count: formData.adults + formData.children + formData.seniors,
          transport: formData.transport,
        },
        emergency_contact: {
          name: formData.emergency_name,
          relation: formData.emergency_relation,
          phone: formData.emergency_phone,
        },
        total_amount: grandTotal,
      };

      const result = await accommodationApi.createBooking(payload);
      setBookingResult(result);
      
      // Fire confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      setCurrentStep(7);
    } catch (err: any) {
      alert(`Booking Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Receipt PDF
  const downloadReceiptPDF = () => {
    if (!bookingResult) return;

    const doc = new jsPDF();

    // Color Theme (Deep Crimson and Gold accent)
    const primaryColor = [139, 0, 0]; // Dark Red
    const secondaryColor = [218, 165, 32]; // Goldenrod

    // Header Board Banner
    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SHREE KHATU SHYAM JI DEVSTHAN BOARD', 105, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Accommodation Booking Receipt', 105, 28, { align: 'center' });

    // Golden decorative stripe
    doc.setFillColor(218, 165, 32);
    doc.rect(0, 40, 210, 3, 'F');

    // Invoice Meta
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Booking Ref: ${bookingResult.booking_id}`, 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')}`, 140, 55);

    // Section 1: Pilgrim details
    doc.setFont('helvetica', 'bold');
    doc.text('PRIMARY PILGRIM DETAILS', 20, 70);
    doc.line(20, 72, 190, 72);

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${bookingResult.guest_details.name}`, 20, 80);
    doc.text(`Mobile: +91 ${bookingResult.guest_details.phone}`, 20, 88);
    doc.text(`Email: ${bookingResult.guest_details.email}`, 20, 96);
    doc.text(`ID Proof: ${bookingResult.guest_details.id_type} (${bookingResult.guest_details.id_number})`, 20, 104);

    // Section 2: Booking details
    doc.setFont('helvetica', 'bold');
    doc.text('ACCOMMODATION & BOOKING DETAILS', 20, 120);
    doc.line(20, 122, 190, 122);

    doc.setFont('helvetica', 'normal');
    doc.text(`Dharamshala/Hotel: ${bookingResult.property_name}`, 20, 130);
    doc.text(`Room Type: ${bookingResult.room_type}`, 20, 138);
    doc.text(`Check-in Date: ${new Date(bookingResult.check_in).toLocaleDateString('en-IN')}`, 20, 146);
    doc.text(`Check-out Date: ${new Date(bookingResult.check_out).toLocaleDateString('en-IN')}`, 20, 154);
    doc.text(`Total Stay: ${nights} Night(s)`, 20, 162);
    doc.text(`Guests: ${formData.adults} Adults, ${formData.children} Children, ${formData.seniors} Seniors`, 20, 170);

    // Section 3: Billing breakdown
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 20, 185);
    doc.line(20, 187, 190, 187);

    doc.setFont('helvetica', 'normal');
    doc.text(`Base Tariff (${nights} night x Rs. ${roomPrice}):`, 20, 195);
    doc.text(`Rs. ${baseTotal.toFixed(2)}`, 150, 195);
    doc.text('CGST & SGST (5%):', 20, 203);
    doc.text(`Rs. ${tax.toFixed(2)}`, 150, 203);

    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total (Paid):', 20, 213);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 150, 213);

    // Transaction Status Badge
    doc.setFillColor(230, 245, 230);
    doc.rect(20, 222, 170, 12, 'F');
    doc.setTextColor(0, 100, 0);
    doc.setFontSize(11);
    doc.text('TRANSACTION STATUS: SUCCESSFUL / PAID ONLINE', 105, 230, { align: 'center' });

    // Decorative footer
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: Please carry a printout of this receipt and the original physical Gov ID for check-in.', 105, 260, { align: 'center' });
    doc.text('May Lord Khatu Shyam Bless You!', 105, 266, { align: 'center' });

    // Border line around page
    doc.setDrawColor(200, 200, 200);
    doc.rect(5, 5, 200, 287);

    doc.save(`Khatu_Shyam_Booking_${bookingResult.booking_id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-100 flex flex-col max-h-[90vh]"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-800 to-amber-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold font-serif tracking-wide text-amber-200">Accommodation Booking Flow</h2>
            <p className="text-xs text-amber-100/80 mt-0.5">{property.name} &bull; {property.type}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white bg-black/25 hover:bg-black/45 rounded-full p-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar Steps Indicator */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 overflow-x-auto shrink-0 flex items-center gap-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-600 text-white' : 
                    isActive ? 'bg-amber-700 text-white shadow-md shadow-amber-700/25 scale-105 ring-2 ring-amber-400' : 
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : step.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-amber-900 font-bold' : isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                </div>
                {idx < 7 - 1 && (
                  <div className={`h-0.5 flex-1 min-w-[20px] max-w-[40px] transition-all duration-500 ${isCompleted ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Modal Main Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Booking Dates */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Home className="text-amber-800" /> Select Accommodation Room Type
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {property.rooms.map(room => (
                      <div 
                        key={room.id}
                        onClick={() => setFormData(prev => ({ ...prev, selectedRoomId: room.id }))}
                        className={`p-4 border-2 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                          formData.selectedRoomId === room.id 
                            ? 'border-amber-700 bg-amber-50/40 ring-1 ring-amber-600' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 text-base">{room.type}</h4>
                          <div className="flex gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded font-semibold ${room.category === 'AC' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                              {room.category} Room
                            </span>
                            <span className="text-slate-500">Available: {room.available_rooms} units</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Price per night</p>
                          <p className="text-lg font-extrabold text-amber-900 font-serif">Rs. {room.base_price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.selectedRoomId && <p className="text-red-500 text-xs">{errors.selectedRoomId}</p>}
                </div>
              )}

              {/* Step 3: Guest Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Users className="text-amber-800" /> Primary Guest Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name (as in Gov ID)</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={formData.guest_name}
                        onChange={e => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.guest_name ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-amber-500'}`}
                      />
                      {errors.guest_name && <p className="text-red-500 text-xs mt-1">{errors.guest_name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                        <div className="relative flex">
                          <span className="p-3 bg-slate-100 border border-slate-300 rounded-l-lg border-r-0 text-slate-500 text-sm font-semibold">+91</span>
                          <input
                            type="tel"
                            placeholder="Enter 10-digit number"
                            value={formData.guest_phone}
                            onChange={e => setFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
                            className={`w-full p-3 border rounded-r-lg focus:outline-none focus:ring-2 ${errors.guest_phone ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-amber-500'}`}
                          />
                        </div>
                        {errors.guest_phone && <p className="text-red-500 text-xs mt-1">{errors.guest_phone}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={formData.guest_email}
                          onChange={e => setFormData(prev => ({ ...prev, guest_email: e.target.value }))}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.guest_email ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-amber-500'}`}
                        />
                        {errors.guest_email && <p className="text-red-500 text-xs mt-1">{errors.guest_email}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: ID Verification */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <IdCard className="text-amber-800" /> Identity Verification
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">ID Document Type</label>
                      <select
                        value={formData.id_type}
                        onChange={e => setFormData(prev => ({ ...prev, id_type: e.target.value }))}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">ID Document Number</label>
                      <input
                        type="text"
                        placeholder={`Enter ${formData.id_type} number`}
                        value={formData.id_number}
                        onChange={e => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.id_number ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-amber-500'}`}
                      />
                      {errors.id_number && <p className="text-red-500 text-xs mt-1">{errors.id_number}</p>}
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-700 mb-1">Upload ID Document (PDF, JPEG, PNG)</h4>
                    <p className="text-xs text-slate-400 mb-4">Max size 2MB. Front & back merged into single file.</p>
                    
                    <input 
                      type="file" 
                      id="id_upload" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="id_upload" 
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer inline-block"
                    >
                      Choose File
                    </label>

                    {formData.id_file_name && (
                      <div className="mt-4 p-2 bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100 rounded inline-flex items-center gap-2">
                        <span>📄 {formData.id_file_name}</span>
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, id_file_name: '' }))}
                          className="hover:text-red-700 ml-1 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {errors.id_file && <p className="text-red-500 text-xs mt-2">{errors.id_file}</p>}
                  </div>
                </div>
              )}

              {/* Step 5: Pilgrimage Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <ShieldCheck className="text-amber-800" /> Pilgrimage Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Darshan Date</label>
                      <input
                        type="date"
                        value={formData.darshan_date}
                        min={formData.check_in}
                        max={formData.check_out}
                        onChange={e => setFormData(prev => ({ ...prev, darshan_date: e.target.value }))}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">Must be during your booking stay period.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Mode of Transport to Khatu</label>
                      <select
                        value={formData.transport}
                        onChange={e => setFormData(prev => ({ ...prev, transport: e.target.value }))}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Train">Train (Ringas Junction / Jaipur)</option>
                        <option value="Bus">Public/Private Bus</option>
                        <option value="Personal Car">Personal Vehicle / Car</option>
                        <option value="Padyatra">Padyatra (Foot Pilgrimage)</option>
                        <option value="Flight">Flight (Jaipur Airport + Taxi)</option>
                      </select>
                      {errors.transport && <p className="text-red-500 text-xs mt-1">{errors.transport}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Emergency Contact */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <PhoneCall className="text-amber-800" /> Emergency Contact
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="Enter contact name"
                        value={formData.emergency_name}
                        onChange={e => setFormData(prev => ({ ...prev, emergency_name: e.target.value }))}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.emergency_name ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-amber-500'}`}
                      />
                      {errors.emergency_name && <p className="text-red-500 text-xs mt-1">{errors.emergency_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Relationship</label>
                      <select
                        value={formData.emergency_relation}
                        onChange={e => setFormData(prev => ({ ...prev, emergency_relation: e.target.value }))}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                      <div className="relative flex">
                        <span className="p-3 bg-slate-100 border border-slate-300 rounded-l-lg border-r-0 text-slate-500 text-sm font-semibold">+91</span>
                        <input
                          type="tel"
                          placeholder="Enter 10-digit number"
                          value={formData.emergency_phone}
                          onChange={e => setFormData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                          className={`w-full p-3 border rounded-r-lg focus:outline-none focus:ring-2 ${errors.emergency_phone ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-amber-500'}`}
                        />
                      </div>
                      {errors.emergency_phone && <p className="text-red-500 text-xs mt-1">{errors.emergency_phone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Payment Summary */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <FileText className="text-amber-800" /> Booking Payment Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl space-y-3">
                        <h4 className="font-bold text-amber-900 border-b border-amber-100 pb-1 text-sm">Accommodation Reservation Summary</h4>
                        <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
                          <div>Property:</div>
                          <div className="font-bold text-slate-800 text-right">{property.name}</div>

                          <div>Room Type:</div>
                          <div className="font-bold text-slate-800 text-right">{selectedRoom?.type} ({selectedRoom?.category})</div>

                          <div>Check-in:</div>
                          <div className="font-bold text-slate-800 text-right">{new Date(formData.check_in).toLocaleDateString('en-IN')} (12:00 PM)</div>

                          <div>Check-out:</div>
                          <div className="font-bold text-slate-800 text-right">{new Date(formData.check_out).toLocaleDateString('en-IN')} (11:00 AM)</div>

                          <div>Stay Duration:</div>
                          <div className="font-bold text-slate-800 text-right">{nights} Night(s)</div>

                          <div>Guests:</div>
                          <div className="font-bold text-slate-800 text-right">{formData.adults} Adults, {formData.children} Children, {formData.seniors} Seniors</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs space-y-2 text-slate-500">
                        <div className="flex gap-2 items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p>
                            This booking is non-transferable. You must carry the same physical photo ID uploaded here at the time of check-in at the property counter.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-400 tracking-wider uppercase border-b border-slate-800 pb-2">Billing Details</h4>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Room Base Fare</span>
                            <span>Rs. {baseTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Convenience GST (5%)</span>
                            <span>Rs. {tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-amber-400">
                            <span>Grand Total</span>
                            <span>Rs. {grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <p className="text-[10px] text-slate-400 text-center">
                          Secured via Devsthan Payment Gateway
                        </p>
                        <button
                          onClick={handleBook}
                          disabled={isSubmitting}
                          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                            </>
                          ) : (
                            <>Confirm & Pay Online &rarr;</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Success screen */}
              {currentStep === 7 && bookingResult && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-800 font-serif">Booking Confirmed Successfully!</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Your booking at <span className="font-semibold text-slate-700">{bookingResult.property_name}</span> is confirmed.
                    </p>
                  </div>

                  {/* Receipt Voucher Display Card */}
                  <div className="max-w-md mx-auto bg-gradient-to-b from-amber-50/50 to-white border border-amber-200 rounded-2xl p-6 shadow-md relative overflow-hidden">
                    {/* Ornamental top edge */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-700 to-amber-600" />
                    
                    <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-4 mb-4">
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Booking ID Reference</p>
                        <p className="text-lg font-black text-slate-800 tracking-wide">{bookingResult.booking_id}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] uppercase">Paid</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 text-left text-xs mb-6">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Primary Guest</span>
                        <span className="font-bold text-slate-700">{bookingResult.guest_details.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Room Type</span>
                        <span className="font-bold text-slate-700">{bookingResult.room_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Check-In Date</span>
                        <span className="font-bold text-slate-700">{new Date(bookingResult.check_in).toLocaleDateString('en-IN')} (12:00 PM)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Check-Out Date</span>
                        <span className="font-bold text-slate-700">{new Date(bookingResult.check_out).toLocaleDateString('en-IN')} (11:00 AM)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Amount Paid</span>
                        <span className="font-black text-amber-900 text-sm font-serif">Rs. {bookingResult.total_amount}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <QRCodeSVG 
                          value={bookingResult.booking_id} 
                          size={55} 
                          level="M" 
                          includeMargin={false} 
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex gap-3">
                      <button
                        onClick={downloadReceiptPDF}
                        className="flex-1 py-2.5 px-4 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors active:scale-95 shadow"
                    >
                      Close Booking Portal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modal Footer Controls (Fixed) */}
        {currentStep < 7 && (
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-between items-center shrink-0">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>

            {currentStep < 7 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
              >
                Next Step <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <div /> // Paid button is in the payment details grid
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
