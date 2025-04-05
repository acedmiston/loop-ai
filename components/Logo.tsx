'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: { container: 'text-sm', infinity: 'text-3xl', translateY: 'translate-y-1' },
    md: { container: 'text-xl', infinity: 'text-5xl', translateY: 'translate-y-2.5' },
    lg: { container: 'text-2xl', infinity: 'text-6xl', translateY: 'translate-y-3.5' },
  };

  return (
    <span className="inline align-text-bottom">
      <span className={`font-bold ${sizeClasses[size].container}`}>
        L
        <span
          className={`inline-block ${sizeClasses[size].infinity} rotate-180 lava-gradient transition-all duration-500 transform ${sizeClasses[size].translateY}`}
          style={{ transformOrigin: 'center' }}
        >
          ∞
        </span>
        P
      </span>
    </span>
  );
}
