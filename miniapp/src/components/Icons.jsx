const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const MenuIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 10.2v3.6M10.2 12h3.6" />
  </svg>
);
export const CartIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1.3 10.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 8Z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </svg>
);
export const UserIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);
export const PlusIcon = (p) => (
  <svg {...base} strokeWidth={2.4} {...p}>
    <path d="M12 6v12M6 12h12" />
  </svg>
);
export const MinusIcon = (p) => (
  <svg {...base} strokeWidth={2.4} {...p}>
    <path d="M6 12h12" />
  </svg>
);
export const PinIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
export const PhoneIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6.6 3.5h2.6l1.4 4-2 1.3a11 11 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
  </svg>
);
export const CopyIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
    <path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" />
  </svg>
);
export const CheckIcon = (p) => (
  <svg {...base} strokeWidth={2.4} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const ArrowIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);
export const TrashIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 7h14M10 7V5h4v2M7 7l.8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9L17 7" />
  </svg>
);
export const RepeatIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
  </svg>
);
