import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { CanvasElement, TextElement, Guide, ImageElement, GroupElement, ShapeElement } from '../types';
import { placeContentWithAI, applyStylesWithAI, editImageWithAI, applyBulkStylesWithAI } from '../services/geminiService';
import { useHistory } from './useHistory';

const SAVE_KEY = 'gemini-design-studio-save';

const loadInitialState = () => {
  try {
    const savedDesignJSON = localStorage.getItem(SAVE_KEY);
    if (savedDesignJSON) {
      const savedDesign = JSON.parse(savedDesignJSON);
      if (savedDesign.artboardSize && Array.isArray(savedDesign.elements)) {
        return {
          initialArtboardSize: savedDesign.artboardSize as { width: number; height: number },
          initialElements: savedDesign.elements as CanvasElement[],
        };
      }
    }
  } catch (e) {
    console.error("Failed to load saved design", e);
    localStorage.removeItem(SAVE_KEY);
  }
  return { initialArtboardSize: null, initialElements: [] as CanvasElement[] };
};

const { initialArtboardSize, initialElements } = loadInitialState();


const makeElementUpdater = (id: string, updates: Partial<CanvasElement>, groupContext: GroupElement | undefined | null) => {
    return (elements: CanvasElement[]): CanvasElement[] => {

        const typeSafeUpdate = (elementToUpdate: CanvasElement): CanvasElement => {
            switch(elementToUpdate.type){
                case 'text':
                    return { ...elementToUpdate, ...(updates as Partial<TextElement>)};
                case 'image':
                    return { ...elementToUpdate, ...(updates as Partial<ImageElement>)};
                case 'shape':
                    return { ...elementToUpdate, ...(updates as Partial<ShapeElement>)};
                case 'group':
                    return { ...elementToUpdate, ...(updates as Partial<GroupElement>)};
                default:
                    return elementToUpdate;
            }
        }
        
        if (groupContext) {
            const newUpdates = { ...updates };
            if (newUpdates.x !== undefined) newUpdates.x -= groupContext.x;
            if (newUpdates.y !== undefined) newUpdates.y -= groupContext.y;
            
            const typeSafeChildUpdate = (childToUpdate: CanvasElement): CanvasElement => {
                switch(childToUpdate.type){
                    case 'text':
                        return { ...childToUpdate, ...(newUpdates as Partial<TextElement>)};
                    case 'image':
                        return { ...childToUpdate, ...(newUpdates as Partial<ImageElement>)};
                    case 'shape':
                        return { ...childToUpdate, ...(newUpdates as Partial<ShapeElement>)};
                    case 'group':
                        return { ...childToUpdate, ...(newUpdates as Partial<GroupElement>)};
                    default:
                        return childToUpdate;
                }
            }

            return elements.map(el => {
                if (el.id === groupContext.id && el.type === 'group') {
                    const updatedChildren = el.elements.map(child =>
                        child.id === id ? typeSafeChildUpdate(child) : child
                    );
                    return { ...el, elements: updatedChildren };
                }
                return el;
            });
        } else {
            return elements.map(el => el.id === id ? typeSafeUpdate(el) : el);
        }
    };
};

