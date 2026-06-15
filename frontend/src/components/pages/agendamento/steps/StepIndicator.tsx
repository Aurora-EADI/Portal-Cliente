'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: { number: number; title: string; subtitle: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-6 px-4 md:px-8 bg-zinc-50 border-b border-zinc-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-sky-600 -translate-y-1/2 z-0 transition-all duration-300 ease-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <div key={step.number} className="flex flex-col items-center z-10 relative">
              <button
                disabled={step.number > currentStep}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 shadow-sm
                  ${isCompleted ? 'bg-emerald-600 text-white border-2 border-emerald-600'
                    : isActive ? 'bg-sky-600 text-white border-2 border-sky-600 scale-110 ring-4 ring-sky-100'
                    : 'bg-white text-zinc-400 border-2 border-zinc-200'}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <span>{step.number}</span>}
              </button>
              <div className="absolute top-12 flex flex-col items-center text-center w-28 md:w-36 pointer-events-none">
                <span className={`text-xs font-semibold mt-1 tracking-tight transition-colors duration-200 ${isActive ? 'text-zinc-900 font-bold' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>
                  {step.title}
                </span>
                <span className={`text-[10px] hidden md:block transition-colors duration-200 ${isActive ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {step.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-6" />
    </div>
  );
}
