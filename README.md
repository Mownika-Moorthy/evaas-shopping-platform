# Evaas Shopping Platform

A full-stack e-commerce platform built with a production-grade architecture — two independent React frontends sharing a single Node.js + Express backend and MongoDB database.

---

## Project Structure

```
evaas-shopping-platform/
├── customer-app/       ← React app for shoppers  (port 3000)
├── admin-app/          ← React app for admins    (port 3001)
├── server/             ← Node.js + Express API   (port 5000)
└── README.md
```

---

## Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Customer UI   | React 19, React Router v7, Vite, Axios  |
| Admin UI      | React 19, React Router v7, Vite, Chart.js |
| Backend       | Node.js, Express.js                     |
| Database      | MongoDB + Mongoose                      |
| Auth          | JWT (separate tokens for users & admins)|
| File Uploads  | Multer                                  |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or a MongoDB Atlas URI

### 1. Configure the Server

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/evaas
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 3. Start the Customer App

```bash
cd customer-app
npm install
npm run dev
```

Customer app runs at: **http://localhost:3000**

#### Customer App Pages
| Route           | Page              | Auth Required |
|-----------------|-------------------|---------------|
| `/`             | Home              | No            |
| `/products`     | Products          | No            |
| `/categories`   | Categories        | No            |
| `/products/:id` | Product Details   | No            |
| `/cart`         | Shopping Cart     | No            |
| `/wishlist`     | Wishlist          | No            |
| `/login`        | User Login        | No            |
| `/register`     | User Registration | No            |
| `/checkout`     | Checkout          | ✅ Yes         |
| `/orders`       | My Orders         | ✅ Yes         |
| `/profile`      | User Profile      | ✅ Yes         |

---

### 4. Start the Admin App

```bash
cd admin-app
npm install
npm run dev
```

Admin app runs at: **http://localhost:3001**

#### Admin App Sections
| Section          | Description                       |
|------------------|-----------------------------------|
| Dashboard        | Overview & KPIs                   |
| Products         | Add / edit / delete products      |
| Categories       | Manage product categories         |
| Inventory        | Stock management                  |
| Orders           | View and update order status      |
| Customers        | Browse customer accounts          |
| Reviews          | Manage customer reviews           |
| Sales Reports    | Revenue & order analytics         |
| Top Selling      | Best performing products          |
| Least Selling    | Underperforming products          |
| Low Stock Alerts | Items needing restocking          |
| Settings         | Admin profile & store settings    |

---

## Security Architecture

- **Customer tokens** are stored as `token` + `user` in `localStorage`
- **Admin tokens** are stored as `admin_token` + `admin_user` in `localStorage`
- The server exposes a dedicated `/api/auth/admin-login` endpoint that rejects non-admin accounts
- `AdminProtectedRoute` verifies `role === 'admin'` before granting dashboard access
- The two apps run on different ports so they cannot accidentally share session state

---

## API Endpoints (Backend — port 5000)

| Method | Route                         | Description              |
|--------|-------------------------------|--------------------------|
| POST   | `/api/auth/register`          | Register new customer    |
| POST   | `/api/auth/login`             | Customer login           |
| POST   | `/api/auth/admin-login`       | Admin login              |
| GET    | `/api/auth/profile`           | Get current user profile |
| GET    | `/api/products`               | List all products        |
| GET    | `/api/products/:id`           | Get product by ID        |
| GET    | `/api/categories`             | List all categories      |
| GET    | `/api/orders`                 | List orders (auth)       |
| POST   | `/api/orders`                 | Create order (auth)      |
| GET    | `/api/admin/...`              | Admin-only endpoints     |
| GET    | `/api/health`                 | Health check             |
