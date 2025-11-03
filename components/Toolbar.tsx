import React from 'react';

const ToolItem = ({ type, icon, label }: { type: string, icon: string, label: string }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col items-center p-3 w-24 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors"
    >
      <span className="text-3xl">{icon}</span>
      <span className="mt-1 text-xs text-gray-300">{label}</span>
    </div>
  );
};

const TextTemplateItem = ({ name, elements }: { name: string, elements: any[] }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'template', elements }));
    };

    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            className="flex flex-col items-center p-3 w-24 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-grab transition-colors"
        >
            <span className="text-3xl">📄</span>
            <span className="mt-1 text-xs text-gray-300 text-center">{name}</span>
        </div>
    )
}

interface ToolbarProps {
  onExportClick: () => void;
  customTemplates: { name: string, elements: any[] }[];
}

const Toolbar: React.FC<ToolbarProps> = ({ onExportClick, customTemplates }) => {
    const titleSubtitleTemplate = [
        { type: 'text', content: 'Main Title', fontSize: 48, fontWeight: 'bold', width: 400, height: 60, color: '#FFFFFF', fontFamily: 'Arial', lineHeight: 1.2 },
        { type: 'text', content: 'Supporting subtitle text', fontSize: 24, fontWeight: 'normal', width: 400, height: 40, color: '#CCCCCC', fontFamily: 'Arial', yOffset: 70, lineHeight: 1.4 },
    ];

    const eventProgramTemplate = [
        // --- HEADER ---
        { type: 'text', content: 'EVENT', fontSize: 96, fontWeight: 'bold', width: 500, height: 100, color: '#B91C1C', fontFamily: 'Georgia', xOffset: -50, yOffset: -250, lineHeight: 1.1 },
        { type: 'text', content: 'PROGRAM', fontSize: 96, fontWeight: 'bold', width: 600, height: 100, color: '#4B5563', fontFamily: 'Georgia', xOffset: 0, yOffset: -160, lineHeight: 1.1 },
        { type: 'text', content: 'BRIGHTERA', fontSize: 18, fontWeight: 'bold', width: 150, height: 25, color: '#4B5563', fontFamily: 'Arial', xOffset: 250, yOffset: -240, lineHeight: 1.2 },
        { type: 'text', content: 'TEMPLATE', fontSize: 10, fontWeight: 'normal', width: 150, height: 20, color: '#9CA3AF', fontFamily: 'Arial', xOffset: 250, yOffset: -220, lineHeight: 1.2 },
    
        // --- DATE/TIME BANNER ---
        { type: 'text', content: 'Date: April 25, 2050', fontSize: 22, fontWeight: 'bold', width: 350, height: 40, color: '#B91C1C', fontFamily: 'Arial', xOffset: -125, yOffset: -50, lineHeight: 1.2 },
        { type: 'text', content: 'Time: 9:00 AM – 4:00 PM', fontSize: 22, fontWeight: 'bold', width: 350, height: 40, color: '#B91C1C', fontFamily: 'Arial', xOffset: 200, yOffset: -50, lineHeight: 1.2 },
    
        // --- SCHEDULE ITEMS ---
        // Row 1: Opening Ceremony
        { type: 'text', content: '9:00 AM –\n9:30 AM', fontSize: 20, fontWeight: 'bold', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 50, lineHeight: 1.2 },
        { type: 'text', content: 'Opening Ceremony', fontSize: 22, fontWeight: 'bold', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 35, lineHeight: 1.2 },
        { type: 'text', content: 'Welcome address by Dr. Emily Rodriguez, College President.', fontSize: 16, fontWeight: 'normal', width: 400, height: 45, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 65, lineHeight: 1.4 },
    
        // Row 2: Student Performances
        { type: 'text', content: '9:30 AM –\n11:30 AM', fontSize: 20, fontWeight: 'bold', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 150, lineHeight: 1.2 },
        { type: 'text', content: 'Student Performances', fontSize: 22, fontWeight: 'bold', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 135, lineHeight: 1.2 },
        { type: 'text', content: 'Live performances by our students.', fontSize: 16, fontWeight: 'normal', width: 400, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 165, lineHeight: 1.4 },
    
        // Row 3: Award Ceremony
        { type: 'text', content: '11:45 AM –\n12:30 PM', fontSize: 20, fontWeight: 'bold', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 250, lineHeight: 1.2 },
        { type: 'text', content: 'Award Ceremony', fontSize: 22, fontWeight: 'bold', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 235, lineHeight: 1.2 },
        { type: 'text', content: 'Live performances by our students.', fontSize: 16, fontWeight: 'normal', width: 400, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 265, lineHeight: 1.4 },
    
        // Row 4: Workshops and Panels
        { type: 'text', content: '1:45 PM –\n3:00 PM', fontSize: 20, fontWeight: 'bold', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 350, lineHeight: 1.2 },
        { type: 'text', content: 'Workshops and Panels', fontSize: 22, fontWeight: 'bold', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 335, lineHeight: 1.2 },
        { type: 'text', content: 'Breakout sessions on key topics in education.', fontSize: 16, fontWeight: 'normal', width: 400, height: 45, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 365, lineHeight: 1.4 },
    
        // Row 5: Closing Remarks
        { type: 'text', content: '3:10 PM –\n4:00 PM', fontSize: 20, fontWeight: 'bold', width: 150, height: 60, color: '#4B5563', fontFamily: 'Arial', xOffset: -225, yOffset: 450, lineHeight: 1.2 },
        { type: 'text', content: 'Closing Remarks', fontSize: 22, fontWeight: 'bold', width: 400, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 75, yOffset: 435, lineHeight: 1.2 },
        { type: 'text', content: 'Dr. Rodriguez will summarize the key takeaways.', fontSize: 16, fontWeight: 'normal', width: 400, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 75, yOffset: 465, lineHeight: 1.4 },
    
        // --- FOOTER ---
        { type: 'text', content: 'Thank you for celebrating with us!', fontSize: 18, fontWeight: 'normal', width: 600, height: 30, color: '#B91C1C', fontFamily: 'Arial', xOffset: 0, yOffset: 550, lineHeight: 1.2 },
        { type: 'text', content: 'www.template.com', fontSize: 18, fontWeight: 'normal', width: 600, height: 30, color: '#4B5563', fontFamily: 'Arial', xOffset: 0, yOffset: 580, lineHeight: 1.2 },
    ];


  return (
    <div className="w-32 bg-gray-900 text-white p-4 flex flex-col items-center space-y-6 overflow-y-auto">
      <button
        onClick={onExportClick}
        className="flex flex-col items-center p-3 w-24 bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer transition-colors"
      >
        <span className="text-3xl" role="img" aria-label="Download Icon">💾</span>
        <span className="mt-1 text-xs text-white font-bold">Export</span>
      </button>
      <div className="w-full border-t border-gray-700 my-2"></div>
      <h2 className="text-lg font-bold text-gray-400">Tools</h2>
      <ToolItem type="text" icon="T" label="Text" />
      <ToolItem type="image" icon="🖼️" label="Image" />
      <div className="w-full border-t border-gray-700 my-2"></div>
      <h2 className="text-lg font-bold text-gray-400">Templates</h2>
      <TextTemplateItem name="Title & Subtitle" elements={titleSubtitleTemplate} />
      <TextTemplateItem name="Event Program" elements={eventProgramTemplate} />
      <div className="w-full border-t border-gray-700 my-2"></div>
      <h2 className="text-lg font-bold text-gray-400">Your Templates</h2>
      {customTemplates.length > 0 ? (
        customTemplates.map((template, index) => (
          <TextTemplateItem key={`${template.name}-${index}`} name={template.name} elements={template.elements} />
        ))
      ) : (
        <p className="text-xs text-gray-500 text-center w-full">Save a design via the Export menu to create your first template.</p>
      )}
    </div>
  );
};

export default Toolbar;