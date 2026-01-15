# 📦 Ken Samudio - Matthew & Melka: Inventory Management System

This is a **full-stack web application** designed for streamlined inventory management. It features a robust **Role-Based Access Control (RBAC)** system tailored for **Admin**, **Sales**, **Production**, and **Finance** roles.

---

## 🛠 Prerequisites

Before running the system, ensure you have the following installed on your local machine:

* **Node.js** (v14 or higher)
* **PostgreSQL** (v12 or higher)
* **npm** (Node Package Manager)
* **VS Code** (recommended editor)
---

## 📦 System Dependencies

### Backend (Node.js/Express)
The following libraries handle server logic, database connectivity, and security:
* **express**: Web framework for API routing.
* **pg**: PostgreSQL client for Node.js.
* **dotenv**: Manages environment variables for security.
* **cors**: Enables communication between Frontend and Backend.
* **nodemailer**: Handles OTP email delivery for security.

### Frontend (React/Vite)
The following libraries power the user interface and navigation:
* **react-router-dom**: Manages dynamic routing and role-based access.
* **axios**: Performs HTTP requests to the backend server.
* **react-icons**: Provides iconography for sidebars and UI elements.
* **tailwindcss**: Utility-first CSS framework for custom styling.

---

## 🗄 Database Configuration (PostgreSQL)

> **⚠️ NOTE:** The SQL script provided below is for **initial testing and development purposes only**. It is **not the final database schema** and is subject to change as the system evolves.

Follow these steps to set up the testing database structure on your local machine:

1.  Open **pgAdmin 4**.
2.  Create a new database named `ims_database`.
3.  Execute the following SQL script to create the temporary tables and relationships:



```sql
-- Step 1: Create PersonalData Table
CREATE TABLE PersonalData (
    User_ID SERIAL PRIMARY KEY,
    FirstName VARCHAR(255) NOT NULL,
    MiddleName VARCHAR(255),
    LastName VARCHAR(255) NOT NULL,
    Contact_No VARCHAR(20),
    Email VARCHAR(255) UNIQUE NOT NULL,
    Profile_Image TEXT
);

-- Step 2: Create UserLogin Table
CREATE TABLE UserLogin (
    LoginID SERIAL PRIMARY KEY,
    User_ID INTEGER NOT NULL REFERENCES PersonalData(User_ID) ON DELETE CASCADE,
    User_Account VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    User_Role VARCHAR(20) DEFAULT 'admin',
    OTP_Code VARCHAR(6),
    OTP_Expiry TIMESTAMP,
    Is_Locked BOOLEAN DEFAULT FALSE,
    Last_Login TIMESTAMP
);
```

# 🚀 Installation Guide

This guide explains how to install and run the **Ken Samudio - Matthew & Melka Inventory Management System** on your local machine.

---

## 1️⃣ Get the Source Code

You can get the project files in two ways:

### Option A: Clone via Git (Recommended)
Open your terminal or command prompt and run:
```bash
git clone [https://github.com/angelcms31/KSMM-inventory-management-system.git](https://github.com/angelcms31/KSMM-inventory-management-system.git)
cd KSMM-inventory-management-system
```
---

## 2️⃣ Install Dependencies 
For this step, you must use Visual Studio Code (VS Code) to ensure all packages are installed correctly within the project environment.

1. Open VS Code.

2. Go to File > Open Folder... and select the KSMM-inventory-management-system folder.

3. Open the Integrated Terminal by pressing Ctrl + \`` (backtick) or going to Terminal > New Terminal`.

Server Dependencies

From the root directory, navigate to the server folder:

```bash
cd server
```

Install the server dependencies by running:

```bash
npm install
```

Client Dependencies

From the root directory, navigate to the client folder:

```bash
cd client
```

Install the client dependencies by running:

```bash
npm install
```
---

# ⚙️ Environment Setup

This document explains how to update the existing environment configuration for the  
**Ken Samudio - Matthew & Melka Inventory Management System**.

---

## 📁 Existing `.env` File

The `.env` file is **already provided** inside the **server** folder.  
You **do not need to create a new one**.

---

## 🔧 Database Configuration Update

Open the existing `.env` file and **update only the database-related values** according to your PostgreSQL setup:

```env
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_HOST=localhost
DB_NAME=ims_database
DB_PORT=5432
```
## 📧 Email Configuration

This section contains the email configuration used for **OTP (One-Time Password)** functionality.

### ⚠️ Important Notice

**Do NOT modify** the email configuration below.  
These values are **already configured** and required for the system’s OTP feature to function properly.

---

## Running the System
To start the application, you must run two separate terminals in VS Code simultaneously:

Terminal 1 (Backend Server):

```bash

# Run from the root folder
node app.js
```

Terminal 2 (Frontend/React):

```bash
# Open a second terminal tab, then run:
cd client
npm run dev
```
The system will be accessible in your browser at: http://localhost:5173.

