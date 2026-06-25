import re

with open('src/app/pages/AccommodationBookingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace("Building, MapPin, Search, ShieldCheck, Star,", "Building, MapPin, Search, ShieldCheck, Star, CalendarDays, ArrowRight,")

# 2. Add State
state_decl = """export function AccommodationBookingPage() {
  const [flowStep, setFlowStep] = useState<'date' | 'hotels'>('date');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');"""
content = content.replace("export function AccommodationBookingPage() {", state_decl)

# 3. Replace the { /* Filter and Content section */ } with the conditional
old_filter_section = """      {/* Filter and Content section */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 flex flex-col gap-6">"""

new_filter_section = """      {/* Filter and Content section */}
      {flowStep === 'date' ? (
        <div className="max-w-3xl mx-auto w-full px-4 py-16 flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 to-red-800" />
            <h2 className="text-3xl font-extrabold font-serif text-slate-800 text-center mb-2 mt-4">Select Your Travel Dates</h2>
            <p className="text-sm text-slate-500 text-center mb-8 font-medium">Please choose your check-in and check-out dates to check real-time availability.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-700" /> Check-in Date
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-700" /> Check-out Date
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setCheckOutDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800 shadow-sm"
                />
              </div>
            </div>

            <button
              onClick={() => setFlowStep('hotels')}
              disabled={!checkInDate || !checkOutDate || checkOutDate <= checkInDate}
              className="w-full py-4 bg-amber-800 hover:bg-amber-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Search Accommodations <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
             <div className="bg-amber-200/50 p-2 rounded-lg"><CalendarDays className="w-5 h-5 text-amber-800" /></div>
             <div>
               <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Selected Dates</p>
               <p className="text-sm font-semibold text-slate-700">{new Date(checkInDate).toLocaleDateString()} &mdash; {new Date(checkOutDate).toLocaleDateString()}</p>
             </div>
          </div>
          <button onClick={() => setFlowStep('date')} className="px-4 py-2 bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-all">Change Dates</button>
        </div>"""
content = content.replace(old_filter_section, new_filter_section)

# 4. Close the conditional before the Modal
# We look for:
#       {/* Property Details Modal */}
old_modal_start = "      {/* Property Details Modal */}"
new_modal_start = "      )}\n\n      {/* Property Details Modal */}"
content = content.replace(old_modal_start, new_modal_start)

# 5. Pass dates to BookingFlowModal
old_booking_modal = """        <BookingFlowModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          property={selectedProperty}
        />"""
new_booking_modal = """        <BookingFlowModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          property={selectedProperty}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
        />"""
content = content.replace(old_booking_modal, new_booking_modal)

with open('src/app/pages/AccommodationBookingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
