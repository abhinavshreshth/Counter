# MakeMyTrade 🧠💹

A full-stack, modular, real-time trading simulation platform built with:

- Node.js + Express + Redis + PostgreSQL
- C++ + ZeroMQ + Redis + libpq
- Modern frontend (HTML/CSS/JS)
- SOLID architecture in both JS & C++

---

## 🚀 Features

✅ User login/signup with session handling  
✅ Session stored in PostgreSQL (connect-pg-simple)  
✅ Redis-powered real-time order streaming  
✅ C++ backend generates and sends orders via ZeroMQ  
✅ WebSocket frontend with sortable, styled trade table  
✅ Toast notifications and live DOM updates

---

## 📦 Tech Stack

- Frontend: HTML + CSS + JS
- Backend: Node.js + Express
- Realtime: Socket.IO + Redis
- C++: Order simulation engine with ZeroMQ
- Database: PostgreSQL + Redis
- Build system: CMake for C++

---

## 🛠️ Setup Instructions

1. Clone the project
2. Create PostgreSQL DB `makemytrade`
3. Run schema:  
   ```bash
   psql -U postgres -d makemytrade -f sql/schema.sql
