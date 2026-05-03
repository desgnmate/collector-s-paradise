import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login',
  description:
    "Log in to your Collector's Paradise account. Access your tickets, profile, and collector dashboard.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
