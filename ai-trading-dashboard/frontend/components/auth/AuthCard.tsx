'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApiError, api, setStoredToken } from '@/lib/api';

interface AuthCardProps {
  mode: 'login' | 'signup';
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Nama wajib diisi.');
        return;
      }
      if (password !== confirm) {
        setError('Konfirmasi password tidak cocok.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await api.register(email.trim(), name.trim(), password);
        const tokenRes = await api.login(email.trim(), password);
        setStoredToken(tokenRes.access_token);
      } else {
        const tokenRes = await api.login(email.trim(), password);
        setStoredToken(tokenRes.access_token);
      }
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Gagal terhubung ke server. Pastikan backend berjalan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-md border border-border bg-panel p-6 shadow-panel">
      <h1 className="text-h1 text-text-primary">
        {mode === 'login' ? 'Welcome back' : 'Create account'}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {mode === 'login'
          ? 'Masuk untuk menyimpan watchlist dan preferensi.'
          : 'Mulai riset pasar dengan akun gratis.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {mode === 'signup' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            autoComplete="name"
            disabled={loading}
            className="w-full rounded border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
          className="w-full rounded border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          disabled={loading}
          className="w-full rounded border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
        />
        {mode === 'signup' && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Konfirmasi password"
            autoComplete="new-password"
            disabled={loading}
            className="w-full rounded border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
          />
        )}
        {error && <p className="text-xs text-negative">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-action-primary py-2.5 text-sm font-semibold text-canvas hover:bg-white/90 disabled:opacity-60"
        >
          {loading ? 'Memproses…' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-text-muted">
        {mode === 'login' ? (
          <>
            Belum punya akun?{' '}
            <Link href="/signup" className="text-positive hover:underline">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            Sudah punya akun?{' '}
            <Link href="/login" className="text-positive hover:underline">
              Log In
            </Link>
          </>
        )}
      </p>
      <p className="mt-3 text-center text-[10px] text-text-muted">
        Token disimpan di localStorage (batasan sementara sebelum httpOnly cookie).
      </p>
    </div>
  );
}
