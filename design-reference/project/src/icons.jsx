// Minimal stroke icons. All inherit currentColor.
const Ic = ({ d, size = 20, sw = 1.7, fill = "none", children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);

const IconCalendar = (p) => (
  <Ic {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="3" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </Ic>
);
const IconChevron = (p) => <Ic {...p} d="M6 9l6 6 6-6" />;
const IconArrowRight = (p) => <Ic {...p} d="M5 12h14M13 6l6 6-6 6" />;
const IconArrowUpRight = (p) => <Ic {...p} d="M7 17L17 7M9 7h8v8" />;
const IconSparkle = (p) => (
  <Ic {...p}>
    <path d="M12 3.5c.4 3.9 1.6 5.1 5.5 5.5-3.9.4-5.1 1.6-5.5 5.5-.4-3.9-1.6-5.1-5.5-5.5 3.9-.4 5.1-1.6 5.5-5.5Z" />
    <path d="M18.5 14.5c.2 1.7.7 2.2 2.4 2.4-1.7.2-2.2.7-2.4 2.4-.2-1.7-.7-2.2-2.4-2.4 1.7-.2 2.2-.7 2.4-2.4Z" />
  </Ic>
);
const IconFlag = (p) => (
  <Ic {...p}>
    <path d="M5 21V4M5 4h11l-1.6 3.5L16 11H5" />
  </Ic>
);
const IconCheckCircle = (p) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.3 2.3 4.7-4.9" />
  </Ic>
);
const IconHeart = (p) => (
  <Ic {...p} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
);
const IconShield = (p) => (
  <Ic {...p}>
    <path d="M12 3l7 2.5v5.5c0 4.6-3 8-7 9.5-4-1.5-7-4.9-7-9.5V5.5L12 3Z" />
  </Ic>
);
const IconBrain = (p) => (
  <Ic {...p}>
    <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7 2.5 2.5 0 0 0 5 9.3 2.5 2.5 0 0 0 6 13.8c0 1.6 1.3 2.7 3 2.7V4.5Z" />
    <path d="M9 4.5A2.5 2.5 0 0 1 11.5 7 2.5 2.5 0 0 1 13 9.3 2.5 2.5 0 0 1 12 13.8c0 1.6-1.3 2.7-3 2.7" transform="translate(3 0)" />
    <path d="M9 4.5h0M12 4.5V20" opacity="0" />
  </Ic>
);
const IconLeaf = (p) => (
  <Ic {...p}>
    <path d="M5 19c0-8 5-13 14-14 1 9-4 14-12 14-1 0-2 0-2 0Z" />
    <path d="M9 15c2-2.5 4.5-4 8-5" />
  </Ic>
);
const IconUsers = (p) => (
  <Ic {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c.4-3 2.8-5 5.5-5s5.1 2 5.5 5" />
    <path d="M16 6.2A2.8 2.8 0 0 1 16 12M17 14c2.2.3 3.9 2 4.2 4.5" />
  </Ic>
);
const IconBell = (p) => (
  <Ic {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 1.5 6 1.5 6H4.5S6 14 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Ic>
);
const IconChat = (p) => (
  <Ic {...p} d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z" />
);
const IconHome = (p) => (
  <Ic {...p}>
    <path d="M4 11l8-6.5L20 11" />
    <path d="M6 9.8V20h12V9.8" />
  </Ic>
);
const IconCalmFace = (p) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 13.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8M8.5 9.5h.01M15.5 9.5h.01" />
  </Ic>
);
const IconSearch = (p) => (
  <Ic {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Ic>
);
const IconSettings = (p) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6" />
  </Ic>
);
const IconLogout = (p) => (
  <Ic {...p}>
    <path d="M15 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H15" />
    <path d="M11 12h9M17 8l4 4-4 4" />
  </Ic>
);
const IconGrid = (p) => (
  <Ic {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </Ic>
);
const IconBuilding = (p) => (
  <Ic {...p}>
    <path d="M4 20.5h16M6 20.5V5.5A1.5 1.5 0 0 1 7.5 4H14a1.5 1.5 0 0 1 1.5 1.5v15M15.5 9H18a1.5 1.5 0 0 1 1.5 1.5v10" />
    <path d="M9 8h3.5M9 11.5h3.5M9 15h3.5" />
  </Ic>
);
const IconLayers = (p) => (
  <Ic {...p}>
    <path d="M12 3.5 21 8l-9 4.5L3 8l9-4.5Z" />
    <path d="M3.5 12.5 12 16.8l8.5-4.3M3.5 16.5 12 20.8l8.5-4.3" />
  </Ic>
);
const IconScale = (p) => (
  <Ic {...p}>
    <path d="M12 3.5v17M7 7h10M7 7l-3 6.5h6L7 7Zm10 0-3 6.5h6L17 7Z" />
    <path d="M4 13.5a3 3 0 0 0 6 0M14 13.5a3 3 0 0 0 6 0M8.5 20.5h7" />
  </Ic>
);
const IconRefresh = (p) => (
  <Ic {...p}>
    <path d="M20 11.5A8 8 0 1 0 18 17M20 5v6h-6" />
  </Ic>
);
const IconArrowUp = (p) => <Ic {...p} d="M12 19V5M6 11l6-6 6 6" />;
const IconArrowDown = (p) => <Ic {...p} d="M12 5v14M6 13l6 6 6-6" />;
const IconMinus = (p) => <Ic {...p} d="M5 12h14" />;

// ---- 8 kecerdasan (Multiple Intelligence) ----
const IconMI_Lo = (p) => ( // Logika-Matematika
  <Ic {...p}><rect x="4.5" y="3" width="15" height="18" rx="2.2" /><path d="M8 7.5h8M8 12h2.5M8 15.5h2.5M14 11l3 5M17 11l-3 5" /></Ic>
);
const IconMI_Na = (p) => ( // Naturalis
  <Ic {...p}><path d="M5 21c0-7 4-12 14-13 0 8-4 12-11 12" /><path d="M5 21c1.5-5 4-7.5 8-9" /></Ic>
);
const IconMI_Ve = (p) => ( // Verbal-Linguistik
  <Ic {...p}><path d="M5 4.5h14v11H10l-4 3.5v-3.5H5Z" /><path d="M8.5 8.2 10 12l1.5-3.8M13.5 8h2.5M14.8 8v4" /></Ic>
);
const IconMI_Ia = (p) => ( // Intrapersonal
  <Ic {...p}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="12" cy="8" r="0.6" fill="currentColor" /></Ic>
);
const IconMI_Sp = (p) => ( // Spasial-Visual
  <Ic {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 21V12M12 12l8-4.5M12 12 4 7.5" /></Ic>
);
const IconMI_Mu = (p) => ( // Musikal
  <Ic {...p}><path d="M9 17.5V5l10-2v12.5" /><circle cx="6.5" cy="17.5" r="2.6" /><circle cx="16.5" cy="15.5" r="2.6" /></Ic>
);
const IconMI_Ki = (p) => ( // Kinestetik
  <Ic {...p}><circle cx="13" cy="4.5" r="2" /><path d="M13 6.5l-2.5 4 3 2 1 5M10.5 10.5 6 9M13.5 12.5 17 14M9 21l1.5-4.5" /></Ic>
);
const IconMI_Ie = (p) => ( // Interpersonal
  <Ic {...p}><circle cx="8.5" cy="8" r="2.8" /><path d="M3.5 19a5 5 0 0 1 10 0" /><path d="M15.5 5.6a2.8 2.8 0 0 1 0 5.4M17 19a5 5 0 0 0-2.8-4.4" /></Ic>
);
const INTEL_ICON = { Lo: IconMI_Lo, Na: IconMI_Na, Ve: IconMI_Ve, Ia: IconMI_Ia, Sp: IconMI_Sp, Mu: IconMI_Mu, Ki: IconMI_Ki, Ie: IconMI_Ie };

Object.assign(window, {
  IconCalendar, IconChevron, IconArrowRight, IconArrowUpRight, IconSparkle,
  IconFlag, IconCheckCircle, IconHeart, IconShield, IconBrain, IconLeaf,
  IconUsers, IconBell, IconChat, IconHome, IconCalmFace,
  IconSearch, IconSettings, IconLogout, IconGrid, IconBuilding, IconLayers,
  IconScale, IconRefresh, IconArrowUp, IconArrowDown, IconMinus, INTEL_ICON
});
