import React from 'react';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import Accordion from './components/Accordion';
import ContextualToolbar from './components/ContextualToolbar';
import ArtboardSelector from './components/ArtboardSelector';
import LayerPanel from './components/LayerPanel';
import AIPanel from './components/AIPanel';
import DetailsPanel from './components/DetailsPanel';
import PropertiesPanel from './components/PropertiesPanel';
import MainMenu from './components/MainMenu';
import SettingsModal from './components/SettingsModal';
import GridGuidesToolbar from './components/GridGuidesToolbar';
import ZoomControl from './components/ZoomControl';
import { useDesignState } from './hooks/useDesignState';

const App: React.FC = () => {
  const {
    artboardSize,
    handleArtboardSelect,
    elements,
    elementsToRender,
    selectedElementIds,
    singleSelectedElement,
    draggingElementId,
    guides,
    zoom,
    editingGroup,
    activeGroup,
    isDirty,
    canUndo,
    canRedo,
    error,
    selectionRect,
    isProcessing,
    activeTool,
    customTemplates,
    canUngroup,
    isDetailsPanelCollapsed,
    isRightPanelCollapsed,
    isSettingsModalOpen,
    canCopy,
    canPaste,
    canDelete,
    gridGuidesConfig,
    gridLines,
    mainContainerRef,
    editorContainerRef,
    editorRef,
    handleSaveDesign,
    fitToScreen,
    handleSetZoom,
    undo,
    redo,
    setError,
    setActiveTool,
    handleAddElement,
    handleAddTemplate,
    handleElementMouseDown,
    handleUpdateElement,
    handleResizeStart,
    handleRotationStart,
    handleElementDoubleClick,
    handleMouseDownOnContainer,
    handlePlaceContent,
    handleApplyStyles,
    handleDeleteElement,
    handleSaveTemplate,
    handleSelectElements,
    handleReorderForLayers,
    setEditingGroupId,
    handleGroup,
    handleUngroup,
    handleToggleLock,
    handleUpdateSelectedElements,
    handleReorderElement,
    handleAlignOrDistribute,
    toggleDetailsPanel,
    toggleRightPanel,
    handleNewDesign,
    handleCopy,
    handlePaste,
    handleDuplicate,
    toggleSettingsModal,
    handleGridGuidesConfigChange,
  } = useDesignState();


  if (!artboardSize) {
    return <ArtboardSelector onSelect={handleArtboardSelect} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-800">
      <header className="bg-gray-900 text-white p-2 flex items-center justify-between shadow-md z-10 h-16">
        <div className="w-1/3 flex items-center pl-4 space-x-4">
          <h1 className="text-xl font-bold">Gemini Design Studio</h1>
          <MainMenu
            onNew={handleNewDesign}
            onSave={handleSaveDesign}
            isDirty={isDirty}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteElement}
            onSettings={toggleSettingsModal}
            canCopy={canCopy}
            canPaste={canPaste}
            canDelete={canDelete}
          />
        </div>
        <div className="w-1/3 text-center">
          {selectedElementIds.length > 0 && (
            <ContextualToolbar
              selectedElementIds={selectedElementIds}
              onAlignOrDistribute={handleAlignOrDistribute}
            />
          )}
        </div>
        <div className="w-1/3 flex justify-end items-center pr-4 space-x-2">
          <GridGuidesToolbar
            config={gridGuidesConfig}
            onChange={handleGridGuidesConfigChange}
          />
          <div className="h-6 w-px bg-gray-600"></div>
          
          <ZoomControl 
              zoom={zoom}
              onZoomChange={handleSetZoom}
              onFitToScreen={fitToScreen}
          />

          <div className="h-6 w-px bg-gray-600"></div>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md text-sm font-semibold transition-colors"
            aria-label="Undo"
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md text-sm font-semibold transition-colors"
            aria-label="Redo"
          >
            Redo ↪
          </button>
        </div>
      </header>
      {error && (
        <div className="bg-red-500 text-white p-2 text-center">
          Error: {error} <button onClick={() => setError(null)} className="font-bold ml-4">X</button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeTool={activeTool}
          onSetActiveTool={setActiveTool}
        />
        <div className="w-px bg-gray-700"></div>
        <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${isDetailsPanelCollapsed ? 'w-0' : 'w-80'}`}>
            <DetailsPanel
              activeTool={activeTool}
              onAddElement={handleAddElement}
              customTemplates={customTemplates}
              editorRef={editorRef}
              artboardSize={artboardSize}
              onSaveTemplate={handleSaveTemplate}
            />
        </div>
        <div className="relative w-px bg-gray-700 shrink-0">
            <button
              onClick={toggleDetailsPanel}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-5 h-16 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center cursor-pointer group"
              title={isDetailsPanelCollapsed ? 'Show Panel' : 'Hide Panel'}
              aria-label={isDetailsPanelCollapsed ? 'Show details panel' : 'Hide details panel'}
            >
              <svg className={`w-4 h-4 transition-transform transform group-hover:scale-125 ${isDetailsPanelCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
        </div>
        <main ref={mainContainerRef} className="flex-1 flex flex-col relative bg-gray-800">
          <div ref={editorContainerRef} onMouseDown={handleMouseDownOnContainer} className="flex-1 w-full h-full overflow-auto">
            <div className="min-h-full min-w-full p-4 flex justify-center items-center">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-in-out' }}>
                <Editor
                  ref={editorRef}
                  artboardSize={artboardSize}
                  elements={elementsToRender}
                  selectedElementIds={selectedElementIds}
                  draggingElementId={draggingElementId}
                  guides={[...guides, ...gridLines]}
                  zoom={zoom}
                  editingGroup={activeGroup ?? null}
                  onAddElement={handleAddElement}
                  onAddTemplate={handleAddTemplate}
                  onElementMouseDown={handleElementMouseDown}
                  onUpdateElement={handleUpdateElement}
                  onResizeStart={handleResizeStart}
                  onRotationStart={handleRotationStart}
                  onElementDoubleClick={handleElementDoubleClick}
                />
              </div>
            </div>
          </div>
          {selectionRect && (
            <div className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none z-50"
              style={{
                left: selectionRect.x1,
                top: selectionRect.y1,
                width: selectionRect.x2 - selectionRect.x1,
                height: selectionRect.y2 - selectionRect.y1,
              }}
            />
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="text-white mt-4 text-lg">AI is thinking...</p>
              </div>
            </div>
          )}
        </main>
        <div className="relative w-px bg-gray-700 shrink-0">
            <button
              onClick={toggleRightPanel}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-5 h-16 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center cursor-pointer group"
              title={isRightPanelCollapsed ? 'Show Panel' : 'Hide Panel'}
              aria-label={isRightPanelCollapsed ? 'Show AI & Layers panel' : 'Hide AI & Layers panel'}
            >
              <svg className={`w-4 h-4 transition-transform transform group-hover:scale-125 ${isRightPanelCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
        </div>
        <div className={`shrink-0 flex flex-col bg-gray-900 text-white overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${isRightPanelCollapsed ? 'w-0' : 'w-80'}`}>
          <div className="min-w-[20rem]">
            {selectedElementIds.length > 0 && (
              <Accordion title="Properties" defaultOpen>
                <PropertiesPanel
                  selectedElementIds={selectedElementIds}
                  elements={elementsToRender}
                  onUpdateElements={handleUpdateSelectedElements}
                />
              </Accordion>
            )}
            <AIPanel
              isProcessing={isProcessing}
              onPlaceContent={handlePlaceContent}
              onApplyStyles={handleApplyStyles}
              onDeleteElement={handleDeleteElement}
              singleSelectedElement={singleSelectedElement}
              selectedElementIds={selectedElementIds}
            />
            <Accordion title="Layers" defaultOpen>
              <LayerPanel
                elements={elements}
                selectedElementIds={selectedElementIds}
                onSelectElements={handleSelectElements}
                onReorder={handleReorderForLayers}
                onReorderSelection={(direction) => handleReorderElement(selectedElementIds, direction)}
                editingGroupId={editingGroup?.id ?? null}
                onSetEditingGroupId={setEditingGroupId}
                onDelete={handleDeleteElement}
                onGroup={handleGroup}
                onUngroup={handleUngroup}
                canUngroup={canUngroup}
                onToggleLock={(ids) => handleToggleLock(ids)}
                onUpdateElements={handleUpdateSelectedElements}
              />
            </Accordion>
          </div>
        </div>
      </div>
      {isSettingsModalOpen && <SettingsModal onClose={toggleSettingsModal} />}
    </div>
  );
};

export default App;