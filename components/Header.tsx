import React from 'react';

interface HeaderProps {
  mode: 'local' | 'cloud';
}

export const Header: React.FC<HeaderProps> = ({ mode }) => {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-md shadow-accent/20"
          aria-hidden
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Vestura <em className="not-italic text-accent">VTON</em>
            </h1>
            <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
              Open Source
            </span>
          </div>
          <p className="text-xs text-muted sm:text-sm">
            High-quality clothing try-on with pluggable local & cloud AI backends
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-xs">
          <span className={`h-2 w-2 rounded-full ${mode === 'local' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
          <span>{mode === 'local' ? 'Local / Free Mode' : 'Cloud API Mode'}</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary py-1.5 px-3 text-xs"
          title="GitHub Repository"
        >
          GitHub
        </a>
      </div>
    </header>
  );
};
