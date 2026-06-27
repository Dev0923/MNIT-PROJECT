const API_URL = 'http://localhost:8000/api/lost-found';

export interface LostItemData {
  category: string;
  date_lost: string;
  location: string;
  description?: string;
  contact_name: string;
  contact_phone: string;
  photo_url?: string;
}

export interface LostPersonData {
  name: string;
  age: number;
  gender?: string;
  clothes_description?: string;
  last_seen_location: string;
  last_seen_time: string;
  contact_name: string;
  contact_phone: string;
  photo_url?: string;
}

export const lostFoundApi = {
  reportLostItem: async (data: LostItemData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/lost-item`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to report lost item");
    return response.json();
  },

  reportLostPerson: async (data: LostPersonData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/lost-person`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to report missing person");
    return response.json();
  },

  getFoundItems: async () => {
    const response = await fetch(`${API_URL}/found-items`);
    if (!response.ok) throw new Error("Failed to fetch found items");
    return response.json();
  },

  getAdminItems: async () => {
    const response = await fetch(`${API_URL}/admin/items`);
    if (!response.ok) throw new Error("Failed to fetch admin items");
    return response.json();
  },

  claimFoundItem: async (id: number, claimId: string) => {
    const response = await fetch(`${API_URL}/claim/${id}?claim_id=${claimId}`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to claim found item");
    return response.json();
  },

  notifyUser: async (lostItemId: number) => {
    const response = await fetch(`${API_URL}/notify/${lostItemId}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to notify user");
    return response.json();
  },
};
