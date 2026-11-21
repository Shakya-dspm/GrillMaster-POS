const CONFIG = {
    currency: 'Rs.',
    taxRate: 0.18,
    key: {
        products: 'grillmaster_products',
        customers: 'grillmaster_customers',
        orders: 'grillmaster_orders',
        orderSeq: 'grillmaster_order_seq'
    }
};

const CATEGORIES = ['Burgers', 'Fries', 'Drinks'];

const SEED_PRODUCTS = [
    { name: 'Classic Beef Burger', category: 'Burgers', price: 950 },
    { name: 'Cheese Burger', category: 'Burgers', price: 1050 },
    { name: 'Chicken Burger', category: 'Burgers', price: 900 },
    { name: 'Double Smash', category: 'Burgers', price: 1450 },
    { name: 'Veggie Burger', category: 'Burgers', price: 800 },
    { name: 'Regular Fries', category: 'Fries', price: 450 },
    { name: 'Cheesy Fries', category: 'Fries', price: 650 },
    { name: 'Loaded Fries', category: 'Fries', price: 750 },
    { name: 'Cola', category: 'Drinks', price: 250 },
    { name: 'Fresh Lemonade', category: 'Drinks', price: 300 },
    { name: 'Chocolate Shake', category: 'Drinks', price: 550 },
    { name: 'Iced Coffee', category: 'Drinks', price: 450 }
];

const SEED_CUSTOMERS = [
    { name: 'Nimal Perera', phone: '0771234567', email: 'nimal@example.com', address: 'Galle Road, Colombo 03' },
    { name: 'Kavindi Silva', phone: '0712345678', email: '', address: 'Temple Road, Panadura' }
];

const TINTS = { Burgers: '#FBE3D0', Fries: '#FCEFC2', Drinks: '#D9ECF7' };

const GLYPHS = {
    Burgers: s => `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><path d="M8 28c0-11 10-18 24-18s24 7 24 18z" fill="#E9A23B"/><rect x="6" y="31" width="52" height="6" rx="3" fill="#5B8C2A"/><rect x="8" y="38" width="48" height="8" rx="4" fill="#6B3A22"/><path d="M8 48h48c0 6-5 9-10 9H18c-5 0-10-3-10-9z" fill="#E9A23B"/></svg>`,
    Fries: s => `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect x="16" y="8" width="6" height="26" rx="2" fill="#F2C94C"/><rect x="25" y="4" width="6" height="30" rx="2" fill="#F2B632"/><rect x="34" y="9" width="6" height="25" rx="2" fill="#F2C94C"/><rect x="43" y="6" width="6" height="28" rx="2" fill="#F2B632"/><path d="M12 30h40l-4 28H16z" fill="#B42318"/></svg>`,
    Drinks: s => `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect x="30" y="2" width="4" height="16" rx="2" fill="#4B5563" transform="rotate(12 32 10)"/><path d="M14 18h36l-4 40H18z" fill="#FFFFFF" stroke="#4B5563" stroke-width="2"/><path d="M16 28h32l-1.6 14H17.6z" fill="#2B6CB0"/></svg>`
};

const glyph = (category, size = 56) => (GLYPHS[category] || GLYPHS.Burgers)(size);
const tint = category => TINTS[category] || TINTS.Burgers;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const money = n => `${CONFIG.currency} ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clampPct = v => Math.min(100, Math.max(0, parseFloat(v) || 0));

const fmtDate = iso => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));

const store = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error('Could not read', key, err);
      return fallback;
    }
  },
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Could not save', key, err);
      toast('Storage is full or unavailable.', 'danger');
    }
  }
};

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${esc(message)}</div>
      <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  $('#toastArea').appendChild(el);
  el.addEventListener('hidden.bs.toast', () => el.remove());
  new bootstrap.Toast(el, { delay: 2500 }).show();
}

/** Generic delete confirmation dialog */
let confirmCallback = null;
function confirmAction(message, callback) {
  $('#confirmMessage').textContent = message;
  confirmCallback = callback;
  modal('confirmModal').show();
}