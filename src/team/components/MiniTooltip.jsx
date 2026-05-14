import { useEffect, useState } from 'react';
import { baseFont } from '../theme';

const OFFSET = 10;

export default function MiniTooltip({ anchor, palette, children }) {
  const [pos, setPos] = useState(() => compute(anchor));

  useEffect(() => {
    setPos(compute(anchor));
    const onResize = () => setPos(compute(anchor));
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [anchor]);

  if (!anchor) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 1100,
        padding: '6px 10px',
        borderRadius: 8,
        backgroundColor: palette.text,
        color: palette.bg,
        fontFamily: baseFont,
        fontSize: 11.5,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 16px -4px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}

function compute(anchor) {
  if (!anchor) return { top: 0, left: 0 };
  const rect = anchor.getBoundingClientRect();
  // Approx tooltip dims so it stays on screen.
  const approxW = 180;
  const approxH = 32;
  let top = rect.top - approxH - 4;
  if (top < 8) top = rect.bottom + 4;
  let left = rect.left + rect.width / 2 - approxW / 2;
  if (left < 8) left = 8;
  if (left + approxW > window.innerWidth - 8) left = window.innerWidth - approxW - 8;
  return { top, left };
}
