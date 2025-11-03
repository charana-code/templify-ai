import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CanvasElement } from '../types';

interface ExportModalProps {
  editorRef: React.RefObject<HTMLDivElement>;
  artboardSize: { width: number; height: number };
  onClose: () => void;
  onSaveTemplate: (name: string) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ editorRef, artboardSize, onClose, onSaveTemplate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [mode, setMode] = useState<'export' | 'save_template'>('export');
  const [templateName, setTemplateName] = useState('');

  const handleExport = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!editorRef.current || isExporting) return;
    setIsExporting(true);

    const editorNode = editorRef.current;
    
    // --- New robust export logic ---
    // 1. Clone the node to avoid altering the live DOM and to modify styles safely.
    const clone = editorNode.cloneNode(true) as HTMLElement;

    // 2. Style the clone to be rendered off-screen but still be in the DOM for style computation.
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    clone.style.overflow = 'visible'; // This is the key fix for the clipping issue.

    // 3. Remove selection indicators (outline and box-shadow) from the clone for a clean export.
    const selectedElementsInClone = Array.from(clone.querySelectorAll('[style*="outline"]')) as HTMLElement[];
    selectedElementsInClone.forEach(el => {
      el.style.outline = 'none';
      el.style.boxShadow = 'none';
    });

    document.body.appendChild(clone);

    try {
      // 4. Run html2canvas on the prepared clone.
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      
      // 5. Generate and download the file based on the chosen format.
      if (format === 'pdf') {
        const { width, height } = artboardSize;
        const orientation = width > height ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'px', [width, height]);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
        pdf.save('design.pdf');
      } else {
        const mimeType = `image/${format}`;
        const imgData = canvas.toDataURL(mimeType, 0.95); // 0.95 quality for jpeg
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `design.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Could not export the design. Please check the console for errors.');
    } finally {
      // 6. Clean up: remove the clone from the DOM and reset state.
      document.body.removeChild(clone);
      setIsExporting(false);
      onClose();
    }
  };

  const handleSaveTemplateClick = () => {
    onSaveTemplate(templateName);
  }

  const renderExportOptions = () => (
    <div className="grid grid-cols-2 gap-4">
      <button onClick={() => handleExport('png')} className="p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
        <span className="text-4xl" role="img" aria-label="PNG">🖼️</span>
        <span className="mt-2 font-semibold">PNG</span>
      </button>
      <button onClick={() => handleExport('jpeg')} className="p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
        <span className="text-4xl" role="img" aria-label="JPG">🏞️</span>
        <span className="mt-2 font-semibold">JPG</span>
      </button>
      <button onClick={() => handleExport('pdf')} className="p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
        <span className="text-4xl" role="img" aria-label="PDF">📄</span>
        <span className="mt-2 font-semibold">PDF</span>
      </button>
      <button onClick={() => setMode('save_template')} className="p-4 bg-gray-700 hover:bg-green-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
        <span className="text-4xl" role="img" aria-label="Save as Template">💾</span>
        <span className="mt-2 font-semibold text-center">Save as<br/>Template</span>
      </button>
    </div>
  );

  const renderSaveTemplateForm = () => (
      <div className="flex flex-col space-y-4">
        <p className="text-sm text-gray-400 text-center">Save the current design as a reusable template in the toolbar.</p>
        <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name..."
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
        />
        <button
            onClick={handleSaveTemplateClick}
            disabled={!templateName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition-colors"
        >
            Save Template
        </button>
      </div>
  );


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg text-white animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
            {mode === 'export' ? 'Export Design' : 'Save as Template'}
        </h2>
        
        {isExporting ? (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="mt-4 text-gray-400">Processing your design...</p>
          </div>
        ) : (
            mode === 'export' ? renderExportOptions() : renderSaveTemplateForm()
        )}

        <div className="mt-8 flex justify-center space-x-4">
            {mode === 'save_template' && !isExporting && (
                 <button 
                    onClick={() => setMode('export')}
                    className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2 px-4 rounded-md bg-gray-700 hover:bg-gray-600"
                >
                    Back to Export
                </button>
            )}
            <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium py-2 px-4 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                disabled={isExporting}
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;