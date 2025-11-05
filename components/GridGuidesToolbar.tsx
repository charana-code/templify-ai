import React from 'react';

interface GridGuidesToolbarProps {
  config: {
    cols: number;
    rows: number;
    isVisible: boolean;
  };
  onChange: (newConfig: Partial<GridGuidesToolbarProps['config']>) => void;
}

const GridInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center space-x-1.5">
    <label htmlFor={`grid-${label.toLowerCase()}`} className="text-xs text-gray-400 font-semibold">{label}</label>
    <input
      id={`grid-${label.toLowerCase()}`}
      type="number"
      min="1"
      max="100"
      value={value}
      onChange={(e) => {
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
          onChange(val);
        }
      }}
      className="w-12 bg-gray-800 text-white rounded-md p-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  </div>
);


const GridGuidesToolbar: React.FC<GridGuidesToolbarProps> = ({ config, onChange }) => {
  const handleVisibilityToggle = () => {
    onChange({ isVisible: !config.isVisible });
  };

  return (
    <div className="flex items-center space-x-3 bg-gray-700 p-1.5 rounded-md text-sm">
      <GridInput label="Cols" value={config.cols} onChange={(cols) => onChange({ cols })} />
      <GridInput label="Rows" value={config.rows} onChange={(rows) => onChange({ rows })} />
      <button
        onClick={handleVisibilityToggle}
        className={`p-1.5 rounded-md transition-colors ${
          config.isVisible ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600 hover:text-white'
        }`}
        title={config.isVisible ? 'Hide Grid' : 'Show Grid'}
        aria-label={config.isVisible ? 'Hide Grid' : 'Show Grid'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
    </div>
  );
};

export default GridGuidesToolbar;