import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { DivIcon, type Map as LeafletMap } from 'leaflet';
import { 
  Building, MapPin, Search, ShieldCheck, Star, CalendarDays, ArrowRight, 
  Wifi, Coffee, Car, Shield, ListFilter, HelpCircle, 
  Map as MapIcon, Grid, List as ListIcon, X, Check, Compass
} from 'lucide-react';
import { accommodationApi, AccommodationProperty, AccommodationRoom } from '../services/accommodationApi';
import { BookingFlowModal } from '../components/BookingFlowModal';
import 'leaflet/dist/leaflet.css';

const KHATU_CENTER: [number, number] = [27.448, 75.401];

// Helper to center the map when property selection changes
function MapFocus({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}
// Custom Leaflet Icon
const customIcon = new DivIcon({
  html: `<div class="bg-amber-800 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  className: 'custom-leaflet-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export function AccommodationBookingPage() {
  const [flowStep, setFlowStep] = useState<'date' | 'hotels'>('date');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [properties, setProperties] = useState<AccommodationProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<AccommodationProperty | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoomToBook, setSelectedRoomToBook] = useState<AccommodationRoom | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceMax, setPriceMax] = useState<number>(3500);
  const [category, setCategory] = useState(''); // 'AC' or 'Non-AC'

  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    fetchProperties();
  }, [search, propertyType, priceMax, category]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await accommodationApi.getProperties({
        type: propertyType || undefined,
        price_max: priceMax,
        category: category || undefined,
        search: search || undefined,
      });
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom marker for Leaflet map based on property type
  const getMarkerIcon = (property: AccommodationProperty, isSelected: boolean) => {
    const size = isSelected ? 40 : 32;
    let bgColor = '#1e293b'; // dark slate
    let label = 'H'; // hotel

    if (property.type.toLowerCase() === 'dharamshala') {
      bgColor = '#850000'; // crimson dharamshala
      label = 'D';
    } else if (property.type.toLowerCase() === 'guest house') {
      bgColor = '#d97706'; // amber guest house
      label = 'G';
    } else {
      bgColor = '#1e3a8a'; // blue hotel
      label = 'H';
    }

    return new DivIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${bgColor};
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: ${isSelected ? '14px' : '11px'};
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
          transition: all 0.2s ease;
        ">
          ${label}
        </div>
      `,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const handleCardClick = (property: AccommodationProperty) => {
    setSelectedProperty(property);
    if (mapRef.current) {
      mapRef.current.flyTo([property.latitude, property.longitude], 15, { duration: 0.8 });
    }
    setDetailModalOpen(true);
  };

  const openDetails = (property: AccommodationProperty) => {
    setSelectedProperty(property);
    setDetailModalOpen(true);
  };

  const handleBookingStart = (property: AccommodationProperty, room?: AccommodationRoom) => {
    setSelectedProperty(property);
    if (room) {
      setSelectedRoomToBook(room);
    }
    setDetailModalOpen(false);
    setBookingModalOpen(true);
  };

  // Maps Lucide icons to amenity name strings
  const getAmenityIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'parking': return <Car className="w-4 h-4" />;
      case 'cctv': return <Shield className="w-4 h-4" />;
      case 'power backup': return <Compass className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf6] flex flex-col">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-red-800 to-amber-900 text-white py-12 px-6 sm:px-12 md:px-16 text-center shadow-md">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="px-3.5 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold tracking-wider uppercase border border-amber-400/30">
            Shree Khatu Shyam Ji Devsthan Board
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold font-serif tracking-tight text-amber-100">
            Accommodation & Dharamshala Booking
          </h1>
          <p className="text-amber-100/80 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Reserve certified Trust Dharamshalas, guest houses, and registered hotels near Khatu Shyam Mandir. Official booking with transparent pricing and standard amenities.
          </p>
        </div>
      </div>

      {/* Filter and Content section */}
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
        </div>
        
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 col-span-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Search Accommodation
            </label>
            <input
              type="text"
              placeholder="Search by name, amenities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Property Type
            </label>
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700"
            >
              <option value="">All Types</option>
              <option value="Dharamshala">Trust Dharamshala</option>
              <option value="Guest House">Guest House</option>
              <option value="Hotel">Hotel</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" /> Room Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="AC">AC Room</option>
              <option value="Non-AC">Non-AC Room</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Max Price per night</span>
              <span className="font-bold text-amber-900 font-serif">Rs. {priceMax}</span>
            </div>
            <input
              type="range"
              min="150"
              max="4000"
              step="50"
              value={priceMax}
              onChange={e => setPriceMax(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>
        </div>

        {/* Layout: Property Grid (Left) + Leaflet Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] flex-1">
          
          {/* Property Cards List */}
          <div className="lg:col-span-7 flex flex-col gap-4 max-h-[750px] overflow-y-auto pr-2">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Available Accommodations ({properties.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-800" />
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700">No properties match your filters</h3>
                <p className="text-slate-400 text-xs mt-1">Try relaxing filters or changing your search criteria</p>
              </div>
            ) : (
              properties.map(property => {
                const isSelected = selectedProperty?.id === property.id;
                return (
                  <div
                    key={property.id}
                    onClick={() => handleCardClick(property)}
                    className={`bg-white rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row min-h-[220px] overflow-hidden ${
                      isSelected 
                        ? 'border-amber-700 shadow-lg ring-1 ring-amber-700/50' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-2/5 md:w-1/3 h-52 sm:h-auto shrink-0 relative bg-slate-100">
                      <img 
                        src={property.image_url} 
                        alt={property.name}
                        className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {property.type}
                      </span>
                    </div>

                    {/* Meta Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between gap-4 bg-white z-10">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-slate-800 text-lg leading-snug">{property.name}</h3>
                          <div className="flex items-center text-amber-500 gap-1 text-xs shrink-0 bg-amber-50 px-2 py-1 rounded-md">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-bold text-amber-900">4.5</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {property.distance} km from Temple Entry Gate
                        </p>
                      </div>

                      {/* Amenities Row */}
                      <div className="flex flex-wrap gap-1.5">
                        {property.amenities.slice(0, 4).map((amenity, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 rounded px-2 py-1 text-[10px] font-medium flex items-center gap-1">
                            {getAmenityIcon(amenity)} {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold px-1 mt-1">
                            +{property.amenities.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Card Footer: Pricing and Book buttons */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-slate-100 pt-4 mt-auto">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Starting from</p>
                          <p className="text-xl font-black text-amber-900 font-serif">Rs. {property.price_start}<span className="text-xs text-slate-400 font-sans font-medium"> / night</span></p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(property);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors text-center"
                          >
                            Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingStart(property);
                            }}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95 text-center"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>

            {/* Leaflet Map (Right Side) */}
            <div className="hidden lg:block lg:col-span-5 h-[750px] sticky top-6 z-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              <MapContainer
                center={[27.3664, 75.3970]} // Khatu Shyam Coordinates
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                ref={mapRef}
                zoomControl={false}
              >
                <ZoomControl position="bottomright" />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {properties.map(property => (
                  <Marker 
                    key={property.id} 
                    position={[property.latitude, property.longitude]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        handleCardClick(property);
                      },
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="font-sans">
                        <h4 className="font-bold text-slate-800">{property.name}</h4>
                        <p className="text-xs text-slate-500">{property.type} • Rs. {property.price_start}</p>
                        <button 
                          onClick={() => openDetails(property)}
                          className="mt-2 w-full bg-amber-800 text-white text-[10px] font-bold py-1.5 rounded"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {detailModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1 block">Property Details</span>
                <h3 className="text-xl font-bold font-serif text-slate-800">{selectedProperty.name}</h3>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              
              <div className="w-full md:w-1/3 shrink-0 space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-[4/3]">
                  <img src={selectedProperty.image_url} className="w-full h-full object-cover" alt={selectedProperty.name} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">About</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedProperty.description}</p>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Amenities</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedProperty.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-amber-800 shrink-0">{getAmenityIcon(amenity)}</span>
                        <span className="font-semibold text-slate-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Availability & Tariff</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedProperty.rooms.map(room => (
                      <div key={room.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-slate-50/40 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">{room.type}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${room.category === 'AC' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                              {room.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold">Available Units: {room.available_rooms}</p>
                        </div>
                        <div className="flex justify-between sm:justify-end items-center gap-4">
                          <div className="sm:text-right">
                            <p className="text-xs text-slate-400">Price per night</p>
                            <p className="text-base font-extrabold text-amber-900 font-serif">Rs. {room.base_price}</p>
                          </div>
                          <button
                            onClick={() => handleBookingStart(selectedProperty, room)}
                            disabled={room.available_rooms <= 0}
                            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-sm"
                          >
                            {room.available_rooms > 0 ? 'Book Room' : 'Sold Out'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-amber-50/20 border border-amber-100/40 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 text-amber-800">
                    <ShieldCheck className="w-4 h-4" /> Board Boarding Rules & Policies
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedProperty.policies.map((policy, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>{policy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col-reverse sm:flex-row justify-between items-center shrink-0 gap-4">
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(selectedProperty.name + " Khatu Shyam")}`} 
                target="_blank" 
                rel="noreferrer" 
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-amber-200"
              >
                <MapPin className="w-3.5 h-3.5" /> View Official Website & Maps
              </a>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors text-center"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking flow wizard modal */}
      {selectedProperty && (
        <BookingFlowModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          property={selectedProperty}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
        />
      )}
    </div>
  );
}
