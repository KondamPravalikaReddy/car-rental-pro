# 🚗 CarRental Pro – Car Rental Management System

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/Frontend-React.js-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-yellow)
![Database](https://img.shields.io/badge/Database-MongoDB%2FPostgres-darkgreen)
![Payments](https://img.shields.io/badge/Payments-Stripe%2FRazorpay-purple)

> A **full-stack car rental platform** with modern UI, secure authentication, booking & payment integration, and an admin dashboard for complete rental management.

---

## 📑 Table of Contents

* [✨ Features](#-features)
* [🛠 Tech Stack](#-tech-stack)
* [📂 Project Structure](#-project-structure)
* [🗄 Database Schema](#-database-schema)
* [⚙️ Installation](#️-installation)
* [🚀 Usage](#-usage)
* [👥 Demo Accounts](#-demo-accounts)
* [🔒 Security](#-security)
* [🌐 Deployment](#-deployment)
* [🎯 Stretch Goals](#-stretch-goals)
* [📜 License](#-license)
* [📬 Contact](#-contact)

---

## ✨ Features

*  JWT-based authentication & role management (Admin/Customer)
*  Browse & filter cars by brand, model, price, location, and availability
*  Booking system with **date conflict prevention & double booking check**
*  **Stripe / Razorpay integration** with payment status tracking
*  Booking history & cancellation (before rental start)
*  Admin panel for managing cars, users, bookings & analytics
*  Protected routes & global error handling
*  Email notifications for bookings (optional)
*  **Responsive mobile-first design**

---

## 🛠 Tech Stack

* **Frontend:** React.js, React Router, Material UI
* **Backend:** Node.js, Express.js
* **Database:** MongoDB / PostgreSQL
* **Payments:** Stripe / Razorpay
* **Others:** JWT, Nodemailer (optional)

---

## 📂 Project Structure

```
car-rental-pro/
├── frontend/         # React frontend
├── backend/         # Node.js/Express backend
├── README.md
└── .env
```

---

## 🗄 Database Schema

### 👤 User

```json
{
  "_id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "hashed_string",
  "role": "customer|admin",
  "isVerified": "boolean"
}
```

### 🚗 Car

```json
{
  "_id": "string",
  "make": "string",
  "model": "string",
  "year": "number",
  "pricePerDay": "number",
  "features": ["string"],
  "images": ["string"],
  "location": "string",
  "availability": "boolean"
}
```

### 📅 Booking

```json
{
  "_id": "string",
  "userId": "string",
  "carId": "string",
  "startDate": "date",
  "endDate": "date",
  "status": "pending|confirmed|active|completed|cancelled",
  "paymentStatus": "pending|paid",
  "paymentId": "string"
}
```

### 💳 Payment

```json
{
  "_id": "string",
  "bookingId": "string",
  "userId": "string",
  "amount": "number",
  "currency": "string",
  "transactionId": "string",
  "status": "pending|completed|failed|refunded"
}
```

---

## ⚙️ Installation

1️⃣ Clone the repository

```bash
git clone https://github.com/KondamPravalikaReddy/car-rental-pro.git
cd car-rental-pro
```

2️⃣ Install backend dependencies

```bash
cd server
npm install
```

* Configure `.env` with database URL, JWT secret, and payment credentials

3️⃣ Install frontend dependencies

```bash
cd ../frontend
npm install
```

4️⃣ Run backend

```bash
npm run dev
```

5️⃣ Run frontend (in another terminal)

```bash
npm start
```

6️⃣ Access the app:

* Frontend → [http://localhost:3000](http://localhost:3000)
* Backend API → [http://localhost:5000/api](http://localhost:5000/api)

---

## 🚀 Usage

* Register/Login as **Customer or Admin**
* Browse cars & filter by brand, price, location, dates
* Book cars with **payment integration**
* Manage & cancel bookings from **user dashboard**
* Admin panel for **analytics & management**

---

## 👥 Demo Accounts

| Role     | Email                                         | Password    |
| -------- | --------------------------------------------- | ----------- |
| Admin    | [admin@example.com](mailto:admin@example.com) | admin123    |
| Customer | [john@example.com](mailto:john@example.com)   | password123 |

---

## 🔒 Security

* JWT Authentication + Role-based access
* Secure Stripe/Razorpay payment handling
* Global error handling & request validation

---

## 🌐 Deployment

Easily deploy on **Render, Vercel, Heroku, or Netlify**

* Update environment variables with **production DB + payment keys**

---

## 🎯 Stretch Goals

🚘 Google Maps API → location-based car search
📆 Availability calendar
🎟 Coupons & discounts system
📱 Progressive Web App (PWA)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

💡 Questions, issues, or suggestions?
Open an **issue** or submit a **pull request** on GitHub.

---
⭐ If you like this project, please consider giving it a ⭐ on GitHub!

Coded with ❤️ and lots of debugging 🔧 — © 2025 car-rental-pro.
