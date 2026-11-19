// Vice Cover Studio — cover engine.
// Draws a multi-panel GTA-poster-style cover onto a canvas: photo panels in a
// chosen layout, a sunset/neon colour grade, an original skyline silhouette
// drawn from rectangles and triangles, and bold condensed caption lettering.
// Every shape here is drawn with canvas paths; nothing is copied artwork.

export const LAYOUTS = {
  hero: 'Hero + two strips',
  triptych: 'Three vertical panels',
  grid: 'Four-panel grid',
};

export const GRADES = {
  sunset: 'Sunset',
  neon: 'Neon Nights',
  dusk: 'Palm Dusk',
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

const GRADE_STYLE = {
  sunset: {
    sky: ['#ff9a3d', '#ff5e62', '#7b2d8b'],
    tint: 'rgba(255, 94, 60, 0.28)',
    scrim: 'rgba(43, 10, 60, 0.72)',
    title: '#fff3d6',
    accent: '#ffb347',
    skyline: '#1c0b2e',
  },
  neon: {
    sky: ['#ff2e88', '#7b2ff7', '#00e5ff'],
    tint: 'rgba(0, 229, 255, 0.22)',
    scrim: 'rgba(10, 4, 40, 0.78)',
    title: '#e8fbff',
    accent: '#ff2e88',
    skyline: '#0a0428',
  },
  dusk: {
    sky: ['#f7b733', '#fc4a1a', '#2c1a4d'],
    tint: 'rgba(252, 74, 26, 0.24)',
    scrim: 'rgba(26, 10, 46, 0.74)',
    title: '#ffe9b0',
    accent: '#7dffb2',
    skyline: '#170a2e',
  },
};

const GUTTER = 0.012; // gutter as a fraction of the short side

/** Panel rectangles for a layout, as fractions of the canvas. */
export function panelRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * GUTTER);
  if (layout === 'triptych') {
    const pw = (w - g * 4) / 3;
    return [0, 1, 2].map((i) => ({ x: g + i * (pw + g), y: g, w: pw, h: h - g * 2 }));
  }
  if (layout === 'grid') {
    const pw = (w - g * 3) / 2;
    const ph = (h - g * 3) / 2;
    return [
      { x: g, y: g, w: pw, h: ph },
      { x: g * 2 + pw, y: g, w: pw, h: ph },
      { x: g, y: g * 2 + ph, w: pw, h: ph },
      { x: g * 2 + pw, y: g * 2 + ph, w: pw, h: ph },
    ];
  }
  // hero: one tall panel on top, two short strips below it.
  const heroH = h * 0.6 - g;
  const stripH = h - heroH - g * 3;
  const stripW = (w - g * 3) / 2;
  return [
    { x: g, y: g, w: w - g * 2, h: heroH },
    { x: g, y: heroH + g * 2, w: stripW, h: stripH },
    { x: g * 2 + stripW, y: heroH + g * 2, w: stripW, h: stripH },
  ];
}

/** How many panels a layout has. */
export function panelCount(layout) {
  return panelRects(layout, 100, 100).length;
}

/** Small deterministic hash so the skyline varies with the title. */
function hashText(text) {
  let n = 7;
  for (const ch of text) n = (n * 31 + ch.codePointAt(0)) % 9973;
  return n;
}

