# 🔐 SecureDMS — Secure Document Management System

> **Smart India Hackathon 2026 | Problem Statement: SIH-190**  
> **Team: ByteForce** 🔥  
> A blockchain-backed, encrypted document management system for Police & Government departments.

---

## 📌 Problem Statement

Police and government agencies deal with highly sensitive documents — FIRs, evidence files, court records, investigation reports. These documents are often:
- Stored insecurely or in paper form
- Prone to tampering and unauthorized access
- Lacking a proper audit trail

**SecureDMS** solves all of these problems with a secure, role-based, blockchain-audited digital document management system.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔑 **Role-Based Access Control** | 5 roles: Super Admin, Admin, Investigator, Officer, Auditor |
| 🔒 **AES-256 File Encryption** | Every uploaded file is encrypted at rest |
| ✍️ **Digital Signatures** | RSA-SHA256 digital signing & verification |
| ⛓️ **Blockchain Audit Log** | Tamper-proof, SHA-256 chained activity log |
| 📁 **Case Management** | Create, assign, and track cases with status & priority |
| 📄 **Document Management** | Upload, download, version history, comments |
| 🔍 **Full-Text Search** | Search across all cases and documents |
| 📊 **Admin Dashboard** | System stats, user management, blockchain verification |

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM** + **SQLite** (Database)
- **AES-256-CBC** (File Encryption)
- **RSA-SHA256** (Digital Signatures)
- **SHA-256 Hash Chain** (Blockchain Audit)
- **JWT** (Authentication — Access + Refresh Tokens)
- **Socket.io** (Real-time Notifications)

### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS** (Styling)
- **Zustand** (State Management)
- **React Query** (Data Fetching)
- **React Dropzone** (File Upload)

---

## 📸 Pages / Screens

- 🔐 **Login Page** — Secure authentication
- 📊 **Dashboard** — Stats, recent cases, blockchain status
- 📁 **Cases** — List, create, filter, search cases
- 📄 **Documents** — Upload (encrypted), sign, verify, download
- 🔍 **Search** — Full-text search across all content
- 📋 **Audit Log** — Blockchain-backed tamper-proof activity log
- 👮 **Admin Panel** — User management, roles, suspend/activate
- 👤 **Profile** — Edit profile, change password

---

## 🚀 How to Run

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the Repository
```bash
git clone https://github.com/code-master11/SIH-190.git
cd SIH-190
```

### 2. Setup Backend (Server)
```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Server runs at: `http://localhost:5000`

### 3. Setup Frontend (Client)
```bash
cd client
npm install
npm run dev
```
Client runs at: `http://localhost:5173`

---

## 🔑 Test Accounts

| Email | Password | Role |
|---|---|---|
| super@dms.com | Password@123 | Super Admin |
| admin@dms.com | Password@123 | Admin |
| investigator@dms.com | Password@123 | Investigator |
| officer@dms.com | Password@123 | Officer |
| auditor@dms.com | Password@123 | Auditor |

---

## 🏗️ Project Structure

```
SIH-190/
├── client/                  # React Frontend
│   └── src/
│       ├── components/      # UI Components & Pages
│       ├── services/        # API Service Layer
│       ├── store/           # Zustand Auth Store
│       ├── types/           # TypeScript Types
│       └── utils/           # Helpers & Constants
│
└── server/                  # Express Backend
    └── src/
        ├── controllers/     # Route Handlers
        ├── routes/          # API Routes
        ├── services/        # Business Logic
        │   ├── blockchain/  # Audit Chain
        │   ├── crypto/      # Encryption & Signatures
        │   └── storage/     # File Management
        ├── middleware/      # Auth, Upload, Rate Limit
        └── prisma/          # Database Schema & Seed
```

---

## 🔐 Security Features

1. **AES-256 Encryption** — Files encrypted before storage, decrypted only on authorized download
2. **JWT Authentication** — Short-lived access tokens (15 min) + refresh tokens (7 days)
3. **Blockchain Audit** — Every action creates a SHA-256 linked block — any tampering is detectable
4. **Digital Signatures** — RSA-2048 key pairs for document authenticity
5. **Rate Limiting** — Brute force protection on login and upload endpoints
6. **Role-Based Access** — Each role sees only what they're authorized to see

---

## 👥 Team — ByteForce 🔥

**Smart India Hackathon 2026**

---

## 📄 License

This project is built for Smart India Hackathon 2026.
