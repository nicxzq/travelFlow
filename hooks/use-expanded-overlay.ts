'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fullscreen presentation for the map. A portalled fixed overlay is the primary
 * mechanism because iPhone Safari does not implement requestFullscreen at all;
 * the native API is layered on top as a desktop enhancement.
 */
export function useExpandedOverlay() {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const scrollYRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const open = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? null;
    setExpanded(true);
  }, []);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) {
      // The trigger lives inside the portal and is gone by now unless it was the
      // embedded button, so only focus it while it is still in the document.
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
      return;
    }

    scrollYRef.current = window.scrollY;
    const { body } = document;
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width };

    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.width = '100%';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [close, expanded]);

  return { expanded, mounted, open, close };
}
