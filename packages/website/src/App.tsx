const features = [
  {
    icon: '⏰',
    title: 'Time Windows',
    description:
      'Block sites only during your focus hours. They automatically unblock when your workday ends — no manual fiddling required.',
  },
  {
    icon: '⚡',
    title: 'Instant Setup',
    description:
      'Add any site in seconds. No account, no cloud sync, no subscriptions. Everything lives locally in your browser.',
  },
  {
    icon: '🎯',
    title: 'Zero Friction',
    description:
      'Toggle blocks on the fly from the popup. Easily tweak time windows without restarting anything.',
  },
  {
    icon: '🔒',
    title: 'Private by Design',
    description:
      'Your blocklist never leaves your device. No telemetry, no tracking, no third parties.',
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-zinc-800 px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">⏱ Timeless</span>
        <a
          href="#download"
          className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          Download
        </a>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
          <span className="text-violet-400">●</span>
          Chrome Extension · Free Forever
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Take back your time.
          <br />
          <span className="text-zinc-500">Block distractions,</span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
            on your schedule.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-400">
          Timeless blocks distracting websites during your focus hours —
          and automatically unblocks them when work is done. No willpower
          needed.
        </p>

        <a
          id="download"
          href="#"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-violet-700"
        >
          Download on Chrome Web Store
          <span aria-hidden>→</span>
        </a>
        <p className="mt-4 text-sm text-zinc-600">Free · No account required</p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <p className="mb-12 text-center text-xs uppercase tracking-widest text-zinc-600">
          Why Timeless
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-zinc-100">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-zinc-800 px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to focus?</h2>
        <p className="mx-auto mb-8 max-w-md text-zinc-400">
          Add Timeless to Chrome in one click. Start blocking distractions
          today.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700"
        >
          Download on Chrome Web Store →
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center">
        <p className="text-sm text-zinc-700">
          © {new Date().getFullYear()} Timeless · Built for focused people
        </p>
      </footer>
    </div>
  );
}
