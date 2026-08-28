# Implementation Walkthrough — TransitX Goa Campus Edition

TransitX is successfully scaffolded, seeded, and configured with dynamic pricing, scroll-responsive navigation, and all 20 Goa Quitol coordinates centering!

All files are located in the subdirectory:
`C:\Users\soham\.gemini\antigravity\scratch\transitx`

---

## 🛠️ Components Implemented

### 1. Full 20 Goa Campus Bus Routes (`seed.js` & `StudentDashboard.jsx`)
- **Seeded Routes**: Populated all 20 routes from the official Parul University Goa transport sheet. Every line correctly maps intermediate stops and terminates at **PU Goa Campus (Quitol)** (`lat: 15.1389, lng: 73.9669`).
  - **Group 1 (₹45,000 PA)**: Route 1 (Marcel), Route 2 (Bicholim), Route 3 (Sanquelim), Route 4 (Mapusa), Route 5 (Porvorim).
  - **Group 2 (₹40,000 PA)**: Route 6 (Panjim), Route 7 (Bambolim), Route 8 (Vasco), Route 9 (Ponda), Route 10 (Old Goa).
  - **Group 3 (₹35,000 PA)**: Route 11 (Canacona), Route 12 (Sanguem), Route 13 (Curchorem), Route 14 (Verna), Route 15 (Cortalim), Route 16 (Pillar).
  - **Group 4 (₹30,000 PA)**: Route 17 (Margao), Route 18 (Quepem).
  - **Group 5 (₹25,000 PA)**: Route 19 (Cuncolim), Route 20 (Chinchinim).
- **Dynamic Pricing Dropdown**: The subscription selector loops through all 20 routes in the database, automatically adjusting monthly, semesterly, and annual costs based on the specific route's pricing group.

### 2. Scroll-Responsive Navigation (`Navbar.jsx`)
- **Auto-Hide Menu**: Built state controllers inside the navigation header to monitor scroll vectors:
  - Scrolling **down** hides the Navbar by shifting it upwards (`-translate-y-full`).
  - Scrolling **up** (or sitting at the very top of the page) slides the Navbar back down smoothly into view (`translate-y-0`).

### 3. Goa Campus Quitol Location Centering (`components/Map.jsx`)
- **College Location**: Centered the Leaflet Map component default focus center on the Quitol campus coordinates (`[15.1389, 73.9669]`) at zoom level `11`.

### 4. Glowing Footer Component (`components/Footer.jsx` & `App.jsx`)
- **Visual Design**: Embedded a bottom footer styled in deep slate (`#030712`) featuring a glowing cyan/sky-blue border top shadow projecting upwards (`shadow-[0_-12px_30px_-8px_rgba(56,189,248,0.15)]`).
- **Official Campus Directories**: Integrated the Parul University Goa Campus contact points directly:
  - Transport Manager: `+91 9213001447`
  - Assistant Transport Manager: `+91 8605320843`

### 5. Black & Dark Blue Theme Customization (`index.css` & Page Wrappers)
- **Global Stylesheet Overrides**: Updated `index.css` to globally map standard Tailwind classes into a custom slate-950 (black) and dark blue palette.
- **QR Code Legibility Guard**: Implemented a `.qr-code-wrapper` style constraint to preserve high-contrast white space for simulated QR pass codes so they remain scanner-scannable.

### 6. Public Landing Page with Background Video (`pages/Home.jsx`)
- **Video Hero Section**: Plays the uploaded video (`bg_video.mp4`) loopingly in the background with a dark blur overlay (`bg-slate-950/85`).

---

## 🚀 How to Run and Verify the App

- **MongoDB Service**: Running on port `27017`
- **Backend server**: [http://localhost:5001](http://localhost:5001)
- **Frontend client**: [http://localhost:3001](http://localhost:3001)
