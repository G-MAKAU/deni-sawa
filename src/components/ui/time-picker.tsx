'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ANY = '__any__';

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 16; h++) {
  for (const m of ['00', '30']) {
    if (h === 16 && m === '30') continue;
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  return (
    <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? '' : v)}>
      <SelectTrigger
        className={cn(
          'h-10 rounded-md border-input px-3 font-normal shadow-none data-[placeholder]:text-muted-foreground',
          className
        )}
      >
        <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Any time" />
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1rem)]">
        <SelectItem value={ANY}>Any time</SelectItem>
        {TIME_SLOTS.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}