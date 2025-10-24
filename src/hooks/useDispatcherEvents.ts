import { useContext, useEffect } from 'react';
import { DispatcherContext } from '../context';
import { CLEAR_EVENT, REDO_EVENT, UNDO_EVENT } from '../util/dispatcher/event';

interface DispatcherCallbacks {
  clearCanvas: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
}

export const useDispatcherEvents = (callbacks: DispatcherCallbacks) => {
  const dispatcherContext = useContext(DispatcherContext);

  useEffect(() => {
    const dispatcher = dispatcherContext.dispatcher;
    if (!dispatcher) return;

    // ... (Orijinal useEffect mantığı buraya gelir)
    dispatcher.on(CLEAR_EVENT, callbacks.clearCanvas);
    dispatcher.on(UNDO_EVENT, callbacks.handleUndo);
    dispatcher.on(REDO_EVENT, callbacks.handleRedo);

    return () => {
      dispatcher.off(CLEAR_EVENT, callbacks.clearCanvas);
      dispatcher.off(UNDO_EVENT, callbacks.handleUndo);
      dispatcher.off(REDO_EVENT, callbacks.handleRedo);
    };
  }, [dispatcherContext, callbacks]);
};
