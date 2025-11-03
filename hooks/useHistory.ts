import { useState, useCallback } from 'react';

// A custom hook to manage state history (undo/redo functionality)
export const useHistory = <T>(initialState: T, onStateChange?: () => void) => {
  const [history, setHistory] = useState<{ past: T[], present: T, future: T[] }>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Move to the previous state in history
  const undo = useCallback(() => {
    if (!canUndo) return;

    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      const newPast = past.slice(0, past.length - 1);
      const newPresent = past[past.length - 1];
      const newFuture = [present, ...future];
      return { past: newPast, present: newPresent, future: newFuture };
    });
    onStateChange?.();
  }, [canUndo, onStateChange]);

  // Move to the next state in history
  const redo = useCallback(() => {
    if (!canRedo) return;

    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      const newPresent = future[0];
      const newFuture = future.slice(1);
      const newPast = [...past, present];
      return { past: newPast, present: newPresent, future: newFuture };
    });
    onStateChange?.();
  }, [canRedo, onStateChange]);

  // Set a new state, clearing the future history
  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setHistory(currentHistory => {
      const { past, present } = currentHistory;
      
      const newPresent = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(present) 
        : newState;

      // Avoid adding duplicate states to history if nothing changed
      if (JSON.stringify(newPresent) === JSON.stringify(present)) {
          return currentHistory;
      }
      
      onStateChange?.();
      
      const newPast = [...past, present];
      return { past: newPast, present: newPresent, future: [] };
    });
  }, [onStateChange]);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
