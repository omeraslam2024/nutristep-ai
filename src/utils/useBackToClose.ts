import { useEffect, useRef } from 'react';

/**
 * Android's back button (and the browser's) closes the top-most open layer — a sheet, a modal, or
 * a non-Home tab — instead of leaving the app. Each open layer pushes one history entry; back pops
 * it and calls `close`. Closing by other means (an X button) removes that entry again, flagged so
 * the layer underneath does not also react.
 */
let ignorePops = 0;

export function useBackToClose(open: boolean, close: () => void): void {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ nutristepLayer: true }, '');
    let poppedByBack = false;

    const onPop = () => {
      if (ignorePops > 0) {
        ignorePops--;
        return;
      }
      poppedByBack = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      if (!poppedByBack) {
        ignorePops++;
        window.history.back();
      }
    };
  }, [open]);
}
