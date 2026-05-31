import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Admin Login',
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
