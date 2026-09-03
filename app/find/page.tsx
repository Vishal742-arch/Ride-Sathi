'use client';
import { CalendarDays, Car, ChevronDown, MapPin, MessageSquare, Phone, Search, ShieldCheck, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RideChat } from '@/components/ride-chat';

type Location={id:string;name:string;city:string};
function LocationPicker({label,value,onSelect,exclude}:{label:string;value:Location|null;onSelect:(location:Location|null)=>void;exclude?:string}){const [query,setQuery]=useState('');const [results,setResults]=useState<Location[]>([]);const [open,setOpen]=useState(false);const [status,setStatus]=useState('');const area=useRef<HTMLDivElement>(null);useEffect(()=>{const close=(event:MouseEvent)=>{if(!area.current?.contains(event.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);useEffect(()=>{if(!open||!query.trim()){setResults([]);setStatus('');return}const controller=new AbortController();const timer=setTimeout(async()=>{try{const response=await fetch(`/api/locations?q=${encodeURIComponent(query)}`,{signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error);setResults(body.filter((item:Location)=>item.id!==exclude));setStatus(body.length?'':'No matching locations yet.')}catch(error){if((error as Error).name!=='AbortError')setStatus('Connect Supabase to search the location network.')}},220);return()=>{clearTimeout(timer);controller.abort()}},[query,open,exclude]);return <div className="location-picker" ref={area}><span>{label}</span><div className="find-input"><MapPin/><input value={value?.name??query} onFocus={()=>{setOpen(true);if(value)setQuery(value.name)}} onChange={event=>{onSelect(null);setQuery(event.target.value);setOpen(true)}} placeholder={label==='FROM'?'Select pickup':'Select destination'} aria-label={label==='FROM'?'Pickup location':'Destination location'} autoComplete="off"/>{value&&<button type="button" className="clear-location" aria-label={`Clear ${label.toLowerCase()}`} onClick={()=>{onSelect(null);setQuery('');setOpen(false)}}><X size={15}/></button>}</div>{open&&query&&<div className="location-popover" role="listbox">{results.map(location=><button type="button" role="option" key={location.id} onClick={()=>{onSelect(location);setQuery('');setOpen(false)}}><MapPin size={16}/><span><b>{location.name}</b><small>{location.city}</small></span></button>)}{status&&<p>{status}</p>}</div>}</div>}

export default function FindRide(){
  const [vehicle,setVehicle]=useState('CAR');
  const [message,setMessage]=useState('');
  const [from,setFrom]=useState<Location|null>(null);
  const [to,setTo]=useState<Location|null>(null);
  const [activeChatRideId, setActiveChatRideId] = useState<string|null>(null);

  return (
    <main className="finder-page">
      <section className="shell finder">
        <span className="kicker">RIDE WITH ME</span>
        <h1>Find a ride</h1>
        <p>Choose your pickup and destination. Search across the live Indore, Dewas, and Ujjain location network with privacy-protected communications.</p>
        <form onSubmit={e=>{e.preventDefault();if(!from||!to){setMessage('Please select a pickup and destination from the location list.');return}setMessage('Showing available matches with contact privacy protection.')}} className="find-card">
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
            <h2>Active Commutes</h2>
            <span className="privacy-chip"><ShieldCheck size={14}/> Phone Numbers Protected</span>
          </div>

          <div className="ride-card-item">
            <div className="ride-header">
              <div>
                <h3>Indore ➔ Ujjain</h3>
                <p>Departure: Today, 8:00 AM • ₹80/seat</p>
              </div>
              <span className="driver-verified-tag">✓ Rahul Sharma (4.9 ★)</span>
            </div>
            <div className="ride-actions">
              <button
                className="ride-btn ride-btn-dark"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/dodo/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: 80, rideId: 'mock-ride-1' }),
                    });
                    const data = await res.json();
                    if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank');
                  } catch {
                    alert('Error launching Dodo Payment.');
                  }
                }}
              >
                🦤 Pay ₹80 via Dodo
              </button>
              <button className="ride-btn ride-btn-light" onClick={() => setActiveChatRideId('mock-ride-1')}>
                <MessageSquare size={16}/> In-App Chat
              </button>
              <button className="ride-btn ride-btn-primary" onClick={() => setActiveChatRideId('mock-ride-1')}>
                <Phone size={16}/> Privacy Call
              </button>
            </div>
          </div>
        </div>
      </section>

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

