// js/utils.js
export const Utils = {
  formatDateTime: function(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  shortText: function(text, n=100) {
    if (!text) return '';
    return text.length > n ? text.substring(0, n) + '...' : text;
  }
};
