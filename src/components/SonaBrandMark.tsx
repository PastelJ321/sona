import type { SVGProps } from 'react';

interface SonaBrandMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * SONA Machined Lamella Signal Mark — 5 precision phased apertures orbiting a resonant core.
 * Directly unites the 2D typographic identity with the 3D Hero Kinetic Resonator.
 */
export function SonaBrandMark({ size = 28, ...rest }: SonaBrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="4"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.2"
      />
      {/* 5 phased acoustic lamellae echoing the Hero sculpture */}
      <line
        x1="9"
        y1="12"
        x2="23"
        y2="12"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="16"
        x2="31"
        y2="16"
        stroke="#5B75FF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="8.5"
        y1="20"
        x2="17"
        y2="20"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="23"
        y1="20"
        x2="31.5"
        y2="20"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="24"
        x2="28"
        y2="24"
        stroke="#D9F56C"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="28"
        x2="31"
        y2="28"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Central resonant index point */}
      <circle cx="20" cy="20" r="2.3" fill="#F4654D" />
    </svg>
  );
}
