import React, { useState, useEffect } from 'react';
import { User, ServiceMenu, Reservation, ReservationStatus } from './types';
import { INITIAL_SERVICES, getInitialMockReservations, ADMIN_USER } from './data';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';

export default function App() {
  // Views: 'LANDING' | 'BOOKING' | 'CLIENT_DASHBOARD' | 'ADMIN_DASHBOARD' | 'AUTH'
  const [currentView, setView] = useState<'LANDING' | 'BOOKING' | 'CLIENT_DASHBOARD' | 'ADMIN_DASHBOARD' | 'AUTH'>('LANDING');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [services, setServices] = useState<ServiceMenu[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [lang, setLangState] = useState<'ko' | 'en'>(() => {
    return (localStorage.getItem('tg_lang') as 'ko' | 'en') || 'ko';
  });

  const setLang = (newLang: 'ko' | 'en') => {
    setLangState(newLang);
    localStorage.setItem('tg_lang', newLang);
  };

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    // Services setup
    const savedServices = localStorage.getItem('tg_services');
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    } else {
      setServices(INITIAL_SERVICES);
      localStorage.setItem('tg_services', JSON.stringify(INITIAL_SERVICES));
    }

    // Reservations setup
    const savedReservations = localStorage.getItem('tg_reservations');
    if (savedReservations) {
      setReservations(JSON.parse(savedReservations));
    } else {
      const initialResList = getInitialMockReservations();
      setReservations(initialResList);
      localStorage.setItem('tg_reservations', JSON.stringify(initialResList));
    }

    // User setup
    const savedUser = localStorage.getItem('tg_currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Authentication handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('tg_currentUser', JSON.stringify(user));
    
    // Redirect smartly based on user role
    if (user.role === 'ADMIN') {
      setView('ADMIN_DASHBOARD');
    } else {
      setView('BOOKING');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tg_currentUser');
    setView('LANDING');
  };

  // 3. Reservation actions
  const handleAddReservation = (bookingData: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    date: string;
    time: string;
  }) => {
    const newReservation: Reservation = {
      id: 'res-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser ? currentUser.id : 'u-guest',
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      serviceId: bookingData.serviceId,
      date: bookingData.date,
      time: bookingData.time,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const updated = [newReservation, ...reservations];
    setReservations(updated);
    localStorage.setItem('tg_reservations', JSON.stringify(updated));
  };

  const handleUpdateReservationStatus = (id: string, newStatus: ReservationStatus) => {
    const updated = reservations.map(res => {
      if (res.id === id) {
        return { ...res, status: newStatus };
      }
      return res;
    });
    setReservations(updated);
    localStorage.setItem('tg_reservations', JSON.stringify(updated));
  };

  const handleCancelReservation = (id: string) => {
    handleUpdateReservationStatus(id, 'Cancelled');
  };

  const handleResetMockData = () => {
    const initialResList = getInitialMockReservations();
    setReservations(initialResList);
    localStorage.setItem('tg_reservations', JSON.stringify(initialResList));
  };

  return (
    <div className="bg-[#FBFBFA] min-h-screen text-[#1A1A1A] font-sans antialiased">
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        setView={setView}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
      />

      <main className="animate-fadeIn">
        {currentView === 'LANDING' && (
          <LandingPage
            onBookNow={() => setView('BOOKING')}
            services={services}
            lang={lang}
          />
        )}

        {currentView === 'AUTH' && (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            onBackToLanding={() => setView('LANDING')}
            lang={lang}
          />
        )}

        {currentView === 'BOOKING' && (
          <BookingForm
            currentUser={currentUser}
            services={services}
            reservations={reservations}
            onAddReservation={handleAddReservation}
            onNavigateToAuth={() => setView('AUTH')}
            lang={lang}
          />
        )}

        {currentView === 'CLIENT_DASHBOARD' && currentUser && (
          <ClientDashboard
            currentUser={currentUser}
            reservations={reservations}
            services={services}
            onCancelReservation={handleCancelReservation}
            onNavigateToBooking={() => setView('BOOKING')}
            lang={lang}
          />
        )}

        {currentView === 'ADMIN_DASHBOARD' && currentUser && currentUser.role === 'ADMIN' && (
          <AdminDashboard
            reservations={reservations}
            services={services}
            onUpdateReservationStatus={handleUpdateReservationStatus}
            onResetMockData={handleResetMockData}
            lang={lang}
          />
        )}
      </main>
    </div>
  );
}
