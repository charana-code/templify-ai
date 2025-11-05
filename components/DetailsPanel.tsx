import React, { useState, useRef } from 'react';
import { CanvasElement, TextElement, ShapeElement, ImageElement, GroupElement } from '../types';
import { generateImageWithAI, editImageWithAI } from '../services/geminiService';
import Accordion from './Accordion';

const DraggableTextPreset: React.FC<{
  label: string;
  element: Omit<TextElement, 'id' | 'x' | 'y' | 'rotation'>;
}> = ({ label, element }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', element }));
  };

  // Use a consistent size for the panel UI, while preserving the font family and weight as a preview.
  const previewStyle: React.CSSProperties = {
    fontSize: '18px', // A reasonable, fixed size for the panel
    fontWeight: element.fontWeight,
    fontFamily: element.fontFamily,
    textAlign: 'left',
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors text-center"
      style={previewStyle}
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

// FIX: Simplified the 'element' prop type to use Omit<CanvasElement, ...> for better readability and consistency.
const DraggableElement: React.FC<{
  element: Omit<CanvasElement, 'id' | 'x' | 'y' | 'rotation'>;
  children: React.ReactNode;
}> = ({ element, children }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', element }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="w-full aspect-square shrink-0 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors flex flex-col items-center justify-center p-2 text-center"
    >
      {children}
    </div>
  );
};


const DraggableTextGroupLayout: React.FC<{
  elements: any[];
  children: React.ReactNode;
}> = ({ elements, children }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'template', elements, group: true }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors"
    >
      {children}
    </div>
  );
};


const TextToolPanel = () => {
  const titleAndDescriptionTemplate = [
    { 
      type: 'text', 
      content: 'Title', 
      fontSize: 32, 
      fontWeight: 'bold', 
      fontStyle: 'normal', 
      width: 300, 
      height: 50, 
      color: '#000000', 
      fontFamily: 'Arial', 
      textAlign: 'left' as const, 
      lineHeight: 1.2, 
      letterSpacing: 0, 
      textTransform: 'none' as const,
      underline: false,
      strikethrough: false,
    },
    { 
      type: 'text', 
      content: 'Your descriptive text goes here. Double click to edit this paragraph and add your own content.', 
      fontSize: 16, 
      fontWeight: 'normal', 
      fontStyle: 'normal', 
      width: 300, 
      height: 90, 
      color: '#333333', 
      fontFamily: 'Arial', 
      textAlign: 'left' as const, 
      yOffset: 60, 
      lineHeight: 1.5, 
      letterSpacing: 0, 
      textTransform: 'none' as const,
      underline: false,
      strikethrough: false,
    },
  ];

  return (
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
          color: '#000000',
          fontFamily: 'Arial',
          textAlign: 'left',
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
          color: '#333333',
          fontFamily: 'Arial',
          textAlign: 'left',
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
          color: '#333333',
          fontFamily: 'Arial',
          textAlign: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          textTransform: 'none',
          underline: false,
          strikethrough: false,
        }}
      />
      <DraggableTextGroupLayout elements={titleAndDescriptionTemplate}>
        <div className="text-left">
          <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial' }}>Title & Description</div>
          <div style={{ fontSize: '12px', fontFamily: 'Arial', marginTop: '4px', color: '#a0a0a0' }}>
            A heading with body text below.
          </div>
        </div>
      </DraggableTextGroupLayout>
    </div>
  );
};

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
                                                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zM13 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
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

// FIX: Widened the 'element' type to Omit<CanvasElement, ...> to support a discriminated union. This resolves type errors when creating shape/image definitions with specific properties (like shapeType or frameShape) and when passing these elements to DraggableElement.
type ElementDef = {
    name: string;
    element: Omit<CanvasElement, 'id' | 'x' | 'y' | 'rotation'>;
    preview: React.ReactNode;
};

