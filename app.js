const CONFIG = {
    currency: 'Rs.',
    taxRate: 0.18,
    keys: {
        products: 'grillmaster_products',
        customers: 'grillmaster_customers',
        orders: 'grillmaster_orders',
        orderSeq: 'grillmaster_order_seq',
        inventory: 'grillmaster_inventory',
        stockMovements: 'grillmaster_stock_movements',
        employees: 'grillmaster_employees',
        settings: 'grillmaster_settings'
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

const TINTS = { Burgers: 'var(--surface-panel)', Fries: 'var(--surface-panel)', Drinks: 'var(--surface-panel)' };

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
function confirmAction(message, callback, actionLabel = 'Delete', danger = true) {
    $('#confirmMessage').textContent = message;
    const confirmButton = $('#confirmYes');
    confirmButton.textContent = actionLabel;
    confirmButton.className = danger ? 'btn btn-danger' : 'btn btn-brand';
    confirmCallback = callback;
    modal('confirmModal').show();
}

const state = {
    products: [],
    customers: [],
    orders: [],
    inventory: [],
    stockMovements: [],
    employees: [],
    cart: [],
    category: 'All',
    search: '',
    statusFilter: 'All'
};

let orderDraft = null;

function loadState() {
    const settings = store.load(CONFIG.keys.settings, null);
    if (settings) {
        CONFIG.currency = settings.currency || CONFIG.currency;
        CONFIG.taxRate = (settings.taxRate ?? 18) / 100;
    }
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

    let inventory = store.load(CONFIG.keys.inventory, null);
    if (!Array.isArray(inventory)) {
        inventory = [];
        store.save(CONFIG.keys.inventory, inventory);
    }
    state.inventory = inventory;

    const stockMovements = store.load(CONFIG.keys.stockMovements, []);
    state.stockMovements = Array.isArray(stockMovements) ? stockMovements : [];

    const employees = store.load(CONFIG.keys.employees, []);
    state.employees = Array.isArray(employees) ? employees : [];
}

const saveProducts = () => store.save(CONFIG.keys.products, state.products);
const saveCustomers = () => store.save(CONFIG.keys.customers, state.customers);
const saveOrders = () => store.save(CONFIG.keys.orders, state.orders);
const saveInventory = () => store.save(CONFIG.keys.inventory, state.inventory);
const saveStockMovements = () => store.save(CONFIG.keys.stockMovements, state.stockMovements);
const saveEmployees = () => store.save(CONFIG.keys.employees, state.employees);

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

function closeCashierMenu() {
    $('#cashierMenu').classList.add('d-none');
    $('#cashierMenuBtn').setAttribute('aria-expanded', 'false');
}

function showView(name) {
    const view = $(`#view-${name}`);
    const requiredPermission = view?.dataset.requiredPermission;
    if (requiredPermission && !GMAuth.requirePermission(requiredPermission)) {
        toast('You do not have permission to access this page.', 'danger');
        showView('pos');
        return;
    }
    if (!GMAuth.isAuthenticated()) {
        showLogin();
        return;
    }
    $$('.view').forEach(v => v.classList.toggle('d-none', v.id !== `view-${name}`));
    $$('#mainNav .side-link').forEach(l => {
        if (l.classList.contains('cashier-direct')) {
            l.classList.toggle('active', l.dataset.view === name);
        }
    });
    $('#cashierMenuBtn').classList.toggle(
        'active',
        ['pos', 'products', 'customers', 'orders'].includes(name)
    );
    $$('#cashierMenu [data-view]').forEach(item =>
        item.classList.toggle('active', item.dataset.view === name)
    );
    closeCashierMenu();
    $('#cartFab').classList.toggle('d-none', name !== 'pos');
    if (name === 'management') renderManagementDashboard();
    if (name === 'sales') renderSalesReport();
    if (name === 'employees') renderEmployees();
    if (name === 'inventory') renderInventory();
    if (name === 'users') renderUsers();
    if (name === 'settings') renderSettings();
    window.scrollTo({ top: 0 });
}

function bindNavigation() {
    $('#cashierMenuBtn').addEventListener('click', event => {
        event.stopPropagation();
        const menu = $('#cashierMenu');
        const opening = menu.classList.contains('d-none');
        menu.classList.toggle('d-none', !opening);
        $('#cashierMenuBtn').setAttribute('aria-expanded', String(opening));
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('#cashierMenu') && !event.target.closest('#cashierMenuBtn')) {
            closeCashierMenu();
        }
    });

    document.addEventListener('click', e => {
        const link = e.target.closest('[data-view]');
        if (!link) return;
        e.preventDefault();
        const permission = link.dataset.permission;
        if (!permission || GMAuth.requirePermission(permission)) {
            showView(link.dataset.view);
        } else {
            toast('You do not have permission to access this page.', 'danger');
        }
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
            <div class="menu-tile">${glyph(p.category, 56)}</div>
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

    $('#discountInput').addEventListener('input', e => {
        const pct = clampPct(e.target.value);
        if (parseFloat(e.target.value) !== pct) e.target.value = pct;
        renderCartTotals();
    });
    $('#clearCartBtn').addEventListener('click', clearCart);
    $('#checkoutBtn').addEventListener('click', checkout);
}

function getInventoryItem(productId) {
    return state.inventory.find(item => item.productId === productId);
}

function initializeInventory() {
    const existingIds = new Set(state.inventory.map(item => item.productId));
    const settings = getSettings();
    state.products.forEach(product => {
        if (!existingIds.has(product.id)) {
            state.inventory.push({
                productId: product.id,
                quantity: 0,
                minimumStock: settings.defaultMinimumStock ?? 5,
                unitPrice: product.price
            });
        }
    });
    saveInventory();
}

function recordStockMovement(productId, type, quantity, reference, note) {
    const product = state.products.find(item => item.id === productId);
    state.stockMovements.unshift({
        id: uid(),
        productId,
        productName: product ? product.name : 'Unknown product',
        type,
        quantity: Number(quantity),
        reference,
        note,
        createdAt: new Date().toISOString()
    });
    state.stockMovements = state.stockMovements.slice(0, 500);
    saveStockMovements();
}

function validateAndDeductStock(items, orderNumber) {
    initializeInventory();
    const shortages = items.map(item => {
        const stock = getInventoryItem(item.productId);
        return { item, available: stock ? Number(stock.quantity) : 0 };
    }).filter(entry => entry.available < entry.item.qty);
    if (shortages.length) {
        return `Insufficient stock: ${shortages.map(entry => entry.item.name).join(', ')}`;
    }
    items.forEach(item => {
        const stock = getInventoryItem(item.productId);
        stock.quantity = Number(stock.quantity) - Number(item.qty);
        recordStockMovement(item.productId, 'Sale', -item.qty, orderNumber, 'Completed order sale');
    });
    saveInventory();
    return null;
}

function restockOrder(order, reason) {
    if (!order || order.stockDeducted !== true) return;
    initializeInventory();
    order.items.forEach(item => {
        const stock = getInventoryItem(item.productId);
        if (stock) stock.quantity = Number(stock.quantity) + Number(item.qty);
        recordStockMovement(item.productId, 'Return', item.qty, order.number, reason);
    });
    order.stockDeducted = false;
    saveInventory();
}

function clearCart() {
    state.cart = [];
    $('#discountInput').value = 0;
    renderCart();
}

function checkout() {
    if (!GMAuth.requirePermission('checkout')) {
        toast('You do not have permission to process checkout.', 'danger');
        return;
    }
    if (!state.cart.length) {
        toast('Add at least one item first.', 'warning');
        return;
    }

    const items = cartItemsDetailed();
    const prospectiveNumber = peekOrderNumber();
    const stockError = validateAndDeductStock(items, prospectiveNumber);
    if (stockError) {
        toast(stockError, 'danger');
        return;
    }
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
        status: 'Completed',
        stockDeducted: true
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
    const canManageInventory = GMAuth.requirePermission('manage_inventory');
    if (!state.products.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-gm py-4">No products yet. Click "Add Product".</td></tr>`;
    } else {
        tbody.innerHTML = state.products.map(p => `
      <tr>
        <td><span class="mini-tile">${glyph(p.category, 26)}</span>${esc(p.name)}</td>
        <td><span class="badge text-bg-secondary">${esc(p.category)}</span></td>
        <td class="text-end">${money(p.price)}</td>
        ${canManageInventory
            ? `<td class="text-end">
                <button class="btn btn-sm btn-outline-gm" data-action="edit" data-id="${p.id}" aria-label="Edit ${esc(p.name)}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}" aria-label="Delete ${esc(p.name)}"><i class="bi bi-trash"></i></button>
              </td>`
            : '<td class="text-end text-muted-gm">View only</td>'}
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
    $('#productId').value = p ? p.id : '';
    $('#productName').value = p ? p.name : '';
    $('#productCategory').value = p ? p.category : 'Burgers';
    $('#productPrice').value = p ? p.price : '';
    modal('productModal').show();
}

function bindProducts() {
    $('#addProductBtn').addEventListener('click', () => {
        if (!GMAuth.requirePermission('manage_inventory')) {
            toast('Only managers and administrators can manage inventory.', 'danger');
            return;
        }
        openProductModal();
    });

    $('#productsTable').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;

        if (btn.dataset.action === 'edit') {
            if (!GMAuth.requirePermission('manage_inventory')) {
                toast('Only managers and administrators can manage inventory.', 'danger');
                return;
            }
            openProductModal(id);
        }
        if (btn.dataset.action === 'delete') {
            if (!GMAuth.requirePermission('manage_inventory')) {
                toast('Only managers and administrators can manage inventory.', 'danger');
                return;
            }
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
        if (!GMAuth.requirePermission('manage_inventory')) {
            toast('Only managers and administrators can manage inventory.', 'danger');
            return;
        }
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

function renderCustomers() {
    const tbody = $('#customersTable');
    if (!state.customers.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-gm py-4">No customers yet. Click "Add Customer".</td></tr>`;
    } else {
        tbody.innerHTML = state.customers.map(c => {
            const orderCount = state.orders.filter(o => o.customerId === c.id).length;
            return `
        <tr>
          <td class="fw-semibold">${esc(c.name)}</td>
          <td>${esc(c.phone)}</td>
          <td>${esc(c.email) || '<span class="text-muted-gm">-</span>'}</td>
          <td>${esc(c.address) || '<span class="text-muted-gm">-</span>'}</td>
          <td class="text-center"><span class="badge text-bg-light border">${orderCount}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-gm" data-action="edit" data-id="${c.id}" aria-label="Edit ${esc(c.name)}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${c.id}" aria-label="Delete ${esc(c.name)}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
        }).join('');
    }
    populateCustomerSelects();
}

function populateCustomerSelects() {
    const options = `<option value="">Walk-in Customer</option>` +
        state.customers.map(c => `<option value="${c.id}">${esc(c.name)} (${esc(c.phone)})</option>`).join('');

    const cartSelect = $('#cartCustomer');
    const previous = cartSelect.value;
    cartSelect.innerHTML = options;
    cartSelect.value = state.customers.some(c => c.id === previous) ? previous : '';
}

function openCustomerModal(id) {
  const form = $('#customerForm');
  form.reset();
  form.classList.remove('was-validated');

  const c = state.customers.find(x => x.id === id);
  $('#customerModalTitle').textContent = c ? 'Edit Customer' : 'Add Customer';
  $('#customerId').value      = c ? c.id : '';
  $('#customerName').value    = c ? c.name : '';
  $('#customerPhone').value   = c ? c.phone : '';
  $('#customerEmail').value   = c ? c.email : '';
  $('#customerAddress').value = c ? c.address : '';
  modal('customerModal').show();
}

function bindCustomers() {
  $('#addCustomerBtn').addEventListener('click', () => openCustomerModal());

  $('#customersTable').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.action === 'edit') openCustomerModal(id);
    if (btn.dataset.action === 'delete') {
      const c = state.customers.find(x => x.id === id);
      confirmAction(`Delete customer "${c.name}"? Their past orders will be kept.`, () => {
        state.customers = state.customers.filter(x => x.id !== id);
        saveCustomers();
        renderCustomers();
        renderOrders();
        toast('Customer deleted.');
      });
    }
  });

  $('#customerForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = $('#customerId').value;
    const data = {
      name: $('#customerName').value.trim(),
      phone: $('#customerPhone').value.trim(),
      email: $('#customerEmail').value.trim(),
      address: $('#customerAddress').value.trim()
    };

    if (id) {
      const i = state.customers.findIndex(c => c.id === id);
      state.customers[i] = { ...state.customers[i], ...data };
      toast('Customer updated.');
    } else {
      state.customers.push({ id: uid(), ...data });
      toast('Customer added.');
    }

    saveCustomers();
    renderCustomers();
    renderOrders();
    modal('customerModal').hide();
  });
}

const STATUS_BADGE = { Pending: 'text-bg-warning', Completed: 'text-bg-success', Cancelled: 'text-bg-secondary' };

function orderCustomerName(o) {
  const c = state.customers.find(x => x.id === o.customerId);
  return c ? c.name : o.customerName;
}

function renderOrders() {
  const list = state.orders.filter(o => state.statusFilter === 'All' || o.status === state.statusFilter);
  const tbody = $('#ordersTable');
  const canManageOrders = GMAuth.requirePermission('manage_orders');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted-gm py-4">No orders to show.</td></tr>`;
  } else {
    tbody.innerHTML = list.map(o => `
      <tr>
        <td class="fw-semibold">${esc(o.number)}</td>
        <td>${fmtDate(o.createdAt)}</td>
        <td>${esc(orderCustomerName(o))}</td>
        <td class="text-center">${o.items.reduce((n, i) => n + i.qty, 0)}</td>
        <td class="text-end">${money(o.total)}</td>
        <td>${esc(o.payment)}</td>
        <td><span class="badge ${STATUS_BADGE[o.status] || 'text-bg-light'}">${esc(o.status)}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-gm" data-action="view" data-id="${o.id}" aria-label="View ${esc(o.number)}"><i class="bi bi-eye"></i></button>
          ${canManageOrders
              ? `<button class="btn btn-sm btn-outline-gm" data-action="edit" data-id="${o.id}" aria-label="Edit ${esc(o.number)}"><i class="bi bi-pencil"></i></button>
                 <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${o.id}" aria-label="Delete ${esc(o.number)}"><i class="bi bi-trash"></i></button>`
              : ''}
        </td>
      </tr>`).join('');
  }

  $('#statTotal').textContent   = state.orders.length;
  $('#statPending').textContent = state.orders.filter(o => o.status === 'Pending').length;
  $('#statRevenue').textContent = money(
    state.orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total, 0)
  );
}

function receiptHtml(o) {
  const rows = o.items.map(i => `
    <tr>
      <td>${esc(i.name)}<br><small>${i.qty} x ${money(i.price)}</small></td>
      <td class="text-end align-top">${money(i.price * i.qty)}</td>
    </tr>`).join('');

  return `
    <div class="receipt">
      <div class="text-center">
        <h5 class="mb-0">GRILLMASTER</h5>
        <small>Order ${esc(o.number)}</small><br>
        <small>${fmtDate(o.createdAt)}</small>
      </div>
      <hr>
      <div>Customer: ${esc(orderCustomerName(o))}</div>
      <div>Payment: ${esc(o.payment)}</div>
      <div>Status: ${esc(o.status)}</div>
      <hr>
      <table class="w-100"><tbody>${rows}</tbody></table>
      <hr>
      <div class="d-flex justify-content-between"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      <div class="d-flex justify-content-between"><span>Discount (${o.discountPct}%)</span><span>- ${money(o.discount)}</span></div>
      <div class="d-flex justify-content-between"><span>Tax (${Math.round(CONFIG.taxRate * 100)}%)</span><span>${money(o.tax)}</span></div>
      <div class="d-flex justify-content-between fw-bold fs-5 mt-1"><span>TOTAL</span><span>${money(o.total)}</span></div>
      <hr>
      <div class="text-center">Thank you! Come again.</div>
    </div>`;
}

function showReceipt(id) {
  const o = state.orders.find(x => x.id === id);
  if (!o) return;
  $('#orderViewTitle').textContent = `Order ${o.number}`;
  $('#receiptContent').innerHTML = receiptHtml(o);
  modal('orderViewModal').show();
}

function populateOrderEditProducts() {
  $('#oeAddProduct').innerHTML = state.products
    .map(p => `<option value="${p.id}">${esc(p.name)} - ${money(p.price)}</option>`).join('');
}

function openOrderEdit(id) {
  if (!GMAuth.requirePermission('manage_orders')) {
    toast('Only managers and administrators can edit orders.', 'danger');
    return;
  }
  const o = state.orders.find(x => x.id === id);
  if (!o) return;
  orderDraft = structuredClone(o);

  const customerExists = !o.customerId || state.customers.some(c => c.id === o.customerId);
  $('#oeCustomer').innerHTML =
    `<option value="">Walk-in Customer</option>` +
    state.customers.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('') +
    (customerExists ? '' : `<option value="__deleted">${esc(o.customerName)} (deleted)</option>`);
  $('#oeCustomer').value = customerExists ? o.customerId : '__deleted';

  $('#orderEditTitle').textContent = `Edit ${o.number}`;
  $('#oeId').value       = o.id;
  $('#oeStatus').value   = o.status;
  $('#oePayment').value  = o.payment;
  $('#oeDiscount').value = o.discountPct;

  populateOrderEditProducts();
  renderOrderEditItems();
  modal('orderEditModal').show();
}

function renderOrderEditItems() {
  $('#oeItems').innerHTML = orderDraft.items.length
    ? orderDraft.items.map((it, idx) => `
        <tr>
          <td>${esc(it.name)}</td>
          <td class="text-end">${money(it.price)}</td>
          <td><input type="number" class="form-control form-control-sm" style="text-align: center" min="1" step="1" value="${it.qty}" data-idx="${idx}" aria-label="Quantity for ${esc(it.name)}"></td>
          <td class="text-end" data-line-total="${idx}">${money(it.price * it.qty)}</td>
          <td class="text-end"><button type="button" class="btn btn-sm text-danger" data-remove="${idx}" aria-label="Remove ${esc(it.name)}"><i class="bi bi-x-lg"></i></button></td>
        </tr>`).join('')
    : `<tr><td colspan="5" class="text-center text-muted-gm py-3">No items. Add one below.</td></tr>`;
  updateOrderEditTotals();
}

function updateOrderEditTotals() {
    orderDraft.discountPct = clampPct($('#oeDiscount').value);
    const t = calcTotals(orderDraft.items, orderDraft.discountPct);

    $$('#oeItems [data-line-total]').forEach(td => {
        const it = orderDraft.items[Number(td.dataset.lineTotal)];
        td.textContent = money(it.price * it.qty);
    });

    $('#oeSubtotal').textContent = money(t.subtotal);
    $('#oeDiscountAmt').textContent = t.discount ? `− ${money(t.discount)}` : money(0);
    $('#oeTax').textContent = money(t.tax);
    $('#oeTotal').textContent = money(t.total);
}

function bindOrders() {
    $('#orderStatusFilter').addEventListener('change', e => {
        state.statusFilter = e.target.value;
        renderOrders();
    });

    $('#ordersTable').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;

        if (btn.dataset.action === 'view') showReceipt(id);
        if (btn.dataset.action === 'edit') {
            if (!GMAuth.requirePermission('manage_orders')) {
                toast('Only managers and administrators can edit orders.', 'danger');
                return;
            }
            openOrderEdit(id);
        }
        if (btn.dataset.action === 'delete') {
            if (!GMAuth.requirePermission('manage_orders')) {
                toast('Only managers and administrators can delete orders.', 'danger');
                return;
            }
            const o = state.orders.find(x => x.id === id);
            confirmAction(`Delete order ${o.number}? This cannot be undone.`, () => {
                if (o.status === 'Completed') restockOrder(o, 'Deleted completed order');
                state.orders = state.orders.filter(x => x.id !== id);
                saveOrders();
                renderOrders();
                renderCustomers();
                toast('Order deleted.');
            });
        }
    });

    $('#printReceiptBtn').addEventListener('click', () => window.print());

    $('#oeItems').addEventListener('input', e => {
        const input = e.target.closest('input[data-idx]');
        if (!input) return;
        const qty = Math.max(1, parseInt(input.value, 10) || 1);
        orderDraft.items[Number(input.dataset.idx)].qty = qty;
        updateOrderEditTotals();
    });

    $('#oeItems').addEventListener('click', e => {
        const btn = e.target.closest('[data-remove]');
        if (!btn) return;
        orderDraft.items.splice(Number(btn.dataset.remove), 1);
        renderOrderEditItems();
    });

    $('#oeAddBtn').addEventListener('click', () => {
        const p = state.products.find(x => x.id === $('#oeAddProduct').value);
        if (!p) return;
        const existing = orderDraft.items.find(i => i.productId === p.id);
        if (existing) existing.qty += 1;
        else orderDraft.items.push({ productId: p.id, name: p.name, price: p.price, qty: 1 });
        renderOrderEditItems();
    });

    $('#oeDiscount').addEventListener('input', updateOrderEditTotals);

    $('#orderEditForm').addEventListener('submit', e => {
        e.preventDefault();
        if (!GMAuth.requirePermission('manage_orders')) {
            toast('Only managers and administrators can edit orders.', 'danger');
            return;
        }
        if (!orderDraft.items.length) {
            toast('An order needs at least one item.', 'warning');
            return;
        }

        const i = state.orders.findIndex(o => o.id === $('#oeId').value);
        if (i < 0) return;

        // Work out the customer (keep the old one if it was deleted and untouched)
        const selected = $('#oeCustomer').value;
        let customerId = state.orders[i].customerId;
        let customerName = state.orders[i].customerName;
        if (selected !== '__deleted') {
            const c = state.customers.find(x => x.id === selected);
            customerId = c ? c.id : '';
            customerName = c ? c.name : 'Walk-in Customer';
        }

        const discountPct = clampPct($('#oeDiscount').value);
        const existingOrder = state.orders[i];
        const newStatus = $('#oeStatus').value;
        if (existingOrder.status === 'Completed' && newStatus !== 'Completed') {
            restockOrder(existingOrder, `Order changed to ${newStatus}`);
        } else if (existingOrder.status !== 'Completed' && newStatus === 'Completed') {
            const stockError = validateAndDeductStock(orderDraft.items, existingOrder.number);
            if (stockError) {
                toast(stockError, 'danger');
                return;
            }
            existingOrder.stockDeducted = true;
        } else if (existingOrder.status === 'Completed' && newStatus === 'Completed') {
            const oldItemsKey = JSON.stringify((existingOrder.items || []).map(item =>
                `${item.productId}:${item.qty}`).sort());
            const newItemsKey = JSON.stringify(orderDraft.items.map(item =>
                `${item.productId}:${item.qty}`).sort());
            if (oldItemsKey !== newItemsKey) {
                restockOrder(existingOrder, `Replaced items for ${existingOrder.number}`);
                const stockError = validateAndDeductStock(orderDraft.items, existingOrder.number);
                if (stockError) {
                    // Restore the old stock allocation when the revised quantities cannot be fulfilled
                    existingOrder.stockDeducted = true;
                    restockOrder(existingOrder, `Restoration after rejected edit`);
                    toast(stockError, 'danger');
                    return;
                }
                existingOrder.stockDeducted = true;
            }
        }
        state.orders[i] = {
            ...existingOrder,
            customerId,
            customerName,
            status: newStatus,
            payment: $('#oePayment').value,
            items: orderDraft.items,
            discountPct,
            ...calcTotals(orderDraft.items, discountPct),
            updatedAt: new Date().toISOString()
        };

        saveOrders();
        renderOrders();
        renderCustomers();
        modal('orderEditModal').hide();
        toast('Order updated.');
    });
}

function getCompletedSales() {
    return state.orders.filter(order => order.status === 'Completed');
}

function sameLocalDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context, width: rect.width, height: rect.height };
}

function drawLineChart(canvas, labels, values) {
    const { context: ctx, width, height } = prepareCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const padding = { top: 10, right: 12, bottom: 32, left: 48 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const max = Math.max(...values, 1);

    ctx.strokeStyle = 'rgba(246, 235, 221, 0.12)';
    ctx.fillStyle = '#B9A794';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + chartHeight * i / 4;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(`${Math.round(max * (4 - i) / 4)}`, padding.left - 8, y + 3);
    }

    const points = values.map((value, index) => ({
        x: padding.left + (values.length === 1 ? chartWidth / 2 : chartWidth * index / (values.length - 1)),
        y: padding.top + chartHeight - chartHeight * value / max
    }));

    ctx.strokeStyle = '#F26B21';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();

    ctx.fillStyle = '#F5B83D';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#B9A794';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
        ctx.fillText(label, points[index].x, height - 10);
    });
}

function drawHorizontalBars(canvas, labels, values) {
    const { context: ctx, width, height } = prepareCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    if (!labels.length) return;

    const padding = { top: 8, right: 24, bottom: 8, left: 112 };
    const chartWidth = width - padding.left - padding.right;
    const rowHeight = (height - padding.top - padding.bottom) / labels.length;
    const max = Math.max(...values, 1);

    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    labels.forEach((label, index) => {
        const y = padding.top + rowHeight * index + rowHeight / 2;
        ctx.fillStyle = '#B9A794';
        ctx.fillText(label.length > 16 ? `${label.slice(0, 15)}…` : label, padding.left - 8, y);
        ctx.fillStyle = 'rgba(246, 235, 221, 0.10)';
        ctx.fillRect(padding.left, y - 10, chartWidth, 20);
        ctx.fillStyle = index % 2 ? '#F5B83D' : '#F26B21';
        ctx.fillRect(padding.left, y - 10, chartWidth * values[index] / max, 20);
        ctx.fillStyle = '#F6EBDD';
        ctx.textAlign = 'left';
        ctx.fillText(String(values[index]), Math.min(width - 32, padding.left + chartWidth * values[index] / max + 6), y);
        ctx.textAlign = 'right';
    });
}

function drawVerticalBars(canvas, labels, values) {
    const { context: ctx, width, height } = prepareCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const padding = { top: 12, right: 12, bottom: 32, left: 48 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const max = Math.max(...values, 1);

    ctx.strokeStyle = 'rgba(246, 235, 221, 0.12)';
    ctx.fillStyle = '#B9A794';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + chartHeight * i / 4;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(`${Math.round(max * (4 - i) / 4)}`, padding.left - 8, y + 3);
    }

    const slot = chartWidth / labels.length;
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
        const barWidth = Math.max(8, slot * 0.58);
        const barHeight = chartHeight * values[index] / max;
        const x = padding.left + slot * index + (slot - barWidth) / 2;
        const y = padding.top + chartHeight - barHeight;
        ctx.fillStyle = index === labels.length - 1 ? '#F5B83D' : '#F26B21';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#B9A794';
        ctx.fillText(label, x + barWidth / 2, height - 10);
    });
}

function setChartEmpty(canvasId, emptyId, hasData) {
    const canvas = $(`#${canvasId}`);
    canvas.classList.toggle('d-none', !hasData);
    $(`#${emptyId}`).classList.toggle('d-none', hasData);
}

function renderManagementDashboard() {
    if (!GMAuth.requirePermission('management_dashboard')) return;

    const completed = getCompletedSales();
    const now = new Date();
    const todayRevenue = completed
        .filter(order => sameLocalDay(new Date(order.createdAt), now))
        .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const monthRevenue = completed
        .filter(order => {
            const date = new Date(order.createdAt);
            return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        })
        .reduce((sum, order) => sum + Number(order.total || 0), 0);

    $('#dashboardTodayRevenue').textContent = money(todayRevenue);
    $('#dashboardMonthRevenue').textContent = money(monthRevenue);
    $('#dashboardTotalOrders').textContent = state.orders.length;
    $('#dashboardTotalProducts').textContent = state.products.length;

    const employees = store.load('grillmaster_employees', []);
    $('#dashboardTotalEmployees').textContent = Array.isArray(employees) ? employees.length : 0;
    const inventory = store.load('grillmaster_inventory', []);
    $('#dashboardLowStock').textContent = Array.isArray(inventory)
        ? inventory.filter(item => Number(item.quantity) <= Number(item.reorderLevel || 0)).length
        : 0;

    const dailyLabels = [];
    const dailyValues = [];
    for (let offset = 6; offset >= 0; offset--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
        dailyLabels.push(date.toLocaleDateString('en-GB', { weekday: 'short' }));
        dailyValues.push(completed
            .filter(order => sameLocalDay(new Date(order.createdAt), date))
            .reduce((sum, order) => sum + Number(order.total || 0), 0));
    }
    setChartEmpty('dailySalesChart', 'dailySalesEmpty', completed.length > 0);
    if (completed.length) drawLineChart($('#dailySalesChart'), dailyLabels, dailyValues);

    const monthlyLabels = [];
    const monthlyValues = [];
    for (let offset = 11; offset >= 0; offset--) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        monthlyLabels.push(date.toLocaleDateString('en-GB', { month: 'short' }));
        monthlyValues.push(completed
            .filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth();
            })
            .reduce((sum, order) => sum + Number(order.total || 0), 0));
    }
    setChartEmpty('monthlyRevenueChart', 'monthlyRevenueEmpty', completed.length > 0);
    if (completed.length) drawVerticalBars($('#monthlyRevenueChart'), monthlyLabels, monthlyValues);

    const productTotals = {};
    completed.forEach(order => order.items.forEach(item => {
        productTotals[item.name] = (productTotals[item.name] || 0) + Number(item.qty || 0);
    }));
    const bestProducts = Object.entries(productTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
    setChartEmpty('bestProductsChart', 'bestProductsEmpty', bestProducts.length > 0);
    if (bestProducts.length) {
        drawHorizontalBars($('#bestProductsChart'), bestProducts.map(([name]) => name), bestProducts.map(([, quantity]) => quantity));
    }

    const paymentTotals = {};
    completed.forEach(order => {
        const method = order.payment || 'Unknown';
        paymentTotals[method] = (paymentTotals[method] || 0) + Number(order.total || 0);
    });
    const payments = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1]);
    setChartEmpty('paymentChart', 'paymentEmpty', payments.length > 0);
    if (payments.length) {
        drawHorizontalBars($('#paymentChart'), payments.map(([name]) => name), payments.map(([, total]) => round2(total)));
    }
}

function inventoryStatus(item) {
    const quantity = Number(item.quantity || 0);
    const minimum = Number(item.minimumStock || 0);
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= minimum) return 'Low Stock';
    return 'In Stock';
}

function renderInventory() {
    if (!GMAuth.requirePermission('manage_inventory')) return;
    initializeInventory();

    const categories = [...new Set(state.products.map(product => product.category))];
    const categoryFilter = $('#inventoryCategoryFilter');
    const previousCategory = categoryFilter.value || 'All';
    categoryFilter.innerHTML = '<option value="All">All categories</option>' +
        categories.map(category => `<option>${esc(category)}</option>`).join('');
    categoryFilter.value = categories.includes(previousCategory) ? previousCategory : 'All';

    const term = ($('#inventorySearch').value || '').trim().toLowerCase();
    const statusFilter = $('#inventoryStatusFilter').value || 'All';
    const filtered = state.inventory.map(item => {
        const product = state.products.find(candidate => candidate.id === item.productId);
        return product ? { ...item, product } : null;
    }).filter(Boolean).filter(entry =>
        (previousCategory === 'All' || entry.product.category === previousCategory) &&
        (statusFilter === 'All' || inventoryStatus(entry) === statusFilter) &&
        (!term || entry.product.name.toLowerCase().includes(term))
    );

    $('#inventoryTable').innerHTML = filtered.length
        ? filtered.map(entry => {
            const status = inventoryStatus(entry);
            const badge = status === 'Out of Stock' ? 'text-bg-danger' : status === 'Low Stock' ? 'text-bg-warning' : 'text-bg-success';
            return `<tr>
              <td title="${esc(entry.product.id)}">${esc(entry.product.id)}</td>
              <td class="fw-semibold">${esc(entry.product.name)}</td>
              <td>${esc(entry.product.category)}</td>
              <td class="text-end">${Number(entry.quantity)}</td>
              <td class="text-end">${Number(entry.minimumStock)}</td>
              <td class="text-end">${money(entry.unitPrice)}</td>
              <td><span class="badge ${badge}">${status}</span></td>
              <td class="text-end"><button type="button" class="btn btn-sm btn-outline-gm" data-inventory-edit="${entry.productId}"><i class="bi bi-pencil"></i> Update</button></td>
            </tr>`;
        }).join('')
        : `<tr><td colspan="8" class="text-center text-muted-gm py-4">No inventory matches these filters.</td></tr>`;

    const counts = state.inventory.map(inventoryStatus);
    $('#inventoryInStock').textContent = counts.filter(status => status === 'In Stock').length;
    $('#inventoryLowStock').textContent = counts.filter(status => status === 'Low Stock').length;
    $('#inventoryOutStock').textContent = counts.filter(status => status === 'Out of Stock').length;

    $('#stockMovementsTable').innerHTML = state.stockMovements.length
        ? state.stockMovements.slice(0, 50).map(movement => `<tr>
            <td>${fmtDate(movement.createdAt)}</td>
            <td>${esc(movement.productName)}</td>
            <td>${esc(movement.type)}</td>
            <td class="text-end ${Number(movement.quantity) < 0 ? 'text-danger' : 'text-success'}">${Number(movement.quantity) > 0 ? '+' : ''}${movement.quantity}</td>
            <td>${esc(movement.reference)}</td>
            <td>${esc(movement.note)}</td>
          </tr>`).join('')
        : `<tr><td colspan="6" class="text-center text-muted-gm py-4">No stock movements recorded.</td></tr>`;
}

function openInventoryModal(productId) {
    const item = getInventoryItem(productId);
    if (!item) return;
    $('#inventoryProductId').value = productId;
    $('#inventoryQuantity').value = item.quantity;
    $('#inventoryMinimum').value = item.minimumStock;
    $('#inventoryMovementNote').value = '';
    modal('inventoryModal').show();
}

function bindInventory() {
    $('#initializeInventoryBtn').addEventListener('click', () => {
        initializeInventory();
        renderInventory();
        toast('Inventory initialized for existing products.');
    });
    $('#inventorySearch').addEventListener('input', renderInventory);
    $('#inventoryCategoryFilter').addEventListener('change', renderInventory);
    $('#inventoryStatusFilter').addEventListener('change', renderInventory);
    $('#inventoryTable').addEventListener('click', event => {
        const button = event.target.closest('[data-inventory-edit]');
        if (button) openInventoryModal(button.dataset.inventoryEdit);
    });
    $('#inventoryForm').addEventListener('submit', event => {
        event.preventDefault();
        if (!GMAuth.requirePermission('manage_inventory')) return;
        const form = event.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        const productId = $('#inventoryProductId').value;
        const item = getInventoryItem(productId);
        const oldQuantity = Number(item.quantity);
        const newQuantity = Math.max(0, parseInt($('#inventoryQuantity').value, 10) || 0);
        item.quantity = newQuantity;
        item.minimumStock = Math.max(0, parseInt($('#inventoryMinimum').value, 10) || 0);
        item.unitPrice = state.products.find(product => product.id === productId)?.price || item.unitPrice;
        saveInventory();
        const difference = newQuantity - oldQuantity;
        if (difference !== 0) {
            recordStockMovement(productId, difference > 0 ? 'Adjustment In' : 'Adjustment Out',
                difference, 'MANUAL', $('#inventoryMovementNote').value.trim() || 'Manual stock adjustment');
        }
        renderInventory();
        modal('inventoryModal').hide();
        toast('Inventory updated.');
    });
}

function renderEmployees() {
    if (!GMAuth.requirePermission('manage_employees')) return;
    const term = ($('#employeeSearch').value || '').trim().toLowerCase();
    const position = $('#employeePositionFilter').value || 'All';
    const status = $('#employeeStatusFilter').value || 'All';
    const employees = state.employees.filter(employee =>
        (position === 'All' || employee.position === position) &&
        (status === 'All' || (employee.status === 'active' ? 'Active' : 'Inactive') === status) &&
        (!term || `${employee.employeeId} ${employee.name} ${employee.email}`.toLowerCase().includes(term))
    );
    $('#employeesTable').innerHTML = employees.length
        ? employees.map(employee => `<tr>
            <td>${esc(employee.employeeId)}</td><td class="fw-semibold">${esc(employee.name)}</td>
            <td>${esc(employee.position)}</td><td>${esc(employee.userRole)}</td>
            <td>${esc(employee.dateJoined)}</td>
            <td><span class="badge ${employee.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}">${employee.status === 'active' ? 'Active' : 'Inactive'}</span></td>
            <td class="text-end"><button type="button" class="btn btn-sm btn-outline-gm" data-employee-edit="${employee.id}"><i class="bi bi-pencil"></i></button></td>
          </tr>`).join('')
        : `<tr><td colspan="7" class="text-center text-muted-gm py-4">No employees match these filters.</td></tr>`;
}

function openEmployeeModal(id) {
    const employee = state.employees.find(candidate => candidate.id === id);
    $('#employeeModalTitle').textContent = employee ? 'Edit Employee' : 'Add Employee';
    $('#employeeId').value = employee?.id || '';
    $('#employeeName').value = employee?.name || '';
    $('#employeeEmail').value = employee?.email || '';
    $('#employeePhone').value = employee?.phone || '';
    $('#employeePosition').value = employee?.position || 'Cashier';
    $('#employeeRole').value = employee?.userRole || 'cashier';
    $('#employeeDateJoined').value = employee?.dateJoined || new Date().toISOString().slice(0, 10);
    $('#employeeStatus').value = employee?.status || 'active';
    modal('employeeModal').show();
}

function bindEmployees() {
    $('#addEmployeeBtn').addEventListener('click', () => openEmployeeModal());
    $('#employeeSearch').addEventListener('input', renderEmployees);
    $('#employeePositionFilter').addEventListener('change', renderEmployees);
    $('#employeeStatusFilter').addEventListener('change', renderEmployees);
    $('#employeesTable').addEventListener('click', event => {
        const button = event.target.closest('[data-employee-edit]');
        if (button) openEmployeeModal(button.dataset.employeeEdit);
    });
    $('#employeeForm').addEventListener('submit', event => {
        event.preventDefault();
        if (!GMAuth.requirePermission('manage_employees')) return;
        if (!event.target.checkValidity()) {
            event.target.classList.add('was-validated');
            return;
        }
        const id = $('#employeeId').value;
        const data = {
            name: $('#employeeName').value.trim(),
            email: $('#employeeEmail').value.trim(),
            phone: $('#employeePhone').value.trim(),
            position: $('#employeePosition').value,
            userRole: $('#employeeRole').value,
            dateJoined: $('#employeeDateJoined').value,
            status: $('#employeeStatus').value
        };
        if (id) {
            const index = state.employees.findIndex(employee => employee.id === id);
            state.employees[index] = { ...state.employees[index], ...data, updatedAt: new Date().toISOString() };
        } else {
            state.employees.push({
                id: uid(),
                employeeId: `EMP-${String(state.employees.length + 1).padStart(4, '0')}`,
                ...data,
                createdAt: new Date().toISOString()
            });
        }
        const linkedUser = GMAuth.listUsers().find(user => user.email.toLowerCase() === data.email.toLowerCase());
        if (linkedUser) {
            GMAuth.updateUserRole(linkedUser.id, data.userRole);
            GMAuth.setUserActive(linkedUser.id, data.status === 'active');
        }
        saveEmployees();
        renderEmployees();
        modal('employeeModal').hide();
        toast('Employee saved.');
    });
}

function renderUsers() {
    if (!GMAuth.requirePermission('manage_users')) return;
    const term = ($('#userSearch').value || '').trim().toLowerCase();
    const role = $('#userRoleFilter').value || 'All';
    const status = $('#userStatusFilter').value || 'All';
    const users = GMAuth.listUsers().filter(user =>
        (role === 'All' || user.role === role) &&
        (status === 'All' || (user.active ? 'active' : 'inactive') === status) &&
        (!term || `${user.username} ${user.email}`.toLowerCase().includes(term))
    );
    const current = GMAuth.getCurrentUser();
    $('#usersTable').innerHTML = users.length
        ? users.map(user => `<tr>
            <td class="fw-semibold">${esc(user.username)}</td><td>${esc(user.email)}</td>
            <td><select class="form-select form-select-sm user-role" data-user-role="${user.id}" ${user.id === current.id ? 'disabled' : ''}><option value="cashier" ${user.role === 'cashier' ? 'selected' : ''}>Cashier</option><option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option></select></td>
            <td><span class="badge ${user.active ? 'text-bg-success' : 'text-bg-secondary'}">${user.active ? 'Active' : 'Inactive'}</span></td>
            <td class="text-end"><button type="button" class="btn btn-sm ${user.active ? 'btn-outline-danger' : 'btn-outline-gm'}" data-user-toggle="${user.id}" ${user.id === current.id && user.active ? 'disabled' : ''}>${user.active ? 'Deactivate' : 'Activate'}</button></td>
          </tr>`).join('')
        : `<tr><td colspan="5" class="text-center text-muted-gm py-4">No users match these filters.</td></tr>`;
}

function bindUsers() {
    $('#addUserBtn').addEventListener('click', () => modal('userModal').show());
    $('#userSearch').addEventListener('input', renderUsers);
    $('#userRoleFilter').addEventListener('change', renderUsers);
    $('#userStatusFilter').addEventListener('change', renderUsers);
    $('#usersTable').addEventListener('change', event => {
        const select = event.target.closest('[data-user-role]');
        if (!select) return;
        if (!GMAuth.updateUserRole(select.dataset.userRole, select.value)) toast('Could not change this role.', 'danger');
        else toast('User role updated.');
    });
    $('#usersTable').addEventListener('click', event => {
        const button = event.target.closest('[data-user-toggle]');
        if (!button) return;
        const user = GMAuth.listUsers().find(candidate => candidate.id === button.dataset.userToggle);
        if (!user) return;
        const actionLabel = user.active ? 'Deactivate' : 'Activate';
        confirmAction(`${actionLabel} "${user.username}"?`, () => {
            if (!GMAuth.setUserActive(user.id, !user.active)) toast('The last active administrator cannot be disabled.', 'danger');
            else renderUsers();
        }, actionLabel, false);
    });
    $('#userForm').addEventListener('submit', async event => {
        event.preventDefault();
        if (!GMAuth.requirePermission('manage_users')) return;
        if (!event.target.checkValidity()) {
            event.target.classList.add('was-validated');
            return;
        }
        try {
            await GMAuth.createUser($('#userUsername').value, $('#userEmail').value, $('#userPassword').value, $('#userRole').value);
            event.target.reset();
            modal('userModal').hide();
            renderUsers();
            toast('User account created.');
        } catch (error) {
            toast(error.message, 'danger');
        }
    });
}

function getSettings() {
    return store.load(CONFIG.keys.settings, {
        storeName: 'GrillMaster',
        counterName: 'Counter 1',
        currency: 'Rs.',
        taxRate: 18,
        defaultMinimumStock: 5
    });
}

function renderSettings() {
    if (!GMAuth.requirePermission('manage_system_settings')) return;
    const settings = getSettings();
    $('#settingsStoreName').value = settings.storeName || 'GrillMaster';
    $('#settingsCounter').value = settings.counterName || 'Counter 1';
    $('#settingsCurrency').value = settings.currency || 'Rs.';
    $('#settingsTaxRate').value = settings.taxRate ?? 18;
    $('#settingsLowStock').value = settings.defaultMinimumStock ?? 5;
}

function bindSettings() {
    $('#settingsForm').addEventListener('submit', event => {
        event.preventDefault();
        if (!GMAuth.requirePermission('manage_system_settings')) return;
        if (!event.target.checkValidity()) {
            event.target.classList.add('was-validated');
            return;
        }
        const settings = {
            storeName: $('#settingsStoreName').value.trim(),
            counterName: $('#settingsCounter').value.trim(),
            currency: $('#settingsCurrency').value.trim(),
            taxRate: Math.min(100, Math.max(0, parseFloat($('#settingsTaxRate').value) || 0)),
            defaultMinimumStock: Math.max(0, parseInt($('#settingsLowStock').value, 10) || 0)
        };
        store.save(CONFIG.keys.settings, settings);
        CONFIG.currency = settings.currency;
        CONFIG.taxRate = settings.taxRate / 100;
        renderToday();
        renderAll();
        toast('System settings saved.');
    });
}

function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function getSalesReportRange() {
    const period = $('#salesPeriod')?.value || 'daily';
    const now = new Date();
    const today = startOfLocalDay(now);

    if (period === 'weekly') {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        return { start, end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999), label: 'Last 7 days' };
    }
    if (period === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end, label: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
    }
    if (period === 'yearly') {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end, label: String(now.getFullYear()) };
    }
    if (period === 'custom') {
        const start = parseLocalDate($('#salesStartDate')?.value);
        const end = parseLocalDate($('#salesEndDate')?.value);
        if (!start || !end) {
            return { start: null, end: null, label: 'Choose a start and end date', invalid: true };
        }
        if (start > end) {
            return { start: null, end: null, label: 'Start date must be before end date', invalid: true };
        }
        end.setHours(23, 59, 59, 999);
        return {
            start,
            end,
            label: `${start.toLocaleDateString('en-GB')} to ${end.toLocaleDateString('en-GB')}`
        };
    }

    return {
        start: today,
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999),
        label: 'Today'
    };
}