/** Draws one photo into a panel rect, cover-fit, with pan offset and zoom. */
function drawPanelPhoto(ctx, photo, rect, panel) {
  if (!photo) return false;
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

/** Original skyline silhouette: rectangles, a water tower and palm fronds. */
function drawSkyline(ctx, w, h, colour, seed) {
  const base = h * 0.985;
  const top = h * 0.86;
  ctx.fillStyle = colour;
  let x = 0;
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  while (x < w) {
    const bw = w * (0.05 + next() * 0.09);
    const bh = top + next() * (base - top) * 0.7;
    ctx.fillRect(x, bh, bw, base - bh);
    if (next() > 0.6) {
      // rooftop antenna
      ctx.fillRect(x + bw / 2 - 1, bh - h * 0.03, 2, h * 0.03);
    }
    if (next() > 0.75) {
      // water tower on the roof
      ctx.fillRect(x + bw * 0.2, bh - h * 0.045, bw * 0.6, h * 0.045);
      ctx.beginPath();
      ctx.moveTo(x + bw * 0.15, bh - h * 0.045);
      ctx.lineTo(x + bw * 0.5, bh - h * 0.075);
      ctx.lineTo(x + bw * 0.85, bh - h * 0.045);
      ctx.closePath();
      ctx.fill();
    }
    x += bw + w * 0.008;
  }
  // Two palm trees at the edges.
  for (const px of [w * 0.06, w * 0.94]) {
    ctx.beginPath();
    ctx.moveTo(px - w * 0.004, base);
    ctx.quadraticCurveTo(px - w * 0.01, base - h * 0.09, px + w * 0.012, base - h * 0.11);
    ctx.lineTo(px + w * 0.02, base - h * 0.11);
    ctx.quadraticCurveTo(px + w * 0.004, base - h * 0.08, px + w * 0.01, base);
    ctx.closePath();
    ctx.fill();
    for (let f = 0; f < 5; f++) {
      const a = Math.PI * (0.08 + f * 0.21);
      const tipX = px + w * 0.012 + Math.cos(a) * w * 0.045;
      const tipY = base - h * 0.11 - Math.sin(a) * h * 0.035;
      ctx.beginPath();
      ctx.moveTo(px + w * 0.012, base - h * 0.11);
      ctx.quadraticCurveTo(px + w * 0.03, base - h * 0.13, tipX, tipY);
      ctx.quadraticCurveTo(px + w * 0.02, base - h * 0.1, px + w * 0.012, base - h * 0.11);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** Bold condensed title with a dark outline and a soft shadow. */
function drawTitle(ctx, w, h, title, subtitle, style) {
  const bandTop = h * 0.8;
  const grad = ctx.createLinearGradient(0, bandTop - h * 0.06, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, style.scrim);
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandTop - h * 0.06, w, h - bandTop + h * 0.06);

  const text = (title || 'VICE COVER').trim().toUpperCase();
  let size = h * 0.13;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const font = (px) => `${px}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > w * 0.92 && size > 20) {
    size -= 4;
    ctx.font = font(size);
  }
  const y = h - h * 0.075;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  ctx.strokeText(text, w / 2, y);
  ctx.fillStyle = style.title;
  ctx.fillText(text, w / 2, y);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Accent underline bar under the title.
  const barW = Math.min(w * 0.5, ctx.measureText(text).width * 0.7);
  ctx.fillStyle = style.accent;
  ctx.fillRect((w - barW) / 2, y + h * 0.015, barW, Math.max(3, h * 0.006));

  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(14, h * 0.032);
    ctx.font = `italic bold ${subSize}px "Arial Narrow", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub.toUpperCase(), w / 2, y + h * 0.055);
  }
}

/** Light film grain: sparse translucent dots over the whole cover. */
function drawGrain(ctx, w, h, seed) {
  let s = seed * 7919 + 13;
  const next = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const dots = Math.floor((w * h) / 9000);
  for (let i = 0; i < dots; i++) {
    ctx.fillRect(next() * w, next() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/**
 * Draws the whole cover.
 * state: { photos, panels, layout, grade, title, subtitle }
 * photos: array of HTMLImageElement (or null); panels: [{ photo, ox, oy, zoom }]
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const style = GRADE_STYLE[state.grade] || GRADE_STYLE.sunset;

  // Sunset sky backdrop behind the panels.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, style.sky[0]);
  sky.addColorStop(0.55, style.sky[1]);
  sky.addColorStop(1, style.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun disc low in the sky, half hidden behind the panels.
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#fff2c9';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.34, Math.min(w, h) * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const rects = panelRects(state.layout, w, h);
  const filled = [];
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, ox: 0, oy: 0, zoom: 1 };
    const img = state.photos[panel.photo] || null;
    const ok = drawPanelPhoto(ctx, img, rect, panel);
    if (ok) filled.push(i);
    // Colour-grade wash over the panel.
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    wash.addColorStop(0, 'rgba(255, 180, 80, 0.10)');
    wash.addColorStop(1, style.tint);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // White frame line around the panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  if (filled.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `${Math.max(16, h * 0.03)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO TO BEGIN', w / 2, h * 0.45);
  }

  drawSkyline(ctx, w, h, style.skyline, hashText(state.title || 'vice'));
  drawTitle(ctx, w, h, state.title, state.subtitle, style);
  drawGrain(ctx, w, h, hashText(state.title || 'vice'));
}
