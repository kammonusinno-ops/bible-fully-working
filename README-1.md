# Bible AI Scholar (Full-Stack PostgreSQL Edition)

This is a full-stack Bible reader and AI theological assistant application built with **Node.js (Express)**, **PostgreSQL**, and a rich client-side interface featuring:
- **User Authentication**: Secure Sign In & Register with hashed passwords (bcrypt) and JWT sessions.
- **Persistent API Keys**: Save your OpenRouter and Hugging Face API keys securely to your PostgreSQL account.
- **Connectors UI**: Expandable optional AI Connectors section on the login screen with direct links (`openrouter.ai/keys` and `huggingface.co/settings/tokens`).
- **Bible Reader**: Complete Old & New Testament with offline local translations (CSB & Ilokano 1973), KJV, ASV, WEB, YLT, BSB, Tagalog, Ilocano, and Hiligaynon.
- **AI Scholar**: Interactive chatbot with hidden thinking, detailed process indicators, suggested follow-up questions, and actionable error handling.
- **Daily Devotionals & Reading Progress**: Interactive devotionals and chapter tracking.

---

## 🚀 Deploying to Railway

1. **Create a PostgreSQL Database on Railway**:
   - In your Railway project, click **New** -> **Database** -> **PostgreSQL**.
   - Railway will automatically provision a PostgreSQL database and set the `DATABASE_URL` environment variable.

2. **Deploy this Repository**:
   - Push this entire folder (`bible-fullstack`) to your GitHub repository.
   - Link the repository to your Railway project.
   - Railway will automatically detect the Node.js project, install dependencies (`npm install`), and start the app (`npm start`).

3. **Environment Variables** (Optional / Auto-configured by Railway):
   - `DATABASE_URL`: Automatically provided by Railway's PostgreSQL plugin.
   - `PORT`: Automatically assigned by Railway.
   - `JWT_SECRET`: (Optional) Custom secret string for signing auth tokens.

---

## 📁 File Structure

```
├── package.json          # Node.js dependencies & scripts
├── server/
│   ├── index.js          # Express server, auth routes, and DB pool
│   └── schema.sql        # PostgreSQL users and keys schema
└── public/
    ├── index.html        # Single-page application frontend with Auth & Reader
    ├── csb.json          # Complete CSB Bible data (local offline)
    └── ilokano1973.json  # Complete Ilokano 1973 Bible data (local offline)
```
