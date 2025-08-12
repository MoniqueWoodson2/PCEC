// js/contact.js
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

// Fields
const firstNameEl = document.getElementById('firstName');
const lastNameEl  = document.getElementById('lastName');
const phoneEl     = document.getElementById('phone');
const emailEl     = document.getElementById('email');
const companyEl   = document.getElementById('company');
const messageEl   = document.getElementById('message');

// Honeypot
const companyTrapEl = document.getElementById('companyTrap');

function clearStatus(){ statusEl.textContent=''; statusEl.className='status'; }
function setOk(m){ statusEl.textContent=m; statusEl.className='status ok'; }
function setErr(m){ statusEl.textContent=m; statusEl.className='status err'; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus();

  // Bot trap: if filled, silently ignore
  if (companyTrapEl.value) return;

  const firstName = (firstNameEl.value || '').trim();
  const lastName  = (lastNameEl.value  || '').trim();
  const phone     = (phoneEl.value     || '').trim();
  const email     = (emailEl.value     || '').trim();
  const company   = (companyEl.value   || '').trim();
  const message   = (messageEl.value   || '').trim();

  // Minimal sensible validation:
  // - Require a name (first or last)
  // - Require at least one contact method (phone OR email)
  if (!firstName && !lastName) {
    setErr('Please enter your first or last name.');
    return;
  }
  if (!phone && !email) {
    setErr('Please provide at least one contact method (phone or email).');
    return;
  }

  const payload = {
    firstName: firstName || null,
    lastName : lastName  || null,
    phone    : phone     || null,
    email    : email     || null,
    company  : company   || null,
    message  : message   || null,
    status   : 'new',
    createdAt: serverTimestamp(),
  };

  submitBtn.disabled = true;
  setOk('Sending…');

  try {
    await addDoc(collection(db, 'contactMessages'), payload);
    setOk('Thanks! Your message has been received. We’ll get back to you soon.');
    form.reset();
  } catch (err) {
    console.error('Firestore add error:', err);
    setErr('Sorry—something went wrong while saving your message. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});