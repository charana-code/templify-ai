import React, { useState } from 'react';

interface ArtboardSelectorProps {
  onSelect: (width: number, height: number) => void;
}

const presets = [
  { name: 'Instagram Post', width: 1080, height: 1080, label: '1080 x 1080 px' },
  { name: 'Instagram Story', width: 1080, height: 1920, label: '1080 x 1920 px' },
  { name: 'Presentation', width: 1920, height: 1080, label: '16:9 Widescreen' },
  { name: 'A4 Document', width: 794, height: 1123, label: 'Portrait' },
  { name: 'US Letter', width: 816, height: 1056, label: 'Portrait' },
  { name: 'Facebook Post', width: 1200, height: 630, label: 'Landscape' },
];

const ArtboardSelector: React.FC<ArtboardSelectorProps> = ({ onSelect }) => {
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const handleCreateCustom = () => {
    if (customWidth > 0 && customHeight > 0) {
      onSelect(customWidth, customHeight);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-800 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Gemini Design Studio</h1>
      <p className="text-lg text-gray-400 mb-12">Choose a size to start your design.</p>

      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => onSelect(preset.width, preset.height)}
              className="bg-gray-700 p-6 rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-200 ease-in-out flex flex-col items-center justify-center"
            >
              <span className="text-xl font-semibold text-center">{preset.name}</span>
              <span className="text-sm text-gray-400 mt-1">{preset.label}</span>
            </button>
          ))}
          <div className="bg-gray-700 p-6 rounded-lg col-span-2 md:col-span-3 lg:col-span-2 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold mb-4">Or use Custom Dimensions</h3>
            <div className="flex items-center space-x-4">
                <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                    className="bg-gray-800 rounded p-2 w-28 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Width"
                />
                <span className="text-gray-500 text-xl">×</span>
                 <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                    className="bg-gray-800 rounded p-2 w-28 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Height"
                />
                 <button 
                    onClick={handleCreateCustom}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors"
                 >
                    Create
                 </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtboardSelector;