let filteredSalesOrders = [];

function renderSalesReport() {
    if (!GMAuth.requirePermission('sales_reports')) return;

    const range = getSalesReportRange();
    const allCompleted = getCompletedSales();
    const sales = range.invalid ? [] : allCompleted.filter(order => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= range.start && createdAt <= range.end;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filteredSalesOrders = sales;
    const revenue = sales.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const items = sales.reduce((sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0), 0);

    $('#salesRevenue').textContent = money(revenue);
    $('#salesOrders').textContent = sales.length;
    $('#salesItems').textContent = items;
    $('#salesAverage').textContent = money(sales.length ? revenue / sales.length : 0);
    $('#salesRangeLabel').textContent = range.label;
    $('#salesRowCount').textContent = `${sales.length} ${sales.length === 1 ? 'record' : 'records'}`;

    $('#salesTable').innerHTML = sales.length
        ? sales.map(order => `
            <tr>
              <td class="fw-semibold">${esc(order.number)}</td>
              <td>${fmtDate(order.createdAt)}</td>
              <td>${esc(orderCustomerName(order))}</td>
              <td class="text-center">${order.items.reduce((sum, item) => sum + Number(item.qty || 0), 0)}</td>
              <td>${esc(order.payment)}</td>
              <td class="text-end">${money(order.subtotal)}</td>
              <td class="text-end">${money(order.tax)}</td>
              <td class="text-end fw-semibold">${money(order.total)}</td>
            </tr>`).join('')
        : `<tr><td colspan="8" class="text-center text-muted-gm py-4">${range.invalid ? esc(range.label) : 'No completed sales found for this period.'}</td></tr>`;
}

function bindSalesReports() {
    $('#salesPeriod').addEventListener('change', () => {
        const custom = $('#salesPeriod').value === 'custom';
        $('#salesStartWrap').classList.toggle('d-none', !custom);
        $('#salesEndWrap').classList.toggle('d-none', !custom);
        if (custom) {
            const today = new Date();
            const localDate = date => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            if (!$('#salesStartDate').value) $('#salesStartDate').value = localDate(new Date(today.getFullYear(), today.getMonth(), 1));
            if (!$('#salesEndDate').value) $('#salesEndDate').value = localDate(today);
        }
        renderSalesReport();
    });
    $('#salesStartDate').addEventListener('change', renderSalesReport);
    $('#salesEndDate').addEventListener('change', renderSalesReport);
    $('#exportSalesCsv').addEventListener('click', exportSalesCsv);
}

function exportSalesCsv() {
    if (!GMAuth.requirePermission('sales_reports')) return;
    if (!filteredSalesOrders.length) {
        toast('No sales data to export for this period.', 'warning');
        return;
    }

    const rows = [
        ['Order', 'Date', 'Customer', 'Items', 'Payment', 'Subtotal', 'Tax', 'Discount', 'Total'],
        ...filteredSalesOrders.map(order => [
            order.number,
            fmtDate(order.createdAt),
            orderCustomerName(order),
            order.items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
            order.payment,
            Number(order.subtotal || 0).toFixed(2),
            Number(order.tax || 0).toFixed(2),
            Number(order.discount || 0).toFixed(2),
            Number(order.total || 0).toFixed(2)
        ])
    ];
    const csv = rows.map(row => row.map(value => {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `grillmaster-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function renderAll() {
    renderToday();
    renderProducts();
    renderCustomers();
    renderOrders();
    renderOrderNo();
    renderManagementDashboard();
}

let appInitialized = false;

function initializeApp() {
    if (appInitialized) return;
    appInitialized = true;
    loadState();
    bindNavigation();
    bindMenu();
    bindCart();
    bindProducts();
    bindCustomers();
    bindOrders();
    bindSalesReports();
    bindInventory();
    bindEmployees();
    bindUsers();
    bindSettings();
    renderAll();
}

function showLogin() {
    $('#appShell').classList.add('d-none');
    $('#cartFab').classList.add('d-none');
    $('#loginPage').classList.remove('d-none');
    $('#loginForm').classList.toggle('d-none', GMAuth.isSetupRequired());
    $('#setupForm').classList.toggle('d-none', !GMAuth.isSetupRequired());
    if (GMAuth.isSetupRequired()) $('#setupUsername').focus();
    else $('#loginUsername').focus();
}

function configureRoleNavigation() {
    const user = GMAuth.getCurrentUser();
    if (!user) return;

    const elevatedRole = user.role === 'manager' || user.role === 'admin';
    $$('.cashier-direct').forEach(link => link.classList.toggle('d-none', elevatedRole));
    $('#cashierMenuBtn').classList.toggle('d-none', !elevatedRole);

    $$('#mainNav [data-permission]').forEach(link => {
        const allowed = GMAuth.requirePermission(link.dataset.permission);
        link.classList.toggle('d-none', !allowed);
    });

    const badge = $('#currentUserBadge');
    badge.textContent = `${user.username} · ${user.role}`;
    badge.classList.remove('d-none');
    $('#addProductBtn').classList.toggle('d-none', !GMAuth.requirePermission('manage_inventory'));
}

function showApp() {
    $('#loginPage').classList.add('d-none');
    $('#appShell').classList.remove('d-none');
    configureRoleNavigation();
    initializeApp();
    showView('pos');
}

document.addEventListener('DOMContentLoaded', () => {
    $('#loginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;

        const usernameOrEmail = $('#loginUsername').value.trim();
        const password = $('#loginPassword').value;
        try {
            await GMAuth.loginUser(usernameOrEmail, password);
            $('#loginError').classList.add('d-none');
            showApp();
        } catch (error) {
            $('#loginError').textContent = error.message;
            $('#loginError').classList.remove('d-none');
            $('#loginPassword').select();
        }
    });

    $('#setupForm').addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;

        const password = $('#setupPassword').value;
        const confirmation = $('#setupPasswordConfirm').value;
        if (password !== confirmation) {
            $('#setupError').textContent = 'Passwords do not match.';
            $('#setupError').classList.remove('d-none');
            return;
        }

        try {
            await GMAuth.createInitialAdmin(
                $('#setupUsername').value,
                $('#setupEmail').value,
                password
            );
            form.reset();
            $('#setupError').classList.add('d-none');
            showApp();
        } catch (error) {
            $('#setupError').textContent = error.message;
            $('#setupError').classList.remove('d-none');
        }
    });

    $('#loginUsername').addEventListener('input', () => $('#loginError').classList.add('d-none'));
    $('#loginPassword').addEventListener('input', () => $('#loginError').classList.add('d-none'));
    $('#setupUsername').addEventListener('input', () => $('#setupError').classList.add('d-none'));
    $('#setupEmail').addEventListener('input', () => $('#setupError').classList.add('d-none'));
    $('#setupPassword').addEventListener('input', () => $('#setupError').classList.add('d-none'));
    $('#setupPasswordConfirm').addEventListener('input', () => $('#setupError').classList.add('d-none'));

    $('#logoutBtn').addEventListener('click', () => {
        GMAuth.logoutUser();
        $('#loginForm').reset();
        $('#loginError').classList.add('d-none');
        showLogin();
    });

    if (GMAuth.isAuthenticated()) {
        showApp();
    } else {
        showLogin();
    }

    window.setInterval(() => {
        if (!GMAuth.isAuthenticated() && !$('#appShell').classList.contains('d-none')) {
            showLogin();
        }
    }, 60000);

    let dashboardResizeTimer;
    window.addEventListener('resize', () => {
        window.clearTimeout(dashboardResizeTimer);
        dashboardResizeTimer = window.setTimeout(() => {
            if (!$('#view-management').classList.contains('d-none')) {
                renderManagementDashboard();
            }
        }, 150);
    });
});
