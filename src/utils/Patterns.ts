export const PATTERN_LIST: Record<string, { name: string; svg: string }> = {
  none: { name: "Solid Color", svg: "" },
  hearts: { name: "Hearts", svg: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 33.5l-1.5-1.5C13.2 27 10 24 10 20.5c0-2.8 2.2-5 5-5 1.6 0 3.1.8 4 2 0.9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 5 0 3.5-3.2 6.5-8.5 11.5L20 33.5z" fill="{{color}}" fill-rule="evenodd"/></svg>` },
  grid: { name: "Grid", svg: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L0 0 0 20" fill="none" stroke="{{color}}" stroke-width="1"/></svg>` },
  dots: { name: "Polka Dots", svg: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="2" fill="{{color}}"/></svg>` },
  stars: { name: "Stars", svg: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 4l4.9 10 11.1 1.6-8 7.8 1.9 11L20 29l-9.9 5.2 1.9-11-8-7.8 11.1-1.6L20 4z" fill="{{color}}" fill-rule="evenodd"/></svg>` },
  stripes: { name: "Stripes", svg: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M-5 25 L25 -5 M-5 5 L5 -5 M15 25 L25 15" fill="none" stroke="{{color}}" stroke-width="4"/></svg>` },
  checker: { name: "Checker", svg: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="{{color}}"/><rect x="10" y="10" width="10" height="10" fill="{{color}}"/></svg>` },
  waves: { name: "Waves", svg: `<svg width="40" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke="{{color}}" stroke-width="2"/></svg>` },
  crosses: { name: "Crosses", svg: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 5 L10 15 M5 10 L15 10" fill="none" stroke="{{color}}" stroke-width="2"/></svg>` },
  diamonds: { name: "Diamonds", svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M10 0 L20 10 L10 20 L0 10 Z" fill="{{color}}"/></svg>` },
  honeycomb: { name: "Honeycomb", svg: `<svg width="28" height="49" viewBox="0 0 28 49" xmlns="http://www.w3.org/2000/svg"><path d="M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z" fill="{{color}}"/></svg>` },
  sprinkles: { name: "Sprinkles", svg: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="{{color}}"><rect x="5" y="5" width="8" height="2" rx="1" transform="rotate(45 9 6)"/><rect x="25" y="15" width="8" height="2" rx="1" transform="rotate(-30 29 16)"/><rect x="15" y="30" width="8" height="2" rx="1" transform="rotate(15 19 31)"/></g></svg>` },
  plus: { name: "Plus", svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M9 4h2v12H9zM4 9h12v2H4z" fill="{{color}}"/></svg>` },
  zigzag: { name: "Zigzag", svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10l5-5 5 5 5-5 5 5" fill="none" stroke="{{color}}" stroke-width="2"/></svg>` },
  bubbles: { name: "Bubbles", svg: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="10" fill="none" stroke="{{color}}" stroke-width="2"/><circle cx="0" cy="0" r="10" fill="none" stroke="{{color}}" stroke-width="2"/></svg>` },
  triangles: { name: "Triangles", svg: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M20 0l20 40H0z" fill="{{color}}" opacity="0.7"/><path d="M20 40L40 0H0z" fill="{{color}}" opacity="0.3"/></svg>` },
  brick: { name: "Brick", svg: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="10" fill="{{color}}"/><rect x="20" y="20" width="20" height="10" fill="{{color}}"/></svg>` },
  target: { name: "Target", svg: `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="none" stroke="{{color}}" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="none" stroke="{{color}}" stroke-width="2"/><circle cx="20" cy="20" r="2" fill="{{color}}"/></svg>` },
  waffle: { name: "Waffle", svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 5h20M5 0v20" stroke="{{color}}" stroke-width="4" opacity="0.5"/><path d="M0 15h20M15 0v20" stroke="{{color}}" stroke-width="2"/></svg>` },
  houndstooth: { name: "Houndstooth", svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 0l10 10v10h-10zM10 10l10-10v10h-10z" fill="{{color}}"/></svg>` }
};

const hexToRgba = (hex: string, alpha: number): string => {
  // If it's already rgba or rgb, just return it (fallback)
  if (hex.startsWith('rgb')) return hex;
  
  // Default to black if invalid
  if (!/^#[0-9A-Fa-f]{6}$/i.test(hex)) return `rgba(0,0,0,${alpha})`;
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getPatternCss = (id: string, color: string, opacity: number = 0.15): string => {
  const p = PATTERN_LIST[id];
  if (!p || !p.svg) return "";
  const finalColor = hexToRgba(color, opacity);
  const svg = p.svg.replace(/\{\{color\}\}/g, finalColor);
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

export const getPatternCanvas = (id: string, color: string): string => {
  const p = PATTERN_LIST[id];
  if (!p || !p.svg) return "";
  const subtleColor = hexToRgba(color, 0.15);
  const svg = p.svg.replace(/\{\{color\}\}/g, subtleColor);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
