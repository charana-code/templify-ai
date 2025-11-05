import React, { useState, useEffect, useMemo } from 'react';
import { CanvasElement, GroupElement, TextElement } from '../types';
import NewLayerModal from './NewLayerModal';

interface LayerItemProps {
  element: CanvasElement;
  level: number;
  selectedElementIds: string[];
  onSelect: (id: string, shiftKey: boolean) => void;
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onSetEditingGroupId: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ element, level, selectedElementIds, onSelect, onReorder, onSetEditingGroupId, onToggleVisibility }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

  const isSelected = selectedElementIds.includes(element.id);
  const isVisible = element.visible ?? true;

  const getElementInfo = (el: CanvasElement): { icon: string, name: string } => {
    switch (el.type) {
      case 'text':
        return { icon: 'T', name: (el as TextElement).content.substring(0, 20) || 'Text' };
      case 'image':
        return { icon: '🖼️', name: 'Image' };
      case 'group':
        return { icon: '📁', name: 'Group' };
      case 'shape':
        const shapeEl = el as any;
        return { icon: '◇', name: shapeEl.shapeType.charAt(0).toUpperCase() + shapeEl.shapeType.slice(1) };
      default:
        return { icon: '?', name: 'Unknown' };
    }
  };

  const { icon, name } = getElementInfo(element);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: element.id }));
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverPosition(e.clientY < midY ? 'top' : 'bottom');
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const draggedId = data.id;

      if (draggedId !== element.id) {
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const position = e.clientY < midY ? 'before' : 'after';
          onReorder(draggedId, element.id, position);
      }
    } catch (error) {
        console.error("Failed to parse drag data:", error)
    } finally {
        setDragOverPosition(null);
    }
  };

  const handleDoubleClick = () => {
    if (element.type === 'group' && !element.locked) {
      onSetEditingGroupId(element.id);
    }
  };

  const itemStyle: React.CSSProperties = {
    paddingLeft: `${level * 16 + 8}px`,
  };

  const dragIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: '#3b82f6',
    pointerEvents: 'none',
  };

  return (
    <div>
      <div
        onClick={(e) => onSelect(element.id, e.shiftKey)}
        onDoubleClick={handleDoubleClick}
        draggable={!element.locked}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center p-2 text-sm text-gray-300 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-800' : 'hover:bg-gray-700'
        } ${element.locked ? 'opacity-60' : ''} ${!isVisible ? 'opacity-50' : ''}`}
        style={itemStyle}
      >
        {dragOverPosition === 'top' && <div style={{ ...dragIndicatorStyle, top: 0 }} />}
        
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(element.id);
            }}
            className="mr-2 text-gray-500 hover:text-white"
            title={isVisible ? 'Hide Layer' : 'Show Layer'}
        >
            {isVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 8.138 15.522 6.138 12.553 5.166l-1.42-1.42L3.707 2.293zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    <path d="M2 10s3.273-5.057 7.542-7C13.727 4.943 18 10 18 10s-3.273 5.057-7.542 7C6.273 15.057 2 10 2 10zm10 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )}
        </button>

        {element.type === 'group' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-2 text-gray-500 hover:text-white"
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <span className="mr-2 w-4 text-center">{icon}</span>
        <span className="truncate flex-1">{name}</span>
        {element.locked && <span className="p-1 text-gray-500" title="Locked">🔒</span>}

        {dragOverPosition === 'bottom' && <div style={{ ...dragIndicatorStyle, bottom: 0 }} />}
      </div>
      {element.type === 'group' && isExpanded && (
        <div className="border-l border-gray-700 ml-4">
          {(element as GroupElement).elements.map(child => (
            <LayerItem
              key={child.id}
              element={child}
              level={level + 1}
              selectedElementIds={selectedElementIds}
              onSelect={onSelect}
              onReorder={onReorder}
              onSetEditingGroupId={onSetEditingGroupId}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LayerPanelProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  onSelectElements: (ids: string[], mode: 'set' | 'add') => void;
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  editingGroupId: string | null;
  onSetEditingGroupId: (id: string | null) => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  canUngroup: boolean;
  onToggleLock: (ids: string[]) => void;
  onToggleVisibility: (ids: string[]) => void;
  onAddNewLayer: (color: string) => void;
  onUpdateElements: (updates: Partial<CanvasElement>) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  elements,
  selectedElementIds,
  onSelectElements,
  onReorder,
  editingGroupId,
  onSetEditingGroupId,
  onDelete,
  onGroup,
  onUngroup,
  canUngroup,
  onToggleLock,
  onToggleVisibility,
  onAddNewLayer,
  onUpdateElements,
}) => {
    
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [isNewLayerModalOpen, setIsNewLayerModalOpen] = useState(false);

  useEffect(() => {
    // Sync the anchor point with external selection changes (e.g., from the canvas)
    if (selectedElementIds.length === 0) {
      setLastClickedId(null);
    } else if (selectedElementIds.length === 1) {
      setLastClickedId(selectedElementIds[0]);
    } else {
      // FIX: If multiple items are selected (e.g., by drag-select), and our current
      // anchor is no longer part of that selection, we must clear it to prevent
      // invalid range selections on the next shift-click.
      if (lastClickedId && !selectedElementIds.includes(lastClickedId)) {
          setLastClickedId(null);
      }
    }
  }, [selectedElementIds, lastClickedId]);

  const elementsToShow = editingGroupId
    ? (elements.find(el => el.id === editingGroupId && el.type === 'group') as GroupElement)?.elements ?? []
    : elements;
  
  const isEditing = !!editingGroupId;
  const visibleElements = elementsToShow.slice().reverse();

  const handleSelect = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastClickedId) {
        const lastIndex = visibleElements.findIndex(el => el.id === lastClickedId);
        const currentIndex = visibleElements.findIndex(el => el.id === id);

        if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            const idsToSelect = visibleElements.slice(start, end + 1).map(el => el.id);
            onSelectElements(idsToSelect, 'set');
        } else {
            // Fallback if anchor not found, treat as normal click
            onSelectElements([id], 'set');
            setLastClickedId(id);
        }
    } else {
        // No shift key, or no anchor present
        onSelectElements([id], 'set');
        setLastClickedId(id);
    }
  };
  
  const isAnySelectedLocked = useMemo(() => {
    if (selectedElementIds.length === 0) return false;
    
    const allElementsById = new Map<string, CanvasElement>();
    const crawl = (els: CanvasElement[]) => {
        els.forEach(el => {
            allElementsById.set(el.id, el);
            if (el.type === 'group') crawl(el.elements);
        });
    };
    crawl(elements);
    
    return selectedElementIds.some(id => allElementsById.get(id)?.locked);
  }, [selectedElementIds, elements]);
  
  const { commonOpacity } = useMemo(() => {
    if (selectedElementIds.length === 0) return { commonOpacity: 100 };
    
    const allElementsById = new Map<string, CanvasElement>();
    const crawl = (els: CanvasElement[]) => {
      els.forEach(el => {
        allElementsById.set(el.id, el);
        if (el.type === 'group') crawl(el.elements);
      });
    };
    crawl(elements);
    
    const selected = selectedElementIds.map(id => allElementsById.get(id)).filter(Boolean);
    const firstOpacity = selected[0]?.opacity ?? 1;
    const allSameOpacity = selected.every(el => (el?.opacity ?? 1) === firstOpacity);
    
    return {
      commonOpacity: allSameOpacity ? Math.round(firstOpacity * 100) : 100, // Default to 100 if mixed
    };
  }, [selectedElementIds, elements]);

  return (
    <>
      <div className="w-full text-white flex flex-col">
          <div className="shrink-0 p-2 border-b border-gray-700 flex items-center space-x-4">
              <button
                  onClick={() => onToggleLock(selectedElementIds)}
                  disabled={selectedElementIds.length === 0}
                  className="p-2 rounded text-lg disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                  title={isAnySelectedLocked ? 'Unlock Selected' : 'Lock Selected'}
              >
                {isAnySelectedLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a5 5 0 00-5 5v1h1a1 1 0 011 1v3a1 1 0 01-1 1H5v1a2 2 0 002 2h6a2 2 0 002-2v-1h-1a1 1 0 01-1-1V9a1 1 0 011-1h1V7a5 5 0 00-5-5zM9 9v3h2V9H9z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="flex items-center space-x-2 flex-grow">
                <label htmlFor="layer-opacity" className="text-xs text-gray-400">Opacity</label>
                <input
                  id="layer-opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={commonOpacity}
                  onChange={(e) => onUpdateElements({ opacity: parseInt(e.target.value) / 100 })}
                  className="w-full"
                  disabled={selectedElementIds.length === 0}
                />
                <span className="text-xs w-8 text-right">{commonOpacity}%</span>
              </div>
          </div>
          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {isEditing && (
              <button 
                onClick={() => onSetEditingGroupId(null)}
                className="w-full text-left p-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 flex items-center mb-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Layers
              </button>
            )}
            {visibleElements.map(element => (
              <LayerItem
                key={element.id}
                element={element}
                level={0}
                selectedElementIds={selectedElementIds}
                onSelect={handleSelect}
                onReorder={onReorder}
                onSetEditingGroupId={onSetEditingGroupId}
                onToggleVisibility={(id) => onToggleVisibility([id])}
              />
            ))}
          </div>
           <div className="shrink-0 p-2 border-t border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setIsNewLayerModalOpen(true)}
                className="p-2 rounded hover:bg-gray-700"
                title="Add New Layer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onGroup}
                  disabled={selectedElementIds.length < 2}
                  className="p-2 rounded disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                  title="Group Layers (Ctrl+G)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={onUngroup}
                  disabled={!canUngroup}
                  className="p-2 rounded disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                  title="Ungroup Layers (Ctrl+Shift+G)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  disabled={selectedElementIds.length === 0}
                  className="p-2 rounded disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                  title="Delete Layer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
          </div>
      </div>
      {isNewLayerModalOpen && (
        <NewLayerModal
          onClose={() => setIsNewLayerModalOpen(false)}
          onCreate={(color) => {
            onAddNewLayer(color);
            setIsNewLayerModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default LayerPanel;
