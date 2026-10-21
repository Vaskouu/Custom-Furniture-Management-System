# FurniPro – Custom Furniture Management System

FurniPro is a web-based system for managing custom furniture orders,
customers, and furniture configurations.

This project is developed as a 12th-grade graduation project
in Applied Programming.

## Technologies

### Frontend
- React
- TypeScript
- HTML and CSS
- Vite

### Backend
- Python
- FastAPI
- SQLAlchemy

### Database
- PostgreSQL

### Development Tools
- Visual Studio Code
- Git and GitHub
- Trello
- pgAdmin

## Project Architecture

The application follows a client-server architecture:

React Frontend → FastAPI Backend → PostgreSQL Database

The frontend handles the user interface, while the backend
processes API requests, business logic, and database operations.

## Database Structure

The initial database contains two related tables.

### Customers
- ID
- Name
- Phone
- Email

### Orders
- ID
- Customer ID
- Furniture Type
- Description
- Status

### Foreign Key Relationship

orders.customer_id → customers.id

One customer can have multiple furniture orders.

## Current Development Status

Implemented:
- FastAPI backend setup
- PostgreSQL database connection
- Customers and orders tables
- Foreign Key relationship
- Basic GET endpoints for customers and orders
- Initial React frontend setup

## Demo Version – November 4, 2026

The first functional demo will focus on backend functionality,
database integration, and relational data management.

### Planned Demo Features

- Customer CRUD operations
- Furniture order management
- Foreign Key validation
- API error handling
- React frontend connected to FastAPI
- Real-time data retrieval from PostgreSQL

## Planned Full Version

- Responsive furniture website
- Furniture catalog
- Custom furniture configurators
- Material and dimension selection
- Automatic price calculation
- Customer accounts
- Order tracking
- Administrative dashboard

## Development Workflow

The project is developed incrementally with meaningful Git commits.

GitHub is used for version control, and Trello is used for
task planning and progress tracking.

## Timeline

- October 2026: Initial architecture and database setup
- November 2026: Functional demo and core features
- December 2026: Furniture catalog and configurators
- January 2027: Advanced features and administration
- February 2027: Testing, documentation, and final presentation

---

Project: FurniPro  
Type: Graduation Project – Applied Programming  
Status: In Development