# GrillMaster POS

GrillMaster POS is a responsive, browser-based point-of-sale interface for a restaurant or grill outlet. It supports order entry, customer and product management, inventory tracking, employees, sales reports, role-based access, and an 18% configurable tax model.

This is a front-end coursework prototype. Business data and authentication are stored in the browser's `localStorage`; it is not a production accounting or security system.

## Features

- Point-of-sale cart with menu search and category filters
- Walk-in and registered customers
- Configurable discounts, payment methods, tax, currency, and counter name
- Product and customer CRUD
- Pending, completed, and cancelled order states
- Inventory quantities, minimum stock levels, and stock-movement history
- Employee management
- Role-based views and permissions
- Cashier, manager, and administrator accounts
- Management dashboard and sales reports
- CSV sales export and printable receipts
- Responsive Bootstrap interface

## Roles and Permissions

| Permission | Cashier | Manager | Admin |
|---|:---:|:---:|:---:|
| POS, products, checkout, and orders | Yes | Yes | Yes |
| Customer management | No | Yes | Yes |
| Order management | No | Yes | Yes |
| Dashboard, reports, analytics | No | Yes | Yes |
| Employees and inventory | No | Yes | Yes |
| Users, roles, and system settings | No | No | Yes |

## Technology

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3
- Bootstrap Icons
- Canvas 2D charts
- Browser `localStorage`
- PBKDF2-SHA-256 for password hashing
- Web Crypto API

Bootstrap and Bootstrap Icons are loaded through CDNs. No package manager or build tool is required for the prebuilt files in `dist/`.

## Getting Started

### Option 1: VS Code Live Preview

1. Open this repository in VS Code.
2. Open `dist/index.html`.
3. Use Live Preview or Live Server to serve the page.

### Option 2: Local HTTP Server

From the repository root:

```powershell
cd dist
python -m http.server 8080
```

Then open `http://localhost:8080/`.

Opening `dist/index.html` directly with `file://` may cause browser restrictions with some features. Serving it over HTTP is recommended.

### First-Time Setup

The first launch displays an administrator setup form. Create the username, email, and password for the initial admin account. Passwords must contain at least eight characters.

The application then seeds a demo restaurant dataset when it has no saved order history: 12 menu items, two customers, 18 orders spread across the last 16 days (including a pending and a cancelled order), opening inventory and stock movements, and three employees. One or more completed orders are dated today so the management dashboard and sales reports show activity immediately. Sample records are created once per browser profile and are not added to profiles that already have an orders key. Use a fresh browser profile to see the complete demo dataset.

## Data Storage

The application uses browser-local keys, including:

- `grillmaster_users`
- `grillmaster_session`
- `grillmaster_products`
- `grillmaster_customers`
- `grillmaster_orders`
- `grillmaster_inventory`
- `grillmaster_stock_movements`
- `grillmaster_employees`
- `grillmaster_settings`

Data is specific to the browser and origin. Clearing site data removes accounts, orders, inventory, and settings. Use a private or test browser profile when experimenting.

## Project Structure

```text
.
|-- js/
|   |-- app.js          # Application state, CRUD, reporting, and POS logic
|   `-- auth.js         # Authentication, sessions, roles, and permissions
|-- dist/
|   |-- index.html      # Deployable application entry point
|   |-- assets/
|   |   |-- css/
|   |   `-- img/
|   `-- js/
|       |-- app.min.js
|       `-- auth.min.js
`-- .vscode/
    `-- settings.json
```

The files in `dist/` are the deployable version. Source JavaScript should be updated in `js/app.js` and `js/auth.js`, then reflected in the corresponding `dist/js/` bundles.

## Security and Production Notes

- `localStorage` is visible to JavaScript and is not suitable for secure credential storage.
- Role checks are client-side UI controls, not server-side authorization.
- There is no database, API, audit server, backup system, or multi-device synchronization.
- Sessions expire after eight hours.
- Do not use real customer, employee, or payment credentials in this prototype.
- For production use, replace this model with a backend, secure authentication, a relational database, and server-side authorization.

## Repository

- Repository: https://github.com/Shakya-dspm/GrillMaster-POS
- Main branch: `master`
- Development branch: `dev`
- License: Not specified
- Dependencies: CDN-based; no package manifest is currently included

## Future Improvements

- Add an actual backend and database
- Use secure server-side authentication and sessions
- Add automated tests
- Add a build/minification pipeline
- Add data import, backup, and restore
- Add payment-provider integration
- Add barcode/SKU support
- Add a formal license and deployment documentation
