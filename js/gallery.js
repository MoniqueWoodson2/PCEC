// js/gallery.js — GH Pages safe gallery using manifest.json (or inline list fallback)

// ----- selectors / lightbox -----
const GRID = document.getElementById('galleryGrid');
const LB   = document.getElementById('lightbox');
const LB_IMG = document.getElementById('lightboxImg');
const LB_CAP = document.getElementById('lightboxCaption');
const BTN_CLOSE = LB.querySelector('.lb-close');
const BTN_PREV  = LB.querySelector('.lb-prev');
const BTN_NEXT  = LB.querySelector('.lb-next');

let photos = [];
let idx = 0;

// ----- resolve paths against PAGE directory (not document.baseURI) -----
const PAGE_DIR = window.location.href
  .replace(/[?#].*$/, '')   // strip query/hash
  .replace(/[^/]*$/, '');   // strip filename, keep trailing /

const FOLDER_URL   = new URL('Images/photoAlbum/', PAGE_DIR).href;
const MANIFEST_URL = new URL('manifest.json', FOLDER_URL).href;

console.log('[Gallery] FOLDER_URL =', FOLDER_URL);
console.log('[Gallery] MANIFEST_URL =', MANIFEST_URL);

const EXTS = ['.jpg','.jpeg','.png','.gif','.webp','.svg','.bmp','.jfif','.pjpeg','.pjp','.avif'];

function looksLikeImage(name) {
  const lower = String(name).toLowerCase();
  return EXTS.some(ext => lower.endsWith(ext));
}

// ----- sources -----
async function listFromManifest() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    console.log('[Gallery] manifest status:', res.status);
    if (!res.ok) throw new Error('manifest fetch failed');
    const arr = await res.json();
    if (Array.isArray(arr)) {
      return arr.map(s => String(s).trim()).filter(looksLikeImage);
    }
  } catch (e) {
    console.warn('[Gallery] Manifest not found/invalid:', e);
  }
  return [];
}

// Optional fallback: define window.PHOTO_SOURCES = ['file1.jpg', ...] in HTML
function listFromWindowGlobal() {
  if (Array.isArray(window.PHOTO_SOURCES)) {
    return window.PHOTO_SOURCES.map(String).filter(looksLikeImage);
  }
  return [];
}

// ----- render -----
function renderGrid(items) {
  GRID.innerHTML = '';

  if (!items.length) {
    const msg = document.createElement('p');
    msg.textContent = 'No photos found. Add Images/photoAlbum/manifest.json or define window.PHOTO_SOURCES.';
    msg.style.textAlign = 'center';
    GRID.appendChild(msg);
    return;
  }

  items.forEach((name, i) => {
    const src = new URL(encodeURIComponent(name), FOLDER_URL).href;

    const a = document.createElement('a');
    a.href = src;
    a.className = 'thumb';
    a.setAttribute('data-index', String(i));
    a.addEventListener('click', (e) => { e.preventDefault(); openLightbox(i); });

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = src;
    img.alt = '';
    a.appendChild(img);

    GRID.appendChild(a);
  });
}

function openLightbox(i) {
  idx = i;
  const src = new URL(encodeURIComponent(photos[idx]), FOLDER_URL).href;
  LB_IMG.src = src;
  LB_IMG.alt = photos[idx] || 'Photo';
  LB_CAP.textContent = photos[idx] || '';
  LB.classList.add('open');
  LB.setAttribute('tabindex', '-1');
  LB.focus();
}
function closeLightbox() { LB.classList.remove('open'); LB_IMG.src = ''; }
function prevImg() { if (!photos.length) return; idx = (idx - 1 + photos.length) % photos.length; openLightbox(idx); }
function nextImg() { if (!photos.length) return; idx = (idx + 1) % photos.length; openLightbox(idx); }

// ----- events -----
BTN_CLOSE.addEventListener('click', closeLightbox);
BTN_PREV.addEventListener('click', prevImg);
BTN_NEXT.addEventListener('click', nextImg);
LB.addEventListener('click', (e) => { if (e.target === LB) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!LB.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImg();
  if (e.key === 'ArrowRight') nextImg();
});

// ----- init -----
(async function init() {
  // On GH Pages, directory listing won’t work, so rely on manifest or inline list
  photos = await listFromManifest();
  if (!photos.length) photos = listFromWindowGlobal();
  renderGrid(photos);
})();