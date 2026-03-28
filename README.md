# 🏛️ Smart-Campus: Unified QR-Based Service System

Welcome to the **Smart-Campus** project! This is a cloud-native, full-stack solution designed to automate and secure the gate pass issuance process in engineering colleges. It replaces traditional paper-based methods with a digital, contactless QR-scanning workflow.

---

## 🚀 Project Overview & Objectives

The primary goal of this system is to bridge the gap between students, wardens, and security guards through a unified platform.

- **Digitized Gate Passes**: Students can apply for leave/gate passes via a mobile app.
- **Contactless Verification**: Security guards can verify authenticity instantly by scanning a dynamic QR code.
- **Audit Trails**: Real-time logs and history for all permissions and movements.
- **Logical Isolation**: Separate data silos for different roles to ensure high security and privacy.

---

## 🏗️ System Architecture & Data Flow

The project follows a **Cloud-Native Monolith** architecture with strict **Logical Database Isolation** and **Role-Based Access Control (RBAC)**.

### Data Flow Scenario:
1. **Student**: Submits a `GatePass` request. The request is stored in the `gate_passes` collection and linked to the `Student` entity.
2. **Backend**: Validates the request and notifies the Warden.
3. **Warden**: Reviews the request via the Warden Dashboard. Approves/Rejects based on parent consent or mentor proof.
4. **Guard**: Once approved, the student gets a QR code. The guard scans it; the backend verifies the `ROLE_GUARD` permissions and marks the pass as `USED`.

### Security Layer:
- **JWT (JSON Web Token)**: Every request is authenticated using a JWT token generated upon login.
- **RBAC**: Endpoints are strictly guarded. For example, a Student token cannot trigger a Warden's `/approve` endpoint.

---

## 🛠️ Tech Stack Snapshot

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React Native (Expo CLI), Axios, Expo-Barcode-Scanner |
| **UI Components** | React Native SVG (Claymorphism Design System) |
| **Backend** | Java 17, Spring Boot, Spring Security (JWT) |
| **Database** | MongoDB Atlas (Cloud-based nosql) |
| **Build Tool** | Apache Maven 3.9.9 |

---

## 📋 Prerequisites

Ensure you have the following installed on your developer machine:
- **Node.js** (v18+) & **npm**
- **Java JDK 17** (Amazon Corretto or OpenJDK)
- **Maven** (Included in `tools/` directory)
- **Expo Go App** (On your physical phone for testing)

---

## ⚙️ Local Setup Instructions

### 1. Clone & Prepare
```bash
git clone <repository-url>
cd Smart-Campus-Unified-Qr-Based-Service-System
```

### 2. Automatic Setup (Windows)
We have provided a one-click startup script. Run this from the root:
```powershell
.\run\run.bat
```
*This will automatically launch the Backend (Spring Boot) and Frontend (Expo) in separate terminal windows.*

### 3. Manual Startup
**Backend:**
```bash
cd backend
mvn spring-boot:run
```
**Frontend:**
```bash
npx expo start
```

---

## 🔑 Environment Variables & Configuration

### Backend (`backend/src/main/resources/application.properties`)
```properties
spring.data.mongodb.uri=mongodb+srv://user:pass@cluster.mongodb.net/smart_campus_db
server.port=8080

# JWT Secret (Keep this private)
jwt.secret=your_super_secret_base64_encoded_key_here
```

### Frontend (`src/config/api.js`)
Update the `BASE_URLS` with your local machine's LAN IP to test on physical devices:
```javascript
const BASE_URLS = [
  'http://<YOUR_LAN_IP>:8080/api/gate-pass',
  'http://localhost:8080/api/gate-pass'
];
```

---

## 🛤️ Basic API Routing Overview

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | PUBLIC | Authenticate and get JWT token |
| `/api/gate-pass` | POST | STUDENT | Submit a new pass request |
| `/api/gate-pass/pending` | GET | WARDEN | View all requests awaiting review |
| `/api/gate-pass/{id}/approve` | PUT | WARDEN | Approve a specific pass |
| `/api/gate-pass/{id}/verify` | GET | GUARD | Verify a pass by ID (QR Scan) |

---

## 🎓 Viva Preparation: Key Concepts & FAQs

Team, use this section to answer your professor's questions with confidence!

### 1. What is JWT and why did we use it?
- **Definition**: JSON Web Token is a compact, URL-safe means of representing claims between two parties.
- **Why?**: It's **stateless**. Since our backend shouldn't have to remember every logged-in user (session), the token carries all the info. It's more secure for cloud deployments.

### 2. What is "Logical Database Isolation"?
- **Concept**: Instead of putting everyone in one `users` collection, we created separate `students`, `wardens`, and `guards` collections.
- **Why?**: Even if a hacker finds a student's ID, they cannot accidentally gain Warden privileges because the query logic is separate. It's a "Security in Depth" practice.

### 3. What is RBAC (Role-Based Access Control)?
- **Concept**: We assigned roles (`ROLE_STUDENT`, `ROLE_WARDEN`, `ROLE_GUARD`) to every user.
- **Implementation**: We used `@PreAuthorize` tags in our Spring Boot controllers. If a student tries to hit a `/warden` path, the system rejects it automatically.

