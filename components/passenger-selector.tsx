'use client';

import { Minus, Plus } from 'lucide-react';

interface PassengerSelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  label?: string;
}

export function PassengerSelector({
  value,
  onChange,
  max = 6,
  min = 1,
  label = 'Passenger',
}: PassengerSelectorProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '14px 18px',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
        gap: 12,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#1e293b',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {label}
      </span>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexShrink: 0,
        }}
      >
        {/* Minus Button */}
        <button
          type="button"
          onClick={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
          aria-label="Decrease passenger count"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: canDecrement ? '1.5px solid #1a56db' : '1.5px solid #cbd5e1',
            background: '#ffffff',
            color: canDecrement ? '#1a56db' : '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canDecrement ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            padding: 0,
            outline: 'none',
          }}
          onMouseEnter={e => {
            if (canDecrement) {
              (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
          }}
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>

        {/* Count */}
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: '#0f172a',
            minWidth: 20,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>

        {/* Plus Button */}
        <button
          type="button"
          onClick={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
          aria-label="Increase passenger count"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: canIncrement ? '1.5px solid #1a56db' : '1.5px solid #cbd5e1',
            background: '#ffffff',
            color: canIncrement ? '#1a56db' : '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canIncrement ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            padding: 0,
            outline: 'none',
          }}
          onMouseEnter={e => {
            if (canIncrement) {
              (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
