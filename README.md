# Donor Hub - Riphah Blood Society

Donor Hub is a powerful, community-driven platform designed to streamline blood donation management. It connects donors with those in need, manages blood requests, and provides administrators with real-time statistics and management tools.

![Donor Hub Logo](file:///e:/riphah_blood_society/donor_hub/src/assets/logo.png)

## 🚀 Key Features

### 🩸 For Donors & Users
- **Easy Registration**: Quick signup with essential details like Blood Group, City, University, and Age.
- **Secure Authentication**: Email-verified accounts with secure password management.
- **Profile Management**: Maintain your donation history, contact details, and visibility settings.
- **Real-time Search**: Find donors by blood group, city, or university instantly.
- **Blood Requests**: Create and track urgent blood requests.

### 🛡️ For Administrators
- **Comprehensive Dashboards**: Interactive charts and cards showing donation trends and donor distribution.
- **Donor Management**: Complete control over donor records, including verification and editing.
- **Event Management**: Organize and promote blood donation camps and events.
- **University Management**: Manage a global list of universities and departments.
- **Statistical Accuracy**: Precise tracking of actual donations using advanced MongoDB aggregation.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Node.js, Express.
- **Database**: MongoDB (via Mongoose).
- **Communication**: Email notifications via Nodemailer.
- **Architecture**: Modular MVC-style backend with a clean React component structure.

## 📦 Components Overview

- **Admin/SuperAdmin Dashboards**: Robust statistics and system-wide overview.
- **Donor List**: Searchable and filterable table of all registered donors.
- **Blood Request Flow**: Dedicated page for managing and responding to blood needs.
- **Events Manager**: Tool for organizing society events.
- **Universal Input Formatting**: Automatic Title Case formatting for consistent and professional data storage.

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HafizAbeer/donor_hub_with_mongodb.git
   cd donor_hub
   ```

2. **Backend Setup**:
   - Navigate to `backend/`
   - Create a `.env` file with:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     EMAIL_SERVICE=gmail
     EMAIL_USERNAME=your_email
     EMAIL_PASSWORD=your_app_password
     ```
   - Run `npm install`
   - Start with `node server.js`

3. **Frontend Setup**:
   - Navigate to root directory
   - Run `npm install`
   - Start development server with `npm run dev`

## 🌟 Recent Enhancements
- **Accurate Donation Tracking**: Implemented `$lookup` joins to count actual donation records instead of estimates.
- **Clean Data Entry**: Added aggressive Unicode normalization and automatic `Title Case` formatting for all names and locations.
- **Demographic Depth**: Integrated a mandatory `Age` field across the entire signup and profile management flow.

---
Developed for **Riphah Blood Society**.
