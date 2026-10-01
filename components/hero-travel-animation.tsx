'use client';

import React from 'react';

export function HeroTravelAnimation() {
  return (
    <div className="hero-travel-banner flex items-center justify-between bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3 px-4 mb-6 shadow-xs max-w-xl transition-all duration-300 hover:border-emerald-200">
      {/* Origin Pin */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
        </span>
        <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">Indore</span>
      </div>

      {/* Dynamic Animated Route Track & Vehicle */}
      <div className="relative flex-1 mx-4 h-4 flex items-center overflow-hidden">
        {/* Route Line (Path) */}
        <div className="w-full h-0.5 bg-emerald-200/80 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500 opacity-40 animate-pulse"></div>
        </div>

        {/* Traveling Vehicle (Car / Bike) Icon */}
        <div
          className="absolute top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none"
          style={{ animation: 'travelMove 6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        >
          <svg className="w-4 h-4 transform -scale-x-100 drop-shadow-xs" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z" />
            <circle cx="7.5" cy="15.5" r="1.5" />
            <circle cx="16.5" cy="15.5" r="1.5" />
          </svg>
        </div>
      </div>

      {/* Destination Pin */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">Dewas / Ujjain</span>
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
      </div>
    </div>
  );
}
