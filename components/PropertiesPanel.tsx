import React, { useRef } from 'react';
import { CanvasElement, TextElement, ImageElement, ShapeElement, ElementType } from '../types';
import Accordion from './Accordion';
import FontSelector from './FontSelector';

const NumberInput: React.FC<{
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
}> = ({ label, value, onChange, suffix, step = 1 }) => (
  <div className="flex items-center justify-between">
    <label className="text-xs text-gray-400">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={value !== undefined ? Math.round(value) : ''}
        placeholder={value === undefined ? 'Mixed' : ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-24 bg-gray-800 border border-gray-700 rounded-md p-1 pl-2 pr-6 text-sm text-right placeholder-gray-500"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">{suffix}</span>}
    </div>
  </div>
);

const ColorInput: React.FC<{
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <div className="flex items-center space-x-2">
            <input
                type="color"
                value={value === 'transparent' ? '#000000' : (value || '#ffffff')}
                onChange={(e) => onChange(e.target.value)}
                className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-gray-800"
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
            />
             <input
                type="text"
                value={value ?? ''}
                placeholder={value === undefined ? 'Mixed' : ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-md p-1 text-sm placeholder-gray-500"
            />
        </div>
    </div>
);


const SelectInput: React.FC<{
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-32 bg-gray-800 border border-gray-700 rounded-md p-1 text-sm ${value === undefined ? 'text-gray-500' : ''}`}
        >
            {value === undefined && <option value="" disabled>Mixed</option>}
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

interface PropertiesPanelProps {
  selectedElementIds: string[];
  elements: CanvasElement[];
  onUpdateElements: (updates: Partial<CanvasElement>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElementIds, elements, onUpdateElements }) => {
  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (selectedElements.length === 0) {
    return null;
  }
  
  const commonType = selectedElements.length > 0 && selectedElements.every(el => el.type === selectedElements[0].type)
    ? selectedElements[0].type
    : null;
    
  const commonProps = selectedElements.reduce((acc, el, index) => {
      if (index === 0) return { ...el };
      Object.keys(acc).forEach(key => {
          if ((acc as any)[key] !== (el as any)[key]) {
              (acc as any)[key] = undefined;
          }
      });
      return acc;
  }, {} as Partial<CanvasElement> & { type?: ElementType });

  const handleUpdate = (updates: Partial<CanvasElement>) => {
    onUpdateElements(updates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          handleUpdate({ src: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const renderTextProperties = (element: Partial<TextElement>) => (
    <>
        <FontSelector
          value={element.fontFamily}
          onChange={v => handleUpdate({ fontFamily: v })}
        />
        <NumberInput label="Font Size" value={element.fontSize} onChange={v => handleUpdate({ fontSize: v })} suffix="px" />
        <ColorInput label="Color" value={element.color} onChange={v => handleUpdate({ color: v })} />
        <div className="flex space-x-2">
            <button title="Bold" onClick={() => handleUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`w-full p-1 rounded font-bold ${element.fontWeight === 'bold' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>B</button>
            <button title="Italic" onClick={() => handleUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`w-full p-1 rounded italic ${element.fontStyle === 'italic' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>I</button>
            <button title="Underline" onClick={() => handleUpdate({ underline: !element.underline })} className={`w-full p-1 rounded underline ${element.underline ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>U</button>
            <button title="Strikethrough" onClick={() => handleUpdate({ strikethrough: !element.strikethrough })} className={`w-full p-1 rounded line-through ${element.strikethrough ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>S</button>
            <button title="Uppercase" onClick={() => handleUpdate({ textTransform: element.textTransform === 'uppercase' ? 'none' : 'uppercase' })} className={`w-full p-1 rounded ${element.textTransform === 'uppercase' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>TT</button>
        </div>
        <NumberInput label="Line Height" value={element.lineHeight} onChange={v => handleUpdate({ lineHeight: v })} step={0.1} />
        <NumberInput label="Spacing" value={element.letterSpacing} onChange={v => handleUpdate({ letterSpacing: v })} suffix="px" />
        <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Align</label>
            <div className="flex space-x-1 bg-gray-800 border border-gray-700 rounded-md p-0.5">
                <button
                    onClick={() => handleUpdate({ textAlign: 'left' })}
                    className={`p-1.5 rounded-sm ${element.textAlign === 'left' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
                    title="Align Left"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 15h12v2H3v-2zm0-5h18v2H3v-2zm0-5h12v2H3V9z"></path></svg>
                </button>
                <button
                    onClick={() => handleUpdate({ textAlign: 'center' })}
                    className={`p-1.5 rounded-sm ${element.textAlign === 'center' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
                    title="Align Center"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm3 15h12v2H6v-2zm-3-5h18v2H3v-2zm3-5h12v2H6V9z"></path></svg>
                </button>
                <button
                    onClick={() => handleUpdate({ textAlign: 'right' })}
                    className={`p-1.5 rounded-sm ${element.textAlign === 'right' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
                    title="Align Right"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm9 15h9v2h-9v-2zm-9-5h18v2H3v-2zm9-5h9v2h-9V9z"></path></svg>
                </button>
            </div>
        </div>
    </>
  );

  const renderImageProperties = (element: Partial<ImageElement>) => (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors text-sm"
      >
        Replace Image
      </button>
      <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => handleUpdate({ flipHorizontal: !element.flipHorizontal })} className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600">Flip Horizontal</button>
          <button onClick={() => handleUpdate({ flipVertical: !element.flipVertical })} className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600">Flip Vertical</button>
      </div>
    </>
  );
  
  const renderShapeProperties = (element: Partial<ShapeElement>) => (
      <>
        <ColorInput label="Fill" value={element.fill} onChange={v => handleUpdate({ fill: v })} />
        <ColorInput label="Stroke" value={element.stroke} onChange={v => handleUpdate({ stroke: v })} />
        <NumberInput label="Stroke Width" value={element.strokeWidth} onChange={v => handleUpdate({ strokeWidth: v })} suffix="px" />
        <SelectInput label="Stroke Style" value={element.strokeDash} onChange={v => handleUpdate({ strokeDash: v as ShapeElement['strokeDash'] })} options={[
             { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' },
        ]} />
      </>
  );

  return (
    <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <NumberInput label="X" value={commonProps.x} onChange={v => handleUpdate({ x: v })} />
            <NumberInput label="Y" value={commonProps.y} onChange={v => handleUpdate({ y: v })} />
            <NumberInput label="W" value={commonProps.width} onChange={v => handleUpdate({ width: v })} />
            <NumberInput label="H" value={commonProps.height} onChange={v => handleUpdate({ height: v })} />
            <NumberInput label="Rotation" value={commonProps.rotation} onChange={v => handleUpdate({ rotation: v })} suffix="°" />
            <NumberInput label="Radius" value={commonProps.borderRadius} onChange={v => handleUpdate({ borderRadius: v })} suffix="px" />
        </div>

        {commonType && (
            <div className="border-t border-gray-700 pt-3 space-y-3">
                {commonType === 'text' && renderTextProperties(commonProps as Partial<TextElement>)}
                {commonType === 'image' && renderImageProperties(commonProps as Partial<ImageElement>)}
                {commonType === 'shape' && renderShapeProperties(commonProps as Partial<ShapeElement>)}
            </div>
        )}

        <div className="border-t border-gray-700">
            <Accordion title="Shadow">
                <div className="space-y-3 pt-2">
                    <NumberInput label="Offset X" value={commonProps.shadowOffsetX ?? 0} onChange={v => handleUpdate({ shadowOffsetX: v })} suffix="px" />
                    <NumberInput label="Offset Y" value={commonProps.shadowOffsetY ?? 0} onChange={v => handleUpdate({ shadowOffsetY: v })} suffix="px" />
                    <NumberInput label="Blur" value={commonProps.shadowBlur ?? 0} onChange={v => handleUpdate({ shadowBlur: v })} suffix="px" />
                    <ColorInput label="Color" value={commonProps.shadowColor ?? 'rgba(0,0,0,0.5)'} onChange={v => handleUpdate({ shadowColor: v })} />
                </div>
            </Accordion>
        </div>
    </div>
  );
};

export default PropertiesPanel;