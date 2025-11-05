import React, { useState, useEffect, useRef } from 'react';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
}

const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, onZoomChange, onFitToScreen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customZoom, setCustomZoom] = useState(Math.round(zoom * 100));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomZoom(Math.round(zoom * 100));
  }, [zoom]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePresetClick = (level: number) => {
    onZoomChange(level);
    setIsOpen(false);
  };

  const handleFitClick = () => {
    onFitToScreen();
    setIsOpen(false);
  };
  
  const handleCustomZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setCustomZoom(isNaN(value) ? 0 : value);
  };

  const handleCustomZoomBlur = () => {
    const clampedZoom = Math.max(10, Math.min(500, customZoom));
    if (clampedZoom > 0) {
      onZoomChange(clampedZoom / 100);
      if (clampedZoom !== customZoom) {
          setCustomZoom(clampedZoom);
      }
    } else {
        setCustomZoom(Math.round(zoom * 100)); // reset if invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const clampedZoom = Math.max(10, Math.min(500, customZoom));
        if (clampedZoom > 0) {
            onZoomChange(clampedZoom / 100);
            setIsOpen(false);
        }
        (e.target as HTMLInputElement).blur();
    }
  };
  
  const handleZoomStep = (step: number) => {
    const newZoomPercent = customZoom + step;
    const clampedZoom = Math.max(10, Math.min(500, newZoomPercent));
    setCustomZoom(clampedZoom);
    onZoomChange(clampedZoom / 100);
  };

  const presets = [0.5, 0.7, 1, 1.5, 2];

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2"
        aria-label="Zoom controls"
        title="Zoom controls"
      >
        <span>{Math.round(zoom * 100)}%</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 p-2">
          <div className="flex flex-col space-y-1">
            <button onClick={handleFitClick} className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-blue-600">Fit to Screen</button>
            {presets.map(level => (
              <button key={level} onClick={() => handlePresetClick(level)} className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-blue-600">
                {level * 100}%
              </button>
            ))}
            <div className="border-t border-gray-700 my-1"></div>
            <div className="flex items-center">
              <div className="flex items-center bg-gray-900 border border-gray-600 rounded-md w-full">
                <button
                  onClick={() => handleZoomStep(-10)}
                  className="px-2.5 py-1 text-lg font-mono leading-none rounded-l-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                  aria-label="Zoom out by 10%"
                  disabled={customZoom <= 10}
                >
                  -
                </button>
                <div className="relative flex-grow">
                  <input
                    type="number"
                    value={customZoom}
                    onChange={handleCustomZoomChange}
                    onBlur={handleCustomZoomBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent p-1.5 text-sm text-center pr-6 focus:outline-none ring-0 border-x border-gray-600"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">%</span>
                </div>
                <button
                  onClick={() => handleZoomStep(10)}
                  className="px-2.5 py-1 text-lg font-mono leading-none rounded-r-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                  aria-label="Zoom in by 10%"
                  disabled={customZoom >= 500}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoomControl;