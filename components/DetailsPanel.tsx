import React, { useState, useRef } from 'react';
import { CanvasElement, TextElement, ShapeElement } from '../types';
import { generateImageWithAI, editImageWithAI } from '../services/geminiService';
import Accordion from './Accordion';

const DraggableTextPreset: React.FC<{
  label: string;
  element: Omit<TextElement, 'id' | 'x' | 'y' | 'rotation'>;
}> = ({ label, element }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', element }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors text-center"
      style={{
        fontSize: `${element.fontSize}px`,
        fontWeight: element.fontWeight,
        fontFamily: element.fontFamily,
      }}
    >
      {label}
    </div>
  );
};

const DraggableTemplateItem: React.FC<{ name: string; elements: any[] }> = ({ name, elements }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'template', elements }));
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="flex flex-col items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors"
        >
            <span className="text-3xl">📄</span>
            <span className="mt-1 text-xs text-gray-300 text-center">{name}</span>
        </div>
    );
};

const DraggableShapePreset: React.FC<{
  label: string;
  element: Omit<ShapeElement, 'id' | 'x' | 'y' | 'rotation'>;
  children: React.ReactNode;
}> = ({ label, element, children }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', element }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors flex flex-col items-center justify-center aspect-square"
    >
      {children}
      <span className="mt-2 text-xs">{label}</span>
    </div>
  );
};


const TextToolPanel = () => (
  <div className="p-4 space-y-4">
    <h3 className="text-lg font-bold text-gray-400">Add Text</h3>
    <DraggableTextPreset
      label="Add a heading"
      element={{
        type: 'text',
        content: 'Heading',
        width: 350,
        height: 70,
        fontSize: 48,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
        textTransform: 'none',
        underline: false,
        strikethrough: false,
      }}
    />
    <DraggableTextPreset
      label="Add a subheading"
      element={{
        type: 'text',
        content: 'Subheading',
        width: 300,
        height: 50,
        fontSize: 32,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#CCCCCC',
        fontFamily: 'Arial',
        textAlign: 'center',
        lineHeight: 1.3,
        letterSpacing: 0,
        textTransform: 'none',
        underline: false,
        strikethrough: false,
      }}
    />
    <DraggableTextPreset
      label="Add body text"
      element={{
        type: 'text',
        content: 'Some body text for a paragraph. You can edit this content by double-clicking on the canvas.',
        width: 250,
        height: 120,
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        textAlign: 'left',
        lineHeight: 1.5,
        letterSpacing: 0,
        textTransform: 'none',
        underline: false,
        strikethrough: false,
      }}
    />
  </div>
);

