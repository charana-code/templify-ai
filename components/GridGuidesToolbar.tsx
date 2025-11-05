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
        <span className="text-xs text-gray-400 font-bold pl-1">Grid Guides</span>
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
        {config.isVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.064 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 15.057 12.478 17 10 17a9.938 9.938 0 01-2.553-.334L4.18 13.82A1 1 0 002.764 15.24l-1.05-1.05a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 15.057 12.478 17 10 17a9.938 9.938 0 01-2.553-.334L4.18 13.82a1 1 0 00-1.414 1.414l-1.05-1.05zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" />
            <path d="M2.707 4.293a1 1 0 010-1.414l1.05-1.05a1 1 0 011.414 0l1.473 1.473A10.014 10.014 0 0110 3c1.27 0 2.502.213 3.658.608l1.473-1.473a1 1 0 011.414 1.414l-1.05 1.05a1 1 0 01-1.414 0l-1.473-1.473A7.962 7.962 0 0010 5a7.962 7.962 0 00-4.658 1.408L2.707 4.293z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default GridGuidesToolbar;