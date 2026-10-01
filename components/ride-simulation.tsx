'use client';

import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Search,
  CheckCircle2,
  MapPin,
  Car,
  User,
  Star,
  ShieldCheck,
  Clock,
  PhoneCall,
  MessageSquare,
  RotateCcw,
  Play,
  ChevronRight,
} from 'lucide-react';

type Step = 'hero' | 'matching' | 'confirmation' | 'tracking';

export function RideSimulation() {
  const [activeStep, setActiveStep] = useState<Step>('hero');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [carPosition, setCarPosition] = useState<{ x: number; y: number }>({ x: 80, y: 320 });

  // Simulated Map Coordinates
  const startPoint = { x: 80, y: 320, name: 'Current Location (Indore)' };
  const endPoint = { x: 340, y: 80, name: 'Destination (Vijay Nagar)' };

  // Simulated auto-run driver tracking movement
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeStep === 'tracking' || isSimulating) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + 1;
        });
      }, 80);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [activeStep, isSimulating]);

  // Interpolate car coordinates based on progress along a bezier curve
  useEffect(() => {
    const t = progress / 100;
    const p0 = startPoint;
    const p1 = { x: 220, y: 280 };
    const p2 = endPoint;

    const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
    const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;

    setCarPosition({ x, y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const handleStepChange = (step: Step) => {
    setActiveStep(step);
    if (step !== 'tracking') {
      setIsSimulating(false);
      setProgress(0);
    }
  };

  const startFullFlow = () => {
    setActiveStep('hero');
    setIsSimulating(true);
    setProgress(0);
    setTimeout(() => setActiveStep('matching'), 2500);
    setTimeout(() => setActiveStep('confirmation'), 5500);
    setTimeout(() => setActiveStep('tracking'), 8000);
  };

  return (
    <div className="flex flex-col h-screen max-h-[850px] w-full max-w-5xl mx-auto bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 font-sans">

      {/* Header & Navigation */}
      <header className="flex flex-wrap justify-between items-center px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Car className="text-slate-950 stroke-[2.5]" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              Ride With Me
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Live Prototype
              </span>
            </h1>
            <p className="text-xs text-slate-400">Interactive UX Animation Suite</p>
          </div>
        </div>

        {/* Step Selector Controls */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 text-xs font-medium flex-wrap">
          {(['hero', 'matching', 'confirmation', 'tracking'] as Step[]).map((step, i) => {
            const labels = ['1. Hero Route', '2. Match Ride', '3. Confirm', '4. Live Tracking'];
            return (
              <button
                key={step}
                onClick={() => handleStepChange(step)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeStep === step
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[i]}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={startFullFlow}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Play size={14} fill="currentColor" /> Play Full Flow
        </button>
      </header>

      {/* Main Container */}
      <div className="relative flex-1 flex overflow-hidden">

        {/* Animated Simulated Map Canvas */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">

          {/* Map Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

          {/* Map SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 420 400">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Road layers */}
            <path d="M 0 320 Q 220 280 420 80" fill="none" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
            <path d="M 0 320 Q 220 280 420 80" fill="none" stroke="#0f172a" strokeWidth="10" strokeLinecap="round" />
            <path d="M 60 0 L 60 400" fill="none" stroke="#1e293b" strokeWidth="6" strokeDasharray="6 6" />
            <path d="M 340 0 L 340 400" fill="none" stroke="#1e293b" strokeWidth="6" strokeDasharray="6 6" />

            {/* Animated Route Path */}
            <path
              d="M 80 320 Q 220 280 340 80"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glow)"
              style={{ strokeDasharray: '400', strokeDashoffset: '0' }}
            />
          </svg>

          {/* Map Elements */}
          <div className="absolute inset-0 pointer-events-none">

            {/* Start Node */}
            <div className="absolute left-[80px] top-[320px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900" />
              </span>
              <div className="mt-1 bg-slate-900/90 border border-slate-800 text-[10px] font-medium px-2 py-0.5 rounded shadow-lg backdrop-blur-sm whitespace-nowrap">
                Pickup (You)
              </div>
            </div>

            {/* Destination Node */}
            <div className="absolute left-[340px] top-[80px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="p-1.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 animate-bounce">
                <MapPin size={16} className="text-slate-950 stroke-[3]" />
              </div>
              <div className="mt-1 bg-slate-900/90 border border-slate-800 text-[10px] font-medium px-2 py-0.5 rounded shadow-lg backdrop-blur-sm whitespace-nowrap">
                Destination
              </div>
            </div>

            {/* HERO: Route info overlay */}
            {activeStep === 'hero' && (
              <div className="absolute top-6 left-6 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-2xl backdrop-blur-md max-w-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
                  <Navigation size={14} className="animate-spin" /> Route Calculated
                </div>
                <h3 className="font-bold text-sm">Indore Junction → Vijay Nagar</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> 14 min</span>
                  <span>•</span>
                  <span>5.2 km</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Fastest Route</span>
                </div>
              </div>
            )}

            {/* MATCHING: Radar */}
            {activeStep === 'matching' && (
              <div className="absolute left-[80px] top-[320px] -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -inset-16 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-32 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute -inset-48 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: '4s' }} />
                <div className="absolute -top-12 -right-16 bg-slate-900 border border-slate-700 p-1.5 rounded-full shadow-lg animate-pulse">
                  <Car size={16} className="text-emerald-400" />
                </div>
                <div className="absolute top-16 -left-10 bg-slate-900 border border-slate-700 p-1.5 rounded-full shadow-lg animate-pulse">
                  <Car size={16} className="text-emerald-400" />
                </div>
              </div>
            )}

            {/* TRACKING: Moving Vehicle */}
            {(activeStep === 'tracking' || activeStep === 'confirmation') && (
              <div
                className="absolute transition-all duration-100 ease-linear pointer-events-none"
                style={{
                  left: `${carPosition.x}px`,
                  top: `${carPosition.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  <div className="p-2 bg-emerald-500 text-slate-950 rounded-full shadow-lg shadow-emerald-500/50 flex items-center justify-center">
                    <Car size={18} className="stroke-[2.5]" />
                  </div>
                  {activeStep === 'tracking' && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                      {progress < 100
                        ? `${Math.max(1, Math.round((100 - progress) / 10))}m away`
                        : 'Arrived!'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md p-5 flex flex-col justify-between z-10">

          {/* STEP 1: HERO */}
          {activeStep === 'hero' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <h2 className="text-base font-bold mb-1">Set Your Destination</h2>
                <p className="text-xs text-slate-400 mb-4">Choose your pickup &amp; drop-off locations.</p>
                <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <input type="text" value="Indore Railway Station" readOnly className="bg-transparent text-xs text-slate-200 outline-none w-full font-medium" />
                  </div>
                  <div className="h-px bg-slate-800 my-1 ml-6" />
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-sm bg-indigo-500" />
                    <input type="text" value="Vijay Nagar Square" readOnly className="bg-transparent text-xs text-slate-200 outline-none w-full font-medium" />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <span className="text-xs text-indigo-300 font-medium">Estimated Fare</span>
                  <div className="text-xl font-extrabold text-white mt-0.5">₹149.00</div>
                </div>
              </div>
              <button
                onClick={() => setActiveStep('matching')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                Find Nearby Rides <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2: MATCHING */}
          {activeStep === 'matching' && (
            <div className="flex flex-col h-full justify-between items-center text-center py-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center animate-pulse">
                    <Search size={32} className="text-indigo-400" />
                  </div>
                </div>
                <h2 className="text-base font-bold mb-1">Searching for Rides...</h2>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Connecting with verified drivers near your pickup location.
                </p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Contacting drivers</span>
                  <span className="text-indigo-400 font-semibold">3 found</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-2/3 animate-pulse" />
                </div>
                <button
                  onClick={() => setActiveStep('confirmation')}
                  className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
                >
                  Simulate Match Found
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRMATION */}
          {activeStep === 'confirmation' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Ride Confirmed</span>
                </div>
                <h2 className="text-base font-bold mb-4">Driver on the way!</h2>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <User size={20} className="text-slate-300" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 text-slate-950">
                        <ShieldCheck size={10} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">Vikram Singh</h4>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Star size={10} fill="currentColor" /> 4.9 (120+ rides)
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Vehicle</span>
                    <span className="font-semibold text-slate-200">Tata Tigor EV (MP09 AB 1234)</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Estimated Pickup</span>
                    <span className="font-semibold text-emerald-400">3 Mins</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Payment</span>
                    <span className="font-semibold text-slate-200">UPI / Cash</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveStep('tracking')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Start Live Tracking
              </button>
            </div>
          )}

          {/* STEP 4: TRACKING */}
          {activeStep === 'tracking' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE TRACKING
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {progress}%
                  </span>
                </div>
                <h2 className="text-lg font-extrabold mb-1">
                  {progress < 100 ? 'Arriving in 3 mins' : 'Driver Arrived!'}
                </h2>
                <p className="text-xs text-slate-400 mb-4">Driver is heading towards your pickup location.</p>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button className="flex items-center justify-center gap-2 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-medium transition-all">
                    <PhoneCall size={14} className="text-emerald-400" /> Call
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-medium transition-all">
                    <MessageSquare size={14} className="text-indigo-400" /> Message
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setProgress(0); setActiveStep('hero'); }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Reset Flow
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
