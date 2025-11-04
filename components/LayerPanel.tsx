import React, { useState, useEffect, useMemo } from 'react';
import { CanvasElement, GroupElement, TextElement } from '../types';

interface LayerItemProps {
  element: CanvasElement;
  level: number;
  selectedElementIds: string[];
  onSelect: (id: string, shiftKey: boolean) => void;
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onSetEditingGroupId: (id: string | null) => void;
  onToggleLock: (id: string) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ element, level, selectedElementIds, onSelect, onReorder, onSetEditingGroupId, onToggleLock }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

  const isSelected = selectedElementIds.includes(element.id);

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

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(element.id);
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
        } ${element.locked ? 'opacity-60' : ''}`}
        style={itemStyle}
      >
        {dragOverPosition === 'top' && <div style={{ ...dragIndicatorStyle, top: 0 }} />}
        
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

        <button onClick={handleLockClick} className="p-1 rounded-full hover:bg-gray-600 z-10" aria-label={element.locked ? `Unlock ${name}` : `Lock ${name}`}>
          {element.locked ? '🔒' : '🔓'}
        </button>

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
              onToggleLock={onToggleLock}
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
  onReorderSelection: (direction: 'forward' | 'backward' | 'front' | 'back') => void;
  editingGroupId: string | null;
  onSetEditingGroupId: (id: string | null) => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  canUngroup: boolean;
  onToggleLock: (ids: string[]) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ elements, selectedElementIds, onSelectElements, onReorder, onReorderSelection, editingGroupId, onSetEditingGroupId, onDelete, onGroup, onUngroup, canUngroup, onToggleLock }) => {
    
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

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

  const { canMoveForward, canMoveBackward, canMoveToFront, canMoveToBack } = useMemo(() => {
    if (selectedElementIds.length === 0 || editingGroupId) {
        return { canMoveForward: false, canMoveBackward: false, canMoveToFront: false, canMoveToBack: false };
    }

    const totalElements = elements.length;
    
    const isSingleSelection = selectedElementIds.length === 1;
    const singleSelectedId = isSingleSelection ? selectedElementIds[0] : null;
    const elementIndex = singleSelectedId ? elements.findIndex(el => el.id === singleSelectedId) : -1;

    const indices = selectedElementIds.map(id => elements.findIndex(el => el.id === id)).filter(i => i !== -1);
    if(indices.length === 0) {
          return { canMoveForward: false, canMoveBackward: false, canMoveToFront: false, canMoveToBack: false };
    }

    const topMostIndex = Math.max(...indices);
    const bottomMostIndex = Math.min(...indices);

    const canMoveForward = isSingleSelection && elementIndex > -1 && elementIndex < totalElements - 1;
    const canMoveBackward = isSingleSelection && elementIndex > 0;
    const canMoveToFront = topMostIndex < totalElements - 1;
    const canMoveToBack = bottomMostIndex > 0;

    return { canMoveForward, canMoveBackward, canMoveToFront, canMoveToBack };
  }, [selectedElementIds, elements, editingGroupId]);


  return (
    <div className="w-full text-white flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {visibleElements.map(element => (
                <LayerItem
                    key={element.id}
                    element={element}
                    level={0}
                    selectedElementIds={selectedElementIds}
                    onSelect={handleSelect}
                    onReorder={onReorder}
                    onSetEditingGroupId={onSetEditingGroupId}
                    onToggleLock={(id) => onToggleLock([id])}
                />
            ))}
        </div>
        {editingGroupId && (
            <button
                onClick={() => onSetEditingGroupId(null)}
                className="w-full mt-auto p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm shrink-0"
            >
                Exit Group
            </button>
        )}
        <div className="shrink-0 p-2 border-t border-gray-700 flex flex-col space-y-2">
            <div className="flex items-center justify-around">
                <button
                    onClick={() => onReorderSelection('backward')}
                    disabled={!canMoveBackward || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-lg disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Send Backward"
                >↓</button>
                <button
                    onClick={() => onReorderSelection('forward')}
                    disabled={!canMoveForward || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-lg disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Bring Forward"
                >↑</button>
                <button
                    onClick={() => onReorderSelection('back')}
                    disabled={!canMoveToBack || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-lg disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Send to Back"
                >⇊</button>
                <button
                    onClick={() => onReorderSelection('front')}
                    disabled={!canMoveToFront || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-lg disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Bring to Front"
                >⇈</button>
            </div>
             <div className="flex items-center justify-around">
                <button
                    onClick={onGroup}
                    disabled={isEditing || selectedElementIds.length < 2 || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-sm disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Group Layers (Ctrl+G)"
                >
                    <span role="img" aria-label="Group">📁+</span>
                </button>
                <button
                    onClick={onUngroup}
                    disabled={isEditing || !canUngroup || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-sm disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Ungroup Layers (Ctrl+Shift+G)"
                >
                    <span role="img" aria-label="Ungroup">📁-</span>
                </button>
                <button
                    onClick={onDelete}
                    disabled={selectedElementIds.length === 0 || isAnySelectedLocked}
                    className="px-3 py-1.5 rounded text-sm disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-gray-700"
                    title="Delete Layer (Delete)"
                >
                    <span role="img" aria-label="Delete">🗑️</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default LayerPanel;