'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function parseISODate(value: string): Date | undefined {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

interface DatePickerProps {
  value?: string;
  onSelect: (iso: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onSelect, placeholder = 'Pick a date', className }: DatePickerProps) {
  const selected = value ? parseISODate(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!value}
          className={cn(
            'h-10 w-full justify-start rounded-md border-input bg-background px-3 text-left text-sm font-normal text-foreground shadow-none hover:bg-accent hover:text-accent-foreground data-[empty=true]:text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value && selected ? format(selected, 'PP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-1rem)] p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onSelect(format(d, 'yyyy-MM-dd'));
            }
          }}
          disabled={{ before: new Date() }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}