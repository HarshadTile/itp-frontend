/* App icon set — one consistent stroke family (matches the login screen).
   Decorative by default (aria-hidden); pass aria-label to make one meaningful. */

const Ic = ({ d, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d}
  </svg>
);

export const FileText = (p) => <Ic {...p} d={<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h1" /></>} />;
export const Search = (p) => <Ic {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />;
export const Layers = (p) => <Ic {...p} d={<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5M3 17l9 5 9-5" /></>} />;
export const Building = (p) => <Ic {...p} d={<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01M10 21v-3h4v3" /></>} />;
export const MessageSquare = (p) => <Ic {...p} d={<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />} />;
export const BarChart3 = (p) => <Ic {...p} d={<><path d="M3 3v18h18" /><path d="M8 17v-5M13 17V8M18 17v-8" /></>} />;
export const History = (p) => <Ic {...p} d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>} />;
export const RefreshCw = (p) => <Ic {...p} d={<><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 12A9 9 0 0 1 18 5.3L21 8" /><path d="M21 3v5h-5M3 21v-5h5" /></>} />;
export const Settings = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>} />;
export const Sliders = (p) => <Ic {...p} d={<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></>} />;
export const Users = (p) => <Ic {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>} />;
export const Shield = (p) => <Ic {...p} d={<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />} />;
export const Bell = (p) => <Ic {...p} d={<><path d="M18 8a6 6 0 1 0-12 0c0 6-3 8-3 8h18s-3-2-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>} />;
export const HelpCircle = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" /></>} />;
export const User = (p) => <Ic {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />;
export const LogOut = (p) => <Ic {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>} />;
export const ChevronRight = (p) => <Ic {...p} d={<path d="m9 6 6 6-6 6" />} />;
export const ChevronDown = (p) => <Ic {...p} d={<path d="m6 9 6 6 6-6" />} />;
export const Eye = (p) => <Ic {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />;
