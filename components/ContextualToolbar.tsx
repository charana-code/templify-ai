import React from 'react';

type AlignOperation = 'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom';
type DistributeOperation = 'distribute-horizontal' | 'distribute-vertical';

interface ContextualToolbarProps {
  selectedElementIds: string[];
  onAlignOrDistribute: (operation: AlignOperation | DistributeOperation) => void;
  onReorderElement: (ids: string[], direction: 'forward' | 'backward' | 'front' | 'back') => void;
  reorderability: {
    canMoveForward: boolean;
    canMoveBackward: boolean;
    canMoveToFront: boolean;
    canMoveToBack: boolean;
  };
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, title, children, disabled }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="p-2 rounded-md hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
    aria-label={title}
  >
    {children}
  </button>
);

const ContextualToolbar: React.FC<ContextualToolbarProps> = ({ selectedElementIds, onAlignOrDistribute, onReorderElement, reorderability }) => {
  const selectionCount = selectedElementIds.length;
  const canAlign = selectionCount >= 2;
  const canDistribute = selectionCount >= 3;

  return (
    <div className="flex items-center space-x-1 bg-gray-800 p-1 rounded-lg">
      <div className="flex items-center space-x-1 border-r border-gray-600 pr-2" title="Align">
        <ToolbarButton onClick={() => onAlignOrDistribute('align-left')} title="Align Left" disabled={!canAlign}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="3" x2="10" y2="21"></line><path d="M4 12h16"></path><path d="M4 18v-2a4 4 0 0 1 4-4h8"></path><path d="M4 6v2a4 4 0 0 0 4 4h8"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAlignOrDistribute('align-center')} title="Align Center" disabled={!canAlign}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"></line><path d="M4 12h16"></path><path d="M18 18v-2a4 4 0 0 0-4-4H9.5"></path><path d="M6 6v2a4 4 0 0 0 4 4h5"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAlignOrDistribute('align-right')} title="Align Right" disabled={!canAlign}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="14" y1="3" x2="14" y2="21"></line><path d="M4 12h16"></path><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path><path d="M20 6v2a4 4 0 0 1-4 4H4"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAlignOrDistribute('align-top')} title="Align Top" disabled={!canAlign}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><path d="M12 20v-8a4 4 0 0 0-4-4H6"></path><path d="M12 4v8a4 4 0 0 1 4 4h2"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAlignOrDistribute('align-middle')} title="Align Middle" disabled={!canAlign}>
           <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="12" x2="3" y2="12"></line><path d="M12 20v-2a4 4 0 0 0-4-4H6"></path><path d="M12 6V4a4 4 0 0 1 4 4h2"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAlignOrDistribute('align-bottom')} title="Align Bottom" disabled={!canAlign}>
           <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="14" x2="3" y2="14"></line><path d="M12 4v8a4 4 0 0 0 4 4h2"></path><path d="M12 20v-8a4 4 0 0 1-4-4H6"></path></svg>
        </ToolbarButton>
      </div>
      <div className="flex items-center space-x-1 border-r border-gray-600 pr-2" title="Distribute">
        <ToolbarButton onClick={() => onAlignOrDistribute('distribute-horizontal')} title="Distribute Horizontal" disabled={!canDistribute}>
           <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="3" x2="3" y2="21"></line><line x1="21" y1="3" x2="21" y2="21"></line><rect x="9" y="8" width="6" height="8" rx="1"></rect></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAlignOrDistribute('distribute-vertical')} title="Distribute Vertical" disabled={!canDistribute}>
           <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="3" x2="21" y2="3"></line><line x1="3" y1="21" x2="21" y2="21"></line><rect x="8" y="9" width="8" height="6" rx="1"></rect></svg>
        </ToolbarButton>
      </div>
      <div className="flex items-center space-x-1" title="Position">
        <ToolbarButton onClick={() => onReorderElement(selectedElementIds, 'forward')} title="Bring Forward" disabled={!reorderability.canMoveForward}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M15 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2zM5 14V6h9v8H5z"></path><path d="M10.75 2a.75.75 0 00-1.5 0v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0V5h1.5a.75.75 0 000-1.5H10.75V2z" opacity=".4"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onReorderElement(selectedElementIds, 'backward')} title="Send Backward" disabled={!reorderability.canMoveBackward}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M15 6h- техниV14H5V6h10zM6 13h8V7H6v6z"></path><path d="M4 4a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2V4a2 2 0 00-2-2H4z" opacity=".4"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onReorderElement(selectedElementIds, 'front')} title="Bring to Front" disabled={!reorderability.canMoveToFront}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M16 1a2 2 0 00-2 2v12a2 2 0 002 2h1a2 2 0 002-2V3a2 2 0 00-2-2h-1z" opacity=".4"></path><path d="M14 4a2 2 0 00-2-2H2a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V4zm-2 9H4V5h8v8z"></path></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onReorderElement(selectedElementIds, 'back')} title="Send to Back" disabled={!reorderability.canMoveToBack}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 16a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10zm2-8h8v8H6V8z"></path><path d="M16 5a2 2 0 002-2V2a2 2 0 00-2-2H5a2 2 0 00-2 2v1a2 2 0 002 2h11z" opacity=".4"></path></svg>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default ContextualToolbar;