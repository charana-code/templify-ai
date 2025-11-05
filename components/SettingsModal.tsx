import React from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md text-white animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Settings</h2>
        <p className="text-center text-gray-400">
          TODO: Settings functionality will be implemented here.
        </p>
        <div className="mt-8 flex justify-center">
            <button 
                onClick={onClose}
                className="text-white hover:bg-blue-700 transition-colors text-sm font-medium py-2 px-6 rounded-md bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                aria-label="Close settings modal"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
