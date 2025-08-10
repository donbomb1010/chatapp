// js/auth.js
import { auth, db, serverTimestamp } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export const AuthModule = {
  init() {
    this.setupListeners();
    // watch auth state
 onAuthStateChanged(auth, async (user) => {
  const loginModal = document.getElementById('login-modal');
  const profileModal = document.getElementById('profile-setup-modal');
  const appContainer = document.getElementById('app-container');

  if (user) {
    // fetch profile
    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : null;

    if (!profile || !profile.displayName) {
      // Show profile setup if no name
      loginModal.style.display = 'none';
      appContainer.style.display = 'none';
      profileModal.style.display = 'flex';
    } else {
      // Go to main app
      loginModal.style.display = 'none';
      profileModal.style.display = 'none';
      appContainer.style.display = 'flex';
      document.getElementById('current-username').innerText = profile.displayName;
      document.getElementById('current-status').innerText = profile.status || 'Available';
    }

    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user, profile } }));
  } else {
    // No user → show login
    loginModal.style.display = 'flex';
    profileModal.style.display = 'none';
    appContainer.style.display = 'none';
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
});

  },

  setupListeners() {
    const toggle = document.getElementById('toggle-auth-mode');
    let isSignUp = false;
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUp = !isSignUp;
      document.getElementById('auth-title').innerText = isSignUp ? "Sign Up" : "Login";
      document.getElementById('auth-subtitle').innerText = isSignUp ? "Create a new account" : "Welcome back — please sign in.";
      document.getElementById('auth-submit-btn').innerText = isSignUp ? "Sign Up" : "Login";
      toggle.innerHTML = isSignUp ? 'Already have an account? <a href="#">Login</a>' : 'Don\'t have an account? <a href="#">Sign up</a>';
      // store flag
      toggle.dataset.signup = isSignUp ? '1' : '0';
    });

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const isSignUp = document.getElementById('toggle-auth-mode').dataset.signup === '1';

      try {
        if (isSignUp) {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          // create initial profile (no name/status yet)
          await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email,
            createdAt: serverTimestamp()
          });
          // onAuthStateChanged will fire and other modules will handle showing profile setup
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (err) {
        alert("Auth error: " + err.message);
      }
    });

    // profile setup submit
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = auth.currentUser;
      if (!current) return alert('No authenticated user');

      const name = document.getElementById('username').value.trim();
      const status = document.getElementById('user-status').value.trim() || 'Available';
      try {
        await setDoc(doc(db, "users", current.uid), {
          uid: current.uid,
          email: current.email,
          displayName: name,
          status,
          createdAt: serverTimestamp()
        }, { merge: true });
        // notify other modules
        const snap = await getDoc(doc(db, "users", current.uid));
        window.dispatchEvent(new CustomEvent('auth:profileSaved', { detail: snap.data() }));
      } catch (err) {
        alert('Failed to save profile: ' + err.message);
      }
    });

    // optional: sign out when pressing logout (you can add a logout button later)
    window.addEventListener('auth:requestSignOut', async () => {
      await signOut(auth);
    });
  }
};

AuthModule.init();
