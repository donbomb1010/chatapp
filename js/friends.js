// js/friends.js
import { db, serverTimestamp } from './firebase-config.js';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export const FriendsModule = {
  user: null,
  friendsUnsub: null,
  requestsUnsub: null,

  init() {
    // listen for login
    window.addEventListener('auth:login', (e) => {
      this.user = e.detail.user;
      this.startRealtime();
    });
    window.addEventListener('auth:logout', () => {
      this.user = null;
      this.stopRealtime();
      this.clearUI();
    });

    // UI actions
    document.getElementById('send-friend-request-btn').addEventListener('click', () => this.sendFriendRequest());
  },

  startRealtime() {
    if (!this.user) return;
    // friends where ownerId == my uid
    const friendsQ = query(collection(db, "friends"), where("ownerId", "==", this.user.uid));
    if (this.friendsUnsub) this.friendsUnsub();
    this.friendsUnsub = onSnapshot(friendsQ, (snap) => {
      const arr = snap.docs.map(d => d.data());
      this.renderFriends(arr);
    });

    // received friend requests
    const reqQ = query(collection(db, "friendRequests"), where("to", "==", this.user.uid));
    if (this.requestsUnsub) this.requestsUnsub();
    this.requestsUnsub = onSnapshot(reqQ, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.renderReceivedRequests(arr);
    });
  },

  stopRealtime() {
    if (this.friendsUnsub) this.friendsUnsub();
    if (this.requestsUnsub) this.requestsUnsub();
    this.friendsUnsub = null;
    this.requestsUnsub = null;
  },

  clearUI() {
    document.getElementById('friends-list').innerHTML = '';
    document.getElementById('received-requests-list').innerHTML = '';
  },

  async sendFriendRequest() {
    const email = document.getElementById('add-friend-email').value.trim();
    if (!email) return alert('Enter an email');
    if (!this.user) return alert('Not signed in');

    // find user with that email
    const usersRef = collection(db, "users");
    const q = query(usersRef); // small app: fetch all and filter (or use proper index/where("email","==",email))
    const snap = await getDocs(q);
    const found = snap.docs.map(d => d.data()).find(u => u.email === email);
    if (!found) return alert('User not found');

    if (found.uid === this.user.uid) return alert("Can't add yourself");

    await addDoc(collection(db, "friendRequests"), {
      from: this.user.uid,
      to: found.uid,
      name: this.user.email || '',
      createdAt: serverTimestamp()
    });

    alert('Friend request sent');
    document.getElementById('add-friend-email').value = '';
  },

  async acceptRequest(req) {
    // add friend entries for both users
    await addDoc(collection(db, "friends"), {
      ownerId: this.user.uid,
      friendId: req.from,
      friendEmail: req.name || '',
      addedAt: serverTimestamp()
    });
    // delete request
    await deleteDoc(doc(db, "friendRequests", req.id));
  },

  async rejectRequest(reqId) {
    await deleteDoc(doc(db, "friendRequests", reqId));
  },

  renderFriends(list) {
    const container = document.getElementById('friends-list');
    container.innerHTML = '';
    list.forEach(f => {
      const el = document.createElement('div');
      el.className = 'friend-item';
      el.innerHTML = `
        <div class="avatar small">${(f.friendEmail||'U').charAt(0).toUpperCase()}</div>
        <div class="friend-info">
          <span class="friend-name">${f.friendEmail || f.friendId}</span>
        </div>
      `;
      el.addEventListener('click', () => {
        // start private chat
        window.dispatchEvent(new CustomEvent('start:chat', { detail: { id: f.friendId, name: f.friendEmail || f.friendId } }));
      });
      container.appendChild(el);
    });
  },

  renderReceivedRequests(list) {
    const container = document.getElementById('received-requests-list');
    container.innerHTML = '';
    list.forEach(r => {
      const el = document.createElement('div');
      el.className = 'friend-request';
      el.innerHTML = `
        <div class="request-info">
          <div class="avatar small">${(r.name||'U').charAt(0).toUpperCase()}</div>
          <div>
            <div class="request-name">${r.name || r.from}</div>
            <div class="request-time">${new Date(r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt || Date.now()).toLocaleString()}</div>
          </div>
        </div>
        <div class="request-actions">
          <button class="btn-small accept-request">Accept</button>
          <button class="btn-small reject-request">Reject</button>
        </div>
      `;
      el.querySelector('.accept-request').addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.acceptRequest(r);
      });
      el.querySelector('.reject-request').addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.rejectRequest(r.id);
      });
      container.appendChild(el);
    });
  }
};

FriendsModule.init();
