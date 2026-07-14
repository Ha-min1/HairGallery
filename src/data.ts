import { ServiceMenu, Reservation, User } from './types';

export const INITIAL_SERVICES: ServiceMenu[] = [
  {
    id: 's1',
    name: 'Signature Cut & Blowout',
    price: 12000,
    durationMinutes: 60,
    category: 'Cut',
    description: 'A bespoke cutting experience tailored to your facial structure, complete with a luxury wash and bouncy signature blowout.'
  },
  {
    id: 's2',
    name: 'Gents Precision Cut',
    price: 10000,
    durationMinutes: 45,
    category: 'Cut',
    description: 'Clean scissor-and-clipper work, detailed texturizing, hot towel neck shave, and premium matte clay styling.'
  },
  {
    id: 's3',
    name: 'Balayage Artistry',
    price: 15000,
    durationMinutes: 180,
    category: 'Color',
    description: 'Hand-painted premium sun-kissed highlights creating seamless, low-maintenance dimensional transitions.'
  },
  {
    id: 's4',
    name: 'Full Dimensional Color',
    price: 13000,
    durationMinutes: 120,
    category: 'Color',
    description: 'All-over bespoke glossing, toning, and depth-building color treatment using ammonia-free formulas.'
  },
  {
    id: 's5',
    name: 'Root Touch-up',
    price: 9000,
    durationMinutes: 75,
    category: 'Color',
    description: 'Precise coverage of gray growth or root matching, complete with a restorative protein glaze.'
  },
  {
    id: 's6',
    name: 'Keratin Smooth Treatment',
    price: 14000,
    durationMinutes: 150,
    category: 'Treatment',
    description: 'Formaldehyde-free smoothing therapy that eliminates frizz, blocks humidity, and cuts style time in half.'
  },
  {
    id: 's7',
    name: 'Caviar Deep Conditioning',
    price: 8000,
    durationMinutes: 45,
    category: 'Treatment',
    description: 'Intense micro-emulsion moisture therapy with black caviar extract to restore lipid protection and high shine.'
  },
  {
    id: 's8',
    name: 'Red Carpet Blowout & Style',
    price: 11000,
    durationMinutes: 45,
    category: 'Styling',
    description: 'Premium red-carpet styling with thermal round-brush sculpting, high-gloss finish, and pin-set volume.'
  }
];

export const ADMIN_USER: User = {
  id: 'u-admin',
  email: 'admin@hairgallery.com',
  name: '엘레나 원장',
  role: 'ADMIN',
  provider: 'credentials',
  phone: '010-9844-1234',
  createdAt: new Date().toISOString()
};

export const MOCK_USERS: User[] = [
  {
    id: 'u-1',
    email: 'client.clara@gmail.com',
    name: '김선영',
    role: 'USER',
    provider: 'google',
    phone: '010-4321-8891',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'u-2',
    email: 'marcus.vance@yahoo.com',
    name: '박민준',
    role: 'USER',
    provider: 'credentials',
    phone: '010-7621-1104',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'u-3',
    email: 'sophia.chen@live.com',
    name: '이지은',
    role: 'USER',
    provider: 'google',
    phone: '010-9014-4432',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

// Helper to generate dates relative to today (e.g. today, tomorrow, yesterday)
const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const getInitialMockReservations = (): Reservation[] => [
  {
    id: 'r-1',
    userId: 'u-1',
    customerName: '김선영',
    customerPhone: '010-4321-8891',
    serviceId: 's3', // Balayage Artistry
    date: getRelativeDateString(0), // Today
    time: '10:00',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-2',
    userId: 'u-2',
    customerName: '박민준',
    customerPhone: '010-7621-1104',
    serviceId: 's1', // Signature Cut
    date: getRelativeDateString(0), // Today
    time: '13:00',
    status: 'Pending',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-3',
    userId: 'u-3',
    customerName: '이지은',
    customerPhone: '010-9014-4432',
    serviceId: 's6', // Keratin Smooth
    date: getRelativeDateString(0), // Today
    time: '15:30',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-4',
    userId: 'u-1',
    customerName: '김선영',
    customerPhone: '010-4321-8891',
    serviceId: 's8', // Red Carpet Blowout
    date: getRelativeDateString(1), // Tomorrow
    time: '11:00',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-5',
    userId: 'u-3',
    customerName: '이지은',
    customerPhone: '010-9014-4432',
    serviceId: 's5', // Root Touch-up
    date: getRelativeDateString(-2), // 2 Days Ago
    time: '14:00',
    status: 'Completed',
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r-6',
    userId: 'u-2',
    customerName: '박민준',
    customerPhone: '010-7621-1104',
    serviceId: 's2', // Gents Precision
    date: getRelativeDateString(-4), // 4 Days Ago
    time: '09:30',
    status: 'Completed',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];
