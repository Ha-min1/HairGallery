export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  provider: 'credentials' | 'google';
  createdAt: string;
}

export interface ServiceMenu {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  category: 'Styling' | 'Cut' | 'Color' | 'Treatment';
  description?: string;
}

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Reservation {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: ReservationStatus;
  createdAt: string;
}
