# 🪙 Coin Gain App

A simple loyalty and discount reward system built for shop owners (admins) and customers (users). When users make purchases, they earn coin rewards (tokens) that can be used for discounts on future transactions.

---

## 📖 Overview

The Coin Gain App is a digital platform that facilitates a token-based reward system. When a customer (user) purchases an item from a shop owner (admin), they receive a percentage of the amount as **tokens**, valid for **6 months**. These tokens can be used to get discounts on future purchases.

For example:
- A user buys an item worth ₹1000 → receives 10% as token (₹100 worth tokens)
- On the next purchase of ₹1000 → uses ₹100 tokens → pays only ₹900

---

## 🧩 Project Structure

### 📦 Frontend (ReactJS)

Path: `frontend/`

```text
frontend/
├── src/
│ └── screens/
│ ├── admin/
│ │ ├── AdminDashboard.js
│ │ ├── History.js
│ │ ├── Home.js
│ │ └── Notification.js
│ ├── user/
│ │ ├── History.js
│ │ ├── Notification.js
│ │ ├── Profile.js
│ │ └── UserDashboard.js
│ └── SuperAdmin/
│ └── SuperAdminDashboard.js
 ```
  

#### 🧑 Admin Screens
- `AdminDashboard.js`: Overview of sales, tokens issued, redeemed, and user engagement.
- `Home.js`: Home interface for managing shop-level operations.
- `History.js`: Displays payment history from users.
- `Notification.js`: View and send alerts to users.

#### 👤 User Screens
- `UserDashboard.js`: View profile summary, token balance, and recent purchases.
- `History.js`: Shows token earnings and usage over time.
- `Notification.js`: Notifications from the admin.
- `Profile.js`: User's account and contact information.

#### 👑 Super Admin Screens
- `SuperAdminDashboard.js`: Manage all shops, admins, analytics, and platform-wide settings.

---

### 🛠 Backend (Node.js + Express)

Path: `Backend/`

```text
Backend/
├── server.js
├── config/
│ └── db.js
├── routes/
│ ├── adminRoutes.js
│ ├── authRoutes.js
│ ├── SuperAdminRoutes.js
│ └── userRoutes.js
├── controllers/
│ ├── adminController.js
│ ├── authController.js
│ ├── superAdminController.js
│ └── userController.js
├── models/
│ ├── Notification.js
│ ├── paymentHistory.js
│ ├── Superadmin.js
│ └── User.js
├── middleware/
│ ├── validators.js
│ └── verifyToken.js
 ```



#### 🔁 Routes
- **authRoutes.js** – Handles login, signup, and token generation.
- **adminRoutes.js** – Admin-specific APIs for managing rewards and users.
- **userRoutes.js** – APIs for users to view, earn, and redeem tokens.
- **SuperAdminRoutes.js** – For super admin controls and platform monitoring.

#### 📂 Controllers
Handle business logic for each user type:
- Admin: Issue/redeem tokens, view sales.
- User: View rewards, redeem points.
- SuperAdmin: Global control.
- Auth: Authentication logic.

#### 📄 Models
- **User.js** – Stores user data, token balance, and expiry.
- **Superadmin.js** – Platform-wide controller.
- **Notification.js** – Messaging system for updates.
- **paymentHistory.js** – Logs of all user transactions and token usage.

#### 🧰 Middleware
- **validators.js** – Request validation logic.
- **verifyToken.js** – JWT token verification for secured routes.

#### 🗄 Config
- **db.js** – MongoDB connection settings.

---

## 💡 Business Logic

1. **Token Earning**
   - On each purchase, users earn a percentage (e.g., 10%) of the amount in tokens.
   - Tokens are valid for 6 months from the date of issue.

2. **Token Redemption**
   - On future purchases, tokens can be applied to get discounts.
   - Remaining amount is paid via standard payment.

3. **Expiration**
   - Unused tokens expire after 6 months and are removed from user balance.

4. **Notifications**
   - Admins can notify users about token expiry, offers, or updates.

---

## 🛡 Authentication & Security

- JWT tokens are used to authenticate and authorize users/admins/superadmins.
- Middleware ensures role-based access to routes.

---

## 🛠 Tech Stack

| Layer        | Technology     |
|--------------|----------------|
| Frontend     | ReactNative.js |
| Backend      | Node.js, Express|
| Database     | MongoDB        |
| Auth         | JWT            |

---

## 📦 Installation (Dev Mode)

### Prerequisites
- Node.js
- MongoDB
- npm or yarn

### Clone the Repo

```bash
[GitHub Repo](https://github.com/opticosolution/CoinGainDev)
cd coin-gain-app

cd frontend
npm install
npm start

cd Backend
npm install
node server.js
