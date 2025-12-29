'use client';

import { KioskVenueProvider } from '@/contexts/KioskVenueContext';

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KioskVenueProvider>
      {children}
    </KioskVenueProvider>
  );
}

