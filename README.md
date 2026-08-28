# TransitX — Bus Tracking and Management System

TransitX is a real-time Bus Tracking and Management System built using the MERN stack. Designed specifically as a college semester project, it incorporates real-time WebSocket communication, Leaflet map overlays with OpenStreetMap, and an automated GPS simulator.

---

## Technical Stack
- **Frontend**: React.js (Vite), Tailwind CSS, React Router, Lucide Icons, Axios, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO Server
- **Database**: MongoDB (Mongoose ODM)
- **Maps**: Leaflet.js with OpenStreetMap (Free, requires no billing/API key)
- **Auth**: JSON Web Tokens (JWT) & Bcrypt password hashing

---

## Folder Structure
```
transitx/
├── backend/
│   ├── config/          # Database connection (db.js)
│   ├── models/          # MongoDB schemas (User, Bus, Route, Trip)
│   ├── controllers/     # Route logic functions (auth, bus, route, driver)
│   ├── routes/          # Express route endpoints mapping
│   ├── middleware/      # Protected route guards (authMiddleware)
│   ├── seed.js          # Pre-populated demo data script
│   └── server.js        # Main entry point (REST APIs + Socket.IO connection)
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI (Navbar, PrivateRoute, Leaflet Map)
│   │   ├── pages/       # Admin Dashboard, Driver Panel, Passenger Home, Login
│   │   ├── context/     # Auth state context manager
│   │   └── services/    # Fetch API network handlers
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
└── README.md
```

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [MongoDB](https://www.mongodb.com/) running locally on default port `27017` (e.g. MongoDB Community Edition).

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. A default `.env` file is already created for you in the `backend/` folder with these variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/transitx
   JWT_SECRET=transitx_super_secret_jwt_key_123456
   ```
4. Seed the database with sample routes, buses, and user accounts:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm start
   ```
   *The server should run on http://localhost:5000*

### 2. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
   *The client application should run on http://localhost:3000*

---

## Demo Walkthrough Guide

To test the application's real-time features, open two different browser windows side-by-side:

### Step 1: Open Passenger Portal
- Navigate to `http://localhost:3000/`.
- This is the public view requiring no login.
- You will see a search bar and a list of seeded buses:
  - `KA-01-F-1234` (Route 101 - Campus Express)
  - `KA-03-HA-5678` (Route 202 - IT Corridor)
  - `KA-05-M-9012` (Route 303 - North-South Link)
- Click on any bus. Since the bus is currently `inactive` (not running), you'll see a notice: *"This bus is not running active trips right now. Showing last known coordinates."*

### Step 2: Simulate Driver Trip
- Open another tab/window and go to `http://localhost:3000/login`.
- Login as a **Driver** using:
  - Email: `john@transitx.com`
  - Password: `driverpassword`
- You will see the Driver Dashboard showing John's assigned bus (`KA-01-F-1234`) and route (`Route 101 - Campus Express`).
- Click the **Start Trip & Broadcast** button.
- The simulator will connect over WebSocket and begin transmitting GPS coordinates traversing stops Majesty Terminal -> Indiranagar -> K.R. Puram -> Whitefield.

### Step 3: Real-Time Tracking & ETA (Passenger View)
- Go back to the Passenger Home window.
- Select the bus `KA-01-F-1234` again.
- You will see:
  1. The bus marker is now active and moving smoothly along the blue dotted route line in real-time.
  2. The ETA Card updates every 2 seconds, displaying the distance remaining (in km) and estimated minutes of arrival to the chosen stop.
  3. You can select different stops on the dropdown to compute the distance and ETA to that particular stop!

### Step 4: Admin Controls & Management
- Go to `http://localhost:3000/login` and log in as the **Admin**:
  - Email: `admin@transitx.com`
  - Password: `adminpassword`
- The **Admin Dashboard** provides:
  - **Overview**: summary cards of active trips, unassigned drivers, and buses.
  - **Buses Tab**: CRUD actions. Create new buses, edit details, or assign them to a different route/driver.
  - **Routes Tab**: CRUD actions. Define custom route lines and add stops sequence with latitude/longitude.
  - **Live Map**: A global tracking map rendering markers for all buses. Active buses will display green pulsing circles and update live as their coordinates change.
