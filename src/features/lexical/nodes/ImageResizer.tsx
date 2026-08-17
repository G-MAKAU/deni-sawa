'use client';

import { useRef, useState } from 'react';
import type { LexicalEditor } from 'lexical';

interface ImageResizerProps {
  editor: LexicalEditor;
  width: number | null;
  minWidth?: number;
  /** Called with the final width when dragging ends. */
  onWidthChange: (width: number) => void;
}

/**
 * 4-corner resize handles for a selected image. Dragging keeps the aspect
 * ratio (the node stores width only; height stays auto). Shows a live width
 * badge while dragging. The caller commits the new width on pointer-up.
 */
export function ImageResizer({ editor, width, minWidth = 60, onWidthChange }: ImageResizerProps) {
  const startXRef = useRef(0);
  const startWRef = useRef(0);
  const liveWRef = useRef<number>(width ?? 0);
  const [liveWidth, setLiveWidth] = useState<number>(width ?? 0);

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    startWRef.current = width ?? 0;
    liveWRef.current = width ?? 0;

    const rootEl = editor.getRootElement();
    const maxW = rootEl ? Math.max(rootEl.clientWidth - 8, minWidth + 8) : 10000;

    const onMove = (ev: PointerEvent) => {
      const next = Math.max(minWidth, Math.min(maxW, Math.round(startWRef.current + (ev.clientX - startXRef.current))));
      liveWRef.current = next;
      setLiveWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      onWidthChange(liveWRef.current);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const corners = ['nw', 'ne', 'sw', 'se'] as const;
  const positions: Record<(typeof corners)[number], React.CSSProperties> = {
    nw: { left: -7, top: -7, cursor: 'nwse-resize' },
    ne: { right: -7, top: -7, cursor: 'nesw-resize' },
    sw: { left: -7, bottom: -7, cursor: 'nesw-resize' },
    se: { right: -7, bottom: -7, cursor: 'nwse-resize' },
  };

  return (
    <>
      {corners.map((corner) => (
        <span
          key={corner}
          role="presentation"
          onPointerDown={onPointerDown}
          className="ds-img-resize-handle"
          style={positions[corner]}
        />
      ))}
      <span className="ds-img-width-badge">{liveWidth}px</span>
    </>
  );
}
