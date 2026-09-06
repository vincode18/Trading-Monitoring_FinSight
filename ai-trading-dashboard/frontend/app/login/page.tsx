import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <Link href="/" className="mb-6 text-sm font-bold text-text-primary">
        Trading Monitor
      </Link>
      <AuthCard mode="login" />
    </div>
  );
}
