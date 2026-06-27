const API_URL = 'http://localhost:8000/api/accommodation';

export interface AccommodationRoom {
  id: number;
  type: string;
  category: string;
  base_price: number;
  available_rooms: number;
  total_rooms?: number;
}

export interface AccommodationProperty {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance: number;
  price_start: number;
  description: string;
  amenities: string[];
  image_url: string;
  policies: string[];
  rooms: AccommodationRoom[];
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  id_type: string;
  id_number: string;
}

export interface PilgrimageDetails {
  darshan_date?: string;
  count?: number;
  transport?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface BookingRequest {
  property_id: number;
  room_type: string;
  check_in: string; // ISO format or YYYY-MM-DD
  check_out: string; // ISO format or YYYY-MM-DD
  adults: number;
  children: number;
  seniors: number;
  guest_details: GuestDetails;
  pilgrimage_details: PilgrimageDetails;
  emergency_contact: EmergencyContact;
  total_amount: number;
}

export interface BookingResponse {
  id: number;
  booking_id: string;
  status: string;
  property_name: string;
  room_type: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  guest_details: GuestDetails;
}

export interface MyBookingResponse {
  id: number;
  booking_id: string;
  property_name: string;
  property_type: string;
  room_type: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  seniors: number;
  total_amount: number;
  status: string;
  guest_details: GuestDetails;
  created_at: string;
}

export const accommodationApi = {
  getProperties: async (filters: {
    type?: string;
    price_max?: number;
    category?: string;
    search?: string;
  } = {}): Promise<AccommodationProperty[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.price_max) params.append('price_max', filters.price_max.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_URL}/properties?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    return response.json();
  },

  getPropertyDetail: async (propertyId: number): Promise<AccommodationProperty> => {
    const response = await fetch(`${API_URL}/properties/${propertyId}`);
    if (!response.ok) throw new Error('Failed to fetch property details');
    return response.json();
  },

  createBooking: async (bookingData: BookingRequest): Promise<BookingResponse> => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to create booking' }));
      throw new Error(errorData.detail || 'Failed to create booking');
    }
    return response.json();
  },

  getMyBookings: async (): Promise<MyBookingResponse[]> => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/bookings/my`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch user bookings');
    return response.json();
  },
};
