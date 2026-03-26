import { useState } from 'react';
import { DateRangePicker } from '../ui/DateRangePicker';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { getApiKey, saveApiKey } from '../../services/flightLookup';

export function Header({
  start,
  end,
  activePreset,
  onPreset,
  onCustomRange,
  onAddEvent,
  onImport,
  activeView,
  onViewChange,
  isLive,
  isReadOnly,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => getApiKey() || '');

  function handleSaveKey() {
    saveApiKey(apiKey.trim());
    setSettingsOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">Travel Tracker</h1>
                {isLive && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live
                  </span>
                )}
                {isReadOnly && (
                  <span className="bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-medium">
                    View Only
                  </span>
                )}
              </div>

              {/* View toggle: Calendar / All Events */}
              <div className="bg-gray-100 rounded-full p-1 flex gap-0.5">
                <button
                  onClick={() => onViewChange('calendar')}
                  className={`px-4 py-1 text-sm font-medium rounded-full transition-all cursor-pointer ${
                    activeView === 'calendar'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Calendar
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => onViewChange('events')}
                    className={`px-4 py-1 text-sm font-medium rounded-full transition-all cursor-pointer ${
                      activeView === 'events'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    All Events
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeView === 'calendar' && (
                <DateRangePicker
                  start={start}
                  end={end}
                  activePreset={activePreset}
                  onPreset={onPreset}
                  onCustom={onCustomRange}
                />
              )}

              {/* Settings icon button */}
              <button
                onClick={() => setSettingsOpen(true)}
                title="Flight API settings"
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {!isReadOnly && onImport && (
                <button
                  onClick={onImport}
                  className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Import
                </button>
              )}

              {!isReadOnly && onAddEvent && (
                <button
                  onClick={() => onAddEvent()}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors cursor-pointer"
                >
                  + Add Event
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Flight Lookup Settings">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add a free{' '}
            <span className="font-medium text-gray-800">AviationStack</span> API key to enable automatic flight detail lookup. Without a key, you can still enter flight details manually.
          </p>
          <p className="text-xs text-gray-500">
            Get a free key at aviationstack.com (100 requests/month). The key is stored only in your browser.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Your AviationStack API key..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveKey} className="flex-1">Save Key</Button>
            {getApiKey() && (
              <Button
                variant="secondary"
                onClick={() => { saveApiKey(''); setApiKey(''); setSettingsOpen(false); }}
              >
                Remove Key
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
