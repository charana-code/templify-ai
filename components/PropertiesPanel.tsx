import React from 'react';
import { CanvasElement, TextElement, ImageElement, ShapeElement } from '../types';

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
}> = ({ label, value, onChange, suffix, step = 1 }) => (
  <div className="flex items-center justify-between">
    <label className="text-xs text-gray-400">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-24 bg-gray-800 border border-gray-700 rounded-md p-1 pl-2 pr-6 text-sm text-right"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">{suffix}</span>}
    </div>
  </div>
);

const ColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <div className="flex items-center space-x-2">
            <input
                type="color"
                value={value === 'transparent' ? '#000000' : value}
                onChange={(e) => onChange(e.target.value)}
                className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-gray-800"
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
            />
             <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-md p-1 text-sm"
            />
        </div>
    </div>
);


const SelectInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-32 bg-gray-800 border border-gray-700 rounded-md p-1 text-sm"
        >
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
  const singleSelectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  if (selectedElements.length === 0) {
    return null;
  }
  
  const commonProps = selectedElements.reduce((acc, el, index) => {
      if (index === 0) return { ...el };
      Object.keys(acc).forEach(key => {
          if ((acc as any)[key] !== (el as any)[key]) {
              (acc as any)[key] = undefined;
          }
      });
      return acc;
  }, {} as Partial<CanvasElement>);

  const handleUpdate = (updates: Partial<CanvasElement>) => {
    onUpdateElements(updates);
  };

  const renderTextProperties = (element: TextElement) => (
    <>
        <NumberInput label="Font Size" value={element.fontSize} onChange={v => handleUpdate({ fontSize: v })} suffix="px" />
        <ColorInput label="Color" value={element.color} onChange={v => handleUpdate({ color: v })} />
        <SelectInput label="Font Family" value={element.fontFamily} onChange={v => handleUpdate({ fontFamily: v })} options={[
             { value: 'Arial', label: 'Arial' },
             { value: 'Verdana', label: 'Verdana' },
             { value: 'Georgia', label: 'Georgia' },
             { value: 'Times New Roman', label: 'Times New Roman' },
             { value: 'Courier New', label: 'Courier New' },
        ]} />
        <div className="flex space-x-2">
            <button onClick={() => handleUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`w-full p-1 rounded ${element.fontWeight === 'bold' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>B</button>
            <button onClick={() => handleUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`w-full p-1 rounded ${element.fontStyle === 'italic' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>I</button>
            <button onClick={() => handleUpdate({ textTransform: element.textTransform === 'uppercase' ? 'none' : 'uppercase' })} className={`w-full p-1 rounded ${element.textTransform === 'uppercase' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>TT</button>
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

  const renderImageProperties = (element: ImageElement) => (
    <div className="grid grid-cols-2 gap-2">
        <button onClick={() => handleUpdate({ flipHorizontal: !element.flipHorizontal })} className="p-2 bg-gray-700 rounded">Flip H</button>
        <button onClick={() => handleUpdate({ flipVertical: !element.flipVertical })} className="p-2 bg-gray-700 rounded">Flip V</button>
    </div>
  );
  
  const renderShapeProperties = (element: ShapeElement) => (
      <>
        <ColorInput label="Fill" value={element.fill} onChange={v => handleUpdate({ fill: v })} />
        <ColorInput label="Stroke" value={element.stroke} onChange={v => handleUpdate({ stroke: v })} />
        <NumberInput label="Stroke Width" value={element.strokeWidth} onChange={v => handleUpdate({ strokeWidth: v })} suffix="px" />
        <SelectInput label="Stroke Style" value={element.strokeDash ?? 'solid'} onChange={v => handleUpdate({ strokeDash: v as ShapeElement['strokeDash'] })} options={[
             { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' },
        ]} />
      </>
  );

  return (
    <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <NumberInput label="X" value={commonProps.x ?? 0} onChange={v => handleUpdate({ x: v })} />
            <NumberInput label="Y" value={commonProps.y ?? 0} onChange={v => handleUpdate({ y: v })} />
            <NumberInput label="W" value={commonProps.width ?? 0} onChange={v => handleUpdate({ width: v })} />
            <NumberInput label="H" value={commonProps.height ?? 0} onChange={v => handleUpdate({ height: v })} />
            <NumberInput label="Rotation" value={commonProps.rotation ?? 0} onChange={v => handleUpdate({ rotation: v })} suffix="°" />
             <NumberInput label="Opacity" value={(commonProps.opacity ?? 1) * 100} onChange={v => handleUpdate({ opacity: v / 100 })} suffix="%" />
        </div>

        {singleSelectedElement && <div className="border-t border-gray-700 pt-3 mt-3 space-y-3">
            {singleSelectedElement.type === 'text' && renderTextProperties(singleSelectedElement)}
            {singleSelectedElement.type === 'image' && renderImageProperties(singleSelectedElement)}
            {singleSelectedElement.type === 'shape' && renderShapeProperties(singleSelectedElement)}
        </div>}
    </div>
  );
};

export default PropertiesPanel;