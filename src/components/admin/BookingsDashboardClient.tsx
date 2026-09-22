'use client';

import AdminBookingsCalendar from '@/components/admin/AdminBookingsCalendar';
import { HolidaysManager, BlockedDatesManager } from '@/components/admin/BookingDateManagers';

export function BookingsDashboardClient() {
  return (
    <div className="space-y-8">
      <AdminBookingsCalendar />

      <div className="grid gap-6 lg:grid-cols-2">
        <HolidaysManager />
        <BlockedDatesManager />
      </div>
    </div>
  );
}
