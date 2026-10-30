'use client';

import { useRouter } from 'next/navigation';
import { StaffPicker } from './floor-view';

/** On a tablet without anyone on it: pick yourself and type your PIN, then the floor shows. */
export function TabletStaff({ staff }: { staff: { id: number; name: string }[] }) {
  const router = useRouter();
  return <StaffPicker staff={staff} onDone={() => router.refresh()} />;
}
