'use client';

import { useEffect, useRef, useState } from 'react';

const WEDGE_COLORS = ['#0a0a0a', '#ff9900'];
const LOSE_COLOR = '#4b5563';

export default function RouletteWheel({ prizes, spinning, targetIndex, onSpinComplete }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [size, setSize] = useState(360);

  const sliceAngle = prizes.length > 0 ? 360 / prizes.length : 0;

  // Responsive canvas sizing
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      setSize(Math.min(w, 420));
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw the wheel whenever prizes or size change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);

    let prizeColorIdx = 0;
    prizes.forEach((prize, i) => {
      const startAngle = (i * sliceAngle * Math.PI) / 180;
      const endAngle = ((i + 1) * sliceAngle * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 6, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.isLose ? LOSE_COLOR : WEDGE_COLORS[prizeColorIdx++ % 2];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + (endAngle - startAngle) / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.max(10, size / 32)}px Inter, system-ui, sans-serif`;
      const label =
        prize.prize_name.length > 18
          ? prize.prize_name.slice(0, 16) + '…'
          : prize.prize_name;
      ctx.fillText(label, radius - 18, 4);
      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 6;
    ctx.stroke();
  }, [prizes, size, sliceAngle]);

  // Handle spin animation
  useEffect(() => {
    if (!spinning || targetIndex === null || prizes.length === 0) return;

    const sliceMid = targetIndex * sliceAngle + sliceAngle / 2;
    // Pointer is fixed at the top (0deg / 12 o'clock). We rotate the wheel so
    // the target slice's middle lands under the pointer, plus multiple full
    // spins for visual drama.
    const fullSpins = 6;
    const finalRotation = 360 * fullSpins + (360 - sliceMid);

    setRotation(finalRotation);

    const timeout = setTimeout(() => {
      onSpinComplete();
    }, 4200);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetIndex]);

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-[420px]">
      {/* Pointer */}
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/3">
        <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-brand-500 drop-shadow" />
      </div>

      <div
        className="aspect-square w-full overflow-hidden rounded-full border-4 border-ink-900 shadow-2xl transition-transform ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: spinning ? '4200ms' : '0ms',
          transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
        }}
      >
        <canvas ref={canvasRef} style={{ width: size, height: size }} />
      </div>

      {/* Center hub */}
      <div className="absolute left-1/2 top-1/2 z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-ink-900 shadow-lg" />
    </div>
  );
}
