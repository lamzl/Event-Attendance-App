function Icon({ children, size = 20, className = "", viewBox = "0 0 24 24" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox={viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function CloseIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function ArrowIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function CheckIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Icon>
  );
}

export function CalendarIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <rect
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
        width="17"
        x="3.5"
        y="5.5"
      />
      <path
        d="M8 3.5v4M16 3.5v4M3.5 10h17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </Icon>
  );
}

export function PinIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </Icon>
  );
}

export function UserIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 20c.4-4 2.6-6 6.5-6s6.1 2 6.5 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </Icon>
  );
}

export function SparkleIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="M12 2.8c.5 4.8 2.4 6.7 7.2 7.2-4.8.5-6.7 2.4-7.2 7.2-.5-4.8-2.4-6.7-7.2-7.2 4.8-.5 6.7-2.4 7.2-7.2Z"
        fill="currentColor"
      />
      <path
        d="M19 16.5c.2 2 .9 2.8 3 3-2.1.2-2.8.9-3 3-.2-2.1-.9-2.8-3-3 2.1-.2 2.8-1 3-3Z"
        fill="currentColor"
      />
    </Icon>
  );
}

export function WifiOffIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="m3 3 18 18M8.5 5.8A13 13 0 0 1 21 9M3 9a13.5 13.5 0 0 1 2.8-1.7M6.5 13a8.2 8.2 0 0 1 5.5-2.2c1 0 2 .2 2.9.5M9.5 16.5A3.8 3.8 0 0 1 12 15.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="20" fill="currentColor" r="1" />
    </Icon>
  );
}

export function InfoIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 10.5V17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="7.2" fill="currentColor" r="1" />
    </Icon>
  );
}

export function RefreshIcon({ size, className }) {
  return (
    <Icon size={size} className={className}>
      <path
        d="M19 8V4m0 0h-4m4 0-3 3a7 7 0 1 0 1.2 8.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}
