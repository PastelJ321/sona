interface SignalShutterProps {
  visible: boolean;
}

/**
 * 5-Lamella Architectural Route Shutter.
 * Translates SONA's machined blade geometry directly into page transitions
 * (inspired by Active Theory & 14islands seamless continuity).
 */
export function SignalShutter({ visible }: SignalShutterProps) {
  return (
    <div
      className={`signal-shutter ${visible ? 'is-visible' : ''}`}
      aria-hidden="true"
    >
      <span className="signal-shutter__blade" style={{ '--blade-i': 0 } as React.CSSProperties} />
      <span className="signal-shutter__blade" style={{ '--blade-i': 1 } as React.CSSProperties} />
      <span className="signal-shutter__blade signal-shutter__blade--index" style={{ '--blade-i': 2 } as React.CSSProperties} />
      <span className="signal-shutter__blade" style={{ '--blade-i': 3 } as React.CSSProperties} />
      <span className="signal-shutter__blade" style={{ '--blade-i': 4 } as React.CSSProperties} />
    </div>
  );
}
