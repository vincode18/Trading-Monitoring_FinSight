'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { api, type AuthUser } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [defaultMarket, setDefaultMarket] = useState('ID');
  const [defaultChartPeriod, setDefaultChartPeriod] = useState('6mo');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const { data: prefs, mutate: mutatePrefs } = useSWR('settings-prefs', () =>
    api.getPreferences()
  );
  const { data: sub } = useSWR('settings-sub', () => api.getSubscription());

  useEffect(() => {
    api
      .me()
      .then((u) => {
        setUser(u);
        setName(u.name);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (prefs?.defaultMarket) setDefaultMarket(prefs.defaultMarket);
    if (prefs?.defaultChartPeriod) setDefaultChartPeriod(prefs.defaultChartPeriod);
  }, [prefs]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const updated = await api.updateProfile(name);
      setUser(updated);
      setMsg('Profile updated.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to update profile');
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setMsg('Password changed successfully.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to change password');
    }
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.updatePreferences({ defaultMarket, defaultChartPeriod });
      await mutatePrefs();
      setMsg('Preferences saved.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to save preferences');
    }
  }

  async function handleDelete() {
    if (!confirm('Permanently delete account? This action cannot be undone.')) return;
    try {
      await api.deleteAccount();
      router.push('/');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to delete account');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-5">
      <div>
        <h1 className="text-h1 text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Profile, password, preferences, and subscription status.
        </p>
      </div>

      {(msg || err) && (
        <p className={`text-xs ${err ? 'text-negative' : 'text-positive'}`}>{err || msg}</p>
      )}

      <section className="rounded-md border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Profile</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Email
            <input
              value={user?.email ?? ''}
              disabled
              className="rounded border border-border bg-canvas/50 px-2 py-1.5 text-sm text-text-muted"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm text-text-primary"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded bg-positive px-3 py-2 text-xs font-semibold text-canvas"
          >
            Save Profile
          </button>
        </form>
      </section>

      <section className="rounded-md border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Change Password</h2>
        <form onSubmit={savePassword} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Current password
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded border border-border px-3 py-2 text-xs text-text-primary hover:border-positive/40"
          >
            Update Password
          </button>
        </form>
      </section>

      <section className="rounded-md border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Preferences</h2>
        <form onSubmit={savePrefs} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Default market
            <select
              value={defaultMarket}
              onChange={(e) => setDefaultMarket(e.target.value)}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            >
              <option value="ID">Indonesia (JK)</option>
              <option value="US">United States</option>
              <option value="CRYPTO">Crypto</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Default chart period
            <select
              value={defaultChartPeriod}
              onChange={(e) => setDefaultChartPeriod(e.target.value)}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            >
              <option value="5d">5D</option>
              <option value="1mo">1M</option>
              <option value="3mo">3M</option>
              <option value="6mo">6M</option>
              <option value="1y">1Y</option>
            </select>
          </label>
          <button
            type="submit"
            className="w-fit rounded border border-border px-3 py-2 text-xs text-text-primary hover:border-positive/40"
          >
            Save Preferences
          </button>
        </form>
      </section>

      <section className="rounded-md border border-border bg-panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Subscription</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-text-muted">Tier</dt>
          <dd className="font-mono text-text-primary">{sub?.tier ?? '—'}</dd>
          <dt className="text-text-muted">Status</dt>
          <dd className="font-mono text-text-primary">{sub?.status ?? '—'}</dd>
        </dl>
        <p className="mt-2 text-xs text-text-muted">
          Billing &amp; upgrades are managed separately — this page is read-only.
        </p>
      </section>

      <section className="rounded-md border border-negative/40 bg-panel p-4">
        <h2 className="mb-2 text-sm font-semibold text-negative">Danger Zone</h2>
        <p className="mb-3 text-xs text-text-muted">
          Deleting your account permanently removes your watchlist, alerts, and portfolio.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-negative px-3 py-2 text-xs font-semibold text-negative hover:bg-negative/10"
        >
          Delete Account
        </button>
      </section>
    </div>
  );
}
