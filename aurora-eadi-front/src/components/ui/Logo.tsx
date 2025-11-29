'use client'
import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  src: string
}

export function Logo({ className = '', size = 'md', src = '' }: LogoProps) {
  
  const dimensions = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
  };

  const { width, height } = dimensions[size];

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src} 
        alt="Aurora EADI Logo"
        width={width}
        height={height}
        priority 
        className="object-contain h-auto"
      />
    </div>
  );
};