const AllElementsView: React.FC<{
    title: string;
    items: ElementDef[];
    onBack: () => void;
}> = ({ title, items, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center shrink-0 p-2 border-b border-gray-700">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <h2 className="text-lg font-bold ml-2">{title}</h2>
            </div>
            <div className="p-2 shrink-0">
                <input
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex-grow overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-4">
                    {filteredItems.map(item => (
                        <DraggableElement key={item.name} element={item.element}>
                            {item.preview}
                        </DraggableElement>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ElementsToolPanel: React.FC<{
  onSetSubView: (view: 'shapes' | 'icons' | 'frames') => void;
}> = ({ onSetSubView }) => {
    const placeholderImageSrc = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0U1RTdFQiIvPjxwYXRoIGQ9Ik04MCA3MCBMNjAgNDAgTDQ1IDYwIEwzMCA1MCBMMjAgNzAgSCA4MCBaIiBmaWxsPSIjRERERUZFIi8+PGNpcmNsZSBjeD0iMzUiIGN5PSIzNSIgcj0iOCIgZmlsbD0iI0Y5RkFGQiIvPjwvc3ZnPg==";
    
    // Use the first few items from the main definitions for the preview
    const shapePreviews = shapeDefinitions.slice(0, 5);
    const iconPreviews = iconDefinitions.slice(0, 5);
    const framePreviews = frameDefinitions.slice(0, 4);
    
    const Section: React.FC<{ title: string; onSeeAll: () => void; children: React.ReactNode }> = ({ title, onSeeAll, children }) => (
      <div className="py-2">
        <div className="flex justify-between items-center mb-3 px-4">
            <h3 className="text-lg font-bold text-gray-400">{title}</h3>
            <button onClick={onSeeAll} className="text-sm text-blue-400 hover:text-blue-300">See all</button>
        </div>
        <div className="grid grid-cols-3 gap-3 px-4">
          {children}
        </div>
      </div>
    );
  
    return (
      <div className="flex flex-col space-y-2">
        <Section title="Shapes" onSeeAll={() => onSetSubView('shapes')}>
           {shapePreviews.map(def => (
               <DraggableElement key={def.name} element={def.element}>{def.preview}</DraggableElement>
           ))}
        </Section>
        <Section title="Icons" onSeeAll={() => onSetSubView('icons')}>
            {iconPreviews.map(def => (
               <DraggableElement key={def.name} element={def.element}>{def.preview}</DraggableElement>
           ))}
        </Section>
        <Section title="Frames" onSeeAll={() => onSetSubView('frames')}>
            {framePreviews.map(def => (
               <DraggableElement key={def.name} element={def.element}>{def.preview}</DraggableElement>
           ))}
        </Section>
      </div>
    );
};


const TemplatesPanel: React.FC<{ customTemplates: { name: string, elements: any[] }[] }> = ({ customTemplates }) => {
    const titleSubtitleTemplate = [
        { type: 'text', content: 'Main Title', fontSize: 48, fontWeight: 'bold', fontStyle: 'normal', width: 400, height: 60, color: '#FFFFFF', fontFamily: 'Arial', lineHeight: 1.2, letterSpacing: 0, textTransform: 'none', textAlign: 'left' },
        { type: 'text', content: 'Supporting subtitle text', fontSize: 24, fontWeight: 'normal', fontStyle: 'normal', width: 400, height: 40, color: '#CCCCCC', fontFamily: 'Arial', yOffset: 70, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none', textAlign: 'left' },
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
  activeTool: 'text' | 'image' | 'elements' | 'templates' | 'export' | null;
  onAddElement: (element: Omit<CanvasElement, 'id'>) => void;
  customTemplates: { name: string, elements: any[] }[];
  // Props for export panel
  editorRef: React.RefObject<HTMLDivElement>;
  artboardSize: { width: number; height: number };
  onSaveTemplate: (name: string) => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ activeTool, onAddElement, customTemplates, editorRef, artboardSize, onSaveTemplate }) => {
  const [subView, setSubView] = useState<'main' | 'shapes' | 'icons' | 'frames'>('main');

  const renderContent = () => {
    switch (activeTool) {
      case 'text':
        return <TextToolPanel />;
      case 'image':
        return <ImageToolPanel onAddElement={onAddElement} />;
      case 'elements':
        if (subView === 'shapes') {
          return <AllElementsView title="Shapes" items={shapeDefinitions} onBack={() => setSubView('main')} />;
        }
        if (subView === 'icons') {
            return <AllElementsView title="Icons" items={iconDefinitions} onBack={() => setSubView('main')} />;
        }
        if (subView === 'frames') {
            return <AllElementsView title="Frames" items={frameDefinitions} onBack={() => setSubView('main')} />;
        }
        return <ElementsToolPanel onSetSubView={setSubView} />;
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
    <div className="w-full h-full bg-gray-900 text-white flex flex-col overflow-y-auto">
      {renderContent()}
    </div>
  );
};

// --- DATA DEFINITIONS FOR ELEMENTS PANEL ---

const defaultShapeProps = { fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 0, strokeDash: 'solid' as const };
const shapeDefinitions: ElementDef[] = [
    { name: 'Rectangle', element: { type: 'shape', shapeType: 'rectangle', width: 150, height: 100, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" fill="#3b82f6" /></svg><span className="text-xs mt-1">Rectangle</span></> },
    { name: 'Ellipse', element: { type: 'shape', shapeType: 'ellipse', width: 150, height: 100, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7" fill="#3b82f6" /></svg><span className="text-xs mt-1">Ellipse</span></> },
    { name: 'Triangle', element: { type: 'shape', shapeType: 'triangle', width: 120, height: 100, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2 L2 22 L22 22 Z" fill="#3b82f6" /></svg><span className="text-xs mt-1">Triangle</span></> },
    { name: 'Polygon', element: { type: 'shape', shapeType: 'polygon', width: 120, height: 120, sides: 6, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2 L21.65 7 L21.65 17 L12 22 L2.35 17 L2.35 7 Z" fill="#3b82f6" /></svg><span className="text-xs mt-1">Polygon</span></> },
    { name: 'Star', element: { type: 'shape', shapeType: 'star', width: 120, height: 120, points: 5, innerRadiusRatio: 0.5, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" fill="#3b82f6" /></svg><span className="text-xs mt-1">Star</span></> },
    { name: 'Line', element: { type: 'shape', shapeType: 'line', width: 150, height: 4, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 4, strokeDash: 'solid' }, preview: <><svg width="40" height="40" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" stroke="#3b82f6" strokeWidth="2" /></svg><span className="text-xs mt-1">Line</span></> },
    { name: 'Pentagon', element: { type: 'shape', shapeType: 'polygon', width: 120, height: 120, sides: 5, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6"><path d="m12 2.5l-10 7.2l3.8 11.8h12.4l3.8-11.8z"/></svg><span className="text-xs mt-1">Pentagon</span></> },
    { name: 'Heptagon', element: { type: 'shape', shapeType: 'polygon', width: 120, height: 120, sides: 7, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6"><path d="M2 9.5l4-7h12l4 7l-4 7h-12z"/></svg><span className="text-xs mt-1">Heptagon</span></> },
    { name: 'Octagon', element: { type: 'shape', shapeType: 'polygon', width: 120, height: 120, sides: 8, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6"><path d="m7.1 2.5l-4.6 4.6v10l4.6 4.4h10l4.4-4.4v-10l-4.4-4.6z"/></svg><span className="text-xs mt-1">Octagon</span></> },
    { name: 'Star 6 points', element: { type: 'shape', shapeType: 'star', width: 120, height: 120, points: 6, innerRadiusRatio: 0.6, ...defaultShapeProps }, preview: <><svg width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6"><path d="m12 2.6l2.3 6.3L21 9.5l-4.8 4.4l1.4 6.6l-5.6-3.3l-5.6 3.3l1.4-6.6l-4.8-4.4l6.7-.6z"/></svg><span className="text-xs mt-1">Star</span></> },
];

const rawIconDefinitions = [
    { name: 'User', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM209.1 359.2l-18.6-31c-6.4-10.7 1.3-24.2 13.7-24.2H243.8c12.4 0 20.1 13.6 13.7 24.2l-18.6 31C234.4 367.6 223.6 372 216 372s-10.4-4.4-13.1-12.8zM224 320c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64z"/></svg>' },
    { name: 'Heart', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>' },
    { name: 'Star Icon', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>' },
    { name: 'Camera', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>' },
    { name: 'Settings', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>' },
    { name: 'Trash', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>' },
    { name: 'File', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>' },
    { name: 'Comment', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 146.3-74.4c28.7 12.1 60.5 18.4 93.7 18.4c141.4 0 256-93.1 256-208S397.4 32 256 32z"/></svg>' },
    { name: 'Bookmark', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"/></svg>' },
    { name: 'Home', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 160l-1.1 0c-1.3 0-2.6 0-3.9 0H128c-22.1 0-40-17.9-40-40V448 384c0-2.6 0-5.1 .3-7.6l.7-160.3h-32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>' },
    { name: 'Check', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>' },
    { name: 'Close', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>' },
    { name: 'Search', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>' },
    { name: 'Menu', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>' },
    { name: 'Plus', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>' },
];

const iconDefinitions: ElementDef[] = rawIconDefinitions.map(icon => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(icon.svg, "image/svg+xml");
    const svgNode = doc.querySelector('svg');
    const pathNodes = doc.querySelectorAll('path');

    const viewBox = svgNode?.getAttribute('viewBox') || '0 0 512 512';
    const pathData = Array.from(pathNodes).map(p => p.getAttribute('d')).join(' ');

    const element: Omit<ShapeElement, 'id' | 'x' | 'y' | 'rotation'> = {
        type: 'shape',
        shapeType: 'icon',
        path: pathData,
        viewBox: viewBox,
        width: 100,
        height: 100,
        fill: '#3b82f6',
        stroke: 'transparent',
        strokeWidth: 0,
    };
    
    const previewSvg = icon.svg.replace(/currentColor/g, '#3b82f6');
    const previewSrc = `data:image/svg+xml;base64,${btoa(previewSvg)}`;

    return {
        name: icon.name,
        element,
        preview: <>
            <img src={previewSrc} alt={`${icon.name} icon`} className="w-10 h-10" />
            <span className="text-xs mt-1">{icon.name}</span>
        </>
    };
});

const placeholderImageSrc = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0U1RTdFQiIvPjxwYXRoIGQ9Ik04MCA3MCBMNjAgNDAgTDQ1IDYwIEwzMCA1MCBMMjAgNzAgSCA4MCBaIiBmaWxsPSIjRERERUZFIi8+PGNpcmNsZSBjeD0iMzUiIGN5PSIzNSIgcj0iOCIgZmlsbD0iI0Y5RkFGQiIvPjwvc3ZnPg==";
const defaultFrameProps = { src: placeholderImageSrc, width: 150, height: 150, flipHorizontal: false, flipVertical: false };
const frameDefinitions: ElementDef[] = [
    { name: 'Circle', element: { type: 'image', ...defaultFrameProps, frameShape: 'circle' }, preview: <><div className="w-10 h-10 rounded-full bg-gray-500" /><span className="text-xs mt-1">Circle</span></> },
    { name: 'Arch', element: { type: 'image', ...defaultFrameProps, frameShape: 'arch' }, preview: <><div className="w-10 h-10 bg-gray-500" style={{ clipPath: 'path("M 0 100 V 50 C 0 22.38 22.38 0 50 0 C 77.62 0 100 22.38 100 50 V 100 Z")' }}/><span className="text-xs mt-1">Arch</span></> },
    { name: 'Hexagon', element: { type: 'image', ...defaultFrameProps, frameShape: 'polygon-6' }, preview: <><div className="w-10 h-10 bg-gray-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}/><span className="text-xs mt-1">Hexagon</span></> },
    { name: 'Star Frame', element: { type: 'image', ...defaultFrameProps, frameShape: 'star-5' }, preview: <><div className="w-10 h-10 bg-gray-500" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}/><span className="text-xs mt-1">Star</span></> },
    { name: 'Square', element: { type: 'image', ...defaultFrameProps }, preview: <><div className="w-10 h-10 bg-gray-500" /><span className="text-xs mt-1">Square</span></> },
    { name: 'Rounded', element: { type: 'image', ...defaultFrameProps, borderRadius: 20 }, preview: <><div className="w-10 h-10 bg-gray-500 rounded-lg" /><span className="text-xs mt-1">Rounded</span></> },
];


export default DetailsPanel;