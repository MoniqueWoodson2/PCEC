// js/programs.js
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const form = document.getElementById('programForm');
const submitBtn = document.getElementById('submitBtn');
const statusEl = document.getElementById('formStatus');

// Participant contact fields
const phoneEl = document.getElementById('phone');
const emailEl = document.getElementById('email');

// Guardian elements
const guardianSection = document.getElementById('guardianSection');
const guardianNameEl = document.getElementById('guardianName');
const guardianPhoneEl = document.getElementById('guardianPhone');
const guardianEmailEl = document.getElementById('guardianEmail');

// Age & program
const ageEl = document.getElementById('age');
const programEl = document.getElementById('program');

// Other fields
const firstNameEl = document.getElementById('firstName');
const lastNameEl = document.getElementById('lastName');
const notesEl = document.getElementById('notes');

// Honeypot
const companyEl = document.getElementById('company');

function isMinor(age) {
  const n = Number(age);
  return Number.isFinite(n) && n < 18;
}

function toggleForAge(ageValue) {
  const minor = isMinor(ageValue);

  // Participant contact disabled for minors, enabled for adults
  phoneEl.disabled = minor;
  emailEl.disabled = minor;

  // Show guardian section for minors
  guardianSection.classList.toggle('hidden', !minor);

  // Required flags
  guardianNameEl.required = minor;
  guardianPhoneEl.required = minor;
  guardianEmailEl.required = minor;

  // For adults, clear any guardian values (keeps Firestore clean)
  if (!minor) {
    guardianNameEl.value = '';
    guardianPhoneEl.value = '';
    guardianEmailEl.value = '';
  }
}

// Initialize on load and on change
toggleForAge(ageEl.value);
ageEl.addEventListener('input', (e) => toggleForAge(e.target.value));

function clearStatus() {
  statusEl.textContent = '';
  statusEl.className = 'status';
}

function setStatusOk(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status ok';
}

function setStatusErr(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status err';
}

function atLeastOne(strA, strB) {
  return (strA && strA.trim().length > 0) || (strB && strB.trim().length > 0);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus();

  // Bot check
  if (companyEl.value) {
    // Silently ignore bots
    return;
  }

  const firstName = firstNameEl.value.trim();
  const lastName  = lastNameEl.value.trim();
  const age       = Number(ageEl.value);
  const program   = programEl.value;
  const phone     = phoneEl.value.trim();
  const email     = emailEl.value.trim();
  const notes     = notesEl.value.trim();

  const minor = isMinor(age);

  // Basic validations
  if (!firstName || !lastName) {
    setStatusErr('Please enter your first and last name.');
    return;
  }
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    setStatusErr('Please enter a valid age between 0 and 120.');
    return;
  }
  if (!program) {
    setStatusErr('Please select a program.');
    return;
  }

  // Contact validation rules
  if (minor) {
    const gName  = guardianNameEl.value.trim();
    const gPhone = guardianPhoneEl.value.trim();
    const gEmail = guardianEmailEl.value.trim();

    if (!gName || !gPhone || !gEmail) {
      setStatusErr('Guardian Name, Phone, and Email are required for minors.');
      return;
    }
  } else {
    // Adult: require at least one of phone or email
    if (!atLeastOne(phone, email)) {
      setStatusErr('Please provide at least one contact method (phone or email).');
      return;
    }
  }

  // Build payload
  const payload = {
    firstName,
    lastName,
    age,
    program,
    // Participant contact captured only if not a minor
    phone: minor ? null : (phone || null),
    email: minor ? null : (email || null),

    // Guardian fields captured only if minor
    guardianName: minor ? guardianNameEl.value.trim() : null,
    guardianPhone: minor ? guardianPhoneEl.value.trim() : null,
    guardianEmail: minor ? guardianEmailEl.value.trim() : null,

    notes: notes || null,
    status: 'new',
    createdAt: serverTimestamp(),
  };

  submitBtn.disabled = true;
  setStatusOk('Submitting…');

  try {
    await addDoc(collection(db, 'programApplications'), payload);
    setStatusOk('Thanks! Your request has been received. We will contact you soon.');

    // Reset form (preserve selected program if you prefer not to clear it)
    form.reset();
    toggleForAge(''); // Reset age-dependent UI
  } catch (err) {
    console.error('Firestore add error:', err);
    setStatusErr('Sorry—something went wrong while saving your request. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});