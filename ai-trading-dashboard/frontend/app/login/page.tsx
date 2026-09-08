import Image from 'next/image';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://placehold.co/640x960/161B22/5C6673?text=Login+Visual"
          alt=""
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
        <p className="absolute bottom-12 left-10 right-10 text-lg font-semibold leading-snug text-text-primary">
          &ldquo;Masuk kembali — watchlist dan riset pasar Anda siap dilanjutkan.&rdquo;
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <Link href="/" className="mb-8 text-sm font-bold text-text-primary">
          FinSight
        </Link>
        <AuthCard mode="login" />
      </div>
    </div>
  );
}