const ImageToolPanel: React.FC<{ onAddElement: (element: Omit<CanvasElement, 'id'>) => void; }> = ({ onAddElement }) => {
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [processingImageSrc, setProcessingImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageLayout, setImageLayout] = useState<'grid' | 'list'>('list');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // FIX: Use a standard for-loop with files.item(i) for safer iteration over FileList.
            // This avoids potential type inference issues with `Array.from(files)`.
            for (let i = 0; i < files.length; i++) {
                const file = files.item(i);
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            setUploadedImages(prev => [reader.result as string, ...prev]);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
            e.target.value = '';
        }
    };

    const handleDragStart = (e: React.DragEvent, src: string) => {
        const element = {
            type: 'image' as const,
            src: src,
            width: 300,
            height: 300,
            flipHorizontal: false,
            flipVertical: false,
        };
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', element }));
    };
    
    const handleGenerateClick = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const newImageSrc = await generateImageWithAI(aiPrompt);
            setUploadedImages(prev => [newImageSrc, ...prev]);
            setAiPrompt('');
        } catch (error) {
            console.error(error);
            alert("Failed to generate image. See console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemoveBackground = async (imageSrc: string, index: number) => {
        setProcessingImageSrc(imageSrc);
        try {
            const newImageSrc = await editImageWithAI(imageSrc, "Analyze the provided image and identify the main subject. Create a segmentation mask for this subject. Your final output must be a PNG image where only the segmented subject is visible and the background is fully transparent (alpha channel value of 0). It is critical that you do not render a checkerboard or any other pattern in place of the background.");
            setUploadedImages(prev => prev.map((src, i) => (i === index ? newImageSrc : src)));
        } catch (error) {
            console.error(error);
            alert("Failed to remove background. See console for details.");
        } finally {
            setProcessingImageSrc(null);
        }
    };
    
    const handleDeleteImage = (indexToDelete: number) => {
        setUploadedImages(prev => prev.filter((_, index) => index !== indexToDelete));
    };


    return (
        <div className="p-4 flex flex-col h-full">
            <div className="shrink-0">
                <Accordion title="Generate with AI" defaultOpen>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., a blue robot holding a red skateboard"
                      className="w-full h-24 bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     <button
                      onClick={handleGenerateClick}
                      disabled={isGenerating}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Image'}
                    </button>
                </Accordion>
            </div>
            
            <div className="flex flex-col flex-grow min-h-0 pt-4 space-y-2">
                <div className="flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-gray-400">Your Images</h3>
                     <div className="flex items-center space-x-2">
                        {uploadedImages.length > 0 && (
                            <div className="flex items-center space-x-1 p-0.5 bg-gray-800 rounded-md border border-gray-700">
                                <button
                                    onClick={() => setImageLayout('list')}
                                    className={`p-1 rounded ${imageLayout === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
                                    title="List view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setImageLayout('grid')}
                                    className={`p-1 rounded ${imageLayout === 'grid' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
                                    title="Grid view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                            title="Upload new images"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    multiple
                />

                {uploadedImages.length > 0 ? (
                    <div className="flex-grow overflow-y-auto -mr-2 pr-2">
                        <div className={`${imageLayout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col space-y-2'}`}>
                           {uploadedImages.map((src, index) => (
                                <div
                                    key={`${src.substring(0, 20)}-${index}`}
                                    draggable={!processingImageSrc}
                                    onDragStart={(e) => handleDragStart(e, src)}
                                    className={`group relative bg-gray-700 rounded-lg cursor-grab flex items-center justify-center ${imageLayout === 'grid' ? 'aspect-square' : ''}`}
                                >
                                    <img src={src} alt={`Uploaded preview ${index + 1}`} className="max-w-full max-h-full object-contain rounded-lg" />
                                    
                                    {processingImageSrc === src && (
                                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    )}
                                    
                                    {!processingImageSrc && (
                                        <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 rounded-lg p-2">
                                            <button
                                                onClick={() => handleRemoveBackground(src, index)}
                                                className="flex items-center justify-center w-full max-w-[130px] px-2 py-1.5 rounded bg-white/20 hover:bg-blue-600 text-white text-xs font-semibold transition-colors backdrop-blur-sm"
                                                title="Remove Background"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zM13 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd" />
                                                  <path d="M11 14a1 1 0 100 2h1a1 1 0 100-2h-1z" />
                                                </svg>
                                                <span>Remove BG</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteImage(index)}
                                                className="flex items-center justify-center w-full max-w-[130px] px-2 py-1.5 rounded bg-white/20 hover:bg-red-600 text-white text-xs font-semibold transition-colors backdrop-blur-sm"
                                                title="Delete Image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-xs text-gray-500 p-4 border-2 border-dashed border-gray-700 rounded-lg flex-grow flex items-center justify-center">
                        <span>Upload images to see them here.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ShapesToolPanel = () => (
    <div className="p-4">
      <h3 className="text-lg font-bold text-gray-400 mb-4">Add Shape</h3>
      <div className="grid grid-cols-2 gap-4">
        <DraggableShapePreset
          label="Rectangle"
          element={{ type: 'shape', shapeType: 'rectangle', width: 150, height: 100, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, strokeDash: 'solid' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" fill="#3b82f6" /></svg>
        </DraggableShapePreset>
        <DraggableShapePreset
          label="Ellipse"
          element={{ type: 'shape', shapeType: 'ellipse', width: 150, height: 100, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, strokeDash: 'solid' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7" fill="#3b82f6" /></svg>
        </DraggableShapePreset>
        <DraggableShapePreset
          label="Triangle"
          element={{ type: 'shape', shapeType: 'triangle', width: 120, height: 100, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, strokeDash: 'solid' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2 L2 22 L22 22 Z" fill="#3b82f6" /></svg>
        </DraggableShapePreset>
        <DraggableShapePreset
          label="Polygon"
          element={{ type: 'shape', shapeType: 'polygon', width: 120, height: 120, sides: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, strokeDash: 'solid' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2 L21.65 7 L21.65 17 L12 22 L2.35 17 L2.35 7 Z" fill="#3b82f6" /></svg>
        </DraggableShapePreset>
        <DraggableShapePreset
          label="Star"
          element={{ type: 'shape', shapeType: 'star', width: 120, height: 120, points: 5, innerRadiusRatio: 0.5, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, strokeDash: 'solid' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" fill="#3b82f6" /></svg>
        </DraggableShapePreset>
        <DraggableShapePreset
          label="Line"
          element={{ type: 'shape', shapeType: 'line', width: 150, height: 4, fill: 'transparent', stroke: '#ffffff', strokeWidth: 4, strokeDash: 'solid' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" stroke="#ffffff" strokeWidth="2" /></svg>
        </DraggableShapePreset>
      </div>
    </div>
);

const TemplatesPanel: React.FC<{ customTemplates: { name: string, elements: any[] }[] }> = ({ customTemplates }) => {
    const titleSubtitleTemplate = [
        { type: 'text', content: 'Main Title', fontSize: 48, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 60, color: '#FFFFFF', fontFamily: 'Arial', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Supporting subtitle text', fontSize: 24, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 40, color: '#CCCCCC', fontFamily: 'Arial', yOffset: 70, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none' },
    ];

    const eventProgramTemplate = [
        { type: 'text', content: 'EVENT', fontSize: 96, fontWeight: 'bold', fontStyle: 'normal', width: 500, height: 100, color: '#B91C1C', fontFamily: 'Georgia', xOffset: -50, yOffset: -250, lineHeight: 1.1, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'PROGRAM', fontSize: 96, fontWeight: 'bold', fontStyle: 'normal', width: 600, height: 100, color: '#4B5563', fontFamily: 'Georgia', xOffset: 0, yOffset: -160, lineHeight: 1.1, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'BRIGHTERA', fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', width: 150, height: 25, color: '#4B5563', fontFamily: 'Arial', xOffset: 250, yOffset: -240, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'TEMPLATE', fontSize: 10, fontWeight: 'normal', fontStyle: 'normal', width: 150, height: 20, color: '#9CA3AF', fontFamily: 'Arial', xOffset: 250, yOffset: -220, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Date: April 25, 2050', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 350, height: 40, color: '#B91C1C', fontFamily: 'Arial', xOffset: -125, yOffset: -50, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Time: 9:00 AM – 4:00 PM', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 350, height: 40, color: '#B91C1C', fontFamily: 'Arial', xOffset: 200, yOffset: -50, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: '9:00 AM –\n9:30 AM', fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 50, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Opening Ceremony', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 35, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Welcome address by Dr. Emily Rodriguez, College President.', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 45, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 65, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: '9:30 AM –\n11:30 AM', fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 150, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Student Performances', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 135, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Live performances by our students.', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 165, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: '11:45 AM –\n12:30 PM', fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 250, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Award Ceremony', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 235, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Live performances by our students.', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 265, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: '1:45 PM –\n3:00 PM', fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 350, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Workshops and Panels', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 335, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Breakout sessions on key topics in education.', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 45, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 365, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: '3:10 PM –\n4:00 PM', fontSize: 20, fontWeight: 'bold', fontStyle: 'normal', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 450, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Closing Remarks', fontSize: 22, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 435, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Dr. Rodriguez will summarize the key takeaways.', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 465, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'Thank you for celebrating with us!', fontSize: 18, fontWeight: 'normal', fontStyle: 'normal', width: 600, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 0, yOffset: 550, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
        { type: 'text', content: 'www.template.com', fontSize: 18, fontWeight: 'normal', fontStyle: 'normal', width: 600, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 0, yOffset: 580, lineHeight: 1.2, letterSpacing: 0, textTransform: 'none' },
    ];
    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-400">Templates</h3>
            <div className="grid grid-cols-2 gap-4">
                <DraggableTemplateItem name="Title & Subtitle" elements={titleSubtitleTemplate} />
                <DraggableTemplateItem name="Event Program" elements={eventProgramTemplate} />
            </div>
            <div className="w-full border-t border-gray-700 my-2"></div>
            <h3 className="text-lg font-bold text-gray-400">Your Templates</h3>
             {customTemplates.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {customTemplates.map((template, index) => (
                      <DraggableTemplateItem key={`${template.name}-${index}`} name={template.name} elements={template.elements} />
                    ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center w-full">Save a design via the Export menu to create your first template.</p>
              )}
        </div>
    )
};


// Extracted from former ExportModal
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ExportPanel: React.FC<{
  editorRef: React.RefObject<HTMLDivElement>;
  artboardSize: { width: number; height: number };
  onSaveTemplate: (name: string) => void;
}> = ({ editorRef, artboardSize, onSaveTemplate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [mode, setMode] = useState<'export' | 'save_template'>('export');
  const [templateName, setTemplateName] = useState('');

  const handleExport = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!editorRef.current || isExporting) return;
    setIsExporting(true);

    const editorNode = editorRef.current;
    const clone = editorNode.cloneNode(true) as HTMLElement;

    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    clone.style.overflow = 'visible';

    const selectedElementsInClone = Array.from(clone.querySelectorAll('[style*="outline"]')) as HTMLElement[];
    selectedElementsInClone.forEach(el => {
      el.style.outline = 'none';
      el.style.boxShadow = 'none';
    });

    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      
      if (format === 'pdf') {
        const { width, height } = artboardSize;
        const orientation = width > height ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'px', [width, height]);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
        pdf.save('design.pdf');
      } else {
        const mimeType = `image/${format}`;
        const imgData = canvas.toDataURL(mimeType, 0.95);
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `design.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Could not export the design. Please check the console for errors.');
    } finally {
      document.body.removeChild(clone);
      setIsExporting(false);
    }
  };
  
  const handleSaveTemplateClick = () => {
    onSaveTemplate(templateName);
    setTemplateName('');
    setMode('export');
  }

  return (
    <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold text-gray-400 text-center">
            {mode === 'export' ? 'Export Design' : 'Save as Template'}
        </h2>

        {isExporting ? (
             <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                <p className="mt-4 text-gray-400">Processing...</p>
             </div>
        ) : mode === 'export' ? (
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleExport('png')} className="p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
                    <span className="text-4xl" role="img" aria-label="PNG">🖼️</span>
                    <span className="mt-2 font-semibold">PNG</span>
                </button>
                <button onClick={() => handleExport('jpeg')} className="p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
                    <span className="text-4xl" role="img" aria-label="JPG">🏞️</span>
                    <span className="mt-2 font-semibold">JPG</span>
                </button>
                <button onClick={() => handleExport('pdf')} className="p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
                    <span className="text-4xl" role="img" aria-label="PDF">📄</span>
                    <span className="mt-2 font-semibold">PDF</span>
                </button>
                <button onClick={() => setMode('save_template')} className="p-4 bg-gray-700 hover:bg-green-600 rounded-lg transition-colors flex flex-col items-center justify-center aspect-square">
                    <span className="text-4xl" role="img" aria-label="Save as Template">💾</span>
                    <span className="mt-2 font-semibold text-center">Save as<br/>Template</span>
                </button>
            </div>
        ) : (
            <div className="flex flex-col space-y-4">
                <p className="text-sm text-gray-400 text-center">Save the current design as a reusable template.</p>
                <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                />
                <button
                    onClick={handleSaveTemplateClick}
                    disabled={!templateName.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition-colors"
                >
                    Save Template
                </button>
                 <button onClick={() => setMode('export')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                    Back to Export
                </button>
            </div>
        )}
    </div>
  )
}


interface DetailsPanelProps {
  activeTool: 'text' | 'image' | 'shapes' | 'templates' | 'export' | null;
  onAddElement: (element: Omit<CanvasElement, 'id'>) => void;
  customTemplates: { name: string, elements: any[] }[];
  // Props for export panel
  editorRef: React.RefObject<HTMLDivElement>;
  artboardSize: { width: number; height: number };
  onSaveTemplate: (name: string) => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ activeTool, onAddElement, customTemplates, editorRef, artboardSize, onSaveTemplate }) => {
  const renderContent = () => {
    switch (activeTool) {
      case 'text':
        return <TextToolPanel />;
      case 'image':
        return <ImageToolPanel onAddElement={onAddElement} />;
      case 'shapes':
        return <ShapesToolPanel />;
      case 'templates':
        return <TemplatesPanel customTemplates={customTemplates} />;
      case 'export':
        return <ExportPanel editorRef={editorRef} artboardSize={artboardSize} onSaveTemplate={onSaveTemplate} />;
      default:
        return (
            <div className="p-4 text-center text-gray-500">
                <p>Select a tool from the left toolbar to get started.</p>
            </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {renderContent()}
    </div>
  );
};

export default DetailsPanel;