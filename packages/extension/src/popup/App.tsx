import { useState, useEffect, useRef, useCallback } from 'react';
import type { BlockedSite } from '../types';

const COOLDOWN_SECONDS = 30;

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-label={checked ? 'Disable block' : 'Enable block'}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${checked ? 'bg-violet-600' : 'bg-zinc-600'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function normalizeHostname(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
}

function formatPauseRemaining(pausedUntil: number): string {
  const diff = Math.max(0, Math.ceil((pausedUntil - Date.now()) / 60000));
  if (diff <= 0) return 'Resuming...';
  return `Paused · ${diff}m left`;
}

export default function App() {
  const [sites, setSites] = useState<BlockedSite[]>([]);
  const [hostname, setHostname] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState('');

  // Cooldown state: which site is counting down
  const [cooldownId, setCooldownId] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Options state: which site is showing pause options
  const [optionsId, setOptionsId] = useState<string | null>(null);

  // Global lock overlay countdown (starts when popup opens)
  const [lockLeft, setLockLeft] = useState(COOLDOWN_SECONDS);

  useEffect(() => {
    chrome.storage.local.get('blockedSites', (result) => {
      setSites(result.blockedSites ?? []);
    });
  }, []);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setInterval(() => setLockLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [lockLeft]);

  // Keep paused time displays updated
  useEffect(() => {
    const hasPaused = sites.some((s) => s.pausedUntil && Date.now() < s.pausedUntil);
    if (!hasPaused) return;
    const interval = setInterval(() => setSites((prev) => [...prev]), 10000);
    return () => clearInterval(interval);
  }, [sites]);

  function saveSites(updated: BlockedSite[]) {
    chrome.storage.local.set({ blockedSites: updated });
    setSites(updated);
  }

  function addSite() {
    const trimmed = normalizeHostname(hostname);
    if (!trimmed) {
      setError('Enter a hostname');
      return;
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmed)) {
      setError('Invalid hostname');
      return;
    }
    if (sites.some((s) => s.hostname === trimmed)) {
      setError('Already in list');
      return;
    }
    const newSite: BlockedSite = {
      id: Date.now().toString(),
      hostname: trimmed,
      startTime,
      endTime,
      enabled: true,
    };
    saveSites([...sites, newSite]);
    setHostname('');
    setError('');
  }

  const clearCooldown = useCallback(() => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = null;
    setCooldownId(null);
    setCooldownLeft(0);
  }, []);

  function handleToggle(site: BlockedSite) {
    const isPaused = site.pausedUntil && Date.now() < site.pausedUntil;

    // Re-enabling (or un-pausing) — instant, no friction
    if (!site.enabled || isPaused) {
      saveSites(
        sites.map((s) =>
          s.id === site.id ? { ...s, enabled: true, pausedUntil: undefined } : s
        )
      );
      clearCooldown();
      setOptionsId(null);
      return;
    }

    // Trying to disable — start 30s cooldown
    if (cooldownId === site.id) return; // already counting down
    clearCooldown();
    setOptionsId(null);
    setCooldownId(site.id);
    setCooldownLeft(COOLDOWN_SECONDS);

    cooldownRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          setCooldownId(null);
          setOptionsId(site.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handlePause(siteId: string, minutes: number) {
    saveSites(
      sites.map((s) =>
        s.id === siteId
          ? { ...s, pausedUntil: Date.now() + minutes * 60 * 1000 }
          : s
      )
    );
    setOptionsId(null);
  }

  function handleCancelOptions() {
    setOptionsId(null);
  }

  function removeSite(id: string) {
    saveSites(sites.filter((s) => s.id !== id));
    if (cooldownId === id) clearCooldown();
    if (optionsId === id) setOptionsId(null);
  }

  return (
    <div className="w-96 bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="text-base font-semibold tracking-tight">⏱ Timeless</span>
        <span className="ml-auto text-xs text-zinc-600">v1.0</span>
      </div>

      {/* Blocked sites list */}
      <div className="relative max-h-72 overflow-y-auto px-4 py-3">
        {/* 30s lock overlay */}
        {lockLeft > 0 && sites.length > 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28" cy="28" r="24"
                  fill="none" stroke="#27272a" strokeWidth="3"
                />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none" stroke="#7c3aed" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (lockLeft / COOLDOWN_SECONDS)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute text-lg font-bold text-violet-400">
                {lockLeft}
              </span>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Take a moment to reconsider</p>
          </div>
        )}
        {sites.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">
            No sites blocked yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sites.map((site) => {
              const isPaused =
                !!site.pausedUntil && Date.now() < site.pausedUntil;
              const isCounting = cooldownId === site.id;
              const isShowingOptions = optionsId === site.id;

              return (
                <li key={site.id} className="rounded-lg bg-zinc-800">
                  <div className="flex items-center gap-3 px-3 py-2">
                    {isCounting ? (
                      // 30s countdown ring
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
                        <div className="relative flex h-7 w-7 items-center justify-center">
                          <svg className="h-7 w-7 -rotate-90" viewBox="0 0 28 28">
                            <circle
                              cx="14"
                              cy="14"
                              r="12"
                              fill="none"
                              stroke="#3f3f46"
                              strokeWidth="2"
                            />
                            <circle
                              cx="14"
                              cy="14"
                              r="12"
                              fill="none"
                              stroke="#7c3aed"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 12}
                              strokeDashoffset={
                                2 * Math.PI * 12 * (1 - cooldownLeft / COOLDOWN_SECONDS)
                              }
                              className="transition-all duration-1000 ease-linear"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-bold text-violet-400">
                            {cooldownLeft}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <ToggleSwitch
                        checked={site.enabled && !isPaused}
                        onChange={() => handleToggle(site)}
                        disabled={isShowingOptions}
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          site.enabled && !isPaused
                            ? 'text-zinc-100'
                            : 'text-zinc-500'
                        }`}
                      >
                        {site.hostname}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {isPaused
                          ? formatPauseRemaining(site.pausedUntil!)
                          : isCounting
                            ? 'Are you sure?'
                            : `${formatTime(site.startTime)} – ${formatTime(site.endTime)}`}
                      </p>
                    </div>

                    {isCounting ? (
                      <button
                        onClick={() => clearCooldown()}
                        className="flex-shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => removeSite(site.id)}
                        aria-label="Remove"
                        className="flex-shrink-0 text-zinc-600 transition-colors hover:text-zinc-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Pause options after cooldown */}
                  {isShowingOptions && (
                    <div className="border-t border-zinc-700 px-3 py-2">
                      <p className="mb-2 text-xs text-zinc-400">
                        Pause blocking for:
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePause(site.id, 15)}
                          className="flex-1 rounded-md bg-zinc-700 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                        >
                          15 min
                        </button>
                        <button
                          onClick={() => handlePause(site.id, 30)}
                          className="flex-1 rounded-md bg-zinc-700 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                        >
                          30 min
                        </button>
                        <button
                          onClick={handleCancelOptions}
                          className="flex-1 rounded-md bg-violet-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                        >
                          Keep on
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add site form */}
      <div className="space-y-2 border-t border-zinc-800 px-4 py-3">
        <div>
          <input
            type="text"
            placeholder="e.g. youtube.com"
            value={hostname}
            onChange={(e) => {
              setHostname(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && addSite()}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-500">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-500">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={addSite}
          className="w-full rounded-md bg-violet-600 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          Block Site
        </button>
      </div>
    </div>
  );
}
