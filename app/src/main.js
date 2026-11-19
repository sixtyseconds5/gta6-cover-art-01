// Vice Cover Studio — editor wiring.
// Owns the app state (photos, per-panel crop/position, layout, grade, size,
// title and subtitle), the live preview canvas, drag-to-pan, and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot (see shots.js).
import { drawCover, panelRects, panelCount, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

const state = {
  photos: [], // HTMLImageElement[]
  photoNames: [],
  panels: [
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
  ],
  layout: 'hero',
  grade: 'sunset',
  size: 'square',
  title: 'VICE CITY',
  subtitle: 'Neon nights, palm dreams',
  selectedPanel: 0,
};

function currentSize() {
  return SIZES[state.size] || SIZES.square;
}

function redraw() {
  const size = currentSize();
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const count = panelCount(state.layout);
  document.querySelectorAll('.panel-row').forEach((row, i) => {
    row.style.display = i < count ? '' : 'none';
  });
  const panel = state.panels[state.selectedPanel];
  $('zoom').value = String(Math.round((panel.zoom || 1) * 100));
  $('zoomVal').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  document.querySelectorAll('.panel-row').forEach((row, i) => {
    row.classList.toggle('selected', i === state.selectedPanel);
  });
}

/** Rebuilds the photo-picker and per-panel photo selects. */
function rebuildPhotoControls() {
  const list = $('photoList');
  list.innerHTML = '';
  state.photos.forEach((img, i) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = `${i + 1}. ${state.photoNames[i] || 'photo'}`;
    list.appendChild(chip);
  });
  document.querySelectorAll('.panel-photo').forEach((select) => {
    const keep = Number(select.value) || 0;
    select.innerHTML = '';
    state.photos.forEach((img, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Photo ${i + 1} — ${state.photoNames[i] || 'photo'}`;
      select.appendChild(opt);
    });
    if (state.photos.length === 0) {
      const opt = document.createElement('option');
      opt.value = '0';
      opt.textContent = 'No photo yet';
      select.appendChild(opt);
    }
    select.value = String(Math.min(keep, Math.max(0, state.photos.length - 1)));
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push(img);
    state.photoNames.push(file.name);
  }
  // Point every panel at the newest photo if it was empty before.
  if (state.photos.length) {
    const last = state.photos.length - 1;
    state.panels.forEach((p) => {
      if (!state.photos[p.photo]) p.photo = last;
    });
  }
  rebuildPhotoControls();
  redraw();
  statusEl.textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded.`;
}

/** Builds the layout / grade / size option buttons. */
function buildOptionButtons() {
  const layoutBox = $('layoutBtns');
  for (const [key, label] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.dataset.value = key;
    b.textContent = label;
    b.addEventListener('click', () => {
      state.layout = key;
      state.selectedPanel = 0;
      layoutBox.querySelectorAll('.opt').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
    if (key === state.layout) b.classList.add('active');
    layoutBox.appendChild(b);
  }
  const gradeBox = $('gradeBtns');
  for (const [key, label] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.dataset.value = key;
    b.textContent = label;
    b.addEventListener('click', () => {
      state.grade = key;
      gradeBox.querySelectorAll('.opt').forEach((x) => x.classList.toggle('active', x === b));
      redraw();
    });
    if (key === state.grade) b.classList.add('active');
    gradeBox.appendChild(b);
  }
  const sizeSel = $('sizeSel');
  for (const [key, size] of Object.entries(SIZES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${size.label} PNG`;
    sizeSel.appendChild(opt);
  }
  sizeSel.value = state.size;
  sizeSel.addEventListener('change', () => {
    state.size = sizeSel.value;
    redraw();
  });
}

/** Builds the per-panel rows: photo select, zoom note and select button. */
function buildPanelRows() {
  const box = $('panelRows');
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `<span class="panel-name">Panel ${i + 1}</span>
      <select class="panel-photo" aria-label="Photo for panel ${i + 1}"></select>
      <button type="button" class="panel-pick">Crop this</button>`;
    row.querySelector('.panel-photo').addEventListener('change', (e) => {
      state.panels[i].photo = Number(e.target.value);
      redraw();
    });
    row.querySelector('.panel-pick').addEventListener('click', () => {
      state.selectedPanel = i;
      syncPanelControls();
      statusEl.textContent = `Panel ${i + 1} selected — drag it on the preview to move the photo.`;
    });
    box.appendChild(row);
  }
}

/** Drag on the preview to pan the selected panel's photo. */
function wireDrag() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const hit = rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (hit >= 0) state.selectedPanel = hit;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    syncPanelControls();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[state.selectedPanel];
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const r = rects[state.selectedPanel];
    if (!r) return;
    panel.ox += ((e.clientX - lastX) / rect.width) * (canvas.width / r.w);
    panel.oy += ((e.clientY - lastY) / rect.height) * (canvas.height / r.h);
    panel.ox = Math.max(-1, Math.min(1, panel.ox));
    panel.oy = Math.max(-1, Math.min(1, panel.oy));
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

/** Renders the cover at full export size and downloads it as a PNG. */
function exportPng() {
  const size = currentSize();
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Exported vice-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

function wireControls() {
  $('photos').addEventListener('change', (e) => addFiles([...e.target.files]));
  $('samplePier').addEventListener('click', async () => {
    const img = await loadImage('samples/pier.jpg');
    state.photos.push(img);
    state.photoNames.push('pier.jpg');
    rebuildPhotoControls();
    redraw();
  });
  $('sampleBoulevard').addEventListener('click', async () => {
    const img = await loadImage('samples/boulevard.jpg');
    state.photos.push(img);
    state.photoNames.push('boulevard.jpg');
    rebuildPhotoControls();
    redraw();
  });
  $('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  $('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].zoom = Number(e.target.value) / 100;
    redraw();
  });
  $('resetCrop').addEventListener('click', () => {
    const p = state.panels[state.selectedPanel];
    p.ox = 0;
    p.oy = 0;
    p.zoom = 1;
    redraw();
  });
  $('export').addEventListener('click', exportPng);
}

buildOptionButtons();
buildPanelRows();
wireControls();
wireDrag();
rebuildPhotoControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadImage,
    setState(patch) {
      Object.assign(state, patch);
      if (patch.size) $('sizeSel').value = patch.size;
      if (patch.title !== undefined) $('title').value = patch.title;
      if (patch.subtitle !== undefined) $('subtitle').value = patch.subtitle;
      document.querySelectorAll('#layoutBtns .opt').forEach((b) => b.classList.toggle('active', b.dataset.value === state.layout));
      document.querySelectorAll('#gradeBtns .opt').forEach((b) => b.classList.toggle('active', b.dataset.value === state.grade));
    },
    addPhoto(img, name) {
      state.photos.push(img);
      state.photoNames.push(name);
      rebuildPhotoControls();
    },
    redraw,
  });
} else {
  redraw();
}
