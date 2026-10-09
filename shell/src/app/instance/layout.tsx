import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { APP } from '@/generated/app';

export const metadata: Metadata = {
  title: { default: APP.name, template: `%s · ${APP.name}` },
};

export default function InstanceLayout({ children }: { children: ReactNode }) {
  return children;
}
