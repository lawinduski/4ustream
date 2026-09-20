import { initShell } from '../app.js';
import { getFirebase } from '../firebase-init.js';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { icon } from '../icons.js';

document.getElementById('auth-icon').innerHTML = icon('user', 22);

const state = await initShell('account');
const firebase = state.firebaseError ? null : await getFirebase();
const auth = firebase?.auth;
const db = firebase?.db;

const form = document.getElementById('signup-form');
const errorBox = document.getElementById('error');
const submitBtn = document.getElementById('submit-btn');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!auth || !db) { showError('Service temporarily unavailable. Please try again later.'); return; }
  if (password.length < 8) { showError('Password must be at least 8 characters.'); return; }

  submitBtn.disabled = true;
  document.getElementById('submit-icon').innerHTML = icon('loader', 17, 'spin');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user);
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid, name, email, status: 'pending', createdAt: serverTimestamp(),
    });
    location.href = '/account.html';
  } catch (err) {
    showError(String(err?.message || '').includes('email-already') ? 'This email is already registered.' : 'Could not create the account.');
    submitBtn.disabled = false;
    document.getElementById('submit-icon').innerHTML = '';
  }
});
