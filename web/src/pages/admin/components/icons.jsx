function base(props, children) {
  const { size = 16, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconDash(props) {
  return base(props, <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </>);
}

export function IconCheck(props) {
  return base(props, <>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="10" />
  </>);
}

export function IconUpload(props) {
  return base(props, <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>);
}

export function IconSpark(props) {
  return base(props, <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />);
}

export function IconSchool(props) {
  return base(props, <>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <rect x="9" y="12" width="6" height="9" />
  </>);
}

export function IconUser(props) {
  return base(props, <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>);
}

export function IconSearch(props) {
  return base(props, <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>);
}

export function IconLogOut(props) {
  return base(props, <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>);
}

export function IconX(props) {
  return base({ strokeWidth: 2.4, ...props }, <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>);
}

export function IconChevronRight(props) {
  return base(props, <polyline points="9 6 15 12 9 18" />);
}

export function IconChevronDown(props) {
  return base(props, <polyline points="6 9 12 15 18 9" />);
}

export function IconMoreVertical(props) {
  return base(props, <>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </>);
}

export function IconRefresh(props) {
  return base(props, <>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </>);
}

export function IconEdit(props) {
  return base(props, <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>);
}

export function IconAlertCircle(props) {
  return base(props, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>);
}

export function IconInfo(props) {
  return base(props, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </>);
}

export function IconInbox(props) {
  return base(props, <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </>);
}

export function IconPlus(props) {
  return base({ strokeWidth: 2.4, ...props }, <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>);
}

export function IconZap(props) {
  return base({ fill: 'currentColor', ...props }, <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />);
}
