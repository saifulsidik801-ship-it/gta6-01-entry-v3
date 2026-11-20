// Save slots in localStorage.
export class Save {
  constructor() { this.key = 'marisol-bay-save-v3'; }
  read() {
    try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { return null; }
  }
  write(slot, data) {
    try {
      const all = this.read() || {};
      all[slot] = { ...data, savedAt: new Date().toISOString() };
      localStorage.setItem(this.key, JSON.stringify(all));
      return true;
    } catch (e) { return false; }
  }
  slots() {
    const all = this.read() || {};
    return [1, 2, 3].map((n) => all[n] || null);
  }
}
