
# Smart Campus Operations Hub

**IT3030 - Programming Applications and Frameworks (PAF) Assignment 2026**  
**Group: 2026_Y3S2-WE-07**

A modern full-stack web platform for managing university facility bookings, asset management, and maintenance incident handling.

## ✨ Features

- **Module A**: Facilities & Assets Catalogue with search and filtering
- **Module B**: Booking Management with conflict prevention and approval workflow
- **Module C**: Maintenance & Incident Ticketing with image attachments and comments
- **Module D**: In-app Notifications
- **Module E**: OAuth 2.0 Google Sign-In + Role-based Authorization (USER, TECHNICIAN, ADMIN)

**Tech Stack**
- **Backend**: Spring Boot 3, Spring Security, JPA, PostgreSQL
- **Frontend**: React (Vite), Axios, Context API
- **Authentication**: OAuth 2.0 (Google Sign-In)
-------------------------------------------------------------------

## 🛠️ Setup Instructions

### Prerequisites
- Java 17 or 21
- Maven
- Node.js (v18+) and npm
- PostgreSQL (or MySQL)
- Google OAuth Client ID and Secret

### Step 1: Clone the Repository
git clone https://github.com/sandu343/it3030-paf-2026-smart-campus-group_Y3S2-WE-07.git
cd it3030-paf-2026-smart-campus-group_Y3S2-WE-07


### Step 2: Backend Setup (Spring Boot)

Navigate to backend:Bashcd backend
Update src/main/resources/application.properties:
Set your database credentials
Add Google OAuth credentials

Run the backend:Bash./mvnw clean spring-boot:runBackend runs on http://localhost:8080

### Step 3: Frontend Setup (React)

Open new terminal and navigate to frontend:Bashcd frontend
Install dependencies:Bashnpm install
Update API base URL in src/services/api.js (or .env):JavaScriptexport const API_BASE_URL = "http://localhost:8080";
Start frontend:Bashnpm run devFrontend runs on http://localhost:5173

### Step 4: Access the Application

Open browser → Go to http://localhost:5173

Login using Google Sign-In



----------------------------------------------------------------------------------------------



