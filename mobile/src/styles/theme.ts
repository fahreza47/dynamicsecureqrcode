export const theme = {
  colors: {
    // Primary Brand
    primary: '#2563eb',       // Modern Royal/Azure Blue
    primaryDark: '#1d4ed8',   // Deeper blue for numbers/active state
    primaryLight: '#3b82f6',  // Vivid blue for chevrons & accents
    primarySoft: '#eff6ff',   // Soft blue pastel for badges & pills

    // Status Colors & Soft Backgrounds
    success: '#16a34a',       // Green (Aktif)
    successSoft: '#f0fdf4',   // Pastel green badge
    danger: '#dc2626',        // Red (Dipindai/Used)
    dangerSoft: '#fef2f2',    // Pastel red badge
    warning: '#d97706',       // Amber warning
    warningSoft: '#fffbeb',   // Pastel amber badge
    info: '#2563eb',

    // Category / Event Card Pastel Palettes
    purple: '#818cf8',        // Violet/Indigo (Music events)
    purpleSoft: '#f5f3ff',
    rose: '#fb7185',          // Rose Pink (Sing/Talkshow events)
    roseSoft: '#fff1f2',
    orange: '#fb923c',        // Amber Orange (Festival/General events)
    orangeSoft: '#fff7ed',

    // Backgrounds & Neutrals
    background: '#f8fafc',    // Slate 50 — clean modern canvas
    cardBackground: '#ffffff',
    textPrimary: '#0f172a',   // Slate 900 — deep high-contrast text
    textSecondary: '#64748b', // Slate 500 — clear subtitle text
    textMuted: '#94a3b8',     // Slate 400 — placeholders & inactive icons
    border: '#f1f5f9',        // Slate 100 — soft card borders
    borderSubtle: '#e2e8f0',  // Slate 200 — dividers & input borders
    white: '#ffffff',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    hero: 32,
  },
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    round: 999,
  },
  typography: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 15,
    xl: 18,
    xxl: 22,
    hero: 28,
  },
  shadows: {
    card: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    buttonPrimary: {
      shadowColor: '#2563eb',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    floating: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 10,
    },
  },
};

