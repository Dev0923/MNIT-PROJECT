import re

missing_code = """
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
"""

with open('src/app/pages/AccommodationBookingPage.tsx', 'r', encoding='utf-8') as f:
    current = f.read().rstrip()

with open('src/app/pages/AccommodationBookingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(current + '\n' + missing_code)
