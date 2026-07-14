'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Scissors, User, Phone, CheckCircle, Info, Sparkles, MapPin } from 'lucide-react';

const TIME_SLOTS_24H = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:30', '16:30', '17:30', '18:00', '19:00'
];

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Fetch Service Registry on load
  useEffect(() => {
    // Boilerplate simulated load of services
    setServices([
      { id: 's1', name: 'Signature Cut & Blowout', price: 90, durationMinutes: 60, category: 'Cut', description: 'Bespoke precision cut completed with a signature bounce wash and blowdry.' },
      { id: 's2', name: 'Gents Precision Cut', price: 55, durationMinutes: 45, category: 'Cut', description: 'Clean clipper work, scissor texturizing, hot towel service and clay styling.' },
      { id: 's3', name: 'Balayage Artistry', price: 240, durationMinutes: 180, category: 'Color', description: 'Premium hand-painted sun-kissed highlighting for beautiful dimensional transitions.' },
      { id: 's6', name: 'Keratin Smooth Treatment', price: 280, durationMinutes: 150, category: 'Treatment', description: 'Restores protein lipids, eliminating frizz and cutting styling time in half.' }
    ]);
  }, []);

  // Fetch Booked Slots dynamically when Date is picked
  useEffect(() => {
    if (!selectedDate) return;

    async function checkAvailability() {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/reservations?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setBookedTimes(data.bookedSlots || []);
        }
      } catch (err) {
        console.error('Failed to retrieve slot lists:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    checkAvailability();
  }, [selectedDate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedServiceId || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setErrorMessage('Please fill out all required fields to register your session.');
      return;
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          serviceId: selectedServiceId,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit reservation.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Server collision. Please retry your submission.');
    }
  };

  return (
    <main className="flex-1 bg-stone-50">
      {/* Editorial Hero Block */}
      <section className="bg-stone-900 text-stone-100 py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-mono tracking-widest text-gold-500 uppercase">THE HAIR GALLERY</span>
          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight">
            Curators of Precision Hair Design
          </h1>
          <p className="text-sm sm:text-base text-stone-400 font-light max-w-xl mx-auto leading-relaxed">
            Welcome to Soho’s luxury coiffure sanctuary. Reserve precision cutting services, dimensional balayage coloring, and restorative botanical hair therapies.
          </p>
        </div>
      </section>

      {/* Main Grid View */}
      <div className="max-w-5xl mx-auto py-16 px-4">
        {isSuccess ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-8 max-w-md mx-auto text-center space-y-6">
            <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-900">Reservation Submitted</h2>
              <p className="text-xs text-stone-500 mt-2">
                Your styling session has been registered! Elena and her team will verify your slot within the hour.
              </p>
            </div>
            <button
              onClick={() => setIsSuccess(false)}
              className="w-full py-2.5 bg-stone-950 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors uppercase tracking-wider"
            >
              Book Another Visit
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Side: Services */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-gold-600" />
                Select Hair Styling Service
              </h2>

              <div className="space-y-3">
                {services.map(s => (
                  <label
                    key={s.id}
                    className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedServiceId === s.id ? 'bg-amber-50/40 border-gold-500/80 ring-1 ring-gold-500/50' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-2">
                        <input
                          type="radio"
                          name="service"
                          checked={selectedServiceId === s.id}
                          onChange={() => setSelectedServiceId(s.id)}
                          className="mt-1 accent-gold-600"
                        />
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">{s.category}</span>
                          <h3 className="text-xs font-bold text-stone-900">{s.name}</h3>
                          <p className="text-[10px] text-stone-500 mt-1">{s.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-serif block">${s.price}</span>
                        <span className="text-[9px] text-stone-400 font-mono">{s.durationMinutes}m</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Guest Details */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="font-serif text-sm font-semibold text-stone-900">Your Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Genevieve Dupre"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400">Contact Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Date/Slots */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold-600" />
                Select Date & Time Slot
              </h2>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-400">Appointment Date</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 cursor-pointer font-mono"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono text-stone-400 block">Available 24h Time Slots</label>
                  {isLoadingSlots ? (
                    <div className="text-center py-4 text-xs text-stone-400 font-mono">Checking schedules...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {TIME_SLOTS_24H.map(slot => {
                        const isBooked = bookedTimes.includes(slot);
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 text-[11px] font-mono font-semibold rounded border transition-colors ${
                              isBooked
                                ? 'bg-stone-100 text-stone-300 border-stone-100 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-stone-950 text-stone-100 border-stone-950'
                                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-stone-900 text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-transform"
              >
                Book Styling Session
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
