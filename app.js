const CONFIG = {
    currency: 'Rs.',
    taxRate: 0.18,
    keys: {
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

let confirmCallback = null;
function confirmAction(message, callback) {
    $('#confirmMessage').textContent = message;
    confirmCallback = callback;
    modal('confirmModal').show();
}

const state = {
    products: [],
    customers: [],
    orders: [],
    cart: [],
    category: 'All',
    search: '',
    statusFilter: 'All'
};

let orderDraft = null;

function loadState() {
    let products = store.load(CONFIG.keys.products, null);
    if (!Array.isArray(products)) {
        products = SEED_PRODUCTS.map(p => ({ id: uid(), ...p }));
        store.save(CONFIG.keys.products, products);
    }
    state.products = products;

    let customers = store.load(CONFIG.keys.customers, null);
    if (!Array.isArray(customers)) {
        customers = SEED_CUSTOMERS.map(c => ({ id: uid(), ...c }));
        store.save(CONFIG.keys.customers, customers);
    }
    state.customers = customers;

    const orders = store.load(CONFIG.keys.orders, []);
    state.orders = Array.isArray(orders) ? orders : [];
}

const saveProducts = () => store.save(CONFIG.keys.products, state.products);
const saveCustomers = () => store.save(CONFIG.keys.customers, state.customers);
const saveOrders = () => store.save(CONFIG.keys.orders, state.orders);

const orderNumberFor = n => `ORD-${String(n).padStart(4, '0')}`;

const peekOrderNumber = () => orderNumberFor((store.load(CONFIG.keys.orderSeq, 0) || 0) + 1);

function nextOrderNumber() {
    const next = (store.load(CONFIG.keys.orderSeq, 0) || 0) + 1;
    store.save(CONFIG.keys.orderSeq, next);
    return orderNumberFor(next);
}

function calcTotals(items, discountPct) {
    const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
    const discount = round2(subtotal * clampPct(discountPct) / 100);
    const taxable = subtotal - discount;
    const tax = round2(taxable * CONFIG.taxRate);
    const total = round2(taxable + tax);
    return { subtotal, discount, tax, total };
}

function showView(name) {
    $$('.view').forEach(v => v.classList.toggle('d-none', v.id !== `view-${name}`));
    $$('#mainNav .side-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
    $('#cartFab').classList.toggle('d-none', name !== 'pos');
    window.scrollTo({ top: 0 });
}

function bindNavigation() {
    document.addEventListener('click', e => {
        const link = e.target.closest('[data-view]');
        if (!link) return;
        e.preventDefault();
        showView(link.dataset.view);
    });

    $('#newOrderBtn').addEventListener('click', () => showView('pos'));
    $('#confirmYes').addEventListener('click', () => {
        modal('confirmModal').hide();
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });
}

function renderToday() {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' });
    const rest = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    $('#todayLabel').textContent = `${weekday}, ${rest} · Counter 1`;
}

function renderCategories() {
    const pills = ['All', ...CATEGORIES].map(cat => {
        const count = cat === 'All' ? state.products.length : state.products.filter(p => p.category === cat).length;
        const active = state.category === cat ? ' active' : '';
        return `<button type="button" class="cat-pill${active}" data-category="${cat}" aria-pressed="${state.category === cat}">${cat} &middot; ${count}</button>`;
    });
    $('#categoryFilter').innerHTML = pills.join('');
}

function renderMenu() {
    renderCategories();

    const term = state.search.trim().toLowerCase();
    const list = state.products.filter(p =>
        (state.category === 'All' || p.category === state.category) &&
        p.name.toLowerCase().includes(term)
    );

    $('#menuGrid').innerHTML = list.length
        ? list.map(p => `
        <div class="col">
          <div class="card menu-card" data-id="${p.id}">
            <div class="menu-tile" style="background:${tint(p.category)}">${glyph(p.category, 56)}</div>
            <div class="menu-body">
              <div class="menu-name">${esc(p.name)}</div>
              <div class="d-flex align-items-center justify-content-between">
                <div class="menu-price">${money(p.price)}</div>
                <button type="button" class="add-btn" aria-label="Add ${esc(p.name)} to order"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
              </div>
            </div>
          </div>
        </div>`).join('')
        : `<div class="col-12"><div class="alert alert-light border text-center mb-0">No items found.</div></div>`;
}

function bindMenu() {
    // Category filter
    $('#categoryFilter').addEventListener('click', e => {
        const btn = e.target.closest('[data-category]');
        if (!btn) return;
        state.category = btn.dataset.category;
        renderMenu();
    });

    // Search
    $('#menuSearch').addEventListener('input', e => {
        state.search = e.target.value;
        renderMenu();
    });

    $('#menuGrid').addEventListener('click', e => {
        const card = e.target.closest('.menu-card');
        if (card) addToCart(card.dataset.id);
    });
}

function addToCart(productId) {
    const line = state.cart.find(l => l.productId === productId);
    if (line) line.qty += 1;
    else state.cart.push({ productId, qty: 1 });
    renderCart();
}

function renderCart() {
    // Drop lines whose product has been deleted
    state.cart = state.cart.filter(l => state.products.some(p => p.id === l.productId));

    const box = $('#cartItems');
    if (!state.cart.length) {
        box.innerHTML = `
      <div class="text-center text-muted-gm py-4">
        <i class="bi bi-cart3 fs-1"></i>
        <p class="mb-0">Cart is empty.<br>Tap an item to add it.</p>
      </div>`;
    } else {
        box.innerHTML = state.cart.map(line => {
            const p = state.products.find(x => x.id === line.productId);
            return `
        <div class="cart-line">
          <div class="line-info">
            <div class="fw-semibold small">${esc(p.name)}</div>
            <div class="text-muted-gm small">${money(p.price)} each</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="qty-btn" data-action="dec" data-id="${p.id}" aria-label="Decrease quantity of ${esc(p.name)}">&minus;</button>
            <span class="fw-semibold small qty-num">${line.qty}</span>
            <button type="button" class="qty-btn" data-action="inc" data-id="${p.id}" aria-label="Increase quantity of ${esc(p.name)}">+</button>
          </div>
          <div class="line-total">${money(p.price * line.qty)}</div>
        </div>`;
        }).join('');
    }
    renderCartTotals();
}

function cartItemsDetailed() {
    return state.cart.map(l => {
        const p = state.products.find(x => x.id === l.productId);
        return { productId: p.id, name: p.name, price: p.price, qty: l.qty };
    });
}

function renderCartTotals() {
    const pct = clampPct($('#discountInput').value);
    const t = calcTotals(cartItemsDetailed(), pct);
    $('#sumSubtotal').textContent = money(t.subtotal);
    $('#sumDiscount').textContent = t.discount ? `− ${money(t.discount)}` : money(0);
    $('#sumTax').textContent = money(t.tax);
    $('#sumTotal').textContent = money(t.total);
    $('#discountLabel').textContent = `Discount (${pct}%)`;
    $('#taxLabel').textContent = `Tax (${Math.round(CONFIG.taxRate * 100)}%)`;
    $('#cartBadge').textContent = state.cart.reduce((n, l) => n + l.qty, 0);
}

function renderOrderNo() {
    $$('.js-order-no').forEach(el => { el.textContent = peekOrderNumber(); });
}

function bindCart() {
    $('#cartItems').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const line = state.cart.find(l => l.productId === btn.dataset.id);
        if (!line) return;

        if (btn.dataset.action === 'inc') line.qty += 1;
        if (btn.dataset.action === 'dec') line.qty -= 1;
        if (line.qty < 1) state.cart = state.cart.filter(l => l !== line); // minus at 1 removes the line
        renderCart();
    });

    $('#discountInput').addEventListener('input', renderCartTotals);
    $('#clearCartBtn').addEventListener('click', clearCart);
    $('#checkoutBtn').addEventListener('click', checkout);
}

function clearCart() {
    state.cart = [];
    $('#discountInput').value = 0;
    renderCart();
}

function checkout() {
    if (!state.cart.length) {
        toast('Add at least one item first.', 'warning');
        return;
    }

    const items = cartItemsDetailed();
    const discountPct = clampPct($('#discountInput').value);
    const customerId = $('#cartCustomer').value;
    const customer = state.customers.find(c => c.id === customerId);

    const order = {
        id: uid(),
        number: nextOrderNumber(),
        createdAt: new Date().toISOString(),
        customerId: customer ? customer.id : '',
        customerName: customer ? customer.name : 'Walk-in Customer',
        items,
        discountPct,
        ...calcTotals(items, discountPct),
        payment: $('#cartPayment').value,
        status: 'Completed'
    };

    state.orders.unshift(order);
    saveOrders();
    clearCart();
    renderOrderNo();
    renderOrders();
    renderCustomers();

    const drawer = bootstrap.Offcanvas.getInstance($('#cartPanel'));
    if (drawer) drawer.hide();

    toast(`Order ${order.number} placed.`);
    showReceipt(order.id);
}

function renderProducts() {
  const tbody = $('#productsTable');
  if (!state.products.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-gm py-4">No products yet. Click "Add Product".</td></tr>`;
  } else {
    tbody.innerHTML = state.products.map(p => `
      <tr>
        <td><span class="mini-tile" style="background:${tint(p.category)}">${glyph(p.category, 26)}</span>${esc(p.name)}</td>
        <td><span class="badge text-bg-secondary">${esc(p.category)}</span></td>
        <td class="text-end">${money(p.price)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${p.id}" aria-label="Edit ${esc(p.name)}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}" aria-label="Delete ${esc(p.name)}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }
  renderMenu();
  renderCart();
  populateOrderEditProducts();
}

function openProductModal(id) {
  const form = $('#productForm');
  form.reset();
  form.classList.remove('was-validated');

  const p = state.products.find(x => x.id === id);
  $('#productModalTitle').textContent = p ? 'Edit Product' : 'Add Product';
  $('#productId').value       = p ? p.id : '';
  $('#productName').value     = p ? p.name : '';
  $('#productCategory').value = p ? p.category : 'Burgers';
  $('#productPrice').value    = p ? p.price : '';
  modal('productModal').show();
}

function bindProducts() {
  $('#addProductBtn').addEventListener('click', () => openProductModal());

  $('#productsTable').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === 'edit') openProductModal(id);
    if (btn.dataset.action === 'delete') {
      const p = state.products.find(x => x.id === id);
      confirmAction(`Delete "${p.name}"? Past orders keep their records.`, () => {
        state.products = state.products.filter(x => x.id !== id);
        state.cart = state.cart.filter(l => l.productId !== id);
        saveProducts();
        renderProducts();
        toast('Product deleted.');
      });
    }
  });

  $('#productForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = $('#productId').value;
    const data = {
      name: $('#productName').value.trim(),
      category: $('#productCategory').value,
      price: round2(parseFloat($('#productPrice').value))
    };

    if (id) {
      const i = state.products.findIndex(p => p.id === id);
      state.products[i] = { ...state.products[i], ...data };
      toast('Product updated.');
    } else {
      state.products.push({ id: uid(), ...data });
      toast('Product added.');
    }

    saveProducts();
    renderProducts();
    modal('productModal').hide();
  });
}