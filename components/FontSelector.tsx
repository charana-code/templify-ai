import React, { useState, useEffect, useRef, useMemo } from 'react';
import { googleFonts } from '../data/google-fonts';
import { useFontLoader } from '../hooks/useFontLoader';

interface FontSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { loadFont } = useFontLoader();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Effect to handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load the initially selected font
  useEffect(() => {
    if (value) {
      loadFont(value);
    }
  }, [value, loadFont]);

  const filteredFonts = useMemo(() => {
    if (!searchTerm) return googleFonts;
    return googleFonts.filter(font =>
      font.family.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Effect to lazy-load fonts for previews as they are scrolled into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl || !isOpen) return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fontName = (entry.target as HTMLElement).dataset.fontFamily;
          if (fontName) {
            loadFont(fontName);
            observer.unobserve(entry.target);
          }
        }
      });
    }, { root: listEl, rootMargin: '0px 0px 200px 0px' }); // Preload fonts 200px ahead

    // FIX: Replaced Array.from().forEach() with a for...of loop to resolve a type inference issue.
    for (const child of listEl.children) {
      observer.observe(child);
    }
    observerRef.current = observer;

    return () => observerRef.current?.disconnect();
  }, [filteredFonts, isOpen, loadFont]);

  const handleSelectFont = (fontFamily: string) => {
    onChange(fontFamily);
    setIsOpen(false);
    setSearchTerm('');
  };

  const currentFont = value || 'Arial';

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={{ fontFamily: value ? `'${value}'` : 'Arial' }}>
            {value === undefined ? 'Mixed' : currentFont}
        </span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search fonts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filteredFonts.map(font => (
              <button
                key={font.family}
                onClick={() => handleSelectFont(font.family)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-600"
                data-font-family={font.family}
                style={{ fontFamily: `'${font.family}', ${font.category}` }}
                role="option"
                aria-selected={value === font.family}
              >
                {font.family}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSelector;
