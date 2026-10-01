'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, CarFront, ChevronRight, CircleCheck, MapPin, Search, ShieldCheck, Star, Users } from 'lucide-react';
import { useState } from 'react';

const routes = [
  { from: 'Indore', to: 'Dewas', price: 'from ₹85', time: '45 min' },
  { from: 'Indore', to: 'Ujjain', price: 'from ₹120', time: '1 hr' },
  { from: 'Dewas', to: 'Indore', price: 'from ₹85', time: '45 min' },
  { from: 'Ujjain', to: 'Indore', price: 'from ₹120', time: '1 hr' },
];

const rides = [
  { time: '07:30', arrival: '08:20', driver: 'Aman', rating: '4.8', price: '₹90', seats: '2 seats left', car: 'Swift · White', stop: 'Vijay Nagar Square' },
  { time: '08:15', arrival: '09:05', driver: 'Priya', rating: '4.9', price: '₹100', seats: '3 seats left', car: 'Baleno · Grey', stop: 'Palasia Square' },
  { time: '09:00', arrival: '09:50', driver: 'Rohan', rating: '4.7', price: '₹85', seats: '1 seat left', car: 'i20 · Blue', stop: 'Dewas Naka' },
];

export default function Home() {
  const [from, setFrom] = useState('Indore');
  const [to, setTo] = useState('Dewas');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRide, setSelectedRide] = useState<typeof rides[number] | null>(null);

  const search = () => {
    if (!from.trim() || !to.trim()) { setMessage('Enter both locations to search for rides.'); return; }
    setSearched(true); setMessage('');
    document.getElementById('ride-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const pickRoute = (route: typeof routes[number]) => {
    setFrom(route.from); setTo(route.to); setSearched(false);
    document.getElementById('trip-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return <main className="bbc-page">
    <section className="bbc-hero">
      <div className="shell bbc-hero-content">
        <p className="bbc-kicker">CARPOOL FOR EVERYDAY JOURNEYS</p>
        <h1>Travel together,<br /><span>for less.</span></h1>
        <p className="bbc-hero-copy">Find someone already going your way. Share the cost, not the whole car.</p>

        <div id="trip-search" className="bbc-search-box">
          <div className="bbc-field"><MapPin /><div><label>Leaving from</label><input value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Leaving from" /></div></div>
          <button className="bbc-swap" type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap origin and destination">↔</button>
          <div className="bbc-field"><MapPin /><div><label>Going to</label><input value={to} onChange={(event) => setTo(event.target.value)} aria-label="Going to" /></div></div>
          <div className="bbc-field bbc-small-field"><CalendarDays /><div><label>When</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Travel date" /></div></div>
          <div className="bbc-field bbc-small-field"><Users /><div><label>Who</label><select value={passengers} onChange={(event) => setPassengers(event.target.value)} aria-label="Passengers"><option value="1">1 passenger</option><option value="2">2 passengers</option><option value="3">3 passengers</option><option value="4">4 passengers</option></select></div></div>
          <button className="bbc-search-button" type="button" onClick={search}>Search <Search size={18} /></button>
        </div>
        {message && <p className="bbc-validation" role="alert">{message}</p>}
        <div className="bbc-trust"><span><ShieldCheck size={17} /> Verified profiles</span><span><CircleCheck size={17} /> Clear prices</span><span><CarFront size={17} /> Real local rides</span></div>
      </div>
    </section>

    <section className="bbc-routes shell">
      <div className="bbc-section-title"><div><p>EXPLORE NEARBY</p><h2>Popular carpool routes</h2></div><Link href="/find">See all rides <ChevronRight size={17} /></Link></div>
      <div className="bbc-route-grid">{routes.map((route) => <button key={`${route.from}${route.to}`} type="button" onClick={() => pickRoute(route)}><div><span>{route.from}</span><ArrowRight size={16} /><span>{route.to}</span></div><p>{route.time} <i /> {route.price}</p></button>)}</div>
    </section>

    <section id="ride-results" className={`bbc-results ${searched ? 'is-visible' : ''}`}>
      <div className="shell">
        <div className="bbc-section-title"><div><p>RIDES FOR YOU</p><h2>{from} <span>→</span> {to}</h2><small>{date || 'Today'} · {passengers} passenger · 3 rides available</small></div><button type="button" onClick={() => setSearched(false)}>Close results</button></div>
        <div className="bbc-ride-list">{rides.map((ride) => <article key={ride.driver} className="bbc-ride-card"><div className="bbc-schedule"><strong>{ride.time}</strong><span /><strong>{ride.arrival}</strong></div><div className="bbc-stop"><b>{ride.stop}</b><small>{ride.car}</small></div><div className="bbc-driver"><span>{ride.driver[0]}</span><div><b>{ride.driver}</b><small><Star size={12} fill="currentColor" /> {ride.rating}</small></div></div><div className="bbc-price"><b>{ride.price}</b><small>{ride.seats}</small><button type="button" onClick={() => setSelectedRide(ride)}>Choose</button></div></article>)}</div>
      </div>
    </section>

    <section className="bbc-benefits"><div className="shell bbc-benefits-grid"><div><p className="bbc-kicker">WHY SHARE A RIDE?</p><h2>A simple way to move.</h2><p>Designed for people travelling between Indore, Dewas, Ujjain and the places in between.</p></div><article><CircleCheck /><h3>Book with confidence</h3><p>See the driver, vehicle, price, and pickup point before choosing.</p></article><article><CarFront /><h3>Driving soon?</h3><p>Fill empty seats and make the cost of the journey lighter.</p><Link href="/offer">Offer a ride <ArrowRight size={16} /></Link></article></div></section>
    {selectedRide && <div className="bbc-modal-backdrop" role="presentation" onClick={() => setSelectedRide(null)}><section className="bbc-modal" role="dialog" aria-modal="true" aria-label="Ride details" onClick={(event) => event.stopPropagation()}><button className="bbc-modal-close" type="button" onClick={() => setSelectedRide(null)} aria-label="Close">×</button><p className="bbc-kicker">YOUR RIDE</p><h2>{from} <span>→</span> {to}</h2><div className="bbc-modal-route"><b>{selectedRide.time}</b><i /><b>{selectedRide.arrival}</b></div><div className="bbc-modal-driver"><span>{selectedRide.driver[0]}</span><div><b>{selectedRide.driver}</b><small><Star size={13} fill="currentColor" /> {selectedRide.rating} · Verified profile</small></div></div><p className="bbc-modal-detail">{selectedRide.car} · Pickup at {selectedRide.stop}</p><div className="bbc-modal-footer"><div><b>{selectedRide.price}</b><small>{selectedRide.seats}</small></div><button type="button" onClick={() => { setMessage(`Ride request sent to ${selectedRide.driver}.`); setSelectedRide(null); }}>Request this ride <ArrowRight size={17} /></button></div></section></div>}
  </main>;
}
