import React from 'react';

const ToolbarItem: React.FC<{
  onClick: () => void;
  icon: string;
  label: string;
  isActive: boolean;
}> = ({ onClick, icon, label, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-3 w-24 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="mt-1 text-xs">{label}</span>
    </button>
  );
};

interface ToolbarProps {
  onSetActiveTool: (tool: 'text' | 'image' | 'elements' | 'templates' | 'export') => void;
  activeTool: 'text' | 'image' | 'elements' | 'templates' | 'export' | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSetActiveTool, activeTool }) => {
  return (
    <div className="w-32 shrink-0 bg-gray-900 text-white p-4 flex flex-col items-center space-y-6 overflow-y-auto">
      <ToolbarItem
        onClick={() => onSetActiveTool('export')}
        icon="💾"
        label="Export"
        isActive={activeTool === 'export'}
      />
      <div className="w-full border-t border-gray-700 my-2"></div>
      <h2 className="text-lg font-bold text-gray-400">Tools</h2>
      <ToolbarItem
        onClick={() => onSetActiveTool('text')}
        icon="T"
        label="Text"
        isActive={activeTool === 'text'}
      />
      <ToolbarItem
        onClick={() => onSetActiveTool('image')}
        icon="🖼️"
        label="Image"
        isActive={activeTool === 'image'}
      />
      <ToolbarItem
        onClick={() => onSetActiveTool('elements')}
        icon="🧩"
        label="Elements"
        isActive={activeTool === 'elements'}
      />
      <div className="w-full border-t border-gray-700 my-2"></div>
      <h2 className="text-lg font-bold text-gray-400">Content</h2>
      <ToolbarItem
        onClick={() => onSetActiveTool('templates')}
        icon="📄"
        label="Templates"
        isActive={activeTool === 'templates'}
      />
    </div>
  );
};

export default Toolbar;