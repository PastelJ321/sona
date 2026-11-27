import type { SVGProps } from 'react';

interface SonaBrandMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Geometric SONA emblem — interlocking phase arcs forming a resonant signal core.
 * No unregistered ® symbols.
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
        x="1"
        y="1"
        width="38"
        height="38"
        rx="9"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.25"
      />
      <path
        d="M9.5 15.5C13.6 9.5 21.6 8.8 27 13.2C29.8 15.5 31.3 18.8 31 22.6"
        stroke="#5B75FF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M30.5 24.5C26.4 30.5 18.4 31.2 13 26.8C10.2 24.5 8.7 21.2 9 17.4"
        stroke="#D9F56C"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M13.5 20C16.2 15.8 23.8 24.2 26.5 20"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="2.2" fill="#F4654D" />
    </svg>
  );
}
