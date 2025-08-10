// js/chat.js
import { db, serverTimestamp } from './firebase-config.js';
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { Utils } from './utils.js';

export const ChatModule = {
  user: null,
  currentChat: null,
  messagesUnsub: null,

  init() {
    window.addEventListener('auth:login', (e) => {
      this.user = e.detail.user;
      this.loadChatsForUser();
    });
    window.addEventListener('auth:logout', () => {
      this.user = null;
      this.clearChatUI();
    });
    window.addEventListener('start:chat', (e) => {
      const other = e.detail;
      this.startPrivateChat(other);
    });

    document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
    document.getElementById('message-input').addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        this.sendMessage();
      }
    });
  },

  async loadChatsForUser() {
    document.getElementById('chats-list').innerHTML = '';
  },

  chatIdFor(a, b) {
    return [a, b].sort().join('_');
  },

  async startPrivateChat(other) {
    if (!this.user) return alert('Not signed in');
    const myId = this.user.uid;
    const otherId = other.id;
    const chatId = this.chatIdFor(myId, otherId);
    this.currentChat = { id: chatId, participant: other };

    await setDoc(doc(db, "chats", chatId), {
      id: chatId,
      type: 'private',
      participants: [myId, otherId],
      createdAt: serverTimestamp()
    }, { merge: true });

    document.getElementById('empty-chat').style.display = 'none';
    document.getElementById('active-chat').style.display = 'flex';
    document.getElementById('chat-name').textContent = other.name || other.id;
    document.getElementById('chat-status').textContent = other.status || 'Online';

    this.listenMessages(chatId);
  },

  listenMessages(chatId) {
    if (this.messagesUnsub) this.messagesUnsub();
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    this.messagesUnsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.renderMessages(msgs);
    });
  },

  renderMessages(msgs) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    msgs.forEach(m => {
      const isMe = m.sender === (this.user && this.user.uid);
      const el = document.createElement('div');
      el.className = `message ${isMe ? 'message-outgoing' : 'message-incoming'}`;
      const timeStr = m.timestamp ? Utils.formatDateTime(m.timestamp) : '';
      el.innerHTML = `
        <div class="message-info">
          <span class="message-sender">${isMe ? 'You' : (m.senderName || m.sender)}</span>
          <span class="message-time">${timeStr}</span>
        </div>
        <div class="message-content">${m.text ? escapeHtml(m.text) : ''}</div>
      `;
      container.appendChild(el);
    });

    // Keep chat scrolled to bottom
    container.scrollTop = container.scrollHeight;
  },

  async sendMessage() {
    const input = document.getElementById('message-input');
    const txt = input.value.trim();
    if (!txt || !this.currentChat || !this.user) return;
    const msg = {
      sender: this.user.uid,
      senderName: this.user.email || '',
      text: txt,
      timestamp: serverTimestamp()
    };
    await addDoc(collection(db, "chats", this.currentChat.id, "messages"), msg);
    input.value = '';
  },

  clearChatUI() {
    document.getElementById('messages-container').innerHTML = '';
    document.getElementById('empty-chat').style.display = 'flex';
    document.getElementById('active-chat').style.display = 'none';
    if (this.messagesUnsub) this.messagesUnsub();
  }
};

function escapeHtml(text = '') {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

ChatModule.init();