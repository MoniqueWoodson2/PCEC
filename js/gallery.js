// js/gallery.js
// Auto-discovers images in images/photoAlbum/ by parsing the folder index if available.
// Falls back to manifest.json or window.PHOTO_SOURCES.

// ----- selectors / lightbox bits -----
const GRID = document.getElementById('galleryGrid');
const LB   = document.getElementById('lightbox');
const LB_IMG = document.getElementById('lightboxImg');
const LB_CAP = document.getElementById('lightboxCaption');
const BTN_CLOSE = LB.querySelector('.lb-close');
const BTN_PREV  = LB.querySelector('.lb-prev');
const BTN_NEXT  = LB.querySelector('.lb-next');

let photos = [];
let idx = 0;

const FOLDER = '/Images/photoAlbum/';
const EXTS = ['.jpg','.jpeg','.png','.gif','.webp','.svg','.bmp','.jfif','.pjpeg','.pjp', '.avif'];

// Normalize a URL/href to a plain filename within the folder
function toName(href) {
  try {
    const u = new URL(href, window.location.href);
    const p = u.pathname.replace(/\\/g,'/'); // normalize slashes
    const i = p.lastIndexOf('/');
    return decodeURIComponent(i >= 0 ? p.slice(i+1) : p);
  } catch {
    // relative hrefs
    const parts = href.split('?')[0].split('#')[0].split('/');
    return decodeURIComponent(parts[parts.length - 1] || href);
  }
}

function looksLikeImage(name) {
  const lower = name.toLowerCase();
  return EXTS.some(ext => lower.endsWith(ext));
}

// ----- strategy 1: fetch and parse directory index -----
async function listFromDirectoryIndex() {
  try {
    const res = await fetch(FOLDER, { cache: 'no-store' });
    if (!res.ok) throw new Error('dir index not available');
    const html = await res.text();

    // Create a throwaway DOM to query anchors from index page (if server exposes one)
    const div = document.createElement('div');
    div.innerHTML = html;

    const links = Array.from(div.querySelectorAll('a'));
    let names = links
      .map(a => a.getAttribute('href') || '')
      .filter(href => href && href !== '../') // skip parent
      .map(href => toName(href))
      .filter(name => name && looksLikeImage(name));

    // Remove duplicates, sort alpha
    names = Array.from(new Set(names)).sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }));
    return names;
  } catch {
    return [];
  }
}

// ----- strategy 2: manifest.json fallback -----
async function listFromManifest() {
  try {
    const res = await fetch(`${FOLDER}manifest.json`, { cache: 'no-store' });
    if (res.ok) {
      const arr = await res.json();
      if (Array.isArray(arr)) {
        return arr
          .map(String)
          .filter(name => looksLikeImage(name))
          .sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }));
      }
    }
  } catch {}
  return [];
}

// ----- strategy 3: window.PHOTO_SOURCES fallback -----
function listFromWindowGlobal() {
  if (Array.isArray(window.PHOTO_SOURCES)) {
    return window.PHOTO_SOURCES
      .map(String)
      .filter(name => looksLikeImage(name))
      .sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }));
  }
  return [];
}

// ----- render grid & lightbox -----
function renderGrid(items) {
  GRID.innerHTML = '';
  items.forEach((name, i) => {
    const src = `${FOLDER}${name}`;
    const a = document.createElement('a');
    a.href = src;
    a.className = 'thumb';
    a.setAttribute('data-index', String(i));
    a.setAttribute('aria-label', `Open image ${i+1}`);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(i);
    });

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
  const src = `${FOLDER}${photos[idx]}`;
  LB_IMG.src = src;
  LB_IMG.alt = photos[idx] || 'Photo';
  LB_CAP.textContent = photos[idx] || '';
  LB.classList.add('open');
  LB.focus();
}

function closeLightbox() {
  LB.classList.remove('open');
  LB_IMG.src = '';
}

function prevImg() {
  if (!photos.length) return;
  idx = (idx - 1 + photos.length) % photos.length;
  openLightbox(idx);
}

function nextImg() {
  if (!photos.length) return;
  idx = (idx + 1) % photos.length;
  openLightbox(idx);
}

// ----- events -----
BTN_CLOSE.addEventListener('click', closeLightbox);
BTN_PREV.addEventListener('click', prevImg);
BTN_NEXT.addEventListener('click', nextImg);

LB.addEventListener('click', (e) => {
  if (e.target === LB) closeLightbox(); // backdrop click closes
});

document.addEventListener('keydown', (e) => {
  if (!LB.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImg();
  if (e.key === 'ArrowRight') nextImg();
});

// ----- init -----
(async function init() {
  // 1) Try directory listing
  photos = await listFromDirectoryIndex();

  // 2) Fallback to manifest.json
  if (!photos.length) photos = await listFromManifest();

  // 3) Fallback to window.PHOTO_SOURCES
  if (!photos.length) photos = listFromWindowGlobal();

  // Render what we have (even if empty)
  renderGrid(photos);
})();