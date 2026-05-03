import type { Metadata } from 'next';
import SignUpClient from './SignUpClient';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    "Create your Collector's Paradise account. Join the community, buy tickets, and start your collecting journey.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return <SignUpClient />;
}
