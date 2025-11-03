import React, { useState, useRef, useMemo } from 'react';
import { CanvasElement, TextElement, ImageElement } from '../types';

interface ContextualToolbarProps {
  selectedElementIds: string[];
  elements: CanvasElement[];
  onUpdateElements: (updates: Partial<CanvasElement>) => void;
  onReorder: (direction: 'forward' | 'backward' | 'front' | 'back') => void;
  onGroup: () => void;
  onUngroup: () => void;
  elementIndex: number;
  totalElements: number;
}

const FONT_FAMILIES = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New'];
const TEXT_ALIGN_OPTIONS: { value: 'left' | 'center' | 'right', label: string, icon: string }[] = [
    { value: 'left', label: 'Align Left', icon: '📄' },
    { value: 'center', label: 'Align Center', icon: '📄' },
    { value: 'right', label: 'Align Right', icon: '📄' }
];


const ToolLabel: React.FC<{ children: React.ReactNode, htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-xs text-gray-400 mr-2 font-semibold uppercase">{children}</label>
);

const ToolWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center">{children}</div>
);

const ContextualToolbar: React.FC<ContextualToolbarProps> = ({ selectedElementIds, elements, onUpdateElements, onReorder, onGroup, onUngroup, elementIndex, totalElements }) => {
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElements = useMemo(() => 
    elements.filter(el => selectedElementIds.includes(el.id)),
    [elements, selectedElementIds]
  );
  
  const selectionType = useMemo(() => {
    if (selectedElements.length === 0) return null;
    const firstType = selectedElements[0].type;
    return selectedElements.every(el => el.type === firstType) ? firstType : 'mixed';
  }, [selectedElements]);

  const singleSelectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  if (selectedElements.length === 0) {
    return <div className="h-[44px]"></div>;
  }

  // FIX: Broaden the accepted key type to include keys from both TextElement and ImageElement, and return 'any' to accommodate various property types.
  const getCommonPropertyValue = (key: keyof TextElement | keyof ImageElement): any => {
    if (selectedElements.length === 0) return undefined;
    const firstElement = selectedElements[0] as any;
    const firstValue = firstElement[key];
    const allSame = selectedElements.every(el => (el as any)[key] === firstValue);
    return allSame ? firstValue : 'mixed';
  };

  const handleUpdate = (key: keyof TextElement | keyof ImageElement, value: any) => {
    let parsedValue = value;
    if ((key === 'fontSize' || key === 'rotation' || key === 'lineHeight')) {
        if (typeof value === 'string' && value === '') {
            return; // Don't update if number input is cleared
        }
        parsedValue = (key === 'lineHeight') ? parseFloat(value) : parseInt(value, 10);
        if (isNaN(parsedValue)) return;
    }
    onUpdateElements({ [key]: parsedValue } as Partial<CanvasElement>);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleUpdate('src', reader.result as string);
            setIsReplaceModalOpen(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleUrlReplace = () => {
    if (imageUrl.trim()) {
        handleUpdate('src', imageUrl.trim());
        setIsReplaceModalOpen(false);
        setImageUrl('');
    }
  };
  
  const renderTextTools = () => {
    if (selectionType !== 'text') return null;

    const commonFontFamily = getCommonPropertyValue('fontFamily');
    const commonFontSize = getCommonPropertyValue('fontSize');
    const commonLineHeight = getCommonPropertyValue('lineHeight');
    const commonFontWeight = getCommonPropertyValue('fontWeight');
    const commonTextAlign = getCommonPropertyValue('textAlign');
    const commonColor = getCommonPropertyValue('color');

    return (
      <div className="flex items-center space-x-4 h-full animate-fade-in" role="toolbar" aria-label="Text Formatting Toolbar">
        <ToolWrapper>
          <ToolLabel htmlFor="fontFamily">Font</ToolLabel>
          <select id="fontFamily" value={commonFontFamily === 'mixed' ? '' : commonFontFamily} onChange={(e) => handleUpdate('fontFamily', e.target.value)}
            className="bg-gray-700 rounded p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {commonFontFamily === 'mixed' && <option value="" disabled>Mixed</option>}
            {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
          </select>
        </ToolWrapper>
        
        <ToolWrapper>
           <ToolLabel htmlFor="fontSize">Size</ToolLabel>
           <input id="fontSize" type="number" 
             value={commonFontSize === 'mixed' ? '' : commonFontSize} 
             placeholder={commonFontSize === 'mixed' ? 'Mixed' : ''}
             onChange={(e) => handleUpdate('fontSize', e.target.value)}
             className="bg-gray-700 rounded p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </ToolWrapper>

        <ToolWrapper>
           <ToolLabel htmlFor="lineHeight">Line-H</ToolLabel>
           <input id="lineHeight" type="number" step="0.1" 
             value={commonLineHeight === 'mixed' ? '' : commonLineHeight}
             placeholder={commonLineHeight === 'mixed' ? 'Mixed' : ''}
             onChange={(e) => handleUpdate('lineHeight', e.target.value)}
             className="bg-gray-700 rounded p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </ToolWrapper>
        
        <ToolWrapper>
           <ToolLabel>Style</ToolLabel>
           <button onClick={() => handleUpdate('fontWeight', commonFontWeight === 'bold' ? 'normal' : 'bold')}
             className={`px-3 py-1 rounded font-bold text-sm transition-colors ${commonFontWeight === 'bold' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'} ${commonFontWeight === 'mixed' ? 'bg-gray-500' : ''}`}
             aria-pressed={commonFontWeight === 'mixed' ? 'mixed' : commonFontWeight === 'bold'}
             aria-label="Toggle Bold">B</button>
        </ToolWrapper>

        <ToolWrapper>
            <ToolLabel>Align</ToolLabel>
            <div className="flex bg-gray-700 rounded">
                {TEXT_ALIGN_OPTIONS.map(({value, label}) => (
                     <button key={value} onClick={() => handleUpdate('textAlign', value)} 
                        className={`px-3 py-1 text-sm rounded transition-colors ${commonTextAlign === value ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
                        aria-pressed={commonTextAlign === value}
                        aria-label={label}
                     >
                        {value.charAt(0).toUpperCase()}
                     </button>
                ))}
            </div>
        </ToolWrapper>

        <ToolWrapper>
            <ToolLabel htmlFor="color">Color</ToolLabel>
            <input id="color" type="color" 
              value={commonColor === 'mixed' ? '#ffffff' : commonColor}
              onChange={(e) => handleUpdate('color', e.target.value)}
              className="bg-gray-700 rounded p-0.5 h-8 w-8 cursor-pointer border-2 border-transparent hover:border-blue-500" 
              style={{ opacity: commonColor === 'mixed' ? 0.5 : 1 }}
              aria-label="Text Color" />
        </ToolWrapper>
      </div>
    );
  };
  
  const renderImageTools = () => {
    if (selectionType !== 'image') return null;
    
    const commonRotation = getCommonPropertyValue('rotation');
    const commonFlipH = getCommonPropertyValue('flipHorizontal');
    const commonFlipV = getCommonPropertyValue('flipVertical');

    return (
      <>
        <div className="flex items-center space-x-4 h-full animate-fade-in" role="toolbar" aria-label="Image Formatting Toolbar">
            {singleSelectedElement && (
              <ToolWrapper>
                  <button 
                      onClick={() => setIsReplaceModalOpen(true)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-semibold transition-colors"
                      aria-label="Replace Image"
                  >
                      Replace
                  </button>
              </ToolWrapper>
            )}
            <ToolWrapper>
            <ToolLabel htmlFor="rotation">Rotate</ToolLabel>
            <div className="flex items-center bg-gray-700 rounded p-1">
                <input id="rotation" type="range" min="0" max="360" 
                    value={commonRotation === 'mixed' ? 0 : commonRotation} 
                    style={{ opacity: commonRotation === 'mixed' ? 0.5 : 1 }}
                    onChange={(e) => handleUpdate('rotation', e.target.value)} 
                    className="w-32" 
                    aria-label="Rotation slider"
                />
                <input type="number" 
                    value={commonRotation === 'mixed' ? '' : commonRotation}
                    placeholder={commonRotation === 'mixed' ? 'Mixed' : ''}
                    onChange={(e) => handleUpdate('rotation', e.target.value)}
                    className="bg-gray-800 rounded p-1 text-sm w-16 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    aria-label="Rotation degrees"
                />
            </div>
            </ToolWrapper>
            <ToolWrapper>
            <ToolLabel>Flip</ToolLabel>
            <div className="flex bg-gray-700 rounded">
                <button
                    onClick={() => handleUpdate('flipHorizontal', !commonFlipH)}
                    className={`px-3 py-1 text-sm rounded-l transition-colors ${commonFlipH ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'} ${commonFlipH === 'mixed' ? 'bg-gray-500' : ''}`}
                    // FIX: Coerce 'any' type to boolean for aria-pressed to satisfy its type requirement (boolean | 'mixed' | 'true' | 'false').
                    aria-pressed={commonFlipH === 'mixed' ? 'mixed' : !!commonFlipH}
                    aria-label="Flip Horizontal"
                    title="Flip Horizontal"
                >
                    ↔
                </button>
                <button
                    onClick={() => handleUpdate('flipVertical', !commonFlipV)}
                    className={`px-3 py-1 text-sm rounded-r transition-colors ${commonFlipV ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'} ${commonFlipV === 'mixed' ? 'bg-gray-500' : ''}`}
                    // FIX: Coerce 'any' type to boolean for aria-pressed to satisfy its type requirement (boolean | 'mixed' | 'true' | 'false').
                    aria-pressed={commonFlipV === 'mixed' ? 'mixed' : !!commonFlipV}
                    aria-label="Flip Vertical"
                    title="Flip Vertical"
                >
                    ↕
                </button>
            </div>
            </ToolWrapper>
        </div>

        {isReplaceModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsReplaceModalOpen(false)}
          >
            <div 
              className="bg-gray-800 rounded-lg shadow-xl p-6 w-96 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Replace Image</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">From URL</label>
                <div className="flex">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="flex-grow bg-gray-900 border border-gray-700 rounded-l-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUrlReplace}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="flex-shrink mx-4 text-gray-500">OR</span>
                  <div className="flex-grow border-t border-gray-700"></div>
              </div>
              
              <button
                onClick={triggerFileUpload}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Upload from device
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const renderArrangeTools = () => {
    const isAtFront = singleSelectedElement ? elementIndex === totalElements - 1 : false;
    const isAtBack = singleSelectedElement ? elementIndex === 0 : false;
    const canMoveFront = selectedElementIds.length > 0 && !elements.every((el, idx) => selectedElementIds.includes(el.id) || idx < totalElements - selectedElementIds.length);
    const canMoveBack = selectedElementIds.length > 0 && !elements.every((el, idx) => selectedElementIds.includes(el.id) || idx >= selectedElementIds.length);
    
    return (
        <div className="flex items-center space-x-4 h-full animate-fade-in" role="toolbar" aria-label="Arrange Toolbar">
            {selectedElements.length > 1 && (
                 <button onClick={onGroup} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition-colors">Group</button>
            )}
             {singleSelectedElement?.type === 'group' && (
                <button onClick={onUngroup} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition-colors">Ungroup</button>
            )}
            <div className="h-6 w-px bg-gray-600"></div>
            <ToolWrapper>
                <ToolLabel>Arrange</ToolLabel>
                <div className="flex bg-gray-700 rounded">
                    <button onClick={() => onReorder('backward')} disabled={isAtBack || !singleSelectedElement} title="Send Backward" aria-label="Send Backward"
                        className="px-3 py-1 text-sm rounded-l transition-colors hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed">
                        ↓
                    </button>
                    <button onClick={() => onReorder('forward')} disabled={isAtFront || !singleSelectedElement} title="Bring Forward" aria-label="Bring Forward"
                        className="px-3 py-1 text-sm transition-colors hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed">
                        ↑
                    </button>
                    <button onClick={() => onReorder('back')} disabled={!canMoveBack} title="Send to Back" aria-label="Send to Back"
                        className="px-3 py-1 text-sm transition-colors hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed">
                        ⇊
                    </button>
                    <button onClick={() => onReorder('front')} disabled={!canMoveFront} title="Bring to Front" aria-label="Bring to Front"
                        className="px-3 py-1 text-sm rounded-r transition-colors hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed">
                        ⇈
                    </button>
                </div>
            </ToolWrapper>
        </div>
    );
  }
  
  const renderMultiSelectTools = () => {
      return (
        <div className="flex items-center space-x-4 h-full animate-fade-in">
            <p className="text-sm text-gray-300">{selectedElements.length} items selected ({selectionType})</p>
        </div>
      )
  }

  return (
    <div className="w-full flex justify-center items-center px-4 space-x-6">
      {selectionType === 'text' && renderTextTools()}
      {selectionType === 'image' && renderImageTools()}
      {selectionType === 'mixed' && renderMultiSelectTools()}
      {selectionType === 'group' && <p className="text-sm text-gray-300">Group Selected</p>}
      {selectedElements.length > 0 && renderArrangeTools()}
    </div>
  );
};
export default ContextualToolbar;