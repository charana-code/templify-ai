import React, { useState } from 'react';

interface NewLayerModalProps {
  onClose: () => void;
  onCreate: (color: string) => void;
}

const NewLayerModal: React.FC<NewLayerModalProps> = ({ onClose, onCreate }) => {
  const [color, setColor] = useState('#FFFFFF');

  const handleCreate = () => {
    onCreate(color);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-sm text-white animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">New Layer Background</h2>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-400 text-center">Choose a background color for the new layer.</label>
          <div className="flex items-center justify-center bg-gray-700 rounded-md p-2 space-x-2">
            <div className="relative">
              <input
                type="color"
                value={color === 'transparent' ? '#FFFFFF' : color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded-md border-0 cursor-pointer bg-transparent"
                style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', appearance: 'none'}}
                aria-label="Choose background color"
              />
            </div>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 flex-grow bg-gray-800 px-3 text-center text-lg focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
            />
          </div>
          <p className="text-xs text-gray-500 text-center">This will add a new rectangle the size of your artboard to the bottom of the layer stack.</p>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="text-gray-300 hover:bg-gray-600 transition-colors text-sm font-medium py-2 px-6 rounded-md bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="text-white bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-bold py-2 px-6 rounded-md"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewLayerModal;
