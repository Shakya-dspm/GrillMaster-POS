const GMAuth = (() => {
    const USERS_KEY = 'grillmaster_users';
    const SESSION_KEY = 'grillmaster_session';
    const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

    const ROLE_PERMISSIONS = {
        cashier: {
            pos: true,
            view_products: true,
            create_orders: true,
            checkout: true,
            view_orders: true,
            view_order_details: true
        },
        manager: {
            pos: true,
            view_products: true,
            create_orders: true,
            checkout: true,
            view_orders: true,
            view_order_details: true,
            manage_customers: true,
            manage_orders: true,
            management_dashboard: true,
            sales_reports: true,
            sales_analytics: true,
            manage_employees: true,
            manage_inventory: true,
            view_stock_movements: true,
            view_low_stock: true
        },
        admin: {
            pos: true,
            view_products: true,
            create_orders: true,
            checkout: true,
            view_orders: true,
            view_order_details: true,
            manage_customers: true,
            manage_orders: true,
            management_dashboard: true,
            sales_reports: true,
            sales_analytics: true,
            manage_employees: true,
            manage_inventory: true,
            view_stock_movements: true,
            view_low_stock: true,
            manage_users: true,
            manage_roles: true,
            manage_permissions: true,
            manage_system_settings: true
        }
    };

    const readUsers = () => {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            return Array.isArray(users) ? users : [];
        } catch (error) {
            console.error('Could not read users.', error);
            return [];
        }
    };

    const saveUsers = users => {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Could not save users.', error);
            return false;
        }
    };

    const bytesToHex = bytes => [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const randomHex = length => bytesToHex(window.crypto.getRandomValues(new Uint8Array(length)));

    async function derivePassword(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        const bits = await window.crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 120000,
            hash: 'SHA-256'
        }, keyMaterial, 256);
        return bytesToHex(new Uint8Array(bits));
    }

    async function createInitialAdmin(username, email, password) {
        if (readUsers().length) throw new Error('An account setup already exists.');
        if (!username.trim() || !email.trim()) throw new Error('Username and email are required.');
        if (password.length < 8) throw new Error('Password must contain at least 8 characters.');

        const salt = randomHex(16);
        const passwordHash = await derivePassword(password, salt);
        const user = {
            id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
            username: username.trim(),
            email: email.trim().toLowerCase(),
            role: 'admin',
            active: true,
            passwordSalt: salt,
            passwordHash,
            createdAt: new Date().toISOString()
        };

        if (!saveUsers([user])) throw new Error('Could not save the administrator account.');
        return loginUser(username, password);
    }

    async function loginUser(usernameOrEmail, password) {
        const identifier = String(usernameOrEmail || '').trim().toLowerCase();
        if (!identifier || !password) throw new Error('Enter your username or email and password.');

        const user = readUsers().find(candidate =>
            candidate.username.toLowerCase() === identifier ||
            candidate.email.toLowerCase() === identifier
        );
        if (!user) throw new Error('The username or password is incorrect.');
        if (!user.active) throw new Error('This account is inactive.');

        const passwordHash = await derivePassword(password, user.passwordSalt);
        if (passwordHash !== user.passwordHash) throw new Error('The username or password is incorrect.');

        const session = {
            userId: user.id,
            expiresAt: Date.now() + SESSION_DURATION_MS
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return getCurrentUser();
    }

    function logoutUser() {
        localStorage.removeItem(SESSION_KEY);
        return true;
    }

    function getCurrentUser() {
        try {
            const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            if (!session || typeof session.expiresAt !== 'number') return null;
            if (session.expiresAt <= Date.now()) {
                logoutUser();
                return null;
            }
            const user = readUsers().find(candidate => candidate.id === session.userId);
            if (!user || !user.active) {
                logoutUser();
                return null;
            }
            return { ...user, passwordSalt: undefined, passwordHash: undefined };
        } catch (error) {
            console.error('Could not restore session.', error);
            logoutUser();
            return null;
        }
    }

    function isAuthenticated() {
        return getCurrentUser() !== null;
    }

    function hasPermission(permission) {
        const user = getCurrentUser();
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role]?.[permission] === true;
    }

    function requirePermission(permission) {
        if (!hasPermission(permission)) {
            return false;
        }
        return true;
    }

    function isSetupRequired() {
        return readUsers().length === 0;
    }

    async function createUser(username, email, password, role) {
        if (!['cashier', 'manager', 'admin'].includes(role)) throw new Error('Invalid role.');
        if (password.length < 8) throw new Error('Password must contain at least 8 characters.');
        const users = readUsers();
        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedUsername || !normalizedEmail) throw new Error('Username and email are required.');
        if (users.some(user => user.username.toLowerCase() === normalizedUsername.toLowerCase())) throw new Error('Username already exists.');
        if (users.some(user => user.email.toLowerCase() === normalizedEmail)) throw new Error('Email already exists.');
        const passwordSalt = randomHex(16);
        const passwordHash = await derivePassword(password, passwordSalt);
        const user = {
            id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}-${randomHex(3)}`,
            username: normalizedUsername,
            email: normalizedEmail,
            role,
            active: true,
            passwordSalt,
            passwordHash,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        if (!saveUsers(users)) throw new Error('Could not save the new account.');
        return { ...user, passwordSalt: undefined, passwordHash: undefined };
    }

    function updateUserRole(userId, role) {
        if (!['cashier', 'manager', 'admin'].includes(role)) return false;
        const users = readUsers();
        const user = users.find(candidate => candidate.id === userId);
        if (!user) return false;
        if (user.active && user.role === 'admin' && role !== 'admin') {
            const activeAdmins = users.filter(candidate => candidate.role === 'admin' && candidate.active);
            if (activeAdmins.length <= 1) return false;
        }
        user.role = role;
        user.updatedAt = new Date().toISOString();
        return saveUsers(users);
    }

    function setUserActive(userId, active) {
        const users = readUsers();
        const user = users.find(candidate => candidate.id === userId);
        if (!user) return false;
        if (!active && user.role === 'admin') {
            const activeAdmins = users.filter(candidate => candidate.role === 'admin' && candidate.active);
            if (activeAdmins.length <= 1 && activeAdmins[0]?.id === userId) return false;
        }
        user.active = Boolean(active);
        user.updatedAt = new Date().toISOString();
        return saveUsers(users);
    }

    function listUsers() {
        return readUsers().map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            active: user.active,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
    }

    return {
        createInitialAdmin,
        loginUser,
        logoutUser,
        getCurrentUser,
        isAuthenticated,
        hasPermission,
        requirePermission,
        isSetupRequired,
        createUser,
        updateUserRole,
        setUserActive,
        listUsers,
        ROLE_PERMISSIONS
    };
})();
