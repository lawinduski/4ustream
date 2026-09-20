import { initShell } from '../app.js';
import { getFirebase } from '../firebase-init.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { icon } from '../icons.js';

document.getElementById('auth-icon').innerHTML = icon('login', 22);

const state = await initShell('account');
const firebase = state.firebaseError ? null : await getFirebase();
const auth = firebase?.auth;

const form = document.getElementById('login-form');
const errorBox = document.getElementById('error');
const submitBtn = document.getElementById('submit-btn');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  submitBtn.disabled = true;
  document.getElementById('submit-icon').innerHTML = icon('loader', 17, 'spin');
  if (!auth) { showError('Service temporarily unavailable. Please try again later.'); submitBtn.disabled = false; return; }
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      showError('Please verify your email before continuing.');
      submitBtn.disabled = false;
      document.getElementById('submit-icon').innerHTML = '';
      return;
    }
    location.href = '/';
  } catch {
    showError('Email or password is incorrect.');
    submitBtn.disabled = false;
    document.getElementById('submit-icon').innerHTML = '';
  }
});

document.getElementById('forgot-btn').addEventListener('click', async () => {
  if (!auth) { showError('Service temporarily unavailable. Please try again later.'); return; }
  const email = document.getElementById('email').value;
  if (!email) { showError('Enter your email first.'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showError('Password reset email sent.');
  } catch {
    showError('Could not send reset email.');
  }
});
