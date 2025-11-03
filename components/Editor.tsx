import React, { forwardRef } from 'react';
import { CanvasElement, TextElement, ImageElement, Guide, GroupElement } from '../types';
import ElementRenderer from './ElementRenderer';

interface EditorProps {
  artboardSize: { width: number; height: number };
  elements: CanvasElement[];
  selectedElementIds: string[];
  draggingElementId: string | null;
  guides: Guide[];
  zoom: number;
  editingGroup: GroupElement | null;
  onAddElement: (element: Omit<CanvasElement, 'id'>, x: number, y: number) => void;
  onAddTemplate: (templateElements: any[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onElementMouseDown: (id: string, e: React.MouseEvent) => void;
  onResizeStart: (id: string, direction: string, e: React.MouseEvent) => void;
  onElementDoubleClick: (id: string) => void;
}

const Editor = forwardRef<HTMLDivElement, EditorProps>(({
  artboardSize,
  elements,
  selectedElementIds,
  draggingElementId,
  guides,
  zoom,
  editingGroup,
  onAddElement,
  onAddTemplate,
  onUpdateElement,
  onElementMouseDown,
  onResizeStart,
  onElementDoubleClick,
}, ref) => {

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const editorDiv = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!editorDiv) return;

    const { type, elements: templateElements } = JSON.parse(e.dataTransfer.getData('application/json'));
    const rect = editorDiv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (type === 'template') {
        onAddTemplate(templateElements);
        return;
    }

    switch (type) {
      case 'text':
        const newTextElement: Omit<TextElement, 'id'> = {
          type: 'text',
          content: 'New Text',
          x,
          y,
          width: 200,
          height: 50,
          rotation: 0,
          fontSize: 24,
          fontWeight: 'normal',
          color: '#000000',
          fontFamily: 'Arial',
          textAlign: 'center',
          lineHeight: 1.2,
        };
        onAddElement(newTextElement, x, y);
        break;
      case 'image':
        const newImageElement: Omit<ImageElement, 'id'> = {
          type: 'image',
          src: 'https://picsum.photos/400/300',
          x,
          y,
          width: 400,
          height: 300,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
        };
        onAddElement(newImageElement, x, y);
        break;
      default:
        return;
    }
  };

  return (
    <div
      ref={ref}
      className="bg-white rounded-lg relative overflow-hidden shadow-2xl shrink-0"
      style={{
        width: `${artboardSize.width}px`,
        height: `${artboardSize.height}px`,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {editingGroup && (
        <div style={{
            position: 'absolute',
            left: editingGroup.x,
            top: editingGroup.y,
            width: editingGroup.width,
            height: editingGroup.height,
            transform: `rotate(${editingGroup.rotation}deg)`,
            outline: '2px dashed #818cf8',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            pointerEvents: 'none',
            zIndex: -1,
        }} />
      )}
      {elements.map((element, index) => (
        <ElementRenderer
          key={element.id}
          element={element}
          isSelected={selectedElementIds.includes(element.id)}
          isResizable={selectedElementIds.length === 1 && selectedElementIds[0] === element.id}
          isDragging={draggingElementId !== null && selectedElementIds.includes(element.id)}
          onElementMouseDown={onElementMouseDown}
          onUpdate={onUpdateElement}
          onResizeStart={onResizeStart}
          onElementDoubleClick={onElementDoubleClick}
          zIndex={index}
          totalElements={elements.length}
        />
      ))}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
        {guides.map((guide, index) => (
            <line
                key={index}
                x1={guide.x1}
                y1={guide.y1}
                x2={guide.x2}
                y2={guide.y2}
                stroke="#ef4444"
                strokeWidth="1"
            />
        ))}
      </svg>
    </div>
  );
});

export default Editor;