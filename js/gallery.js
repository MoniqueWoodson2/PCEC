// js/gallery.js
// --- GitHub repo config for Monique's site ---
const GH_OWNER  = "MoniqueWoodson2";
const GH_REPO   = "PCEC";
const GH_BRANCH = "main"; // change to "gh-pages" if that's your default branch

// Folder with images (case-sensitive on GitHub)
const GALLERY_DIR = "Images/photoAlbum";

// Supported extensions
const EXTENSIONS = [
  ".jpg",".jpeg",".png",".gif",".webp",".svg",".bmp",".jfif",".pjpeg",".pjp",".avif"
];

// Optional fallback if GitHub API is blocked/rate-limited:
const MANIFEST_URL = `/${GALLERY_DIR}/manifest.json`;

const gridEl = document.getElementById("galleryGrid");
const lbEl = document.getElementById("lightbox");
const lbImg = document.getElementById("lightboxImg");
const lbCaption = document.getElementById("lightboxCaption");
const btnPrev = document.querySelector(".lb-prev");
const btnNext = document.querySelector(".lb-next");
const btnClose = document.querySelector(".lb-close");

let images = [];
let currentIndex = 0;

function hasAllowedExt(name){
  const lower = name.toLowerCase();
  return EXTENSIONS.some(ext => lower.endsWith(ext));
}
function fileNameToCaption(name){
  return name.replace(/\.[^.]+$/, "")
             .replace(/[-_]+/g, " ")
             .replace(/\s+/g, " ")
             .trim()
             .replace(/^./, c => c.toUpperCase());
}

async function fetchFromGitHubAPI(){
  const apiURL = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GALLERY_DIR}?ref=${GH_BRANCH}`;
  const res = await fetch(apiURL, { headers: { "Accept": "application/vnd.github.v3+json" }});
  if(!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  const files = data
    .filter(item => item.type === "file" && hasAllowedExt(item.name))
    .map(item => ({
      name: item.name,
      src: item.download_url,
      alt: fileNameToCaption(item.name)
    }));
  if(!files.length) throw new Error("No images found in the folder.");
  return files;
}

async function fetchFromManifest(){
  const res = await fetch(MANIFEST_URL, { cache: "no-store" });
  if(!res.ok) throw new Error("No manifest.json fallback found.");
  const list = await res.json();
  const files = list
    .filter(name => hasAllowedExt(name))
    .map(name => ({
      name,
      src: `/${GALLERY_DIR}/${name}`,
      alt: fileNameToCaption(name)
    }));
  if(!files.length) throw new Error("Manifest has no valid images.");
  return files;
}

function renderGrid(){
  gridEl.innerHTML = "";
  images.forEach((img, idx) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className = "thumb";
    a.setAttribute("aria-label", img.alt);
    a.addEventListener("click", (e) => { e.preventDefault(); openLightbox(idx); });

    const image = document.createElement("img");
    image.loading = "lazy";
    image.decoding = "async";
    image.src = img.src;
    image.alt = img.alt;

    a.appendChild(image);
    gridEl.appendChild(a);
  });
}

function openLightbox(index){
  currentIndex = index;
  updateLightbox();
  lbEl.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  lbEl.classList.remove("open");
  document.body.style.overflow = "";
}
function showPrev(){ currentIndex = (currentIndex - 1 + images.length) % images.length; updateLightbox(); }
function showNext(){ currentIndex = (currentIndex + 1) % images.length; updateLightbox(); }
function updateLightbox(){
  const item = images[currentIndex];
  lbImg.src = item.src;
  lbImg.alt = item.alt;
  lbCaption.textContent = `${item.alt} — ${currentIndex + 1} / ${images.length}`;
  lbCaption.setAttribute("aria-hidden", "false");
}

lbEl?.addEventListener("click", (e) => { if(e.target === lbEl) closeLightbox(); });
btnPrev?.addEventListener("click", showPrev);
btnNext?.addEventListener("click", showNext);
btnClose?.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => {
  if(!lbEl.classList.contains("open")) return;
  if(e.key === "Escape") closeLightbox();
  if(e.key === "ArrowLeft") showPrev();
  if(e.key === "ArrowRight") showNext();
  if(e.key === "Home") { currentIndex = 0; updateLightbox(); }
  if(e.key === "End") { currentIndex = images.length - 1; updateLightbox(); }
});

(async function initGallery(){
  try {
    images = await fetchFromGitHubAPI();
  } catch(e1){
    console.warn(e1.message, "Trying manifest fallback...");
    try {
      images = await fetchFromManifest();
    } catch(e2){
      console.error(e2.message);
      gridEl.innerHTML = `
        <div style="text-align:center;padding:1rem;background:floralwhite;border:1px solid gainsboro;border-radius:10px">
          <p>We couldn't load the gallery.</p>
          <p style="font-size:0.95rem;opacity:.8">
            Tip: Ensure your images are in <code>/${GALLERY_DIR}</code> and the branch name (<code>${GH_BRANCH}</code>) matches your repo.
            If you hit GitHub API rate limits, add <code>${MANIFEST_URL}</code> with a JSON array of filenames.
          </p>
        </div>`;
      return;
    }
  }
  renderGrid();
})();