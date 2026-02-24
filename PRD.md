# Product Requirement Document (PRD) - Donor Hub

## 1. Project Overview
**Donor Hub** is a centralized blood donation management system designed for the Riphah Blood Society. Its primary goal is to maintain a high-quality, verified database of blood donors and facilitate the quick connection between donors and patients in urgent need.

## 2. Target Audience
- **Donors**: Individuals willing to donate blood.
- **Admins**: Society members who verify donors and manage events.
- **Super Admins**: System administrators with full control over users, roles, and global settings.

## 3. Functional Requirements

### 3.1 User & Donor Management
- **Registration**: Support for full user profiles (Name, Email, Phone, Age, Blood Group, City, University, Department, Hostelite status).
- **Verification**: Mandatory email verification via code for all new signups.
- **Admin Verification**: Admins must be able to verify donor records and mark them as active.
- **Search & Discovery**: Advanced filtering of donors by Blood Group, City, and University.

### 3.2 Analytics & Dashboards
- **Admin Stats**: Visualization of donors by city and university.
- **SuperAdmin Stats**: System-wide growth metrics and topographical data.
- **Accuracy**: Calculations must reflect actual donation records from the database using MongoDB `$lookup`.

### 3.3 Communication & Alerts
- **Blood Requests**: Users can post requests that are broadcasted to relevant donors (simulated via database/UI).
- **Email Notifications**: Automated emails for verification codes and system alerts.

### 3.4 Data Integrity
- **Title Case Normalization**: All text inputs (Names, Cities, Addresses) must be automatically formatted to Title Case.
- **Unicode Support**: Removal of hidden characters and zero-width spaces during registration and stats processing.

## 4. Technical Requirements

### 4.1 Frontend
- **Framework**: React.js with Vite for high-performance builds.
- **Styling**: Tailwind CSS for responsive, modern UI.
- **Icons**: Lucide-React for consistent iconography.
- **Charts**: Recharts for data visualization.

### 4.2 Backend
- **Runtime**: Node.js with Express.js.
- **Database**: MongoDB for flexible, document-oriented storage.
- **ORM**: Mongoose for schema-based data modeling.
- **Security**: JWT for session management and Bcrypt for password hashing.

### 4.3 Deployment
- **Platform**: Vercel (Frontend/API orchestration).
- **Database**: MongoDB Atlas for cloud-hosted data.

## 5. UI/UX Design Goals
- **Accessibility**: High contrast and elder-friendly typography.
- **Responsiveness**: Fully functional on mobile, tablet, and desktop.
- **Dark Mode Support**: System-wide toggle for user preference.

## 6. Future Scope
- **Push Notifications**: Integration with service workers for real-time mobile alerts.
- **Gamification**: Badges and certificates for regular donors.
- **Map Integration**: Visual map of registered donors per region.
