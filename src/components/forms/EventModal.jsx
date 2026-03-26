import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { LocationForm } from './LocationForm';
import { FlightForm } from './FlightForm';
import { HotelForm } from './HotelForm';
import { TogetherForm } from './TogetherForm';
import { NoteForm } from './NoteForm';

const TABS = [
  { key: 'location', label: '📍 Location' },
  { key: 'flight', label: '✈ Flight' },
  { key: 'hotel', label: '🏨 Hotel' },
  { key: 'together', label: '💚 Together' },
  { key: 'note', label: '📝 Note' },
];

export function EventModal({ isOpen, onClose, onSave, editEvent }) {
  const [activeTab, setActiveTab] = useState(editEvent?.type || 'location');

  const isEdit = !!editEvent;
  const title = isEdit ? `Edit ${editEvent.type}` : 'Add Event';

  function handleSave(data) {
    if (isEdit) {
      onSave({ ...data, id: editEvent.id, createdAt: editEvent.createdAt });
    } else {
      onSave(data);
    }
    onClose();
  }

  const formProps = {
    initial: isEdit ? editEvent : undefined,
    onSave: handleSave,
    onCancel: onClose,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {!isEdit && (
        <div className="flex border-b border-gray-200 mb-4 -mx-6 px-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors mr-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'location' && <LocationForm {...formProps} />}
      {activeTab === 'flight' && <FlightForm {...formProps} />}
      {activeTab === 'hotel' && <HotelForm {...formProps} />}
      {activeTab === 'together' && <TogetherForm {...formProps} />}
      {activeTab === 'note' && <NoteForm {...formProps} />}
    </Modal>
  );
}
