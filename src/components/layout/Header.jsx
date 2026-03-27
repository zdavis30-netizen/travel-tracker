import { useState } from 'react';
import { Modal } from '../ui/Modal';

export function Header({
  onAddEvent,
  onImport,
  isLive,
  isReadOnly,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          {/* Left: title + status */}
          <div className="flex items-center gap-3">
            <span className="text-xl">✈️</span>
            <h1 className="text-base font-semibold text-gray-900 tracking-tight">Travel Tracker</h1>
            {isLive && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Live
              </span>
            )}
            {isReadOnly && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                View only
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {!isReadOnly && onImport && (
              <button
                onClick={onImport}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Import
              </button>
            )}

            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {!isReadOnly && onAddEvent && (
              <button
                onClick={() => onAddEvent()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <span className="text-base leading-none">+</span>
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Flight times are looked up automatically via AeroDataBox when you enter a flight number.
          </p>
          <p className="text-xs text-gray-400">
            Travel Tracker · synced live via Firebase
          </p>
        </div>
      </Modal>
    </>
  );
}
