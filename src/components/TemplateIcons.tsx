// Custom template icons for photobooth layouts

interface IconProps {
  className?: string;
}

export const Vertical4Icon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="4" y="4" width="7" height="7" rx="1" fill="currentColor" />
    <rect x="13" y="4" width="7" height="7" rx="1" fill="currentColor" />
    <rect x="4" y="13" width="7" height="7" rx="1" fill="currentColor" />
    <rect x="13" y="13" width="7" height="7" rx="1" fill="currentColor" />
  </svg>
);

export const Horizontal4Icon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="7" width="4" height="10" rx="1" fill="currentColor" />
    <rect x="7" y="7" width="4" height="10" rx="1" fill="currentColor" />
    <rect x="12" y="7" width="4" height="10" rx="1" fill="currentColor" />
    <rect x="17" y="7" width="4" height="10" rx="1" fill="currentColor" />
  </svg>
);

export const Vertical3Icon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="7" y="3" width="10" height="5" rx="1" fill="currentColor" />
    <rect x="7" y="9.5" width="10" height="5" rx="1" fill="currentColor" />
    <rect x="7" y="16" width="10" height="5" rx="1" fill="currentColor" />
  </svg>
);

export const HorizontalLine4Icon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="9" width="4.5" height="6" rx="0.5" fill="currentColor" />
    <rect x="7" y="9" width="4.5" height="6" rx="0.5" fill="currentColor" />
    <rect x="12" y="9" width="4.5" height="6" rx="0.5" fill="currentColor" />
    <rect x="17" y="9" width="4.5" height="6" rx="0.5" fill="currentColor" />
  </svg>
);
