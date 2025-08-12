// js/volunteer.js
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const form = document.getElementById('volunteerForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

// Fields
const firstNameEl = document.getElementById('firstName');
const lastNameEl  = document.getElementById('lastName');
const emailEl     = document.getElementById('email');
const phoneEl     = document.getElementById('phone');
const availabilityEl = document.getElementById('availability');
const frequencyEl = document.getElementById('frequency');
const notesEl     = document.getElementById('notes');
const consentEl   = document.getElementById('consent');
const companyEl   = document.getElementById('company'); // honeypot

function clearStatus() {
  statusEl.textContent = '';
  statusEl.className = 'status';
}
function setOk(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status ok';
}
function setErr(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status err';
}

function getCheckedInterests() {
  return Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(i => i.value);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus();

  // Bot trap
  if (companyEl.value) return;

  const firstName = firstNameEl.value.trim();
  const lastName  = lastNameEl.value.trim();
  const email     = emailEl.value.trim();
  const phone     = phoneEl.value.trim();
  const availability = availabilityEl.value.trim();
  const frequency = frequencyEl.value;
  const notes     = notesEl.value.trim();
  const consent   = consentEl.checked;
  const interests = getCheckedInterests();

  // Validations
  if (!firstName || !lastName) {
    setErr('Please enter your first and last name.');
    return;
  }
  if (!email) {
    setErr('Please provide an email address.');
    return;
  }
  if (!phone) {
    setErr('Please provide a phone number.');
    return;
  }
  if (!interests.length) {
    setErr('Choose at least one interest area.');
    return;
  }
  if (!availability) {
    setErr('Please tell us when you can volunteer.');
    return;
  }
  if (!frequency) {
    setErr('Please choose your preferred frequency.');
    return;
  }
  if (!consent) {
    setErr('You must agree to be contacted to continue.');
    return;
  }

  const payload = {
    firstName,
    lastName,
    email,
    phone,
    interests,       // array of strings
    availability,    // free text
    frequency,       // enum string
    notes: notes || null,
    consent,         // boolean
    status: 'new',
    createdAt: serverTimestamp(),
  };

  submitBtn.disabled = true;
  setOk('Submitting…');

  try {
    await addDoc(collection(db, 'volunteerApplications'), payload);
    setOk('Thank you! Your volunteer form has been received.');
    form.reset();
  } catch (err) {
    console.error('Firestore add error:', err);
    setErr('Sorry—something went wrong while saving your form. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});