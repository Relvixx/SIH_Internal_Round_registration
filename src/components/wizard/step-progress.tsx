import { Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Step {
  id: string;
  title: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStepIndex: number;
}

export function StepProgress({ steps, currentStepIndex }: StepProgressProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-[var(--color-border-subtle)] -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--color-primary)] -z-10 transition-all duration-300 rounded-full"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                  isCompleted ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" :
                  isCurrent ? "bg-white border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm" :
                  "bg-white border-[var(--color-border-subtle)] text-[var(--color-ink-tertiary)]"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : (index + 1)}
              </div>
              <span 
                className={cn(
                  "text-xs hidden md:block absolute top-10 whitespace-nowrap font-medium transition-colors duration-300",
                  isCurrent ? "text-[var(--color-ink)]" : "text-[var(--color-ink-tertiary)]"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
