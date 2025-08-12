// Simple JavaScript to load the header.html and foote.html into the page
/*fetch("header.html")
.then(res => res.text())
.then(data => {
  document.getElementById("header-container").innerHTML = data;
});

fetch("footer.html")
.then(res => res.text())
.then(data => {
  document.getElementById("footer-container").innerHTML = data;
});


// Load Announcements Section
fetch("ANNOUNCEMENTS.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("announcements-container").innerHTML = data;
  })
  .catch(err => console.error("Error loading announcements:", err));*/

////////////////////////
(async function loadPartials() {
  try {
    const h = await fetch('header.html');
    if (h.ok) {
      document.getElementById('header-container').innerHTML = await h.text();
    }
  } catch (e) {}

  try {
    const f = await fetch('footer.html');
    if (f.ok) {
      document.getElementById('footer-container').innerHTML = await f.text();
    }
  } catch (e) {}

  // --- After header loads, set active nav link ---
  try {
    const current = (() => {
      // Get just the file name (e.g., "programs.html"), treat "/" or "" as "index.html"
      const path = window.location.pathname.split('/').pop();
      return path && path !== '' ? path.toLowerCase() : 'index.html';
    })();

    const navLinks = document.querySelectorAll('.main-nav a[href]');
    navLinks.forEach(a => {
      // Resolve potential relative paths
      const href = a.getAttribute('href') || '';
      const page = href.split('/').pop().toLowerCase();

      if (page === current || (current === 'index.html' && (page === '' || page === './'))) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });
  } catch (e) {
    // silent fail is fine
  }
})();