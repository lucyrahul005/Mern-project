# 🛒 MERN E-Commerce WebnApp

A full-stack production-style e-commerce web application built using the MERN stack with authentication, payment integration, and automated email confirmation.

## 🚀 Live Demo

Frontend: https://mern-ecommerce-webnapp.vercel.app  
Backend API: https://webnapp-backend.onrender.com  

---

## 📌 Features

- 🔐 JWT Authentication (Register / Login)
- 🛍 Product Listing with Images
- 💳 Razorpay Payment Integration
- 📦 Order Placement & Storage
- 📧 Automatic Email Confirmation (Resend API)
- 🔒 Protected Routes
- 🌙 Premium Black & White UI
- 📱 Responsive Design
- ☁️ Cloud Deployment (Vercel + Render)

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- React Router DOM
- Axios
- SweetAlert2
- CSS (Custom Dark UI)

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Razorpay API
- Resend Email API

### Deployment
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## 📂 Project Structure

mern-ecommerce-webnapp/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── App.jsx
│ │ └── main.jsx
│ └── package.json
│
├── models/
├── middleware/
├── server.js
└── package.json


---

## 🔐 Authentication Flow

1. User registers
2. Password is hashed using bcrypt
3. JWT token is generated on login
4. Token stored in localStorage
5. Protected routes verify token using middleware

---

## 💳 Payment Flow

1. User clicks "Buy Now"
2. Razorpay order is created from backend
3. Payment popup opens
4. On successful payment:
   - Order is saved in MongoDB
   - Email confirmation is sent via Resend API

---

## 📧 Email Integration

Emails are sent using:

Resend Email API

This avoids SMTP limitations on cloud platforms and ensures reliable delivery.

---

## 🌍 Environment Variables (Backend)

Set these in Render:

MONGO_URI=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RESEND_API_KEY=


---

## 🖥 Installation (Local Setup)

### 1️⃣ Clone Repository

git clone https://github.com/xNikhilx1/mern-ecommerce-webnapp.git


### 2️⃣ Install Backend Dependencies

npm install


### 3️⃣ Install Frontend Dependencies

cd frontend
npm install


### 4️⃣ Run Backend

npm start


### 5️⃣ Run Frontend

npm run dev

---

## 🎯 What This Project Demonstrates

- Full stack architecture
- Secure authentication
- REST API design
- Third-party API integration
- Payment gateway integration
- Email automation
- Production deployment
- Cloud environment configuration

---

## 👨‍💻 About the Developer

Built by **Nikhil Geddam**  
Full Stack Developer focused on building scalable and production-ready applications.

---

---