### 4. How are passwords secured?
- **Term**: **BCrypt Hashing**.
- **Explanation**: We NEVER store plain passwords. BCrypt adds a "salt" and hashes them multiple times. If someone steals our database, they still won't know the passwords.

### 5. Why MongoDB instead of SQL (like MySQL)?
- **Flexibility**: Gate passes can have different data (some need mentors, some don't). MongoDB is **schema-less**, allowing us to add fields without breaking existing data.
- **Speed**: MongoDB is great for handling fast read/write operations for dynamic QR codes.

### 6. What is the flow of a QR scan?
- **Step 1**: Student's app generates a QR with their `passId`.
- **Step 2**: Guard app scans it and sends a `GET /api/gate-pass/{id}/verify` request.
- **Step 3**: Guard's JWT token is validated. If authorized, the backend marks the pass as `EXITED`.

---

## 📂 Project Directory Structure

### 📱 Frontend (`/src`)
- `screens/`: Contains all physical app pages (Login, Student, Warden, Guard).
- `config/api.js`: The "brain" for network calls. It tries multiple IPs to find the server.
- `config/utils.js`: Shared helpers like `crossAlert` for Web/Mobile compatibility.
- `assets/`: Icons and brand logos.

### ⚙️ Backend (`/backend/src/main/java/com/smartcampus`)
- `model/`: Java classes that represent our database tables (GatePass, Student, etc.).
- `repository/`: Spring Data interfaces for DB actions (Save, Find, Delete).
- `service/`: The **Business Logic Layer**. This is where we decide if a pass can be approved.
- `controller/`: REST API endpoints where the frontend sends requests.
- `security/`: JWT Filter, Token Utility, and RBAC rules.

---

## 🔄 Technical Workflow (How it works under the hood)

### 1. Request Lifecycle
When a student clicks "Apply":
1. **Frontend**: Bundles the data into JSON and sends a `POST` request to `/api/gate-pass`.
2. **Security Filter**: `JwtAuthenticationFilter` checks the `Authorization` header. If valid, it tells the system "This is a Student".
3. **Controller**: Receives the data and sends it to `GatePassService`.
4. **Service**: Saves it in MongoDB and returns the saved object with a unique **ObjectId**.

### 2. Mentor & Parent Verification Logic
- **Parent Verification**: Warden clicks "Call/WA". This sets `parentApprovalStatus` to `APPROVED` in the database.
- **Mentor Proof**: If the pass requires a mentor, the student must upload an image. The Warden reviews the image and clicks "Mentor Approve".
- **Final Approval**: Only AFTER both are done, the Warden can click the main "Approve" button. If they try earlier, the backend throws a `RuntimeException` which we handled to show a nice error message!

---

## 🛠️ Troubleshooting for Teammates

- **"App not connecting"**: Ensure your phone and PC are on the same Wi-Fi. Check your LAN IP in `src/config/api.js`.
- **"500 Internal Server Error"**: Usually means the database is down or there's a coding bug. Check the `backend_log.txt` (or the terminal running the server).
- **"Login Failed"**: Check if the seeder (`SmartCampusApplication.java`) has run and the user exists in your MongoDB Atlas cluster.

---

## 🔍 Deep Dive: Technologies & Libraries

### 📱 Frontend (React Native + Expo)
- **Expo Framework**: Used for rapid development and easy deployment to "Expo Go".
- **React Navigation**: Handles the navigation stack (e.g., switching from Login to Student Dashboard).
- **React Native SVG**: This is the secret behind the **Claymorphism** UI. We use it to draw soft shadows and 3D-like shapes.
- **Expo Barcode Scanner**: Integrated in the Guard's module to access the camera and decode QR data.
- **React Native QRCode SVG**: Used by students to generate a unique, data-embedded QR code after pass approval.
- **Poppins Google Fonts**: Used for that premium, clean typography.

### ⚙️ Backend (Spring Boot + MongoDB)
- **Spring Boot 3.2.5**: The backbone of our RESTful API.
- **Spring Security 6.x**: The "Police" of our app. It handles **JWT Authentication** and **RBAC**.
- **JJWT (Java JWT)**: A library used to create (sign) and read (parse) the JSON Web Tokens.
- **Spring Data MongoDB**: Maps our Java classes (Models) directly to MongoDB collections without writing complex queries.
- **Lombok**: Uses annotations like `@Data` and `@AllArgsConstructor` to keep the code clean and readable by auto-generating getters, setters, and constructors.
- **BCrypt**: A strong password-hashing function that makes our user credentials virtually unhackable.

---

## 🏗️ Technical Architecture Details (For Teammates)

- **Security Flow**: `HttpRequest` -> `JwtAuthenticationFilter` -> `SecurityContextHolder` -> `Controller`.
- **Data Layer**: `GatePassService` coordinates logic between `GatePassRepository` and the various user repositories.
- **Frontend Design**: We used **Claymorphism** for a modern, 3D "puffy" look using `react-native-svg`.

---

## 🤝 Contribution Guidelines
When contributing, ensure you follow the **RBAC** patterns. If adding a new feature, update the `SecurityConfig` and ensure the proper `@PreAuthorize` tags are added to your controllers.

**Team, let's build the future of campus security together!** 🚀