export const useDesignState = () => {
  const [isDirty, setIsDirty] = useState(false);
  const { 
    state: elements, 
    setState: setElementsWithHistory, 
    reset: resetElementsHistory,
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory<CanvasElement[]>(initialElements, () => setIsDirty(true));

  const setElements = useCallback((updater: React.SetStateAction<CanvasElement[]>) => {
    setElementsWithHistory(updater);
  }, [setElementsWithHistory]);


  const [artboardSize, setArtboardSize] = useState<{ width: number, height: number } | null>(initialArtboardSize);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const mainContainerRef = useRef<HTMLElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [selectionRect, setSelectionRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<{ name: string, elements: any[] }[]>([]);
  const [liveElements, setLiveElements] = useState<CanvasElement[] | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [activeTool, _setActiveTool] = useState<'templates' | 'text' | 'image' | 'shapes' | 'export' | null>('templates');
  const [isDetailsPanelCollapsed, setIsDetailsPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [canPaste, setCanPaste] = useState(false);
  const [gridGuidesConfig, setGridGuidesConfig] = useState({ cols: 3, rows: 3, isVisible: false });

  const clipboardRef = useRef<(Omit<TextElement, 'id'> | Omit<ImageElement, 'id'> | Omit<ShapeElement, 'id'> | Omit<GroupElement, 'id'>)[]>([]);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const artboardSizeRef = useRef(artboardSize);
  artboardSizeRef.current = artboardSize;
  
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  
  const setActiveTool = useCallback((tool: 'text' | 'image' | 'shapes' | 'templates' | 'export') => {
    _setActiveTool(tool);
    if (isDetailsPanelCollapsed) {
      setIsDetailsPanelCollapsed(false);
    }
  }, [isDetailsPanelCollapsed]);

  const handleGridGuidesConfigChange = useCallback((newConfig: Partial<typeof gridGuidesConfig>) => {
    setGridGuidesConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const gridLines = useMemo((): Guide[] => {
    if (!gridGuidesConfig.isVisible || !artboardSize) {
      return [];
    }
    const lines: Guide[] = [];
    const { cols, rows } = gridGuidesConfig;
    const { width, height } = artboardSize;

    // Vertical lines
    for (let i = 1; i < cols; i++) {
      const x = (width / cols) * i;
      lines.push({ x1: x, y1: 0, x2: x, y2: height, type: 'grid' });
    }
    // Horizontal lines
    for (let i = 1; i < rows; i++) {
      const y = (height / rows) * i;
      lines.push({ x1: 0, y1: y, x2: width, y2: y, type: 'grid' });
    }
    return lines;
  }, [gridGuidesConfig, artboardSize]);

  const handleSaveDesign = useCallback(() => {
    if (!artboardSizeRef.current) return;

    try {
      const designState = {
        artboardSize: artboardSizeRef.current,
        elements: elementsRef.current,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(designState));
      setIsDirty(false);
    } catch (e) {
      console.error("Failed to save design", e);
    }
  }, []);

  useEffect(() => {
    const handleAutoSave = () => {
        if (!isDirtyRef.current || !artboardSizeRef.current) return;
        
        try {
            const designState = {
                artboardSize: artboardSizeRef.current,
                elements: elementsRef.current,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(designState));
            setIsDirty(false);
        } catch (e) {
            console.error("Failed to auto-save design", e);
        }
    };
    
    const intervalId = setInterval(handleAutoSave, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      setCustomTemplates(savedTemplates);
    } catch (e) {
      console.error("Failed to load custom templates from localStorage", e);
      setCustomTemplates([]);
    }
  }, []);

  const dragInfo = useRef<{
    startX: number;
    startY: number;
    elementsStart: { id: string; x: number; y: number; }[];
  } | null>(null);
  
  const resizeInfo = useRef<{
    element: CanvasElement;
    direction: string;
    startX: number;
    startY: number;
    elementStart: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const rotationInfo = useRef<{
    elementId: string;
    elementStartRotation: number;
    center: { x: number; y: number };
    startAngle: number;
  } | null>(null);

  const activeGroup = useMemo(() => editingGroupId
    ? (liveElements ?? elements).find(el => el.id === editingGroupId && el.type === 'group') as GroupElement | undefined
    : undefined, [editingGroupId, liveElements, elements]);

  const elementsOnCanvas = useMemo(() => activeGroup
    ? activeGroup.elements.map(el => ({
        ...el,
        x: el.x + activeGroup.x,
        y: el.y + activeGroup.y,
      }))
    : (liveElements ?? elements), [activeGroup, liveElements, elements]);

  const elementsToRender = liveElements ?? elements;
  const singleSelectedElement = selectedElementIds.length === 1 ? elementsOnCanvas.find(el => el.id === selectedElementIds[0]) : null;
  
  const handleSetZoom = useCallback((newZoom: number | ((prevZoom: number) => number)) => {
    const MIN_ZOOM = 0.1; // 10%
    const MAX_ZOOM = 5.0; // 500%
    setZoom(prevZoom => {
        const nextZoom = typeof newZoom === 'function' ? newZoom(prevZoom) : newZoom;
        return Math.max(MIN_ZOOM, Math.min(nextZoom, MAX_ZOOM));
    });
  }, []);


  const fitToScreen = useCallback(() => {
    if (!mainContainerRef.current || !artboardSize) return;

    const container = mainContainerRef.current;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    const { width: artboardWidth, height: artboardHeight } = artboardSize;
    
    const padding = 32;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    const scaleX = availableWidth / artboardWidth;
    const scaleY = availableHeight / artboardHeight;
    
    const newZoom = Math.min(scaleX, scaleY);
    handleSetZoom(newZoom > 0 ? newZoom : 1);
  }, [artboardSize, handleSetZoom]);

  useEffect(() => {
    if (!artboardSize) return;
    const timer = setTimeout(() => fitToScreen(), 0);
    window.addEventListener('resize', fitToScreen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitToScreen);
    };
  }, [artboardSize, fitToScreen]);

  useEffect(() => {
    if (editorContainerRef.current) {
      const container = editorContainerRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, [zoom]);


  const handleArtboardSelect = (width: number, height: number) => {
    setArtboardSize({ width, height });
  };

  const handleAddElement = useCallback((element: Omit<CanvasElement, 'id'>) => {
    const newElement: CanvasElement = {
      ...element,
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    } as CanvasElement;
    setElements((prev) => [...prev, newElement]);
  }, [setElements]);

  const handleAddTemplate = useCallback((templateElements: any[]) => {
    if (!editorRef.current || templateElements.length === 0) return;

    const rect = editorRef.current.getBoundingClientRect();
    const canvasWidth = rect.width / zoom;
    const canvasHeight = rect.height / zoom;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const padding = 40;

    const isUserTemplate = typeof templateElements[0]?.x === 'number';

    if (isUserTemplate) {
        // --- Logic for user-saved templates with absolute x, y ---
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        templateElements.forEach(el => {
            minX = Math.min(minX, el.x);
            maxX = Math.max(maxX, el.x + el.width);
            minY = Math.min(minY, el.y);
            maxY = Math.max(maxY, el.y + el.height);
        });

        const templateWidth = maxX - minX;
        const templateHeight = maxY - minY;

        const availableWidth = canvasWidth - padding;
        const availableHeight = canvasHeight - padding;
        const scaleFactor = Math.min(1, availableWidth / templateWidth, availableHeight / templateHeight);

        const newTemplateWidth = templateWidth * scaleFactor;
        const newTemplateHeight = templateHeight * scaleFactor;
        const newTemplateX = canvasCenterX - newTemplateWidth / 2;
        const newTemplateY = canvasCenterY - newTemplateHeight / 2;

        const newElements = templateElements.map((templateEl, index) => {
            const relativeX = templateEl.x - minX;
            const relativeY = templateEl.y - minY;
            
            const scaledWidth = templateEl.width * scaleFactor;
            const scaledHeight = templateEl.height * scaleFactor;

            const newElement: Partial<CanvasElement> = {
                ...templateEl,
                id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
                width: scaledWidth,
                height: scaledHeight,
                x: newTemplateX + (relativeX * scaleFactor),
                y: newTemplateY + (relativeY * scaleFactor),
                rotation: templateEl.rotation || 0,
            };

            if (newElement.type === 'text' && templateEl.fontSize) {
                (newElement as TextElement).fontSize = templateEl.fontSize * scaleFactor;
            }

            return newElement as CanvasElement;
        });
        
        setElements(prev => [...prev, ...newElements]);

    } else {
        // --- Existing logic for pre-defined templates with xOffset, yOffset ---
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        templateElements.forEach(el => {
          const { width, height, xOffset = 0, yOffset = 0 } = el;
          minX = Math.min(minX, xOffset - width / 2);
          maxX = Math.max(maxX, xOffset + width / 2);
          minY = Math.min(minY, yOffset - height / 2);
          maxY = Math.max(maxY, yOffset + height / 2);
        });
    
        const templateWidth = maxX - minX;
        const templateHeight = maxY - minY;
        const availableWidth = canvasWidth - padding;
        const availableHeight = canvasHeight - padding;
        const scaleFactor = Math.min(1, availableWidth / templateWidth, availableHeight / templateHeight);
    
        const newElements: CanvasElement[] = templateElements.map((templateEl, index) => {
            const { yOffset = 0, xOffset = 0, ...rest } = templateEl;
            const scaledWidth = rest.width * scaleFactor;
            const scaledHeight = rest.height * scaleFactor;
            const scaledXOffset = xOffset * scaleFactor;
            const scaledYOffset = yOffset * scaleFactor;
            
            const element: Partial<CanvasElement> = {
                ...rest,
                id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
                width: scaledWidth,
                height: scaledHeight,
                x: canvasCenterX + scaledXOffset - scaledWidth / 2,
                y: canvasCenterY + scaledYOffset - scaledHeight / 2,
                rotation: 0,
            };
            if (element.type === 'text') {
                (element as TextElement).fontSize = (rest.fontSize || 16) * scaleFactor;
                (element as TextElement).textAlign = rest.textAlign || 'center';
            }
            return element as CanvasElement;
        });
        setElements(prev => [...prev, ...newElements]);
    }
}, [setElements, zoom]);


  const handleUpdateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const updater = makeElementUpdater(id, updates, activeGroup);
    if (liveElements) {
        setLiveElements(updater);
    } else {
        setElements(updater);
    }
  }, [setElements, liveElements, activeGroup]);

  const handleUpdateSelectedElements = useCallback((updates: Partial<CanvasElement>) => {
    const updater = (prevElements: CanvasElement[]): CanvasElement[] => {
        const selectedIdsSet = new Set(selectedElementIds);

        const applyUpdates = (el: CanvasElement): CanvasElement => {
            if (!selectedIdsSet.has(el.id)) {
                return el;
            }
            switch(el.type) {
                case 'text':
                    return { ...el, ...(updates as Partial<TextElement>) };
                case 'image':
                    return { ...el, ...(updates as Partial<ImageElement>) };
                case 'shape':
                    return { ...el, ...(updates as Partial<ShapeElement>) };
                case 'group':
                    return { ...el, ...(updates as Partial<GroupElement>) };
            }
        };

        if (editingGroupId) {
            return prevElements.map(el => {
                if (el.id === editingGroupId && el.type === 'group') {
                    const updatedChildren = el.elements.map(applyUpdates);
                    const updatedGroup = selectedIdsSet.has(el.id) ? applyUpdates(el) as GroupElement : el;
                    return { ...updatedGroup, elements: updatedChildren };
                }
                return el;
            });
        }
        return prevElements.map(applyUpdates);
    };

    if (liveElements) {
        setLiveElements(prev => prev ? updater(prev) : null);
    } else {
        setElements(updater);
    }
  }, [selectedElementIds, setElements, editingGroupId, liveElements]);
  
  const isAnySelectedLocked = useMemo(() => {
    if (selectedElementIds.length === 0) return false;
    
    const allElementsById = new Map<string, CanvasElement>();
    const crawl = (els: CanvasElement[]) => {
        els.forEach(el => {
            allElementsById.set(el.id, el);
            if (el.type === 'group') crawl(el.elements);
        });
    };
    crawl(elements);
    
    return selectedElementIds.some(id => allElementsById.get(id)?.locked);
  }, [selectedElementIds, elements]);
  
  const handleDeleteElement = useCallback(() => {
    if (selectedElementIds.length === 0 || isAnySelectedLocked) return;
    
    const idsToDelete = new Set(selectedElementIds);
    const filterRecursively = (els: CanvasElement[]): CanvasElement[] => {
        const filtered = els.filter(el => !idsToDelete.has(el.id));
        return filtered.map(el => {
            if (el.type === 'group') return { ...el, elements: filterRecursively(el.elements) };
            return el;
        });
    };
    setElements(filterRecursively);
    setSelectedElementIds(prev => prev.filter(id => !idsToDelete.has(id)));
}, [selectedElementIds, setElements, isAnySelectedLocked]);

  const handleReorderElement = useCallback((elementIds: string[], direction: 'forward' | 'backward' | 'front' | 'back') => {
      setElements(prev => {
          const newElements = prev.filter(el => !elementIds.includes(el.id));
          const elementsToMove = prev.filter(el => elementIds.includes(el.id));
          if (elementsToMove.length === 0) return prev;
          if (direction === 'front') return [...newElements, ...elementsToMove];
          if (direction === 'back') return [...elementsToMove, ...newElements];
          if (elementIds.length === 1) {
              const elementId = elementIds[0];
              const currentIndex = prev.findIndex(el => el.id === elementId);

              // Element not found, return original array
              if (currentIndex === -1) {
                return prev;
              }

              const element = prev[currentIndex];
              const arr = prev.filter(el => el.id !== elementId);
              
              if (direction === 'forward') {
                // To move forward, insert at the next index in the shortened array.
                // This is safe because reorderability check ensures we are not at the end.
                arr.splice(currentIndex + 1, 0, element);
              } else if (direction === 'backward') {
                // To move backward, insert at the previous index.
                arr.splice(Math.max(currentIndex - 1, 0), 0, element);
              }
              return arr;
          }
          return prev;
      });
  }, [setElements]);

  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current || !artboardSize) return;
    const { elementsStart, startX, startY } = dragInfo.current;
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    
    const draggedElementIds = new Set(elementsStart.map(s => s.id));
    const otherElements = elementsOnCanvas.filter(el => !draggedElementIds.has(el.id));
    const draggedElementsWithPos = elementsStart.map(start => ({ ...elementsOnCanvas.find(e => e.id === start.id)!, x: start.x + dx, y: start.y + dy }));
    if (draggedElementsWithPos.length === 0) return;

    const selectionBounds = draggedElementsWithPos.reduce((acc, el) => ({
        minX: Math.min(acc.minX, el.x), minY: Math.min(acc.minY, el.y),
        maxX: Math.max(acc.maxX, el.x + el.width), maxY: Math.max(acc.maxY, el.y + el.height),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    const draggedBounds = {
        left: selectionBounds.minX, top: selectionBounds.minY, right: selectionBounds.maxX, bottom: selectionBounds.maxY,
        centerX: selectionBounds.minX + (selectionBounds.maxX - selectionBounds.minX) / 2,
        centerY: selectionBounds.minY + (selectionBounds.maxY - selectionBounds.minY) / 2,
    };
    
    let snapDx = 0;
    let snapDy = 0;
    const newGuides: Guide[] = [];
    const SNAP_THRESHOLD = 5 / zoom;

    const artboardTarget = {
        left: 0, centerX: artboardSize.width / 2, right: artboardSize.width,
        top: 0, centerY: artboardSize.height / 2, bottom: artboardSize.height,
    };
    const elementTargets = otherElements.map(el => ({
        left: el.x, centerX: el.x + el.width / 2, right: el.x + el.width,
        top: el.y, centerY: el.y + el.height / 2, bottom: el.y + el.height,
    }));
    const allTargets = [artboardTarget, ...elementTargets];

    let bestXSnap = { diff: Infinity, targetValue: 0 };
    for (const target of allTargets) {
        for (const draggedEdge of ['left', 'centerX', 'right'] as const) {
            for (const targetEdge of ['left', 'centerX', 'right'] as const) {
                const diff = Math.abs(draggedBounds[draggedEdge] - target[targetEdge]);
                if (diff < SNAP_THRESHOLD && diff < bestXSnap.diff) {
                    bestXSnap = { diff, targetValue: target[targetEdge] };
                    snapDx = draggedBounds[draggedEdge] - target[targetEdge];
                }
            }
        }
    }
    
    let bestYSnap = { diff: Infinity, targetValue: 0 };
    for (const target of allTargets) {
        for (const draggedEdge of ['top', 'centerY', 'bottom'] as const) {
            for (const targetEdge of ['top', 'centerY', 'bottom'] as const) {
                const diff = Math.abs(draggedBounds[draggedEdge] - target[targetEdge]);
                if (diff < SNAP_THRESHOLD && diff < bestYSnap.diff) {
                    bestYSnap = { diff, targetValue: target[targetEdge] };
                    snapDy = draggedBounds[draggedEdge] - target[targetEdge];
                }
            }
        }
    }

    if (bestXSnap.diff !== Infinity) {
        newGuides.push({ x1: bestXSnap.targetValue, y1: 0, x2: bestXSnap.targetValue, y2: artboardSize.height, type: 'snap' });
    }
    if (bestYSnap.diff !== Infinity) {
        newGuides.push({ x1: 0, y1: bestYSnap.targetValue, x2: artboardSize.width, y2: bestYSnap.targetValue, type: 'snap' });
    }
    
    setGuides(newGuides);

    const finalDx = dx - snapDx;
    const finalDy = dy - snapDy;

    setLiveElements(currentLiveElements => {
        if (!currentLiveElements) return currentLiveElements;
        let updatedElements = currentLiveElements;
        elementsStart.forEach(start => {
            const updater = makeElementUpdater(start.id, { x: start.x + finalDx, y: start.y + finalDy }, activeGroup);
            updatedElements = updater(updatedElements);
        });
        return updatedElements;
    });
  }, [zoom, elements, artboardSize, elementsOnCanvas, activeGroup]);

  const handleDocumentMouseUp = useCallback(() => {
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    if (dragInfo.current) {
        const elementsStart = dragInfo.current.elementsStart;
        setLiveElements(currentLiveElements => {
            if (currentLiveElements) {
                const currentActiveGroup = editingGroupId ?
                    currentLiveElements.find(el => el.id === editingGroupId && el.type === 'group') as GroupElement | undefined
                    : undefined;
                
                const finalElementsOnCanvas = currentActiveGroup
                    ? currentActiveGroup.elements.map(el => ({...el, x: el.x + currentActiveGroup.x, y: el.y + currentActiveGroup.y})) ?? []
                    : currentLiveElements;
                const hasMoved = finalElementsOnCanvas.some(el => {
                    const startPos = elementsStart.find(s => s.id === el.id);
                    return startPos && (el.x !== startPos.x || el.y !== startPos.y);
                });
                if (hasMoved) setElements(currentLiveElements);
            }
            return null;
        });
    }
    setGuides([]);
    setDraggingElementId(null);
    dragInfo.current = null;
  }, [handleDocumentMouseMove, setElements, editingGroupId]);

  const handleElementMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    const element = elementsOnCanvas.find(el => el.id === id);
    if (!element || element.locked) return;
    if (resizeInfo.current || rotationInfo.current) return;
    e.stopPropagation();
    let nextSelectedIds: string[];
    const isAlreadySelected = selectedElementIds.includes(id);
    if (e.shiftKey) nextSelectedIds = isAlreadySelected ? selectedElementIds.filter(sid => sid !== id) : [...selectedElementIds, id];
    else nextSelectedIds = !isAlreadySelected ? [id] : selectedElementIds;
    setSelectedElementIds(nextSelectedIds);
    if (e.shiftKey && isAlreadySelected) return;
    const elementsToDrag = elementsOnCanvas.filter(el => nextSelectedIds.includes(el.id));
    if (elementsToDrag.length === 0) return;
    dragInfo.current = { startX: e.clientX, startY: e.clientY, elementsStart: elementsToDrag.map(el => ({ id: el.id, x: el.x, y: el.y })) };
    setDraggingElementId(id);
    setLiveElements(elements);
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  }, [elements, selectedElementIds, handleDocumentMouseMove, handleDocumentMouseUp, elementsOnCanvas]);

  const handleDocumentMouseMoveForResize = useCallback((e: MouseEvent) => {
    if (!resizeInfo.current) return;
    const { element, direction, elementStart, startX, startY } = resizeInfo.current;
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    const minSize = 20;
    let { x, y, width, height } = elementStart;

    if (e.shiftKey && elementStart.width > 0 && elementStart.height > 0) {
        const aspectRatio = elementStart.width / elementStart.height;

        let potentialWidth = width;
        let potentialHeight = height;

        if (direction.includes('right')) potentialWidth = elementStart.width + dx;
        else if (direction.includes('left')) potentialWidth = elementStart.width - dx;
        
        if (direction.includes('bottom')) potentialHeight = elementStart.height + dy;
        else if (direction.includes('top')) potentialHeight = elementStart.height - dy;

        const isCorner = (direction.includes('left') || direction.includes('right')) && (direction.includes('top') || direction.includes('bottom'));
        
        if (isCorner) {
            if (Math.abs(dx) > Math.abs(dy)) {
                width = Math.max(minSize, potentialWidth);
                height = width / aspectRatio;
            } else {
                height = Math.max(minSize, potentialHeight);
                width = height * aspectRatio;
            }
        } else if (direction.includes('left') || direction.includes('right')) {
            width = Math.max(minSize, potentialWidth);
            height = width / aspectRatio;
        } else {
            height = Math.max(minSize, potentialHeight);
            width = height * aspectRatio;
        }
        
    } else {
        if (direction.includes('right')) {
            width = Math.max(minSize, elementStart.width + dx);
        } else if (direction.includes('left')) {
            const newWidth = elementStart.width - dx;
            if (newWidth >= minSize) width = newWidth;
        }
        if (direction.includes('bottom')) {
            height = Math.max(minSize, elementStart.height + dy);
        } else if (direction.includes('top')) {
            const newHeight = elementStart.height - dy;
            if (newHeight >= minSize) height = newHeight;
        }
    }
    
    if (direction.includes('left')) {
        x = elementStart.x + (elementStart.width - width);
    }
    if (direction.includes('top')) {
        y = elementStart.y + (elementStart.height - height);
    }

    const updates: Partial<CanvasElement> = { x, y, width, height };
    
    if (element.type === 'shape' && (element as ShapeElement).shapeType === 'line') {
      (updates as Partial<ShapeElement>).strokeWidth = height;
    }

    if (element.type === 'group') {
        const scaleX = width / elementStart.width;
        const scaleY = height / elementStart.height;
        const updatedChildren = (element as GroupElement).elements.map((child): CanvasElement => {
            const baseUpdate = {
                x: child.x * scaleX,
                y: child.y * scaleY,
                width: child.width * scaleX,
                height: child.height * scaleY,
            };
            switch (child.type) {
                case 'text':
                    return { ...child, ...baseUpdate, fontSize: child.fontSize * Math.min(scaleX, scaleY) };
                case 'shape':
                    if (child.shapeType === 'line') {
                        return { ...child, ...baseUpdate, strokeWidth: child.strokeWidth * scaleY };
                    }
                    return { ...child, ...baseUpdate, strokeWidth: child.strokeWidth * Math.min(scaleX, scaleY) };
                case 'image':
                case 'group':
                    return { ...child, ...baseUpdate };
            }
        });
        (updates as Partial<GroupElement>).elements = updatedChildren;
    }
    setLiveElements(currentLiveElements => {
        if (!currentLiveElements) return currentLiveElements;
        const currentActiveGroup = editingGroupId ? currentLiveElements.find(el => el.id === editingGroupId && el.type === 'group') as GroupElement | undefined : undefined;
        const updater = makeElementUpdater(element.id, updates, currentActiveGroup);
        return updater(currentLiveElements);
    });
  }, [zoom, editingGroupId]);

  const handleDocumentMouseUpForResize = useCallback(() => {
      document.body.style.userSelect = '';
      setLiveElements(currentLiveElements => {
          if (currentLiveElements) setElements(currentLiveElements);
          return null;
      });
      document.removeEventListener('mousemove', handleDocumentMouseMoveForResize);
      document.removeEventListener('mouseup', handleDocumentMouseUpForResize);
      resizeInfo.current = null;
  }, [handleDocumentMouseMoveForResize, setElements]);

  const handleResizeStart = useCallback((elementId: string, direction: string, e: React.MouseEvent) => {
    const element = elementsOnCanvas.find(el => el.id === elementId);
    if (!element) return;
    e.stopPropagation();
    resizeInfo.current = { startX: e.clientX, startY: e.clientY, elementStart: { x: element.x, y: element.y, width: element.width, height: element.height }, element, direction };
    setLiveElements(elements);
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleDocumentMouseMoveForResize);
    document.addEventListener('mouseup', handleDocumentMouseUpForResize);
  }, [elements, elementsOnCanvas, handleDocumentMouseMoveForResize, handleDocumentMouseUpForResize]);
  
  const handleDocumentMouseMoveForRotation = useCallback((e: MouseEvent) => {
    if (!rotationInfo.current || !editorRef.current) return;
    const { elementId, elementStartRotation, center, startAngle } = rotationInfo.current;
    
    const editorRect = editorRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - editorRect.left) / zoom;
    const mouseY = (e.clientY - editorRect.top) / zoom;
    
    const currentAngle = Math.atan2(mouseY - center.y, mouseX - center.x) * (180 / Math.PI);
    
    let deltaAngle = currentAngle - startAngle;
    let newRotation = elementStartRotation + deltaAngle;
    
    if (e.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
    }
    
    setLiveElements(currentLiveElements => {
        if (!currentLiveElements) return currentLiveElements;
        const updater = makeElementUpdater(elementId, { rotation: newRotation }, activeGroup);
        return updater(currentLiveElements);
    });
  }, [zoom, activeGroup]);

  const handleDocumentMouseUpForRotation = useCallback(() => {
      document.body.style.userSelect = '';
      setLiveElements(currentLiveElements => {
          if (currentLiveElements) setElements(currentLiveElements);
          return null;
      });
      document.removeEventListener('mousemove', handleDocumentMouseMoveForRotation);
      document.removeEventListener('mouseup', handleDocumentMouseUpForRotation);
      rotationInfo.current = null;
  }, [handleDocumentMouseMoveForRotation, setElements]);

  const handleRotationStart = useCallback((elementId: string, e: React.MouseEvent) => {
    const element = elementsOnCanvas.find(el => el.id === elementId);
    if (!element || !editorRef.current) return;
    e.stopPropagation();
    const editorRect = editorRef.current.getBoundingClientRect();
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    
    const mouseX = (e.clientX - editorRect.left) / zoom;
    const mouseY = (e.clientY - editorRect.top) / zoom;
    
    const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
    
    rotationInfo.current = {
      elementId,
      elementStartRotation: element.rotation,
      center: { x: centerX, y: centerY },
      startAngle: startAngle,
    };
    
    setLiveElements(elements);
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleDocumentMouseMoveForRotation);
    document.addEventListener('mouseup', handleDocumentMouseUpForRotation);
  }, [elements, elementsOnCanvas, zoom, handleDocumentMouseMoveForRotation, handleDocumentMouseUpForRotation]);

    const handleMouseDownOnContainer = (e: React.MouseEvent) => {
        const container = e.currentTarget as HTMLElement;
        if (editingGroupId) {
            const editorRect = editorRef.current?.getBoundingClientRect();
            if (editorRect) {
                const group = elements.find(el => el.id === editingGroupId) as GroupElement;
                if (group) {
                    const groupRect = { left: editorRect.left + group.x * zoom, top: editorRect.top + group.y * zoom, right: editorRect.left + (group.x + group.width) * zoom, bottom: editorRect.top + (group.y + group.height) * zoom };
                    if (e.clientX < groupRect.left || e.clientX > groupRect.right || e.clientY < groupRect.top || e.clientY > groupRect.bottom) {
                        setEditingGroupId(null);
                        setSelectedElementIds([editingGroupId]);
                        return;
                    }
                }
            }
            return;
        }
        
        const containerRect = container.getBoundingClientRect();
        if (e.clientX >= containerRect.left + container.clientWidth || e.clientY >= containerRect.top + container.clientHeight) return;

        if (!e.shiftKey) setSelectedElementIds([]);
        
        const mainContainer = mainContainerRef.current;
        if (!mainContainer) return;

        document.body.style.userSelect = 'none';
        
        const mainRect = mainContainer.getBoundingClientRect();

        const startX = e.clientX - mainRect.left;
        const startY = e.clientY - mainRect.top;

        const handleMouseMove = (moveE: MouseEvent) => {
            const moveX = moveE.clientX - mainRect.left;
            const moveY = moveE.clientY - mainRect.top;
            setSelectionRect({
                x1: Math.min(startX, moveX),
                y1: Math.min(startY, moveY),
                x2: Math.max(startX, moveX),
                y2: Math.max(startY, moveY)
            });
        };
        const handleMouseUp = (upE: MouseEvent) => {
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setSelectionRect(currentRect => {
                if (currentRect && editorRef.current) {
                    const artboardRect = editorRef.current.getBoundingClientRect();
                    const latestMainRect = mainContainerRef.current!.getBoundingClientRect();
                    const artboardLeftRelativeToMain = artboardRect.left - latestMainRect.left;
                    const artboardTopRelativeToMain = artboardRect.top - latestMainRect.top;
                    
                    const marquee = {
                        x: (currentRect.x1 - artboardLeftRelativeToMain) / zoom,
                        y: (currentRect.y1 - artboardTopRelativeToMain) / zoom,
                        width: (currentRect.x2 - currentRect.x1) / zoom,
                        height: (currentRect.y2 - currentRect.y1) / zoom
                    };
                    
                    if (marquee.width < 5 && marquee.height < 5) return null;
                    const selectableElements = elementsToRender.filter(el => !el.locked);
                    const selectedIds = selectableElements.filter(el => (el.x < marquee.x + marquee.width && el.x + el.width > marquee.x && el.y < marquee.y + marquee.height && el.y + el.height > marquee.y)).map(el => el.id);
                    if (upE.shiftKey) setSelectedElementIds(prev => [...new Set([...prev, ...selectedIds])]);
                    else setSelectedElementIds(selectedIds);
                }
                return null;
            });
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleGroup = useCallback(() => {
        const elementsToGroup = elements.filter(el => selectedElementIds.includes(el.id));
        if (elementsToGroup.length < 2 || elementsToGroup.some(el => el.locked)) return;
        const minX = Math.min(...elementsToGroup.map(el => el.x));
        const minY = Math.min(...elementsToGroup.map(el => el.y));
        const maxX = Math.max(...elementsToGroup.map(el => el.x + el.width));
        const maxY = Math.max(...elementsToGroup.map(el => el.y + el.height));
        const newGroup: GroupElement = {
            id: `group_${Date.now()}`, type: 'group', x: minX, y: minY,
            width: maxX - minX, height: maxY - minY, rotation: 0,
            elements: elementsToGroup.map(el => ({ ...el, x: el.x - minX, y: el.y - minY })),
        };
        setElements(prev => [...prev.filter(el => !selectedElementIds.includes(el.id)), newGroup]);
        setSelectedElementIds([newGroup.id]);
    }, [elements, selectedElementIds, setElements]);
    
    const handleUngroup = useCallback(() => {
        const groupsToUngroup = elements.filter(el => selectedElementIds.includes(el.id) && el.type === 'group') as GroupElement[];
        if (groupsToUngroup.length === 0 || groupsToUngroup.some(g => g.locked)) return;
        const groupIdsToUngroup = new Set(groupsToUngroup.map(g => g.id));
        const remainingElements = elements.filter(el => !groupIdsToUngroup.has(el.id));
        const newIndividualElements: CanvasElement[] = [];
        groupsToUngroup.forEach(group => {
            const children = group.elements.map(el => ({ ...el, id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, x: el.x + group.x, y: el.y + group.y, rotation: (el.rotation || 0) + (group.rotation || 0) }));
            newIndividualElements.push(...children);
        });
        const newSelectedIds = newIndividualElements.map(el => el.id);
        setElements([...remainingElements, ...newIndividualElements]);
        setSelectedElementIds(newSelectedIds);
    }, [elements, selectedElementIds, setElements]);

    const canUngroup = useMemo(() => selectedElementIds.some(id => elements.find(e => e.id === id)?.type === 'group'), [selectedElementIds, elements]);

    const handleElementDoubleClick = (id: string) => {
      if (editingGroupId) return;
      const element = elements.find(el => el.id === id);
      if (element?.type === 'group' && !element.locked) {
        setEditingGroupId(id);
        setSelectedElementIds([]);
      }
    };

    const handleAlignOrDistribute = useCallback((operation: 'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom' | 'distribute-horizontal' | 'distribute-vertical') => {
        const selectedElements = elementsOnCanvas.filter(el => selectedElementIds.includes(el.id) && !el.locked);

        if (selectedElements.length < 2) return;

        const updates = new Map<string, Partial<CanvasElement>>();

        const boundingBox = selectedElements.reduce((acc, el) => ({
            minX: Math.min(acc.minX, el.x),
            minY: Math.min(acc.minY, el.y),
            maxX: Math.max(acc.maxX, el.x + el.width),
            maxY: Math.max(acc.maxY, el.y + el.height),
        }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

        const centerX = boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2;
        const middleY = boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2;

        switch (operation) {
            case 'align-left':
                selectedElements.forEach(el => updates.set(el.id, { x: boundingBox.minX }));
                break;
            case 'align-center':
                selectedElements.forEach(el => updates.set(el.id, { x: centerX - el.width / 2 }));
                break;
            case 'align-right':
                selectedElements.forEach(el => updates.set(el.id, { x: boundingBox.maxX - el.width }));
                break;
            case 'align-top':
                selectedElements.forEach(el => updates.set(el.id, { y: boundingBox.minY }));
                break;
            case 'align-middle':
                selectedElements.forEach(el => updates.set(el.id, { y: middleY - el.height / 2 }));
                break;
            case 'align-bottom':
                selectedElements.forEach(el => updates.set(el.id, { y: boundingBox.maxY - el.height }));
                break;
            case 'distribute-horizontal':
                if (selectedElements.length < 3) break;
                const sortedH = [...selectedElements].sort((a, b) => a.x - b.x);
                const totalWidth = sortedH.reduce((sum, el) => sum + el.width, 0);
                const totalGap = boundingBox.maxX - boundingBox.minX - totalWidth;
                const gap = totalGap / (sortedH.length - 1);
                let currentX = boundingBox.minX;
                sortedH.forEach(el => {
                    updates.set(el.id, { x: currentX });
                    currentX += el.width + gap;
                });
                break;
            case 'distribute-vertical':
                if (selectedElements.length < 3) break;
                const sortedV = [...selectedElements].sort((a, b) => a.y - b.y);
                const totalHeight = sortedV.reduce((sum, el) => sum + el.height, 0);
                const totalGapV = boundingBox.maxY - boundingBox.minY - totalHeight;
                const gapV = totalGapV / (sortedV.length - 1);
                let currentY = boundingBox.minY;
                sortedV.forEach(el => {
                    updates.set(el.id, { y: currentY });
                    currentY += el.height + gapV;
                });
                break;
        }

        setElements(prev => {
            let nextElements = prev;
            updates.forEach((update, id) => {
                const updater = makeElementUpdater(id, update, activeGroup);
                nextElements = updater(nextElements);
            });
            return nextElements;
        });
    }, [elementsOnCanvas, selectedElementIds, setElements, activeGroup]);

    const handleSelectElements = useCallback((ids: string[], mode: 'set' | 'add') => {
        if (mode === 'set') {
            setSelectedElementIds(ids);
        } else {
            setSelectedElementIds(prev => [...new Set([...prev, ...ids])]);
        }
    }, []);

    const handleReorderForLayers = useCallback((draggedId: string, targetId: string, position: 'before' | 'after') => {
        setElements(prev => {
            const draggedItem = prev.find(p => p.id === draggedId);
            if (!draggedItem) return prev;

            const items = prev.filter(p => p.id !== draggedId);
            const targetIndex = items.findIndex(p => p.id === targetId);
            if (targetIndex === -1) return prev;

            items.splice(targetIndex + (position === 'after' ? 1 : 0), 0, draggedItem);
            return items;
        });
    }, [setElements]);

    const handleToggleLock = useCallback((ids: string[]) => {
        const idsToToggle = new Set(ids);
        const toggleLockRecursively = (els: CanvasElement[]): CanvasElement[] => {
            return els.map(el => {
                const newEl = { ...el };
                if (idsToToggle.has(el.id)) {
                    newEl.locked = !newEl.locked;
                }
                if (newEl.type === 'group') {
                    newEl.elements = toggleLockRecursively(newEl.elements);
                }
                return newEl;
            });
        };
        setElements(toggleLockRecursively);
    }, [setElements]);

    const handleCopy = useCallback(() => {
      if (selectedElementIds.length === 0) return;
      const elementsToCopy = elementsOnCanvas
        .filter(el => selectedElementIds.includes(el.id))
        .map(el => {
          switch (el.type) {
            case 'text': { const { id, ...rest } = el; return rest; }
            case 'image': { const { id, ...rest } = el; return rest; }
            case 'shape': { const { id, ...rest } = el; return rest; }
            case 'group': { const { id, ...rest } = el; return rest; }
          }
        });
      clipboardRef.current = elementsToCopy.filter(Boolean);
      setCanPaste(true);
    }, [selectedElementIds, elementsOnCanvas]);

    const handlePaste = useCallback(() => {
      if (clipboardRef.current.length === 0) return;
      const newElements = clipboardRef.current.map((el, i): CanvasElement | null => {
          const newId = `el_${Date.now()}_${i}`;
          const newPosition = { x: el.x + 20, y: el.y + 20 };
          switch (el.type) {
              case 'text': return { ...el, ...newPosition, id: newId };
              case 'image': return { ...el, ...newPosition, id: newId };
              case 'shape': return { ...el, ...newPosition, id: newId };
              case 'group': return { ...el, ...newPosition, id: newId };
              default: return null;
          }
      }).filter((el): el is CanvasElement => el !== null);
      setElements(prev => [...prev, ...newElements]);
      setSelectedElementIds(newElements.map(el => el.id));
    }, [setElements]);

    const handleDuplicate = useCallback(() => {
      if (selectedElementIds.length === 0 || isAnySelectedLocked) return;
      const elementsMap = new Map<string, CanvasElement>();
      const crawl = (els: CanvasElement[]) => els.forEach(el => {
          elementsMap.set(el.id, el);
          if (el.type === 'group') crawl(el.elements);
      });
      crawl(elements);
      const elementsToDuplicate = selectedElementIds.map(id => elementsMap.get(id)).filter((el): el is CanvasElement => !!el);
      const newElements = elementsToDuplicate.map((el): CanvasElement | undefined => {
        const newPosition = { x: el.x + 20, y: el.y + 20 };
        const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        switch(el.type) {
          case 'text': { const { id, ...rest } = el; return { ...rest, ...newPosition, id: newId }; }
          case 'image': { const { id, ...rest } = el; return { ...rest, ...newPosition, id: newId }; }
          case 'shape': { const { id, ...rest } = el; return { ...rest, ...newPosition, id: newId }; }
          case 'group': { const { id, ...rest } = el; return { ...rest, ...newPosition, id: newId }; }
        }
      }).filter((el): el is CanvasElement => !!el);
      setElements(prev => [...prev, ...newElements]);
      setSelectedElementIds(newElements.map(el => el.id));
    }, [selectedElementIds, elements, setElements, isAnySelectedLocked]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
        if (isInputFocused) return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          let allSelectableIds: string[];
          if (editingGroupId) {
            const group = elements.find(el => el.id === editingGroupId && el.type === 'group') as GroupElement | undefined;
            if (group) {
              allSelectableIds = group.elements.filter(el => !el.locked).map(el => el.id);
            } else {
              allSelectableIds = [];
            }
          } else {
            allSelectableIds = elements.filter(el => !el.locked).map(el => el.id);
          }
          setSelectedElementIds(allSelectableIds);
          return;
        }
        
        // Add zoom controls
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '=' || e.key === '+') { // Handle both '=' and '+' for zoom in
                e.preventDefault();
                handleSetZoom(z => z + 0.1);
                return;
            }
            if (e.key === '-') {
                e.preventDefault();
                handleSetZoom(z => z - 0.1);
                return;
            }
            if (e.key === '0') {
                e.preventDefault();
                fitToScreen();
                return;
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteElement(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); handleGroup(); }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') { e.preventDefault(); handleUngroup(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveDesign(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); handleCopy(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); handlePaste(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); handleDuplicate(); }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
        undo, redo, handleDeleteElement, handleGroup, handleUngroup, handleSaveDesign, 
        handleCopy, handlePaste, handleDuplicate, elements, editingGroupId, fitToScreen, handleSetZoom
    ]);

    const withErrorHandling = <T extends any[]>(fn: (...args: T) => Promise<void>) => {
        return async (...args: T) => {
            try {
                setError(null);
                setIsProcessing(true);
                await fn(...args);
            } catch (err: any) {
                console.error("AI operation failed:", err);
                setError(err.message || "An unknown error occurred with the AI service.");
            } finally {
                setIsProcessing(false);
            }
        };
    };

    const handlePlaceContent = withErrorHandling(async (content: string) => {
        const contentMap = await placeContentWithAI(elements, content);
        setElements(prev =>
            prev.map(el =>
                el.type === 'text' && contentMap[el.id]
                    ? { ...el, content: contentMap[el.id] } as TextElement
                    : el
            )
        );
    });

    const handleApplyStyles = withErrorHandling(async (command: string) => {
        if (selectedElementIds.length === 0) return;

        if (selectedElementIds.length > 1) {
            const selected = elements.filter(el => selectedElementIds.includes(el.id));
            const updates = await applyBulkStylesWithAI(selected, command);
            setElements(prev => {
                const updatesMap = new Map(updates.map(u => [u.id, u]));
                return prev.map(el => {
                    const update = updatesMap.get(el.id);
                    return update ? { ...el, ...update } as CanvasElement : el;
                });
            });
        } else {
            const element = singleSelectedElement;
            if (!element) return;

            if (element.type === 'image') {
                const newSrc = await editImageWithAI(element.src, command);
                handleUpdateElement(element.id, { src: newSrc });
            } else {
                const styleUpdates = await applyStylesWithAI(element, command);
                handleUpdateElement(element.id, styleUpdates);
            }
        }
    });
    
    const handleSaveTemplate = useCallback((name: string) => {
      const template = {
        name,
        elements: elements.map(({ id, ...rest }) => rest)
      };
      setCustomTemplates(prev => {
        const newTemplates = [...prev, template];
        localStorage.setItem('customTemplates', JSON.stringify(newTemplates));
        return newTemplates;
      });
      alert(`Template "${name}" saved!`);
    }, [elements]);

    const handleNewDesign = useCallback(() => {
        if (isDirtyRef.current && !window.confirm('You have unsaved changes. Are you sure? This will create a new blank canvas.')) {
            return;
        }
        setArtboardSize(null);
        resetElementsHistory([]);
        setSelectedElementIds([]);
        setEditingGroupId(null);
        localStorage.removeItem(SAVE_KEY);
        setIsDirty(false); 
    }, [resetElementsHistory]);

    const toggleDetailsPanel = () => setIsDetailsPanelCollapsed(prev => !prev);
    const toggleRightPanel = () => setIsRightPanelCollapsed(prev => !prev);
    const toggleSettingsModal = () => setIsSettingsModalOpen(prev => !prev);

    const canCopy = useMemo(() => selectedElementIds.length > 0, [selectedElementIds]);
    const canDelete = useMemo(() => selectedElementIds.length > 0 && !isAnySelectedLocked, [selectedElementIds, isAnySelectedLocked]);

    const reorderability = useMemo(() => {
        if (selectedElementIds.length === 0 || editingGroupId) {
            return { canMoveForward: false, canMoveBackward: false, canMoveToFront: false, canMoveToBack: false };
        }

        const totalElements = elements.length;
        const isSingleSelection = selectedElementIds.length === 1;
        
        const indices = selectedElementIds.map(id => elements.findIndex(el => el.id === id)).filter(i => i !== -1);
        if(indices.length === 0) {
            return { canMoveForward: false, canMoveBackward: false, canMoveToFront: false, canMoveToBack: false };
        }

        const topMostIndex = Math.max(...indices);
        const bottomMostIndex = Math.min(...indices);

        const canMoveForward = isSingleSelection && topMostIndex < totalElements - 1;
        const canMoveBackward = isSingleSelection && bottomMostIndex > 0;
        const canMoveToFront = topMostIndex < totalElements - 1;
        const canMoveToBack = bottomMostIndex > 0;

        return { canMoveForward, canMoveBackward, canMoveToFront, canMoveToBack };
    }, [selectedElementIds, elements, editingGroupId]);

  return {
    artboardSize,
    handleArtboardSelect,
    elements,
    elementsToRender,
    selectedElementIds,
    singleSelectedElement,
    draggingElementId,
    guides,
    zoom,
    editingGroup: activeGroup,
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
    reorderability,
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
  };
};