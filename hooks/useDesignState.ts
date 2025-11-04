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
        if (groupContext) {
            const newUpdates = { ...updates };
            if (newUpdates.x !== undefined) newUpdates.x -= groupContext.x;
            if (newUpdates.y !== undefined) newUpdates.y -= groupContext.y;

            return elements.map(el => {
                if (el.id === groupContext.id && el.type === 'group') {
                    const updatedChildren = el.elements.map(child =>
                        child.id === id ? { ...child, ...newUpdates } as CanvasElement : child
                    );
                    return { ...el, elements: updatedChildren };
                }
                return el;
            });
        } else {
            return elements.map(el => el.id === id ? { ...el, ...updates } as CanvasElement : el);
        }
    };
};

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export const useDesignState = () => {
  const [isDirty, setIsDirty] = useState(false);
  const { 
    state: elements, 
    setState: setElements, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory<CanvasElement[]>(initialElements, () => setIsDirty(true));

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
  const [activeTool, setActiveTool] = useState<'templates' | 'text' | 'image' | 'shapes' | 'export' | null>('templates');
  const [isDetailsPanelCollapsed, setIsDetailsPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const clipboardRef = useRef<Omit<CanvasElement, 'id'>[]>([]);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const artboardSizeRef = useRef(artboardSize);
  artboardSizeRef.current = artboardSize;
  
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

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
  const singleSelectedElementIndex = singleSelectedElement ? elementsOnCanvas.findIndex(el => el.id === singleSelectedElement.id) : -1;

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
    setZoom(newZoom > 0 ? newZoom : 1);
  }, [artboardSize]);
  
  const handleZoomIn = useCallback(() => {
    setZoom(currentZoom => {
        const nextLevel = ZOOM_LEVELS.find(level => level > currentZoom);
        return nextLevel || currentZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
      setZoom(currentZoom => {
          const prevLevel = [...ZOOM_LEVELS].reverse().find(level => level < currentZoom);
          return prevLevel || currentZoom;
      });
  }, []);

  const handleSetZoom = useCallback((newZoom: number) => {
      if (newZoom > 0) {
          setZoom(newZoom);
      }
  }, []);

  const canZoomIn = useMemo(() => {
      const nextLevel = ZOOM_LEVELS.find(level => level > zoom);
      return !!nextLevel;
  }, [zoom]);

  const canZoomOut = useMemo(() => {
      const prevLevel = [...ZOOM_LEVELS].reverse().find(level => level < zoom);
      return !!prevLevel;
  }, [zoom]);

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
    if (!editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const canvasWidth = rect.width / zoom;
    const canvasHeight = rect.height / zoom;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

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
    const padding = 40;
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
            id: `el_${Date.now()}_${index}`,
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
    const updater = (prevElements: CanvasElement[]) => {
        const selectedIdsSet = new Set(selectedElementIds);
        if (editingGroupId) {
            return prevElements.map(el => {
                if (el.id === editingGroupId && el.type === 'group') {
                    const updatedChildren = el.elements.map(child =>
                        selectedIdsSet.has(child.id) ? { ...child, ...updates } as CanvasElement : child
                    );
                    return { ...el, elements: updatedChildren };
                }
                return el;
            });
        }
        return prevElements.map(el =>
            selectedIdsSet.has(el.id) ? { ...el, ...updates } as CanvasElement : el
        );
    };
    if (liveElements) {
        setLiveElements(updater);
    } else {
        setElements(updater);
    }
  }, [selectedElementIds, setElements, editingGroupId, liveElements]);
  
  const handleDeleteElement = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const allElementsById = new Map<string, CanvasElement>();
    const crawl = (els: CanvasElement[]) => els.forEach(el => {
        allElementsById.set(el.id, el);
        if (el.type === 'group') crawl(el.elements);
    });
    crawl(elements);
    const idsToDelete = new Set(selectedElementIds.filter(id => !allElementsById.get(id)?.locked));
    if (idsToDelete.size === 0) return;
    const filterRecursively = (els: CanvasElement[]): CanvasElement[] => {
        const filtered = els.filter(el => !idsToDelete.has(el.id));
        return filtered.map(el => {
            if (el.type === 'group') return { ...el, elements: filterRecursively(el.elements) };
            return el;
        });
    };
    setElements(filterRecursively);
    setSelectedElementIds(prev => prev.filter(id => !idsToDelete.has(id)));
}, [selectedElementIds, setElements, elements]);

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
              const [element] = prev.filter(el => el.id === elementId);
              const arr = prev.filter(el => el.id !== elementId);
              if (direction === 'forward') arr.splice(Math.min(currentIndex, arr.length), 0, element);
              else if (direction === 'backward') arr.splice(Math.max(currentIndex - 1, 0), 0, element);
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
        newGuides.push({ x1: bestXSnap.targetValue, y1: 0, x2: bestXSnap.targetValue, y2: artboardSize.height });
    }
    if (bestYSnap.diff !== Infinity) {
        newGuides.push({ x1: 0, y1: bestYSnap.targetValue, x2: artboardSize.width, y2: bestYSnap.targetValue });
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
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    if (dragInfo.current) {
        const elementsStart = dragInfo.current.elementsStart;
        setLiveElements(currentLiveElements => {
            if (currentLiveElements) {
                const finalElementsOnCanvas = activeGroup
                    ? (currentLiveElements.find(g => g.id === editingGroupId) as GroupElement)?.elements.map(el => ({...el, x: el.x + activeGroup.x, y: el.y + activeGroup.y})) ?? []
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
  }, [handleDocumentMouseMove, setElements, activeGroup, editingGroupId]);

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
        } else if (direction.includes('left') || direction.includes('right')) { // Horizontal resize
            width = Math.max(minSize, potentialWidth);
            height = width / aspectRatio;
        } else { // Vertical resize
            height = Math.max(minSize, potentialHeight);
            width = height * aspectRatio;
        }
        
    } else {
        // Original non-proportional resize logic
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
    
    // Adjust position for left/top handles AFTER new dimensions are calculated
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
        const updatedChildren = (element as GroupElement).elements.map(child => {
            const newChild = { ...child, x: child.x * scaleX, y: child.y * scaleY, width: child.width * scaleX, height: child.height * scaleY };
            if (newChild.type === 'text') newChild.fontSize *= Math.min(scaleX, scaleY);
            if (newChild.type === 'shape' && newChild.shapeType === 'line') newChild.strokeWidth *= scaleY;
            else if (newChild.type === 'shape') newChild.strokeWidth *= Math.min(scaleX, scaleY);
            return newChild;
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
            case 'distribute-horizontal': {
                if (selectedElements.length < 3) break;
                const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
                const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
                const totalSpace = (boundingBox.maxX - boundingBox.minX) - totalWidth;
                const spacing = totalSpace / (sorted.length - 1);
                let currentX = boundingBox.minX;
                sorted.forEach(el => {
                    updates.set(el.id, { x: currentX });
                    currentX += el.width + spacing;
                });
                break;
            }
            case 'distribute-vertical': {
                if (selectedElements.length < 3) break;
                const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
                const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
                const totalSpace = (boundingBox.maxY - boundingBox.minY) - totalHeight;
                const spacing = totalSpace / (sorted.length - 1);
                let currentY = boundingBox.minY;
                sorted.forEach(el => {
                    updates.set(el.id, { y: currentY });
                    currentY += el.height + spacing;
                });
                break;
            }
        }

        if (updates.size > 0) {
            setElements(prevElements => {
                const applyUpdatesRecursively = (els: CanvasElement[], groupContext: GroupElement | null): CanvasElement[] => {
                    return els.map(el => {
                        let newEl = { ...el };
                        if (updates.has(el.id)) {
                            const update = { ...updates.get(el.id)! };
                            if (groupContext) {
                                if (update.x !== undefined) update.x -= groupContext.x;
                                if (update.y !== undefined) update.y -= groupContext.y;
                            }
                            newEl = { ...newEl, ...update };
                        }

                        if (newEl.type === 'group' && !updates.has(el.id)) {
                           (newEl as GroupElement).elements = applyUpdatesRecursively((newEl as GroupElement).elements, newEl as GroupElement);
                        }
                        return newEl;
                    });
                };
                return applyUpdatesRecursively(prevElements, activeGroup ?? null);
            });
        }

    }, [selectedElementIds, elementsOnCanvas, setElements, activeGroup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          if (selectedElementIds.length === 0) return;
          const amount = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowLeft') dx = -amount;
          if (e.key === 'ArrowRight') dx = amount;
          if (e.key === 'ArrowUp') dy = -amount;
          if (e.key === 'ArrowDown') dy = amount;

          setElements(prevElements => {
              const selectedIdsSet = new Set(selectedElementIds);
              const nudgeRecursively = (elementsToNudge: CanvasElement[]): CanvasElement[] => {
                  return elementsToNudge.map(el => {
                      if (selectedIdsSet.has(el.id) && !el.locked) {
                          return { ...el, x: el.x + dx, y: el.y + dy };
                      }
                      if (el.type === 'group') {
                          if (selectedIdsSet.has(el.id)) return el;
                          return { ...el, elements: nudgeRecursively(el.elements) };
                      }
                      return el;
                  });
              };
              return nudgeRecursively(prevElements);
          });
          return;
      }
      if (e.key === 'Escape' && editingGroupId) { e.preventDefault(); setEditingGroupId(null); setSelectedElementIds([editingGroupId]); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveDesign(); }
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedElementIds.length > 0) { e.preventDefault(); handleDeleteElement(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); setSelectedElementIds(elementsToRender.filter(el => !el.locked).map(el => el.id)); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !e.shiftKey) { e.preventDefault(); handleGroup(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') { e.preventDefault(); handleUngroup(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (selectedElementIds.length === 0 || editingGroupId) return;
        const elementsToCopy = elements.filter(el => selectedElementIds.includes(el.id));
        clipboardRef.current = elementsToCopy.map((el): Omit<CanvasElement, 'id'> => {
          const { id, ...rest } = el;
          return rest;
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (clipboardRef.current.length === 0 || editingGroupId) return;
        const pasteOffset = 20;
        const newElements = clipboardRef.current.map((el): CanvasElement => {
          const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newX = el.x + pasteOffset;
          const newY = el.y + pasteOffset;

          // FIX: Use a switch statement to correctly narrow the union type before spreading.
          // This avoids creating an invalid object shape from spreading a union type and allows
          // TypeScript to correctly infer the return type.
          switch (el.type) {
            case 'text':
              return { ...el, id: newId, x: newX, y: newY };
            case 'image':
              return { ...el, id: newId, x: newX, y: newY };
            case 'shape':
              return { ...el, id: newId, x: newX, y: newY };
            case 'group':
              return { ...el, id: newId, x: newX, y: newY };
            default:
              // This exhaustiveness check ensures that all element types are handled.
              const _exhaustiveCheck: never = el;
              throw new Error(`Unhandled element type in paste: ${(_exhaustiveCheck as any).type}`);
          }
        });
        setElements(prev => [...prev, ...newElements]);
        setSelectedElementIds(newElements.map(el => el.id));
        clipboardRef.current = newElements.map(({ id, ...rest }) => rest);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedElementIds.length === 0 || editingGroupId) return;
        const duplicateOffset = 20;
        const elementsToDuplicate = elements.filter(el => selectedElementIds.includes(el.id));
        if (elementsToDuplicate.some(el => el.locked)) return;
        const newElements = elementsToDuplicate.map((el): CanvasElement => {
          const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newX = el.x + duplicateOffset;
          const newY = el.y + duplicateOffset;
          
          // FIX: Use a switch statement to correctly narrow the union type before spreading.
          // This ensures that TypeScript can infer the correct, specific type for each new element.
          switch (el.type) {
            case 'text':
              return { ...el, id: newId, x: newX, y: newY };
            case 'image':
              return { ...el, id: newId, x: newX, y: newY };
            case 'shape':
              return { ...el, id: newId, x: newX, y: newY };
            case 'group':
              return { ...el, id: newId, x: newX, y: newY };
            default:
              const _exhaustiveCheck: never = el;
              // This path should be unreachable if all element types are handled.
              throw new Error(`Unhandled element type for duplication: ${(_exhaustiveCheck as any).type}`);
          }
        });
        setElements(prev => [...prev, ...newElements]);
        setSelectedElementIds(newElements.map(el => el.id));
      }

    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, handleDeleteElement, elements, handleGroup, handleUngroup, editingGroupId, elementsToRender, handleSaveDesign, setElements]);

  const handlePlaceContent = async (content: string) => {
    setIsProcessing(true); setError(null);
    try {
      const contentMap = await placeContentWithAI(elements, content);
      if (contentMap && Object.keys(contentMap).length > 0) {
        setElements(prev => prev.map(el => (el.type === 'text' && contentMap[el.id]) ? { ...el, content: contentMap[el.id] } : el));
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'An unknown error occurred.'); } 
    finally { setIsProcessing(false); }
  };

  const handleApplyStyles = async (command: string) => {
    const selectedElements = elementsOnCanvas.filter(el => selectedElementIds.includes(el.id));
    if (selectedElements.length === 0) return;
    setIsProcessing(true); setError(null);
    try {
      if (selectedElements.length === 1) {
        const element = selectedElements[0];
        if (element.type === 'image') {
          const newImageSrc = await editImageWithAI((element as ImageElement).src, command);
          if (newImageSrc) handleUpdateElement(element.id, { src: newImageSrc });
        } else {
          const styleUpdates = await applyStylesWithAI(element, command);
          if (styleUpdates && Object.keys(styleUpdates).length > 0) handleUpdateElement(element.id, styleUpdates);
        }
      } else {
        if (selectedElements.some(el => el.type === 'image')) throw new Error("AI Designer does not support multi-selection with images yet.");
        const updates = await applyBulkStylesWithAI(selectedElements, command);
        if (!updates || updates.length === 0) return;
        const updatesMap = new Map<string, Partial<CanvasElement>>();
        updates.forEach(u => { const { id, ...styleUpdates } = u as Partial<CanvasElement> & { id: string }; if (id) updatesMap.set(id, styleUpdates); });
        if (updatesMap.size === 0) return;
        const updater = (prevElements: CanvasElement[]): CanvasElement[] => {
          const applyUpdatesRecursively = (els: CanvasElement[]): CanvasElement[] => els.map(el => {
            let updatedEl = { ...el };
            if (updatesMap.has(el.id)) {
                updatedEl = { ...updatedEl, ...updatesMap.get(el.id)! } as CanvasElement;
            }
            if (updatedEl.type === 'group') {
                (updatedEl as GroupElement).elements = applyUpdatesRecursively((updatedEl as GroupElement).elements);
            }
            return updatedEl;
          });
          return applyUpdatesRecursively(prevElements);
        };
        setElements(updater);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'An unknown error occurred.'); } 
    finally { setIsProcessing(false); }
  };

  // FIX: This function was corrupted by the prompt's error list. It has been restored.
  const handleSaveTemplate = (name: string) => {
    if (elements.length === 0) {
      alert("Cannot save an empty canvas as a template.");
      return;
    }
    const newTemplate = { name, elements: elements.map(({ id, ...rest }) => rest) };
    const updatedTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedTemplates);
    localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates));
    alert(`Template "${name}" saved!`);
  };

  // FIX: This function was missing from the corrupted file. It has been added.
  const handleSelectElements = (ids: string[], mode: 'set' | 'add') => {
    if (mode === 'set') {
      setSelectedElementIds(ids);
    } else {
      setSelectedElementIds(prev => [...new Set([...prev, ...ids])]);
    }
  };
  
  // FIX: This function was missing from the corrupted file. It has been added.
  const handleReorderForLayers = (draggedId: string, targetId: string, position: 'before' | 'after') => {
    setElements(prev => {
      const draggedItemIndex = prev.findIndex(el => el.id === draggedId);
      if (draggedItemIndex === -1) return prev;
      const [draggedItem] = prev.splice(draggedItemIndex, 1);
      
      const targetIndex = prev.findIndex(el => el.id === targetId);
      if (targetIndex === -1) {
          prev.splice(draggedItemIndex, 0, draggedItem); // put it back
          return prev;
      }

      // Layer panel is reversed, so 'before' means after in the array, and 'after' means before.
      const insertAtIndex = position === 'before' ? targetIndex : targetIndex + 1;
      prev.splice(insertAtIndex, 0, draggedItem);
      
      return [...prev];
    });
  };

  // FIX: This function was missing from the corrupted file. It has been added.
  const handleToggleLock = (ids: string[]) => {
    const idsToToggle = new Set(ids);
    const toggleRecursively = (els: CanvasElement[]): CanvasElement[] => {
        return els.map(el => {
            if (idsToToggle.has(el.id)) {
                return { ...el, locked: !el.locked };
            }
            if (el.type === 'group') {
                return { ...el, elements: toggleRecursively(el.elements) };
            }
            return el;
        });
    };
    setElements(toggleRecursively);
  };
  
  // FIX: This function was missing from the corrupted file. It has been added.
  const toggleDetailsPanel = () => setIsDetailsPanelCollapsed(p => !p);
  // FIX: This function was missing from the corrupted file. It has been added.
  const toggleRightPanel = () => setIsRightPanelCollapsed(p => !p);

  // FIX: The main return statement for the hook was missing, causing all properties to be undefined. It has been added.
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
    canZoomIn,
    canZoomOut,
    error,
    selectionRect,
    isProcessing,
    activeTool,
    customTemplates,
    canUngroup,
    isDetailsPanelCollapsed,
    isRightPanelCollapsed,
    mainContainerRef,
    editorContainerRef,
    editorRef,
    handleSaveDesign,
    fitToScreen,
    handleZoomIn,
    handleZoomOut,
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
  };
};
