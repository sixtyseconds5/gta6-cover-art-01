// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// full-viewport; ?shot=editor shows the editor with a sample photo loaded.
// Query params: photo (pier | boulevard), caption (title), subtitle, layout
// (hero | triptych | grid), grade (sunset | neon | dusk), size
// (square | portrait | wide). window.__shotReady is set once painted.
export async function runShot(shot, query, api) {
  const photoName = query.get('photo') ?? 'pier';
  const title = query.get('caption') ?? 'VICE CITY';
  const subtitle = query.get('subtitle') ?? 'Neon nights, palm dreams';
  const layout = query.get('layout') ?? 'hero';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';

  const img = await api.loadImage(`samples/${photoName}.jpg`);
  api.addPhoto(img, `${photoName}.jpg`);
  api.setState({ layout, grade, size, title, subtitle });
  api.redraw();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Force the cover to fill the whole viewport: inline styles beat the
    // editor's max-height rule, so no letterbox bars survive the shot.
    const coverCanvas = document.getElementById('cover');
    coverCanvas.style.width = '100vw';
    coverCanvas.style.height = '100vh';
    coverCanvas.style.maxHeight = 'none';
    coverCanvas.style.objectFit = 'contain';
    api.redraw();
  }
  await document.fonts.ready;
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
