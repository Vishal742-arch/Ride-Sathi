'use client';
import { CalendarDays, Car, ChevronDown, Clock, MapPin, MessageSquare, Phone, Search, ShieldCheck, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RideChat } from '@/components/ride-chat';
import { RideBookingModal } from '@/components/ride-booking-modal';
import { formatPostedTime } from '@/lib/utils/format-posted-time';

type Location={id:string;name:string;city:string};
type RideItem={
  id: string;
  driver_name: string;
  driver_rating: number;
  vehicle: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  is_verified: boolean;
  postedAt?: string;
  created_at?: string;
};

function LocationPicker({label,value,onSelect,exclude}:{label:string;value:Location|null;onSelect:(location:Location|null)=>void;exclude?:string}){const [query,setQuery]=useState('');const [results,setResults]=useState<Location[]>([]);const [open,setOpen]=useState(false);const [status,setStatus]=useState('');const area=useRef<HTMLDivElement>(null);useEffect(()=>{const close=(event:MouseEvent)=>{if(!area.current?.contains(event.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);useEffect(()=>{if(!open||!query.trim()){setResults([]);setStatus('');return}const controller=new AbortController();const timer=setTimeout(async()=>{try{const response=await fetch(`/api/locations?q=${encodeURIComponent(query)}`,{signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error);setResults(body.filter((item:Location)=>item.id!==exclude));setStatus(body.length?'':'No matching locations yet.')}catch(error){if((error as Error).name!=='AbortError')setStatus('Connect Supabase to search the location network.')}},220);return()=>{clearTimeout(timer);controller.abort()}},[query,open,exclude]);return <div className="location-picker" ref={area}><span>{label}</span><div className="find-input"><MapPin/><input value={value?.name??query} onFocus={()=>{setOpen(true);if(value)setQuery(value.name)}} onChange={event=>{onSelect(null);setQuery(event.target.value);setOpen(true)}} placeholder={label==='FROM'?'Select pickup':'Select destination'} aria-label={label==='FROM'?'Pickup location':'Destination location'} autoComplete="off"/>{value&&<button type="button" className="clear-location" aria-label={`Clear ${label.toLowerCase()}`} onClick={()=>{onSelect(null);setQuery('');setOpen(false)}}><X size={15}/></button>}</div>{open&&query&&<div className="location-popover" role="listbox">{results.map(location=><button type="button" role="option" key={location.id} onClick={()=>{onSelect(location);setQuery('');setOpen(false)}}><MapPin size={16}/><span><b>{location.name}</b><small>{location.city}</small></span></button>)}{status&&<p>{status}</p>}</div>}</div>}

export default function FindRide(){
  const [vehicle,setVehicle]=useState('CAR');
  const [message,setMessage]=useState('');
  const [from,setFrom]=useState<Location|null>(null);
  const [to,setTo]=useState<Location|null>(null);
  const [activeChatRideId, setActiveChatRideId] = useState<string|null>(null);
  const [bookingRide, setBookingRide] = useState<RideItem|null>(null);
  const [rides, setRides] = useState<RideItem[]>([]);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    fetchRides();

    // Live runtime ticker: updates relative timestamps (e.g. 10 min ago -> 11 min ago) dynamically every minute
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchRides = async (fromQuery?: string, toQuery?: string) => {
    try {
      const url = `/api/rides/search?from=${encodeURIComponent(fromQuery || '')}&to=${encodeURIComponent(toQuery || '')}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.rides) setRides(data.rides);
    } catch {
      // Fallback handled by API
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      setMessage('Please select a pickup and destination from the location list.');
      return;
    }
    setMessage(`Showing verified matches from ${from.name} to ${to.name}.`);
    fetchRides(from.name, to.name);
  };

  return (
    <main className="finder-page">
      <section className="shell finder">
        <span className="kicker">RIDE SATHI CARPOOLING</span>
        <h1>Find a ride</h1>
        <p>Choose your pickup and destination. Search across Indore, Dewas, and Ujjain location network with instant UPI/Card booking & contact privacy.</p>
        <form onSubmit={handleSearch} className="find-card">
          <LocationPicker label="FROM" value={from} onSelect={setFrom} exclude={to?.id}/>
          <div className="finder-line"/>
          <LocationPicker label="TO" value={to} onSelect={setTo} exclude={from?.id}/>
          <div className="find-options">
            <label><span>DATE</span><div className="find-input"><CalendarDays/><input type="date" aria-label="Travel date"/></div></label>
            <label><span>PASSENGERS</span><div className="find-input"><Users/><select aria-label="Passengers" defaultValue="1"><option>1</option><option>2</option><option>3</option></select><ChevronDown size={15}/></div></label>
          </div>
          <fieldset><legend>VEHICLE</legend><div className="vehicle-options"><button type="button" className={vehicle==='BIKE'?'selected':''} onClick={()=>setVehicle('BIKE')}>🏍️ Bike</button><button type="button" className={vehicle==='CAR'?'selected':''} onClick={()=>setVehicle('CAR')}><Car size={18}/> Car</button></div></fieldset>
          <button className="search-button"><Search size={18}/> Find available rides</button>
          {message&&<p className="form-note" role="status">{message}</p>}
        </form>

        <div className="featured-rides-preview">
          <div className="preview-heading">
            <h2>Available Live Commutes</h2>
            <span className="privacy-chip"><ShieldCheck size={14}/> Phone Numbers Protected</span>
          </div>

          {rides.map(ride => (
            <div key={ride.id} className="ride-card-item">
              <div className="ride-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, width: '100%' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <h3>{ride.origin} ➔ {ride.destination}</h3>
                  <p>Departure: {ride.departure_time} • ₹{ride.price_per_seat}/seat • {ride.vehicle}</p>
                </div>
                <div className="ride-header-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#617d72', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0f7f4', padding: '3px 8px', borderRadius: 8, border: '1px solid #dcece2', whiteSpace: 'nowrap' }}>
                    <Clock size={12} style={{ color: '#087c64' }} /> {formatPostedTime(ride.postedAt || ride.created_at || '')}
                  </span>
                  <span className="driver-verified-tag">✓ {ride.driver_name} ({ride.driver_rating} ★)</span>
                </div>
              </div>
              <div className="ride-actions">
                <button className="ride-btn ride-btn-primary" onClick={() => setBookingRide(ride)}>
                  ⚡ Book & Pay (UPI/Card)
                </button>
                <button className="ride-btn ride-btn-light" onClick={() => setActiveChatRideId(ride.id)}>
                  <MessageSquare size={16}/> In-App Chat
                </button>
                <button className="ride-btn ride-btn-light" onClick={() => setActiveChatRideId(ride.id)}>
                  <Phone size={16}/> Privacy Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {bookingRide && (
        <RideBookingModal ride={bookingRide} onClose={() => setBookingRide(null)} />
      )}

      {activeChatRideId && (
        <RideChat
          rideId={activeChatRideId}
          driverName="Rahul Sharma"
          driverRole="Verified Driver"
          isVerified={true}
          onClose={() => setActiveChatRideId(null)}
        />
      )}
    </main>
  );
}


