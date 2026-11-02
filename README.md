# FurniPro — Custom Furniture Management System

FurniPro is a web application for managing custom furniture orders, customers, and materials. It is being developed as a **12th-grade graduation project in Applied Programming**.

The project is currently focused on its **administration system**. A public furniture website and product configurator are planned for later development; they are **not yet part of the completed application**.

## Current Development Status

**In development — intermediate demo: November 4, 2026.**

### Implemented

- Administrative interface built with React and TypeScript.
- Customer management: view, create, edit, and delete customer records.
- Order management: view, create, edit, and delete furniture orders.
- Material management: view, create, edit, and delete materials.
- Order–material management: assign materials and quantities to orders, and edit or remove those assignments.
- PostgreSQL database integration with relationships between customers, orders, and materials.
- User login, password hashing, and JWT-based authentication.
- Role-based API access control (`admin`, `designer`, and `client`).
- Administrative API endpoints for user management.
- API documentation through FastAPI's `/docs` page.
- `/health` endpoint for checking API and database connectivity.

### Verified So Far

- The frontend builds successfully with `npm run build`.
- The `/health` endpoint has confirmed that the API is online and the PostgreSQL connection is working.

These checks do not mean every workflow has been fully tested or that the application is ready for production.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, HTML, CSS |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| Authentication | Password hashing, JSON Web Tokens (JWT) |
| Development tools | Visual Studio Code, Git, GitHub, pgAdmin, Trello |

## Architecture

The application follows a client–server architecture:

```text
User in browser
      |
      v
React + TypeScript frontend
      | HTTP / JSON
      v
FastAPI backend
      | SQLAlchemy / SQL
      v
PostgreSQL database
```

The frontend handles forms, tables, navigation, and user interactions. The backend validates requests, checks permissions, and reads or updates records in PostgreSQL.

### Main Project Files

```text
FurniPro/
├── backend/
│   ├── main.py          # API routes and application logic
│   ├── auth.py          # Password verification and JWT handling
│   └── database.py      # PostgreSQL connection configuration
└── frontend/
    └── src/
        └── App.tsx      # Main administrative interface and state
```

This is a simplified overview, not the complete folder structure.

## Database Relationships

The implemented system includes these core relationships:

- **Customers → Orders:** one customer can have multiple orders (`orders.customer_id` → `customers.id`).
- **Orders → Order Materials:** each order can include multiple material entries.
- **Materials → Order Materials:** the same material can be used in multiple orders.

The `order_materials` table connects orders with materials and stores the required quantity for each entry.

## API Overview

The backend provides endpoints for:

| Resource | Main operations |
| --- | --- |
| `/customers` | Customer CRUD |
| `/orders` | Order CRUD |
| `/materials` | Material CRUD |
| `/order-materials` | Manage materials assigned to orders |
| `/auth/login` | User authentication |
| `/auth/me` | Information about the signed-in user |
| `/users` | Administrative user management |
| `/health` | API and database health check |

The exact request and response schemas can be viewed at **`http://127.0.0.1:8000/docs`** when the backend is running.

## Running the Project Locally

**Requirements:** Python, Node.js with npm, PostgreSQL, and the project's configured database tables and environment variables.

### 1. Backend

Open a terminal in the `backend` directory. Make sure the project's Python virtual environment and dependencies are installed, and configure the database connection and authentication settings in your local `.env` file.

On Windows, start FastAPI with:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Wait for `Application startup complete`, then open:

- API docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local address displayed by Vite (usually `http://localhost:5173`). If the backend runs at a different URL, configure `VITE_API_URL` accordingly.

**Security:** Do not commit `.env` files, database passwords, or JWT secrets to GitHub.

## Planned Development

The next development stages may include:

- Public website with home page, furniture catalog, team information, and contact page.
- Custom furniture configurator with dimensions, materials, colors, and component placement.
- Product and category management connected to the database.
- Customer accounts, quote requests, and order tracking.
- Estimated price calculation for furniture configurations.
- Extended administrative features, testing, and deployment improvements.

These features are **planned**, not claimed as implemented.

## Development Workflow

Development is tracked with Git and GitHub. Changes are organized into small, meaningful commits, with tasks and priorities managed through Trello.

The current repository is the foundation for the final project. Future work will build on the existing React, FastAPI, and PostgreSQL code rather than replacing the application from scratch.

## Project Information

- **Project:** FurniPro
- **Type:** 12th-grade Graduation Project — Applied Programming
- **Current stage:** Working administrative foundation; further development in progress
- **Repository:** https://github.com/Vaskouu/Custom-Furniture-Management-System
