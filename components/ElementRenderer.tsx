import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, TextElement, ImageElement, GroupElement } from '../types';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isResizable: boolean;
  isDragging: boolean;
  onUpdate: (id:string, updates: Partial<CanvasElement>) => void;
  onElementMouseDown: (id: string, e: React.MouseEvent) => void;
  onResizeStart: (id: string, direction: string, e: React.MouseEvent) => void;
  onElementDoubleClick: (id: string) => void;
  zIndex: number;
  totalElements: number;
}

const ResizeHandle: React.FC<{
  position: string;
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
}> = ({ position, cursor, onMouseDown }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#3b82f6',
    border: '1px solid #ffffff',
    borderRadius: '2px',
    cursor,
    zIndex: 20,
  };

  if (position.includes('top')) style.top = '-5px';
  if (position.includes('bottom')) style.bottom = '-5px';
  if (position.includes('left')) style.left = '-5px';
  if (position.includes('right')) style.right = '-5px';
  if (position.includes('center-h')) {
    style.left = '50%';
    style.transform = 'translateX(-50%)';
  }
  if (position.includes('center-v')) {
    style.top = '50%';
    style.transform = 'translateY(-50%)';
  }

  return <div style={style} onMouseDown={onMouseDown} />;
};

const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  isSelected,
  isResizable,
  isDragging, 
  onUpdate, 
  onElementMouseDown, 
  onResizeStart,
  onElementDoubleClick,
  zIndex,
  totalElements,
 }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    onElementMouseDown(element.id, e);
  };
  
  const handleDoubleClick = () => {
    if (element.type === 'text') {
      setIsEditing(true);
      setEditableContent((element as TextElement).content);
    } else {
      onElementDoubleClick(element.id);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };

  const handleEditBlur = () => {
    if (isEditing) {
      onUpdate(element.id, { content: editableContent });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditBlur();
    }
  };

  const styles: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `rotate(${element.rotation}deg)`,
    cursor: isEditing ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    userSelect: 'none',
    boxSizing: 'border-box',
    zIndex: isDragging ? 9999 : (isSelected ? totalElements : zIndex),
  };

  if (isSelected && !isEditing) {
    styles.outline = '2px solid #3b82f6';
    styles.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
  }

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        const textEl = element as TextElement;
        const textStyles: React.CSSProperties = {
          fontSize: `${textEl.fontSize}px`,
          fontWeight: textEl.fontWeight,
          color: textEl.color,
          fontFamily: textEl.fontFamily,
          textAlign: textEl.textAlign,
          lineHeight: textEl.lineHeight,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: textEl.textAlign === 'left' ? 'flex-start' : textEl.textAlign === 'right' ? 'flex-end' : 'center',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '5px',
        };
        
        if (isEditing) {
          const { display, alignItems, justifyContent, ...textareaInheritedStyles } = textStyles;

          const textareaStyles: React.CSSProperties = {
            ...textareaInheritedStyles,
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            outline: '1px solid #3b82f6',
            resize: 'none',
            margin: 0,
            overflowWrap: 'break-word',
          };

          return (
            <textarea
              ref={textareaRef}
              value={editableContent}
              onChange={handleContentChange}
              onBlur={handleEditBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              style={textareaStyles}
            />
          );
        }

        return (
          <div
            style={textStyles}
          >
            {textEl.content}
          </div>
        );
      case 'image':
        const imgEl = element as ImageElement;
        const imgTransforms: string[] = [];
        if (imgEl.flipHorizontal) imgTransforms.push('scaleX(-1)');
        if (imgEl.flipVertical) imgTransforms.push('scaleY(-1)');

        return (
          <img
            src={imgEl.src}
            alt="canvas element"
            className="w-full h-full object-cover pointer-events-none"
            style={{ transform: imgTransforms.join(' ') }}
            draggable={false}
          />
        );
      case 'group':
        const groupEl = element as GroupElement;
        return (
          <div className="w-full h-full relative pointer-events-none">
            {groupEl.elements.map((child, index) => (
              <ElementRenderer
                key={child.id}
                element={child}
                // Group children are not directly interactive
                isSelected={false}
                isResizable={false}
                isDragging={false}
                onElementMouseDown={() => {}}
                onUpdate={() => {}}
                onResizeStart={() => {}}
                onElementDoubleClick={() => {}}
                zIndex={index}
                totalElements={groupEl.elements.length}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };
  
  const resizeHandles = [
    { position: 'top-left', cursor: 'nwse-resize' },
    { position: 'top-center-h', cursor: 'ns-resize' },
    { position: 'top-right', cursor: 'nesw-resize' },
    { position: 'right-center-v', cursor: 'ew-resize' },
    { position: 'bottom-right', cursor: 'nwse-resize' },
    { position: 'bottom-center-h', cursor: 'ns-resize' },
    { position: 'bottom-left', cursor: 'nesw-resize' },
    { position: 'left-center-v', cursor: 'ew-resize' },
  ];

  return (
    <div
      ref={ref}
      style={styles}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderElement()}
       {isResizable && !isEditing &&
        resizeHandles.map(handle => (
          <ResizeHandle
            key={handle.position}
            position={handle.position}
            cursor={handle.cursor}
            onMouseDown={(e) => onResizeStart(element.id, handle.position, e)}
          />
        ))
      }
    </div>
  );
};

export default ElementRenderer;