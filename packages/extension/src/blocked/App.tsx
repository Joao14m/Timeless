import { useState, useEffect } from 'react';

function getSecondsUntil(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function BlockedApp() {
  const params = new URLSearchParams(window.location.search);
  const site = params.get('site') ?? 'this site';
  const until = params.get('until') ?? '00:00';

  const [seconds, setSeconds] = useState(() => getSecondsUntil(until));

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(getSecondsUntil(until));
    }, 1000);
    return () => clearInterval(interval);
  }, [until]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-3xl">
          ⏱
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            {site} is blocked
          </h1>
          <p className="mt-2 text-zinc-400">
            Available after{' '}
            <span className="font-semibold text-violet-400">
              {formatTime(until)}
            </span>
          </p>
        </div>

        {/* Countdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-6">
          <p className="mb-3 text-xs uppercase tracking-widest text-zinc-600">
            Time remaining
          </p>
          <p className="font-mono text-5xl font-bold tracking-wider text-zinc-100">
            {formatCountdown(seconds)}
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-700">Timeless · Stay focused</p>
      </div>
    </div>
  );
}
