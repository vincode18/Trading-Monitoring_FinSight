'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApiError, api } from '@/lib/api';

interface AuthCardProps {
  mode: 'login' | 'signup';
}

const inputClass =
  'w-full rounded-md border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted disabled:opacity-60';

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const minPassword = mode === 'signup' ? 8 : 6;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Invalid email format.');
      return;
    }
    if (password.length < minPassword) {
      setError(`Password must be at least ${minPassword} characters.`);
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Name is required.');
        return;
      }
      if (password !== confirm) {
        setError('Password confirmation does not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await api.register(email.trim(), name.trim(), password);
      } else {
        await api.login(email.trim(), password);
      }
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Failed to connect to the server. Make sure the backend is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-h1 text-text-primary">
        {mode === 'login' ? 'Welcome Back' : 'Create New Account'}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {mode === 'login'
          ? 'Sign in to continue monitoring your markets.'
          : 'Start market research with a free account.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {mode === 'signup' && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            disabled={loading}
            className={inputClass}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
          className={inputClass}
        />
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            disabled={loading}
            className={inputClass}
          />
          {mode === 'signup' && (
            <p className="mt-1.5 text-[10px] text-text-muted">At least 8 characters</p>
          )}
        </div>
        {mode === 'signup' && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={loading}
            className={inputClass}
          />
        )}
        {error && <p className="text-xs text-negative">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-action-primary py-2.5 text-sm font-semibold text-canvas hover:bg-white/90 disabled:opacity-60"
        >
          {loading ? 'Processing…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-text-muted">
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <Link href="/signup" className="text-positive hover:underline">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-positive hover:underline">
              Sign In
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
