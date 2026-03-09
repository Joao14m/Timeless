import { useState, useEffect } from 'react';
import type { BlockedSite } from '../types';

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-label={checked ? 'Disable block' : 'Enable block'}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-violet-600' : 'bg-zinc-600'
      }`}
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

export default function App() {
  const [sites, setSites] = useState<BlockedSite[]>([]);
  const [hostname, setHostname] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState('');

  useEffect(() => {
    chrome.storage.local.get('blockedSites', (result) => {
      setSites(result.blockedSites ?? []);
    });
  }, []);

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

  function toggleSite(id: string) {
    saveSites(
      sites.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  function removeSite(id: string) {
    saveSites(sites.filter((s) => s.id !== id));
  }

  return (
    <div className="w-96 bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="text-base font-semibold tracking-tight">⏱ Timeless</span>
        <span className="ml-auto text-xs text-zinc-600">v1.0</span>
      </div>

      {/* Blocked sites list */}
      <div className="max-h-64 overflow-y-auto px-4 py-3">
        {sites.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">
            No sites blocked yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sites.map((site) => (
              <li
                key={site.id}
                className="flex items-center gap-3 rounded-lg bg-zinc-800 px-3 py-2"
              >
                <ToggleSwitch
                  checked={site.enabled}
                  onChange={() => toggleSite(site.id)}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      site.enabled ? 'text-zinc-100' : 'text-zinc-500'
                    }`}
                  >
                    {site.hostname}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatTime(site.startTime)} – {formatTime(site.endTime)}
                  </p>
                </div>
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
              </li>
            ))}
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
