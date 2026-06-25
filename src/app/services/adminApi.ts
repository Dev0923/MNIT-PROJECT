/**
 * Admin API Service
 * Typed client for all /api/admin/* backend endpoints.
 * Reads JWT token from localStorage for Authorization header.
 */

const BASE_URL = "http://localhost:8000";

// ── Types ────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
  receive_updates: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AdminUserUpdate {
  name?: string;
  phone?: string;
  email?: string;
  is_admin?: boolean;
  receive_updates?: boolean;
  password?: string;
}

export interface AdminDonation {
  id: number;
  donation_id: string;
  user_id: number | null;
  fullName: string;
  mobile: string;
  purpose: string;
  amount: number;
  want80G: boolean;
  panCard: string | null;
  created_at: string;
}

export interface AdminBooking {
  id: number;
  booking_id: string;
  user_id: number | null;
  booking_type: string;
  date: string;
  phone: string;
  city: string;
  individual_details: Record<string, unknown> | null;
  group_details: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminSupportTicket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export interface AdminVehiclePermit {
  id: number;
  vehicle_id: number;
  plate_number: string;
  vehicle_type: string;
  vehicle_model: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  permit_type: string;
  status: string;
  valid_from: string;
  valid_to: string;
  allowed_zones: string[];
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_donations: number;
  total_donated_amount: number;
  total_bookings: number;
  open_tickets: number;
  pending_permits: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
    last_login: string | null;
  };
}

// ── Auth helpers ─────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

export function setToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function clearToken(): void {
  localStorage.removeItem("authToken");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Core fetch wrapper ───────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────

export async function adminLogin(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  const res = await apiFetch<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    },
    false
  );
  setToken(res.access_token);
  return res;
}

export async function getMe() {
  return apiFetch<LoginResponse["user"]>("/api/auth/me");
}

// ── Stats ─────────────────────────────────────────────────

export async function getStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/admin/stats");
}

// ── Users ─────────────────────────────────────────────────

export async function getUsers(q?: string, skip = 0, limit = 50): Promise<AdminUser[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (q) params.set("q", q);
  return apiFetch<AdminUser[]>(`/api/admin/users?${params}`);
}

export async function getUser(id: number): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}`);
}

export async function updateUser(id: number, patch: AdminUserUpdate): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/users/${id}`, { method: "DELETE" });
}

export async function createAdminUser(
  name: string,
  email: string,
  password: string
): Promise<AdminUser> {
  return apiFetch<AdminUser>("/api/admin/create-admin", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// ── Donations ─────────────────────────────────────────────

export async function getDonations(q?: string, skip = 0, limit = 50): Promise<AdminDonation[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (q) params.set("q", q);
  return apiFetch<AdminDonation[]>(`/api/admin/donations?${params}`);
}

// ── Bookings ──────────────────────────────────────────────

export async function getBookings(q?: string, skip = 0, limit = 50): Promise<AdminBooking[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (q) params.set("q", q);
  return apiFetch<AdminBooking[]>(`/api/admin/bookings?${params}`);
}

// ── Support Tickets ───────────────────────────────────────

export async function getSupportTickets(
  statusFilter?: string,
  skip = 0,
  limit = 50
): Promise<AdminSupportTicket[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (statusFilter) params.set("status", statusFilter);
  return apiFetch<AdminSupportTicket[]>(`/api/admin/support?${params}`);
}

export async function updateTicketStatus(
  id: number,
  status: string,
  adminReply?: string
): Promise<AdminSupportTicket> {
  return apiFetch<AdminSupportTicket>(`/api/admin/support/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, admin_reply: adminReply }),
  });
}

// ── Vehicle Permits ───────────────────────────────────────

export async function getVehiclePermits(
  statusFilter?: string,
  q?: string,
  skip = 0,
  limit = 50
): Promise<AdminVehiclePermit[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (statusFilter) params.set("status", statusFilter);
  if (q) params.set("q", q);
  return apiFetch<AdminVehiclePermit[]>(`/api/admin/vehicle-permits?${params}`);
}

export async function approveVehiclePermit(
  id: number,
  permitStatus: "Approved" | "Denied" | "Pending"
): Promise<AdminVehiclePermit> {
  return apiFetch<AdminVehiclePermit>(`/api/admin/vehicle-permits/${id}/approve`, {
    method: "PUT",
    body: JSON.stringify({ status: permitStatus }),
  });
}

// ── Announcements ─────────────────────────────────────

export interface Announcement {
  id: number;
  text: string;
  active: boolean;
  created_at: string;
}

/** Fetch all announcements. Pass activeOnly=true to get only active ones. Public endpoint. */
export async function getAnnouncements(activeOnly = false): Promise<Announcement[]> {
  const params = activeOnly ? "?active_only=true" : "";
  return apiFetch<Announcement[]>(`/api/admin/announcements${params}`, {}, false);
}

export async function createAnnouncement(text: string, active = true): Promise<Announcement> {
  return apiFetch<Announcement>("/api/admin/announcements", {
    method: "POST",
    body: JSON.stringify({ text, active }),
  });
}

export async function updateAnnouncement(
  id: number,
  patch: { text?: string; active?: boolean }
): Promise<Announcement> {
  return apiFetch<Announcement>(`/api/admin/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function deleteAnnouncement(id: number): Promise<void> {
  return apiFetch<void>(`/api/admin/announcements/${id}`, { method: "DELETE" });
}
