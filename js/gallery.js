// js/gallery.js

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

// IMPORTANT: use a RELATIVE path, no leading slash.
// This works whether your site is at root or at /some/subpath/
const FOLDER_PATH = 'Images/photoAlbum/';
// Resolve to an absolute URL based on the current page
const FOLDER = new URL(FOLDER_PATH, document.baseURI).href;

const EXTS = ['.jpg','.jpeg','.png','.gif','.webp','.svg','.bmp','.jfif','.pjpeg','.pjp','.avif'];

function toName(href) {
  try {
    const u = new URL(href, window.location.href);
    const p = u.pathname.replace(/\\/g,'/');
    const i = p.lastIndexOf('/');
    return decodeURIComponent(i >= 0 ? p.slice(i+1) : p);
  } catch {
    const parts = href.split('?')[0].split('#')[0].split('/');
    return decodeURIComponent(parts[parts.length - 1] || href);
  }
}
function looksLikeImage(name) {
  const lower = name.toLowerCase();
  return EXTS.some(ext => lower.endsWith(ext));
}

// Try reading a directory index page (many hosts disable this; OK if it fails)
async function listFromDirectoryIndex() {
  try {
    const res = await fetch(FOLDER, { cache: 'no-store' });
    if (!res.ok) throw new Error('dir index not available');
    const html = await res.text();
    const div = document.createElement('div');
    div.innerHTML = html;
    const links = Array.from(div.querySelectorAll('a'));
    let names = links
      .map(a => a.getAttribute('href') || '')
      .filter(href => href && href !== '../')
      .map(href => toName(href))
      .filter(name => name && looksLikeImage(name));
    names = Array.from(new Set(names)).sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }));
    return names;
  } catch {
    return [];
  }
}

// Manifest fallback (RECOMMENDED): Images/photoAlbum/manifest.json
async function listFromManifest() {
  try {
    const manifestURL = new URL('manifest.json', FOLDER).href;
    const res = await fetch(manifestURL, { cache: 'no-store' });
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

// Window global fallback
function listFromWindowGlobal() {
  if (Array.isArray(window.PHOTO_SOURCES)) {
    return window.PHOTO_SOURCES
      .map(String)
      .filter(name => looksLikeImage(name))
      .sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }));
  }
  return [];
}

// Render grid
function renderGrid(items) {
  GRID.innerHTML = '';

  if (!items.length) {
    const msg = document.createElement('p');
    msg.textContent = 'No photos found. Add a manifest.json or define window.PHOTO_SOURCES.';
    msg.style.textAlign = 'center';
    GRID.appendChild(msg);
    return;
  }

  items.forEach((name, i) => {
    const src = new URL(name, FOLDER).href;
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

// Lightbox
function openLightbox(i) {
  idx = i;
  const src = new URL(photos[idx], FOLDER).href;
  LB_IMG.src = src;
  LB_IMG.alt = photos[idx] || 'Photo';
  LB_CAP.textContent = photos[idx] || '';
  LB.classList.add('open');
  LB.setAttribute('tabindex', '-1'); // ensure focusable
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

// Events
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

// Init
(async function init() {
  // 1) Try directory listing (often blocked in production)
  photos = await listFromDirectoryIndex();

  // 2) Fallback to manifest.json (recommended & reliable)
  if (!photos.length) photos = await listFromManifest();

  // 3) Fallback to window.PHOTO_SOURCES
  if (!photos.length) photos = listFromWindowGlobal();

  renderGrid(photos);
})();