import { useRef, useState } from 'react';

interface TouchJoystickProps {
  onVectorChange: (x: number, y: number) => void;
}

/**
 * Tactile virtual thumb joystick for Mobile & Tablet Free Exploration mode.
 * Isolates touch-action: none strictly to the circular pad so it never breaks page UI.
 */
export function TouchJoystick({ onVectorChange }: TouchJoystickProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const maxRadius = 38;

  const updateFromClient = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnob({ x: dx, y: dy });
    // Screen Y down = world +Z (south), screen Y up = world -Z (north)
    onVectorChange(dx / maxRadius, dy / maxRadius);
  };

  const reset = () => {
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0 });
    onVectorChange(0, 0);
  };

  return (
    <div
      ref={padRef}
      className="touch-joystick"
      role="application"
      aria-label="탐사체 이동 조이스틱"
      onPointerDown={(e) => {
        e.stopPropagation();
        pointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        reset();
      }}
      onPointerCancel={reset}
    >
      <div className="touch-joystick__ring" aria-hidden="true" />
      <div
        className="touch-joystick__knob"
        style={{ transform: `translate3d(${knob.x}px, ${knob.y}px, 0)` }}
        aria-hidden="true"
      />
    </div>
  );
}
