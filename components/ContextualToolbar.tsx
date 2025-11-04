import React, { useState, useRef, useMemo } from 'react';
import { CanvasElement, TextElement, ImageElement, ShapeElement } from '../types';

interface ContextualToolbarProps {
  selectedElementIds: string[];
  elements: CanvasElement[];
  onUpdateElements: (updates: Partial<CanvasElement>) => void;
  onAlignOrDistribute: (operation: 'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom' | 'distribute-horizontal' | 'distribute-vertical') => void;
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

const ColorInputWithNone: React.FC<{
  id: string;
  value: string; // color hex, 'transparent', or 'mixed'
  onUpdate: (value: string) => void;
}> = ({ id, value, onUpdate }) => {
  const isMixed = value === 'mixed';
  const isTransparent = value === 'transparent';

  return (
    <div className="flex items-center bg-gray-700 rounded">
      <input
        id={id}
        type="color"
        value={isMixed || isTransparent ? '#000000' : value}
        onChange={(e) => onUpdate(e.target.value)}
        className="bg-transparent p-0.5 h-8 w-8 cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-l"
        style={{ opacity: isMixed ? 0.5 : 1 }}
        aria-label="Color Picker"
      />
      <button
        onClick={() => onUpdate('transparent')}
        className={`w-8 h-8 flex items-center justify-center rounded-r transition-colors ${
          isTransparent ? 'bg-blue-600' : 'hover:bg-gray-600'
        }`}
        title="No color / Transparent"
        aria-pressed={isTransparent}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
            <line x1="15" y1="1" x2="1" y2="15" />
        </svg>
      </button>
    </div>
  );
};

const AlignButton: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, disabled = false, children }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    disabled={disabled}
    className="p-2 rounded transition-colors hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);


