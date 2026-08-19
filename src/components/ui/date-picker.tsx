'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';

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
  /** Restrict selection to today and future dates (default true). Set false for filters over historical data. */
  disablePast?: boolean;
  /** Show a clear button inside the field when a value is set. */
  clearable?: boolean;
}

export function DatePicker({
  value,
  onSelect,
  placeholder = 'Pick a date',
  className,
  disablePast = true,
  clearable = false,
}: DatePickerProps) {
  const selected = value ? parseISODate(value) : undefined;
  const showClear = clearable && Boolean(value);

  return (
    <Popover>
      <div className={cn('relative', className)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            data-empty={!value}
            className={cn(
              'h-10 w-full justify-start rounded-md border-input bg-background px-3 text-left text-sm font-normal text-foreground shadow-none hover:bg-accent hover:text-accent-foreground data-[empty=true]:text-muted-foreground',
              showClear && 'pr-9',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {value && selected ? format(selected, 'PP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        {showClear && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect('');
            }}
            aria-label="Clear date"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto max-w-[calc(100vw-1rem)] p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onSelect(format(d, 'yyyy-MM-dd'));
            }
          }}
          disabled={disablePast ? { before: new Date() } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}