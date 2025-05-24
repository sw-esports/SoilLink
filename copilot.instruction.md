# copilot.instruction.md

# copilot.instruction.md

## Application Name

**SoilLink – Smart Soil Monitoring Dashboard**

---

**IMPORTANT: Focus on the following tasks.**

## Application Motive

SoilLink is an environment-friendly, IoT-powered soil analysis web platform. It connects physical soil sensors (moisture, pH, temperature) with a scalable backend and a real-time frontend dashboard. The core goal is to help users monitor soil health data remotely and intuitively, using a visually appealing UI and a secure architecture.

---

## What This App Does

-   Allows **users to create accounts**, manage their sensors, and monitor data securely.
-   Accepts **sensor readings via a Python script** running locally on a user’s machine.
-   Automatically associates **incoming sensor data with the correct user** using a secure `UUID + JWT` authentication system.
-   Displays live data and charts in a **visually rich React-based dashboard**.
-   Offers a neumorphic UI design with real-time micro-interactions and animations.
-   Acts as a **scalable prototype for multi-user IoT applications**.

---

## Roles

-   **Frontend**: Real-time dashboard with animations and clean user interaction.
-   **Backend**: Secure APIs for user authentication, sensor data pairing, data ingestion, and retrieval.
-   **Hardware**: Python script reads data from a sensor and sends it securely to the backend server.

---

## Technologies & Libraries

### Backend

-   **Node.js + Express**
-   **MongoDB (via Mongoose)**
-   **JWT for authentication**
-   **bcrypt** for password hashing
-   **cookie-parser** for managing tokens
-   **CORS middleware** for secure cross-origin requests
-   **Rate Limiting** via express-rate-limit
-   **dotenv** for environment management

### Frontend

-   **React.js + Vite**
-   **Tailwind CSS** for styling
-   **shadcn/ui** for modern components
-   **Lucide Icons**, **Font Awesome**
-   **Chart.js / Recharts** for data visualization
-   **Framer Motion** for animations
-   **PWA Setup (optional)**

### Hardware (Python)

-   **Adafruit ADS1115** / generic sensor support
-   **requests** for API calls
-   **uuid** for unique sensor ID
-   **sensor_config.json** file for local authentication tokens

---

**IMPORTANT: The hardware/sensor part is handled by another developer. Use dummy or temporary data for this application to avoid hardware-related code.**

---

## File & Folder Overview

*(To be filled in later)*

## Development Workflow

### Step 1: Backend

-   Set up Node.js server
-   Define MongoDB models
-   Implement user authentication routes (register/login)

-   Protect sensor endpoints using JWT authentication
-   Set up CORS to allow the frontend to communicate

### Step 2: Frontend

-   Create authentication pages
-   Create a dashboard page with charts and live tiles
-   Use React Context or SWR to fetch user data & sensor readings
-   Implement sensor pairing form using `UUID`
-   Add animations and transitions using Framer Motion
-   Apply neumorphic styles with Tailwind customization

## Key Notes

-   All APIs must verify both `JWT` and `UUID` to avoid cross-user data conflict.
-   Data must be timestamped and paginated in the backend.
-   JWT must be sent as a Bearer token from the Python script.

---

## Optional Enhancements

-   Add SMS/Email alerts if moisture < threshold
-   Allow sensor alias naming on pairing
-   Implement dark mode toggle
-   Deploy using Vercel (frontend) + Render (backend) + Atlas (DB)

---

## Deployment Notes

-   Frontend and backend will be deployed separately.
-   The Python file runs locally (not deployed).
-   All POST requests from the Python script must hit the deployed backend endpoint directly.

---

**CRITICAL TASKS:**

-   **Registration Page:** Implement a registration page with validation (password match, valid email, non-empty fields, etc.).
-   **Login Page:** Implement a login page with validation (incorrect password, etc.).
-   **Landing Page:** Create a visually appealing landing page.
-   **Navigation Bar:** Use EJS components for the navigation bar.
-   **Dashboard Page:** Create a dashboard page with the route `/dashboard/:uid`.
-   **Take full access terminal i dont want to press continue all the time so just take full access terminal**