const ContextualToolbar: React.FC<ContextualToolbarProps> = ({ selectedElementIds, elements, onUpdateElements, onAlignOrDistribute }) => {
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

  const getCommonPropertyValue = (key: keyof TextElement | keyof ImageElement | keyof ShapeElement): any => {
    if (selectedElements.length === 0) return undefined;
    const firstElement = selectedElements[0] as any;
    const firstValue = firstElement[key];
    const allSame = selectedElements.every(el => (el as any)[key] === firstValue);
    return allSame ? firstValue : 'mixed';
  };

  const handleUpdate = (key: keyof TextElement | keyof ImageElement | keyof ShapeElement | 'opacity', value: any) => {
    let parsedValue = value;
    const numberKeys: string[] = ['fontSize', 'rotation', 'lineHeight', 'strokeWidth', 'sides', 'points', 'innerRadiusRatio', 'opacity'];
    if (numberKeys.includes(key)) {
        if (typeof value === 'string' && value === '') {
            return; // Don't update if number input is cleared
        }
        parsedValue = (key === 'lineHeight' || key === 'innerRadiusRatio' || key === 'opacity') ? parseFloat(value) : parseInt(value, 10);
        if (isNaN(parsedValue)) return;
    }

    if (key === 'strokeWidth' && selectedElements.every(el => (el as ShapeElement).shapeType === 'line')) {
        onUpdateElements({ [key]: parsedValue, height: parsedValue } as Partial<CanvasElement>);
    } else {
        onUpdateElements({ [key]: parsedValue } as Partial<CanvasElement>);
    }
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
                    aria-pressed={commonFlipH === 'mixed' ? 'mixed' : !!commonFlipH}
                    aria-label="Flip Horizontal"
                    title="Flip Horizontal"
                >
                    ↔
                </button>
                <button
                    onClick={() => handleUpdate('flipVertical', !commonFlipV)}
                    className={`px-3 py-1 text-sm rounded-r transition-colors ${commonFlipV ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'} ${commonFlipV === 'mixed' ? 'bg-gray-500' : ''}`}
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

  const renderShapeTools = () => {
    if (selectionType !== 'shape') return null;

    const commonFill = getCommonPropertyValue('fill');
    const commonStroke = getCommonPropertyValue('stroke');
    const commonStrokeWidth = getCommonPropertyValue('strokeWidth');
    const commonStrokeDash = getCommonPropertyValue('strokeDash') || 'solid';

    const singleSelectedShape = singleSelectedElement as ShapeElement | null;
    const isLine = selectedElements.every(el => (el as ShapeElement).shapeType === 'line');
    
    const STROKE_DASH_OPTIONS: { value: 'solid' | 'dashed' | 'dotted'; icon: string }[] = [
        { value: 'solid', icon: '—' },
        { value: 'dashed', icon: '- -' },
        { value: 'dotted', icon: '· ·' }
    ];

    return (
        <div className="flex items-center space-x-4 h-full animate-fade-in" role="toolbar" aria-label="Shape Formatting Toolbar">
            {!isLine && (
                <ToolWrapper>
                    <ToolLabel htmlFor="fillColor">Fill</ToolLabel>
                    <ColorInputWithNone id="fillColor" value={commonFill} onUpdate={v => handleUpdate('fill', v)} />
                </ToolWrapper>
            )}

            <ToolWrapper>
                <ToolLabel htmlFor="strokeColor">Stroke</ToolLabel>
                <ColorInputWithNone id="strokeColor" value={commonStroke} onUpdate={v => handleUpdate('stroke', v)} />
            </ToolWrapper>

            <ToolWrapper>
                <ToolLabel htmlFor="strokeWidth">Width</ToolLabel>
                <input id="strokeWidth" type="number" min="0"
                    value={commonStrokeWidth === 'mixed' ? '' : commonStrokeWidth}
                    placeholder={commonStrokeWidth === 'mixed' ? 'Mixed' : ''}
                    onChange={(e) => handleUpdate('strokeWidth', e.target.value)}
                    className="bg-gray-700 rounded p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </ToolWrapper>
            
            <ToolWrapper>
                <ToolLabel>Style</ToolLabel>
                <div className="flex bg-gray-700 rounded">
                    {STROKE_DASH_OPTIONS.map(({ value, icon }) => (
                    <button
                        key={value}
                        onClick={() => handleUpdate('strokeDash', value)}
                        className={`px-3 py-1 text-sm rounded transition-colors font-mono ${commonStrokeDash === value ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'} ${commonStrokeDash === 'mixed' ? 'bg-gray-500' : ''}`}
                        aria-pressed={commonStrokeDash === 'mixed' ? 'mixed' : commonStrokeDash === value}
                        title={value.charAt(0).toUpperCase() + value.slice(1)}
                    >
                        {icon}
                    </button>
                    ))}
                </div>
            </ToolWrapper>
            
            {singleSelectedShape?.shapeType === 'polygon' && (
                <ToolWrapper>
                    <ToolLabel htmlFor="sides">Sides</ToolLabel>
                    <input id="sides" type="number" min="3" max="12"
                        value={singleSelectedShape.sides || 6}
                        onChange={(e) => handleUpdate('sides', e.target.value)}
                        className="bg-gray-700 rounded p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </ToolWrapper>
            )}

            {singleSelectedShape?.shapeType === 'star' && (
                <>
                    <ToolWrapper>
                        <ToolLabel htmlFor="points">Points</ToolLabel>
                        <input id="points" type="number" min="3" max="20"
                            value={singleSelectedShape.points || 5}
                            onChange={(e) => handleUpdate('points', e.target.value)}
                            className="bg-gray-700 rounded p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </ToolWrapper>
                    <ToolWrapper>
                        <ToolLabel htmlFor="innerRadiusRatio">Ratio</ToolLabel>
                        <input id="innerRadiusRatio" type="number" min="0.1" max="0.9" step="0.1"
                            value={singleSelectedShape.innerRadiusRatio || 0.5}
                            onChange={(e) => handleUpdate('innerRadiusRatio', e.target.value)}
                            className="bg-gray-700 rounded p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </ToolWrapper>
                </>
            )}
        </div>
    );
  };
  
  const renderAlignmentTools = () => {
    const isAnyLocked = useMemo(() => selectedElements.some(el => el.locked), [selectedElements]);
    const canDistribute = selectedElements.length > 2;
    return (
        <div className="flex items-center space-x-2 h-full animate-fade-in" role="toolbar" aria-label="Alignment Toolbar">
            <p className="text-sm text-gray-300 pr-2">{selectedElements.length} items selected</p>
            <div className="h-6 w-px bg-gray-600"></div>

            <ToolWrapper>
                <div className="flex bg-gray-700 rounded">
                    <AlignButton label="Align Left" onClick={() => onAlignOrDistribute('align-left')} disabled={isAnyLocked}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3h2v14H3V3zm4 2h8v3H7V5zm0 7h5v3H7v-3z"/></svg>
                    </AlignButton>
                    <AlignButton label="Align Center" onClick={() => onAlignOrDistribute('align-center')} disabled={isAnyLocked}>
                       <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M9 3h2v14H9V3zm-2.5-1h8v3h-8V2zm-1.5 7h11v3h-11v-3zm2 5h7v3h-7v-3z" transform="translate(0, 1) rotate(90 10 10) translate(0, -1)" /></svg>
                    </AlignButton>
                    <AlignButton label="Align Right" onClick={() => onAlignOrDistribute('align-right')} disabled={isAnyLocked}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M15 3h2v14h-2V3zm-4 2h-8v3h8V5zm0 7h-5v3h5v-3z"/></svg>
                    </AlignButton>
                    <AlignButton label="Align Top" onClick={() => onAlignOrDistribute('align-top')} disabled={isAnyLocked}>
                       <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3h14v2H3V3zm2 4h3v8H5V7zm7 0h3v5h-3V7z"/></svg>
                    </AlignButton>
                     <AlignButton label="Align Middle" onClick={() => onAlignOrDistribute('align-middle')} disabled={isAnyLocked}>
                       <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 9h14v2H3V9zM5 4h3v4H5V4zm7 5h3v4h-3V9z"/></svg>
                    </AlignButton>
                    <AlignButton label="Align Bottom" onClick={() => onAlignOrDistribute('align-bottom')} disabled={isAnyLocked}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 15h14v2H3v-2zm2-2h3V5H5v8zm7 0h3V8h-3v5z"/></svg>
                    </AlignButton>
                </div>
            </ToolWrapper>
             <div className="h-6 w-px bg-gray-600"></div>
            <ToolWrapper>
                 <div className="flex bg-gray-700 rounded">
                    <AlignButton label="Distribute Horizontally" onClick={() => onAlignOrDistribute('distribute-horizontal')} disabled={isAnyLocked || !canDistribute}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h2v12H3V4zm5.5 2h3v8h-3V6zm5.5 0h3v8h-3V6zm5.5-2h2v12h-2V4z" transform="rotate(90 10 10)"/></svg>
                    </AlignButton>
                    <AlignButton label="Distribute Vertically" onClick={() => onAlignOrDistribute('distribute-vertical')} disabled={isAnyLocked || !canDistribute}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3h12v2H4V3zm2 5.5h8v3H6v-3zm0 5.5h8v3H6v-3zm-2 5.5h12v2H4v-2z" transform="rotate(90 10 10)"/></svg>
                    </AlignButton>
                 </div>
            </ToolWrapper>
        </div>
    );
  };

  const renderArrangeTools = () => {
    const commonOpacity = getCommonPropertyValue('opacity');
    const opacityValue = commonOpacity === 'mixed' ? 1 : (commonOpacity ?? 1);

    return (
        <div className="flex items-center space-x-4 h-full animate-fade-in" role="toolbar" aria-label="Arrange Toolbar">
            <ToolWrapper>
                <ToolLabel htmlFor="opacity">Opacity</ToolLabel>
                <div className="flex items-center bg-gray-700 rounded">
                    <input id="opacity" type="range" min="0" max="1" step="0.01" 
                        value={opacityValue}
                        style={{ opacity: commonOpacity === 'mixed' ? 0.5 : 1 }}
                        onChange={(e) => handleUpdate('opacity', e.target.value)}
                        className="w-24 p-1"
                        aria-label="Opacity slider"
                    />
                    <input type="number"
                        min="0" max="100"
                        value={commonOpacity === 'mixed' ? '' : Math.round(opacityValue * 100)}
                        placeholder={commonOpacity === 'mixed' ? 'Mixed' : ''}
                        onChange={(e) => handleUpdate('opacity', (parseInt(e.target.value, 10) || 0) / 100)}
                        className="bg-gray-800 rounded-r p-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Opacity percentage"
                    />
                </div>
            </ToolWrapper>
        </div>
    );
  }
  
  return (
    <div className="w-full flex justify-center items-center px-4 space-x-6">
      {selectedElements.length === 1 && selectionType === 'text' && renderTextTools()}
      {selectedElements.length === 1 && selectionType === 'image' && renderImageTools()}
      {selectedElements.length === 1 && selectionType === 'shape' && renderShapeTools()}
      {selectedElements.length === 1 && singleSelectedElement?.type === 'group' && <p className="text-sm text-gray-300">Group Selected</p>}
      {selectedElements.length > 1 && renderAlignmentTools()}
      {selectedElements.length > 0 && renderArrangeTools()}
    </div>
  );
};
export default ContextualToolbar;