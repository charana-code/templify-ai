import React, { useState, useRef } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-gray-700 bg-gray-900">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 text-left text-lg font-bold text-gray-300 hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px',
        }}
      >
        <div className="p-3 border-t border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
