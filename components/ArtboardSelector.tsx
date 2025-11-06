import React, { useState } from 'react';
import { artboardCategories, ArtboardPreset } from '../data/artboard-presets';

interface ArtboardSelectorProps {
  onSelect: (width: number, height: number, backgroundColor: string, projectName: string) => void;
}

type TabCategory = keyof typeof artboardCategories;

const ArtboardSelector: React.FC<ArtboardSelectorProps> = ({ onSelect }) => {
  const [projectName, setProjectName] = useState('Untitled Design');
  
  // Find A4 preset to use as the default
  const a4Preset = artboardCategories.print.find(p => p.name === 'A4 Document')!;

  const [customWidth, setCustomWidth] = useState(a4Preset.width);
  const [customHeight, setCustomHeight] = useState(a4Preset.height);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [activeTab, setActiveTab] = useState<TabCategory>('default');
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(a4Preset.name);


  const handleCreateCustom = () => {
    if (customWidth > 0 && customHeight > 0) {
      onSelect(customWidth, customHeight, backgroundColor, projectName);
    }
  };

  const handlePresetClick = (preset: ArtboardPreset) => {
    const landscapeWidth = Math.max(preset.width, preset.height);
    const landscapeHeight = Math.min(preset.width, preset.height);
    
    setSelectedPresetName(preset.name);

    if (orientation === 'landscape') {
      setCustomWidth(landscapeWidth);
      setCustomHeight(landscapeHeight);
    } else {
      setCustomWidth(landscapeHeight);
      setCustomHeight(landscapeWidth);
    }
  };

  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    if (orientation === newOrientation || customWidth === customHeight) return;
    
    setOrientation(newOrientation);
    setSelectedPresetName(null);
    
    const w = customWidth;
    const h = customHeight;
    setCustomWidth(h);
    setCustomHeight(w);
  };

  const tabs: { key: TabCategory; label: string }[] = [
    { key: 'default', label: 'Recommended' },
    { key: 'social', label: 'Social Media' },
    { key: 'print', label: 'Print' },
    { key: 'photo', label: 'Photo' },
    { key: 'screens', label: 'Screens' },
  ];

  const presets = artboardCategories[activeTab];

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-800 text-white p-8">
      <div className="w-full max-w-7xl h-[85vh] flex bg-gray-900/80 rounded-xl shadow-2xl ring-1 ring-gray-700">
        {/* Left Panel: Presets */}
        <div className="w-2/3 flex flex-col p-8 overflow-hidden">
          <div className="text-left mb-6 shrink-0">
            <h1 className="text-3xl font-bold mb-1">Start a New Design</h1>
            <p className="text-md text-gray-400">Choose a popular preset or create a custom size on the right.</p>
          </div>

          <div className="flex space-x-2 sm:space-x-4 mb-6 border-b border-gray-700 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm sm:text-base font-medium rounded-t-lg transition-colors border-b-2
                  ${activeTab === tab.key
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }`
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
              {presets.map(preset => (
                <button
                  key={`${activeTab}-${preset.name}`}
                  onClick={() => handlePresetClick(preset)}
                  className={`p-4 rounded-lg hover:scale-105 transition-all duration-200 ease-in-out flex flex-col items-center justify-center aspect-square ${
                    selectedPresetName === preset.name
                      ? 'bg-blue-600 ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-400'
                      : 'bg-gray-700 hover:bg-blue-600'
                  }`}
                >
                  <span className="text-md font-semibold text-center">{preset.name}</span>
                  <span className="text-xs text-gray-400 mt-1">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Creation */}
        <div className="w-1/3 bg-gray-800 p-8 rounded-r-xl flex flex-col justify-center space-y-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
            <input
                type="text"
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-gray-700 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Untitled Design"
            />
          </div>
          <div className="flex items-end justify-center gap-4">
            <div className="flex flex-col items-center">
              <label htmlFor="custom-width" className="text-sm font-medium text-gray-400 mb-1">Width</label>
              <div className="flex items-center bg-gray-700 rounded-md">
                <input
                  id="custom-width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => {
                    setCustomWidth(parseInt(e.target.value, 10) || 0);
                    setSelectedPresetName(null);
                  }}
                  className="bg-transparent p-2 w-24 text-center text-lg focus:outline-none"
                />
                <span className="text-gray-500 text-sm pr-3">px</span>
              </div>
            </div>
            <span className="text-gray-500 text-xl pb-3">×</span>
            <div className="flex flex-col items-center">
              <label htmlFor="custom-height" className="text-sm font-medium text-gray-400 mb-1">Height</label>
              <div className="flex items-center bg-gray-700 rounded-md">
                <input
                  id="custom-height"
                  type="number"
                  value={customHeight}
                   onChange={(e) => {
                    setCustomHeight(parseInt(e.target.value, 10) || 0);
                    setSelectedPresetName(null);
                  }}
                  className="bg-transparent p-2 w-24 text-center text-lg focus:outline-none"
                />
                <span className="text-gray-500 text-sm pr-3">px</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 text-center">Orientation</label>
            <div className="flex justify-center bg-gray-700 rounded-md p-1">
              <button onClick={() => handleOrientationChange('landscape')} className={`w-1/2 py-1.5 text-sm rounded ${orientation === 'landscape' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}>Landscape</button>
              <button onClick={() => handleOrientationChange('portrait')} className={`w-1/2 py-1.5 text-sm rounded ${orientation === 'portrait' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}>Portrait</button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 text-center">Background</label>
            <div className="flex items-center justify-center bg-gray-700 rounded-md p-1 space-x-1">
              <div className="relative">
                <input
                  type="color"
                  value={backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-8 rounded-l-md border-0 cursor-pointer bg-transparent"
                  style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', appearance: 'none'}}
                  aria-label="Choose background color"
                />
              </div>
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                onFocus={() => { if (backgroundColor === 'transparent') setBackgroundColor('#FFFFFF'); }}
                className="h-8 flex-grow bg-gray-800 px-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => setBackgroundColor('transparent')}
                className={`p-2 h-8 rounded-r-md transition-colors ${backgroundColor === 'transparent' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
                title="Transparent Background"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0H12V12H0V0Z" fill="#E5E7EB"/>
                  <path d="M12 12H24V24H12V12Z" fill="#E5E7EB"/>
                  <path d="M12 0H24V12H12V0Z" fill="white"/>
                  <path d="M0 12H12V24H0V12Z" fill="white"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateCustom}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            Create Design
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtboardSelector;