# Donor Hub Backend

This is the Node.js/Express backend for the Donor Hub application.

## Prerequisites
- Node.js installed
- MongoDB installed and running locally on port 27017 (or update `.env`)

## Setup & Run

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm run dev
    ```
    The server will start on port **5000**.

## Project Structure
- `config/db.js`: Database connection config.
- `controllers/`: Request logic (Auth, User).
- `models/`: Mongoose models (User/Donor).
- `routes/`: API routes definitions.
- `middleware/`: Auth middleware (JWT protection).
- `server.js`: Entry point.

## API Endpoints

### Auth
- `POST /api/auth/signup`: Create a new account.
- `POST /api/auth/login`: Login.
- `GET /api/auth/me`: Get current user profile (Protected).

### Users (Donors)
- `GET /api/users`: Get all donors (supports filters: `bloodGroup`, `city`, `search`).
- `POST /api/users`: Add a new user (Admin only).
- `PUT /api/users/:id`: Update user.
- `DELETE /api/users/:id`: Delete user (Admin only).

## Notes
- Default password for users added via "Add User" form in admin panel is `password123`.
