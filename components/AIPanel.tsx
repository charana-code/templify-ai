import React, { useState } from 'react';
import Accordion from './Accordion';
import { CanvasElement } from '../types';

interface AIPanelProps {
  isProcessing: boolean;
  onPlaceContent: (content: string) => Promise<void>;
  onApplyStyles: (command: string) => Promise<void>;
  onDeleteElement: () => void;
  singleSelectedElement: CanvasElement | null;
  selectedElementIds: string[];
}

const AIPanel: React.FC<AIPanelProps> = ({
  isProcessing,
  onPlaceContent,
  onApplyStyles,
  onDeleteElement,
  singleSelectedElement,
  selectedElementIds,
}) => {
  const [aiContent, setAiContent] = useState('');
  const [aiCommand, setAiCommand] = useState('');

  const getDesignerPlaceholder = () => {
    if (selectedElementIds.length === 0) {
      return "Select an element to edit";
    }
    if (selectedElementIds.length > 1) {
      return "e.g., 'align to the left', 'make them all blue'";
    }
    if (singleSelectedElement) {
      if (singleSelectedElement.type === 'image') {
        return "e.g., 'add a birthday hat'";
      }
      if (singleSelectedElement.type === 'text') {
        return "e.g., 'make it blue and bold'";
      }
    }
    return "Describe the change you want...";
  };

  return (
    <>
      <Accordion title="AI Content">
        <p className="text-xs text-gray-500 mb-2">
          Paste your content below. The AI will analyze it and automatically place it into the text boxes on your canvas.
        </p>
        <textarea
          value={aiContent}
          onChange={(e) => setAiContent(e.target.value)}
          placeholder="Paste title, paragraphs, lists, etc. here..."
          className="w-full h-48 bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => onPlaceContent(aiContent)}
          disabled={isProcessing || !aiContent.trim()}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isProcessing ? 'Analyzing...' : 'Place Content'}
        </button>
      </Accordion>
      <Accordion title="AI Designer" defaultOpen>
        <p className="text-xs text-gray-500 mb-2">
          Select an element on the canvas and give the AI a command to modify it.
        </p>
        <textarea
          rows={3}
          value={aiCommand}
          onChange={(e) => setAiCommand(e.target.value)}
          placeholder={getDesignerPlaceholder()}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={selectedElementIds.length === 0}
        />
        <button
          onClick={() => {
            onApplyStyles(aiCommand);
            setAiCommand('');
          }}
          disabled={isProcessing || !aiCommand.trim() || selectedElementIds.length === 0}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isProcessing ? 'Designing...' : 'Apply Change'}
        </button>
      </Accordion>
    </>
  );
};

export default AIPanel;