'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Search,
  PlusCircle,
  Clock,
  ShieldCheck,
  Phone,
  MessageSquare,
  ChevronRight,
  Car,
  Bell,
  ArrowRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronLeft,
  Share2,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Info,
  DollarSign
} from 'lucide-react';
import { LocationPoint, calculateRoadRoute, calculateFare, POPULAR_LOCATIONS, searchLocations, getCurrentGPSLocation } from '@/lib/location-service';
import { LocationMap } from '@/components/location-map';

export default function MobileDemoPage() {
  // Navigation tabs: 'dashboard' | 'route' | 'trip'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'route' | 'trip'>('dashboard');
  
  // App simulated or real data
  const [rides, setRides] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [travelDate, setTravelDate] = useState('2026-10-18');
  const [passengers, setPassengers] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'CAR' | 'BIKE'>('ALL');

  // Screen B (Live Route & Estimation state)
  const [pickupPoint, setPickupPoint] = useState<LocationPoint | null>(POPULAR_LOCATIONS[0]); // Vijay Nagar
  const [dropPoint, setDropPoint] = useState<LocationPoint | null>(POPULAR_LOCATIONS[9]); // Ujjain Mahakal Lok
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeVehicle, setRouteVehicle] = useState<'BIKE' | 'CAR'>('CAR');
  const [routeSeats, setRouteSeats] = useState(1);
  const [fareCalculation, setFareCalculation] = useState<any>(null);

  // Screen C (Booking / Trip Management state)
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slideConfirmed, setSlideConfirmed] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Load real backend data from existing endpoints with seamless fallback
  useEffect(() => {
    async function loadData() {
      setLoadingRides(true);
      try {
        const res = await fetch('/api/rides/search');
        if (res.ok) {
          const data = await res.json();
          if (data.rides && data.rides.length > 0) {
            setRides(data.rides);
          } else {
            // Seed initial realistic rides for interactive demo if database table is currently empty
            setRides([
              {
                id: 'demo_ride_1',
                origin: 'Vijay Nagar Square, Indore',
                destination: 'Mahakaleshwar Jyotirlinga, Ujjain',
                departure_time: 'Tomorrow, 08:30 AM',
                vehicle: 'Car',
                available_seats: 3,
                price_per_seat: 120,
                driver_name: 'Rahul Sharma',
                driver_rating: 4.9,
                driver_phone: '+91 98260 12345',
                is_verified: true,
                postedAt: new Date(Date.now() - 3600000).toISOString(),
              },
              {
                id: 'demo_ride_2',
                origin: 'Palasia Square, Indore',
                destination: 'Dewas Bus Stand, Dewas',
                departure_time: 'Tomorrow, 09:15 AM',
                vehicle: 'Bike',
                available_seats: 1,
                price_per_seat: 85,
                driver_name: 'Amit Verma',
                driver_rating: 4.8,
                driver_phone: '+91 98261 54321',
                is_verified: true,
                postedAt: new Date(Date.now() - 7200000).toISOString(),
              },
              {
                id: 'demo_ride_3',
                origin: 'Sayaji Gate, Dewas',
                destination: 'Freeganj Tower, Ujjain',
                departure_time: 'Today, 06:00 PM',
                vehicle: 'Car',
                available_seats: 2,
                price_per_seat: 95,
                driver_name: 'Pooja Chouhan',
                driver_rating: 5.0,
                driver_phone: '+91 94250 98765',
                is_verified: true,
                postedAt: new Date(Date.now() - 10800000).toISOString(),
              }
            ]);
          }
        }
      } catch (e) {
        console.error('Error fetching demo rides:', e);
      } finally {
        setLoadingRides(false);
      }
    }
    loadData();
  }, []);

  // Compute live road route whenever pickup, drop or vehicle changes
  useEffect(() => {
    if (!pickupPoint || !dropPoint) return;

    let isMounted = true;
    async function calc() {
      setRouteLoading(true);
      try {
        const info = await calculateRoadRoute(pickupPoint!, dropPoint!);
        if (isMounted) {
          setRouteInfo(info);
          const fare = calculateFare(info.distanceKm, routeVehicle, routeSeats);
          setFareCalculation(fare);
        }
      } catch (err) {
        console.error('Route calculation error:', err);
      } finally {
        if (isMounted) setRouteLoading(false);
      }
    }
    calc();

    return () => { isMounted = false; };
  }, [pickupPoint, dropPoint, routeVehicle, routeSeats]);

  // Set active sample booking for Screen C if empty
  useEffect(() => {
    if (!selectedBooking && rides.length > 0) {
      const activeRide = rides[0];
      setSelectedBooking({
        id: 'BK-9475',
        orderNumber: '#9475',
        trackingNumber: '#36123217',
        origin: activeRide.origin || 'Vijay Nagar, Indore',
        destination: activeRide.destination || 'Mahakal Lok, Ujjain',
        departureTime: activeRide.departure_time || 'Tomorrow, 08:30 AM',
        passengerName: 'Diane Lara',
        passengerPhone: '+91 98765 43210',
        driverName: activeRide.driver_name || 'Rahul Sharma',
        driverPhone: activeRide.driver_phone || '+91 98260 12345',
        vehicle: activeRide.vehicle || 'Car',
        seats: 2,
        fareAmount: activeRide.price_per_seat ? activeRide.price_per_seat * 2 : 240,
        status: 'CONFIRMED',
        paymentStatus: 'Cash to Driver at Pickup',
        tripOtp: '482910',
        distance: '54.2 km',
        duration: '58 min'
      });
    }
  }, [rides, selectedBooking]);

  // Handle slide to confirm booking
  const handleConfirmAction = () => {
    setSlideConfirmed(true);
    setSlideProgress(100);
    if (selectedBooking) {
      setSelectedBooking((prev: any) => ({
        ...prev,
        status: 'PICKUP_READY',
      }));
    }
  };

  // OTP Verification handler
  const handleVerifyOtp = () => {
    if (!otpInput) {
      setOtpMessage({ type: 'error', text: 'Please enter the 6-digit Boarding PIN.' });
      return;
    }
    setOtpVerifying(true);
    setTimeout(() => {
      setOtpVerifying(false);
      if (otpInput.trim() === selectedBooking?.tripOtp || otpInput.trim() === '482910') {
        setOtpMessage({ type: 'success', text: 'Boarding PIN verified! Trip started safely.' });
        setSelectedBooking((prev: any) => ({ ...prev, status: 'IN_TRANSIT' }));
      } else {
        setOtpMessage({ type: 'error', text: 'Invalid PIN. Please check passenger confirmation.' });
      }
    }, 700);
  };

  const handleCancelBooking = () => {
    setCancelModalOpen(false);
    setSelectedBooking((prev: any) => ({
      ...prev,
      status: 'CANCELLED'
    }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Quick switch between demo screens
  const triggerSelectRideForRoute = (ride: any) => {
    // Locate points if available
    const originPreset = POPULAR_LOCATIONS.find(p => ride.origin.toLowerCase().includes(p.city.toLowerCase()) || ride.origin.toLowerCase().includes(p.placeName.toLowerCase())) || POPULAR_LOCATIONS[0];
    const destPreset = POPULAR_LOCATIONS.find(p => ride.destination.toLowerCase().includes(p.city.toLowerCase()) || ride.destination.toLowerCase().includes(p.placeName.toLowerCase())) || POPULAR_LOCATIONS[9];
    
    setPickupPoint(originPreset);
    setDropPoint(destPreset);
    setRouteVehicle(ride.vehicle === 'Bike' ? 'BIKE' : 'CAR');
    setActiveTab('route');
  };

  const triggerBookThisRide = (ride: any) => {
    setSelectedBooking({
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      trackingNumber: `#3612${Math.floor(1000 + Math.random() * 9000)}`,
      origin: ride.origin,
      destination: ride.destination,
      departureTime: ride.departure_time,
      passengerName: 'Diane Lara',
      passengerPhone: '+91 98765 43210',
      driverName: ride.driver_name,
      driverPhone: ride.driver_phone || '+91 98260 12345',
      vehicle: ride.vehicle,
      seats: routeSeats || 1,
      fareAmount: (ride.price_per_seat || 100) * (routeSeats || 1),
      status: 'CONFIRMED',
      paymentStatus: 'Cash to Driver',
      tripOtp: `${Math.floor(100000 + Math.random() * 900000)}`,
      distance: routeInfo?.formattedDistance || '48.5 km',
      duration: routeInfo?.formattedDuration || '52 min'
    });
    setSlideConfirmed(false);
    setSlideProgress(0);
    setActiveTab('trip');
  };

  return (
    <div className="min-h-screen bg-[#eef1ed] text-slate-800 font-sans antialiased selection:bg-[#7ced7c] selection:text-black pb-16">
      
      {/* Top Demo Header Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-xs font-black tracking-wider uppercase text-emerald-800 flex items-center gap-1.5">
                <span>RIDE WITH ME</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">PREVIEW DEMO</span>
              </div>
              <p className="text-[11px] text-slate-500 m-0">Approval-gated mobile redesign demo (Isolated environment)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher buttons */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Screen A: Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('route')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'route'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Screen B: Live Route
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('trip')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'trip'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Screen C: Trip Details
              </button>
            </div>

            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
            >
              Exit to Live Site
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container - Renders the three phones either side-by-side or responsive tab switcher */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        
        {/* Descriptive Banner */}
        <div className="mb-6 p-4 bg-white/70 backdrop-blur rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>Mobile-First Redesign Inspiration Preview</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">Three-Phone Layout</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Adapted from your delivery tracking UI reference: features soft green gradient badges, rounded cards, black primary buttons, interactive map controls, and full carpool functionality.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-medium">
              🔒 Live production remains untouched
            </span>
          </div>
        </div>

        {/* 3-PHONE SHOWCASE (On large screens, shows all 3 devices side-by-side; on mobile/tablet shows active tab device) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start justify-center">

          {/* =========================================================================
              SCREEN A — RIDE DASHBOARD (Left Device)
             ========================================================================= */}
          <div className={`transition-all duration-300 ${activeTab !== 'dashboard' ? 'hidden lg:block' : 'block'}`}>
            <div className="text-center mb-2 font-bold text-xs uppercase tracking-wider text-slate-500">
              Screen A • Ride Dashboard
            </div>
            
            {/* Phone Frame */}
            <div className="mx-auto w-[360px] max-w-full bg-white rounded-[44px] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col relative min-h-[720px]">
              
              {/* Dynamic Island / Speaker cutout */}
              <div className="pt-3 pb-2 px-6 flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>9:41</span>
                <div className="w-24 h-5 bg-black rounded-full" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-slate-800 rounded-sm p-0.5"><div className="w-full h-full bg-slate-800" /></div>
                </div>
              </div>

              {/* Header: User Profile & Notification */}
              <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-sm overflow-hidden">
                    DL
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">Diane Lara</h2>
                    <span className="text-[11px] text-slate-500">Indore • Verified Commuter</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 relative hover:bg-slate-100 transition"
                  onClick={() => alert('Notifications: Your booking for Indore to Ujjain is confirmed.')}
                >
                  <Bell size={16} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                </button>
              </div>

              {/* Search Bar - Style matching reference: "Track your shipment" -> "Where are you commuting?" */}
              <div className="px-5 mb-4">
                <div className="flex items-center gap-2 bg-[#f8faf9] border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search destination or route..."
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    className="w-full text-xs bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPickupPoint(POPULAR_LOCATIONS[0]);
                      setDropPoint(POPULAR_LOCATIONS[9]);
                      setActiveTab('route');
                    }}
                    className="w-7 h-7 rounded-xl bg-[#cbf382] hover:bg-[#bce672] flex items-center justify-center text-slate-900 shrink-0 transition"
                  >
                    <Sliders size={14} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="px-5 overflow-y-auto flex-1 space-y-4 pb-20 max-h-[540px]">
                
                {/* Nearest / Upcoming Commute Card (Soft green gradient styling from reference) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Active commute</span>
                    <span className="text-[11px] text-emerald-700 font-semibold cursor-pointer">Live Status</span>
                  </div>

                  <div className="bg-gradient-to-br from-[#d4f6a5] via-[#a8ee68] to-[#92e864] p-4 rounded-3xl text-slate-900 shadow-sm border border-[#a2e760]/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-900/80 block">
                          Ride reference
                        </span>
                        <span className="text-xs font-black tracking-tight text-slate-900">#36123217</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-black text-white rounded-full tracking-wider">
                        Confirmed
                      </span>
                    </div>

                    {/* Progress bar line matching reference */}
                    <div className="w-full bg-black/15 h-1.5 rounded-full my-3 overflow-hidden">
                      <div className="bg-black w-2/3 h-full rounded-full" />
                    </div>

                    <div className="flex justify-between items-end text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-emerald-950/70 block">From</span>
                        <strong className="font-extrabold text-slate-900">Vijay Nagar</strong>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-emerald-950/70 block">To</span>
                        <strong className="font-extrabold text-slate-900">Mahakal Lok</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-950/70 block">Departure</span>
                        <strong className="font-extrabold text-slate-900">Tomorrow</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('trip')}
                      className="mt-3 w-full py-2 bg-black/90 hover:bg-black text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <span>View Pass & Boarding PIN</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Services Section - 3 Rounded Cards matching Reference Icons */}
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-2">Quick Services</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('route');
                      }}
                      className="bg-[#f8faf9] hover:bg-[#eef4f0] p-3 rounded-2xl border border-slate-200/80 text-left transition flex flex-col justify-between h-20"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                        <Compass size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">Find Ride</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = '/offer';
                      }}
                      className="bg-[#f8faf9] hover:bg-[#eef4f0] p-3 rounded-2xl border border-slate-200/80 text-left transition flex flex-col justify-between h-20"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                        <PlusCircle size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">Offer Ride</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRouteVehicle(routeVehicle === 'CAR' ? 'BIKE' : 'CAR');
                        setActiveTab('route');
                      }}
                      className="bg-[#f8faf9] hover:bg-[#eef4f0] p-3 rounded-2xl border border-slate-200/80 text-left transition flex flex-col justify-between h-20"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                        <DollarSign size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">Fare Calc</span>
                    </button>
                  </div>
                </div>

                {/* Available Live Commutes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Available Commutes</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{rides.length} rides found</span>
                  </div>

                  <div className="space-y-2.5">
                    {rides.slice(0, 3).map((ride, idx) => (
                      <div
                        key={ride.id || idx}
                        className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-400 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                              {ride.vehicle === 'Bike' ? '🏍️ Bike Commute' : '🚗 Carpool'}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-900 mt-0.5">
                              {ride.origin?.split(',')[0]} ➔ {ride.destination?.split(',')[0]}
                            </h4>
                          </div>
                          <span className="text-xs font-black text-emerald-700">
                            ₹{ride.price_per_seat || 80}/seat
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {ride.departure_time?.split(',')[0] || 'Today'}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Users size={12} className="text-slate-400" />
                            {ride.available_seats || 1} seat left
                          </span>
                        </div>

                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => triggerSelectRideForRoute(ride)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-xl transition text-center"
                          >
                            View Route Map
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerBookThisRide(ride)}
                            className="flex-1 py-1.5 bg-black hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition text-center"
                          >
                            Book Seat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Floating Bottom Navigation Bar (Matched to Left Phone Reference) */}
              <div className="absolute bottom-4 left-5 right-5 bg-black text-white px-5 py-3 rounded-3xl flex justify-between items-center shadow-xl z-20">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center justify-center text-[#cbf382]"
                >
                  <Compass size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('route')}
                  className="flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <MapPin size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('trip')}
                  className="flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <Car size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => alert('Settings: Verified phone, emergency contacts and commute history.')}
                  className="flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <Sliders size={18} />
                </button>
              </div>

            </div>
          </div>


          {/* =========================================================================
              SCREEN B — LIVE ROUTE & TRIP MAP (Middle Device)
             ========================================================================= */}
          <div className={`transition-all duration-300 ${activeTab !== 'route' ? 'hidden lg:block' : 'block'}`}>
            <div className="text-center mb-2 font-bold text-xs uppercase tracking-wider text-slate-500">
              Screen B • Live Route & Map
            </div>

            {/* Phone Frame */}
            <div className="mx-auto w-[360px] max-w-full bg-[#f8faf9] rounded-[44px] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col relative min-h-[720px]">
              
              {/* Dynamic Island */}
              <div className="pt-3 pb-2 px-6 flex justify-between items-center text-xs font-semibold text-slate-800 z-30">
                <span>9:41</span>
                <div className="w-24 h-5 bg-black rounded-full" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-slate-800 rounded-sm p-0.5"><div className="w-full h-full bg-slate-800" /></div>
                </div>
              </div>

              {/* Floating Navigation Pill (Top Left - matching reference "0.3 mi Turn right") */}
              <div className="absolute top-12 left-5 z-20">
                <div className="bg-[#48d248] text-white px-3 py-2 rounded-2xl shadow-lg flex items-center gap-2">
                  <Navigation size={18} className="rotate-45" />
                  <div>
                    <strong className="text-xs font-extrabold block leading-tight">
                      {routeInfo?.formattedDistance || '49.1 km'}
                    </strong>
                    <span className="text-[10px] font-medium opacity-90">
                      {routeInfo?.formattedDuration || '51 min'} via Highway
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Pause / Recenter Control (Top Right) */}
              <div className="absolute top-12 right-5 z-20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const gps = await getCurrentGPSLocation();
                    if (gps.location) setPickupPoint(gps.location);
                  }}
                  className="bg-white/95 backdrop-blur text-slate-800 px-3 py-2 rounded-2xl shadow-md text-xs font-bold border border-slate-200/80 hover:bg-white transition flex items-center gap-1.5"
                >
                  <MapPin size={13} className="text-emerald-600" />
                  <span>My GPS</span>
                </button>
              </div>

              {/* Full Interactive Route Map Component */}
              <div className="flex-1 w-full h-[380px] relative">
                <LocationMap
                  pickup={pickupPoint}
                  drop={dropPoint}
                  polylineCoords={routeInfo?.polylineCoords || []}
                  interactiveMode="view"
                  height="100%"
                />

                {/* Floating Map Zoom controls (+ / -) */}
                <div className="absolute right-4 bottom-28 z-20 bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-md p-1 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.L && document.querySelector('.leaflet-control-zoom-in')) {
                        (document.querySelector('.leaflet-control-zoom-in') as HTMLElement)?.click();
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center font-bold text-slate-800 text-sm hover:bg-slate-100 rounded-lg"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.L && document.querySelector('.leaflet-control-zoom-out')) {
                        (document.querySelector('.leaflet-control-zoom-out') as HTMLElement)?.click();
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center font-bold text-slate-800 text-sm hover:bg-slate-100 rounded-lg"
                  >
                    -
                  </button>
                </div>
              </div>

              {/* Floating Bottom Card: Distance, ETA, Route Selection & Actions */}
              <div className="bg-white p-5 rounded-t-[32px] shadow-2xl border-t border-slate-200 relative z-20 space-y-3">
                
                {/* Distance & Progress indicator matching reference (0.96 mi ----> 9:43) */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>{routeInfo?.formattedDistance || '49.1 km'}</span>
                  <div className="flex-1 mx-3 flex items-center relative">
                    <div className="w-full h-1 bg-[#48d248] rounded-full" />
                    <div className="w-2.5 h-2.5 bg-black rounded-full absolute right-0" />
                  </div>
                  <span>{routeInfo?.formattedDuration || '51 min'}</span>
                </div>

                {/* Selected Locations Preview */}
                <div className="bg-[#f8faf9] p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">
                      {pickupPoint?.placeName || 'Pickup Location'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">
                      {dropPoint?.placeName || 'Destination'}
                    </span>
                  </div>
                </div>

                {/* Vehicle Mode & Seat Options */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRouteVehicle('BIKE')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                        routeVehicle === 'BIKE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      🏍️ Bike (₹2.5/km)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouteVehicle('CAR')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                        routeVehicle === 'CAR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      🚗 Car (₹4.5/km)
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-semibold">Exact Fare</span>
                    <strong className="text-sm font-black text-emerald-700">
                      ₹{fareCalculation?.fareAmount || 123}
                    </strong>
                  </div>
                </div>

                {/* Primary Action Button Bar matching reference (Report Issue / Confirm) */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (routeInfo) {
                        triggerBookThisRide({
                          origin: pickupPoint?.placeName,
                          destination: dropPoint?.placeName,
                          departure_time: 'Today, 04:30 PM',
                          driver_name: 'Rahul Sharma',
                          driver_phone: '+91 98260 12345',
                          vehicle: routeVehicle === 'BIKE' ? 'Bike' : 'Car',
                          price_per_seat: fareCalculation?.perSeatFare || 123,
                        });
                      }
                    }}
                    className="flex-1 py-3 bg-black hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Trip Booking</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('Route report: Indore-Dewas-Ujjain corridor currently clear.')}
                    className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl flex items-center justify-center transition shrink-0"
                    title="Traffic / Route Info"
                  >
                    <Info size={16} />
                  </button>
                </div>

              </div>

            </div>
          </div>


          {/* =========================================================================
              SCREEN C — BOOKING & TRIP MANAGEMENT (Right Device)
             ========================================================================= */}
          <div className={`transition-all duration-300 ${activeTab !== 'trip' ? 'hidden lg:block' : 'block'}`}>
            <div className="text-center mb-2 font-bold text-xs uppercase tracking-wider text-slate-500">
              Screen C • Trip Details & Management
            </div>

            {/* Phone Frame */}
            <div className="mx-auto w-[360px] max-w-full bg-white rounded-[44px] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col relative min-h-[720px]">
              
              {/* Dynamic Island */}
              <div className="pt-3 pb-2 px-6 flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>9:41</span>
                <div className="w-24 h-5 bg-black rounded-full" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-slate-800 rounded-sm p-0.5"><div className="w-full h-full bg-slate-800" /></div>
                </div>
              </div>

              {/* Header with Back button and progress */}
              <div className="px-5 py-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>{selectedBooking?.distance || '49.1 km'}</span>
                  <div className="w-16 h-1 bg-[#48d248] rounded-full relative">
                    <div className="w-2 h-2 bg-black rounded-full absolute right-0 -top-0.5" />
                  </div>
                  <span>{selectedBooking?.duration || '51 min'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(selectedBooking?.id || 'BK-9475')}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                  title="Share / Copy"
                >
                  <Share2 size={14} />
                </button>
              </div>

              {/* Scrollable Trip Details Card */}
              <div className="px-5 overflow-y-auto flex-1 space-y-3.5 pb-6 max-h-[620px]">
                
                {/* Order ID & Status Banner */}
                <div className="flex justify-between items-center pt-1">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Booking {selectedBooking?.orderNumber || '#9475'}
                  </h3>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    selectedBooking?.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedBooking?.status === 'VERIFIED' || selectedBooking?.status === 'IN_TRANSIT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-black text-white'
                  }`}>
                    {selectedBooking?.status || 'CONFIRMED'}
                  </span>
                </div>

                {/* Soft Green Card: Boarding PIN & Tracking Number (From Reference) */}
                <div className="bg-gradient-to-r from-[#d9f7ad] to-[#a0ea62] p-4 rounded-3xl border border-[#91e750]/40 shadow-sm relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-950/70 block">
                        Boarding PIN (Show Driver)
                      </span>
                      <strong className="text-xl font-black text-slate-900 tracking-wider">
                        {selectedBooking?.tripOtp || '482910'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(selectedBooking?.tripOtp || '482910')}
                      className="w-9 h-9 rounded-2xl bg-white/80 hover:bg-white flex items-center justify-center text-slate-900 shadow-sm transition"
                      title="Copy Boarding PIN"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {copiedOtp && (
                    <span className="text-[10px] text-emerald-900 font-bold mt-1 block">
                      ✓ Boarding PIN copied to clipboard!
                    </span>
                  )}
                </div>

                {/* Detailed Information Rows matching reference:
                    Delivery address -> Route
                    Recipient -> Passenger
                    Recipient phone -> Phone
                    Delivery time -> Departure
                    Delivery notes -> Safety Notes
                    Payment method -> Payment
                */}
                <div className="space-y-2.5 text-xs pt-1">
                  <div className="flex justify-between items-start py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Pickup & Drop</span>
                    <div className="text-right font-bold text-slate-900 max-w-[200px]">
                      <div>{selectedBooking?.origin?.split(',')[0]}</div>
                      <div className="text-slate-400 font-normal">to {selectedBooking?.destination?.split(',')[0]}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Driver</span>
                    <strong className="font-bold text-slate-900 flex items-center gap-1">
                      <span>{selectedBooking?.driverName || 'Rahul Sharma'}</span>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Vehicle Type</span>
                    <strong className="font-bold text-slate-900">{selectedBooking?.vehicle || 'Car'}</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Departure</span>
                    <strong className="font-bold text-slate-900">{selectedBooking?.departureTime}</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Passenger Count</span>
                    <strong className="font-bold text-slate-900">{selectedBooking?.seats || 1} Seat</strong>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Payment status</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ₹{selectedBooking?.fareAmount} • Cash at Pickup
                    </span>
                  </div>
                </div>

                {/* OTP Verification Box for Driver testing */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Simulate Driver Boarding Verification
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit PIN"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-center tracking-widest font-bold"
                    />
                    <button
                      type="button"
                      disabled={otpVerifying}
                      onClick={handleVerifyOtp}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                    >
                      {otpVerifying ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                  {otpMessage && (
                    <p className={`text-[10px] font-semibold mt-1.5 ${otpMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {otpMessage.text}
                    </p>
                  )}
                </div>

                {/* Slide to Confirm Action (Matching green slider on right phone) */}
                <div className="pt-2">
                  {!slideConfirmed && selectedBooking?.status !== 'CANCELLED' ? (
                    <div className="relative w-full h-12 bg-gradient-to-r from-[#d9f7ad] to-[#a0ea62] rounded-2xl p-1 flex items-center shadow-inner cursor-pointer select-none">
                      <div
                        onClick={handleConfirmAction}
                        className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-emerald-800 font-bold transition-all hover:scale-105 active:scale-95"
                      >
                        <ChevronRight size={20} />
                      </div>
                      <span className="w-full text-center text-xs font-black text-slate-900 pointer-events-none pr-8">
                        Slide or Tap to Confirm Ride
                      </span>
                    </div>
                  ) : selectedBooking?.status === 'CANCELLED' ? (
                    <div className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl text-center">
                      This ride booking has been cancelled
                    </div>
                  ) : (
                    <div className="w-full py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-1.5 shadow-md">
                      <CheckCircle2 size={16} />
                      <span>Booking Confirmed & Ready for Pickup</span>
                    </div>
                  )}
                </div>

                {/* Support and Communication Actions matching bottom of reference */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => alert(`Connecting securely to verified driver: ${selectedBooking?.driverPhone}`)}
                    className="flex-1 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Contact Driver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('In-App Commute Chat is ready. End-to-end phone numbers remain protected.')}
                    className="w-11 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                    title="In-App Chat"
                  >
                    <MessageSquare size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="w-11 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                    title="Cancel Booking"
                  >
                    <XCircle size={16} />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Cancellation confirmation modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 text-center">Cancel this Booking?</h4>
            <p className="text-xs text-slate-600 text-center mt-1.5 mb-4">
              Your reserved seats will be instantly returned to the available seats pool.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
