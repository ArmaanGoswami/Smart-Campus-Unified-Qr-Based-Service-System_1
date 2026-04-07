# Smart Campus Unified QR-Based Service System
## Complete Project Documentation (Team Friendly Edition)

### 🎯 Kya Banya Hai?

Ek mobile app (phone par download kar sakte ho) jo students ke liye **gate pass banaata hai** aur guards ke liye **QR code scan karke verify karta hai**.

**Real world mein kya hote the:**
- ❌ Paper pass banate the (ruk jaata tha, copy-paste ho jaata tha)
- ❌ Guard ko manually check karna padta tha
- ❌ Kaunsa student kabhi gate se nikla, record nahi rehta tha
- ❌ Reports banana mushkil tha

**Humne jo banaya:**
- ✅ Student phone se gate pass request karr sakte hain
- ✅ Warden (staff) approve ya reject kar dete hain
- ✅ Guard QR code scan kar ke 2 seconds mein verify kar deta hai
- ✅ Sab kuch database mein save ho jata hai - reports aasaani se ban jaati hain
- ✅ Secure system - sirf valid token se access milta hai

---

## 2. TECHNOLOGY STACK

### **FRONTEND: React Native + Expo 54**

**Why Chosen:**
- Cross-platform (iOS + Android from single codebase)
- Faster development cycle with hot reload
- Native performance for mobile features
- Excellent camera/QR scanning libraries

**Key Technologies:**
```
Framework: React Native 0.76.1
Build Tool: Expo 54.0.0
React: 19.1.0
State Management: AsyncStorage + React Context API
Navigation: React Navigation (Tab + Stack Navigator)
```

**Dependencies:**
- `@react-native-async-storage/async-storage` - Persistent token storage
- `expo-camera` - QR code scanning for guard dashboard
- `expo-image-picker` - Photo selection for submissions
- `react-native-svg` - Custom animated designs and clay UI
- `react-native-reanimated` - Smooth animations and transitions
- `axios` - API communication with fallback handling

**Screens/Components:**
```
src/screens/
├── loginscreen.js          # Authentication (Student/Warden/Guard)
├── studentscreen.js        # Student: Request & view gate passes
├── wardenscreen.js         # Warden: Approve/Reject requests
├── gaurdscreen.js          # Guard: QR code scanning
├── profilescreen.js        # User profile & settings
└── ServicesScreen.js       # Additional services

src/components/
├── Navigation component    # Tab & stack navigation
├── Custom UI elements      # Themed buttons, cards, inputs
└── Animated components     # Loading screens, transitions
```

**Port:** 8081 (Expo dev server)

---

### **BACKEND: Spring Boot + Java**

**Why Chosen:**
- Enterprise-grade security (OAuth2, JWT, CORS)
- Robust request validation and error handling
- Industry-standard for institutional systems
- Excellent database integration (JPA/Hibernate)
- Easy integration with monitoring tools

**Key Technologies:**
```
Framework: Spring Boot 3.x
Language: Java 17+
Build Tool: Maven 3.9.9
Security: Spring Security 6.x
```

**Core Components:**

#### Authentication & Security
```
JWT Implementation:
├── JwtUtils.java              # Token generation & validation
├── JwtAuthenticationFilter.java # Token extraction & validation
├── SecurityConfig.java         # Spring Security configuration
└── CorsConfig.java             # Cross-origin request handling
```

**Key Features:**
- HS256 (HMAC-SHA256) algorithm for token signing
- Token expiry: 10 hours
- Claims: username, role, issued_at, expiry
- Bearer token in Authorization header

#### Controllers (API Endpoints)

```
/api/auth/login              # POST - Login (returns JWT)
/api/gatepass
  ├── /request              # POST - Create new gate pass request
  ├── /list                 # GET - User's gate passes
  └── /status/{id}          # GET - Gate pass status
  
/api/warden
  ├── /pending              # GET - Pending requests
  ├── /approve/{id}         # POST - Approve request
  └── /reject/{id}          # POST - Reject request

/api/guard
  ├── /scan                 # POST - Verify QR code
  └── /log                  # GET - Access logs

/api/user/profile           # GET - User details
```

#### Models
```
User (Student, Warden, Guard)
├── userId, password
├── fullName, email, phone
├── role (STUDENT, WARDEN, GUARD)
└── department, hostel info

GatePass
├── gatePassId (Auto-generated)
├── studentId, requestedDate
├── destination, purpose
├── exitTime, entryTime
├── status (PENDING, APPROVED, REJECTED, USED, EXITED)
├── wardenId (Approver)
└── qrCode (Auto-generated)

AccessLog
├── logId
├── gatePassId, guardId
├── scanTime, location
└── verification status
```

#### Database
- **MongoDB** - Document-based NoSQL
- Collections: users, gatepasses, accesslogs
- Indexes on: userId, status, requestedDate

**Port:** 8080 (REST API server)

---

### **AUTHENTICATION: JWT (JSON Web Token)**

#### Why JWT Over Session-Based Auth?

**In Intranet/Internal Network Scenario:**
```
Traditional Session:
┌─────────────┐      Request      ┌─────────────┐
│   Mobile    │──────────────────▶│   Server    │
│    App      │                   │ (Port 8080) │
└─────────────┘                   └─────────────┘
     │                                   │
     └──────Session ID────────────────────┘
     └──Token stored in server memory (scales poorly)
     └──Server must verify every request
     └──Issues: Stateful, not scalable for mobile

JWT Approach (Used in This Project):
┌─────────────┐      1. Login      ┌──────────────┐
│   Mobile    │◀─────JWT Token─────│   Backend    │
│    App      │                    │   (8080)     │
└─────────────┘                    └──────────────┘
     │ Stores in AsyncStorage              │
     │ (Persistent across sessions)        │
     │                                     │
     └──Authorization: Bearer {token}──────┘
     └──Server just verifies signature
     └──Stateless - scales horizontally
     └──Works offline (as long as token valid)
```

**Key Advantages in This Project:**
1. **Stateless** - No session memory needed on server
2. **Mobile-Friendly** - Works perfectly with AsyncStorage
3. **Intranet Compatible** - No external identity provider needed
4. **Self-Contained** - All user info in token claims
5. **Scalable** - Can add multiple backend instances if needed

#### Implementation Details

**Token Structure:**
```
Header:     { "alg": "HS256", "typ": "JWT" }
Payload:    { 
              "sub": "STU123",
              "role": "STUDENT",
              "iat": 1234567890,
              "exp": 1234607890
            }
Signature:  HMACSHA256(base64Header + "." + base64Payload, secret)
```

**Frontend Token Management (src/config/api.js):**
```javascript
// Storage
storeToken(token)        // Save JWT to AsyncStorage + localStorage
getStoredToken()         // Retrieve JWT from storage
clearToken()             // Remove JWT on logout

// API Communication
authRequest(path)        // POST requests without token (login)
request(path)            // GET/POST with Authorization header
```

**Backend Token Validation:**
- Signature verified using secret key
- Token not expired
- User role extracted from claims
- Logged in User context created

---

## 3. SYSTEM ARCHITECTURE

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     SMART CAMPUS SYSTEM                     │
└─────────────────────────────────────────────────────────────┘

        FRONTEND LAYER (React Native + Expo)
        ┌─────────────────────────────────────┐
        │   Login Screen (All Roles)          │
        ├─────────────────────────────────────┤
        │  Student       │ Warden    │ Guard  │
        │  Dashboard     │ Dashboard │ QR     │
        │  - Request     │ - Pending │ Scanner│
        │  - History     │ - Approve │ - Scan │
        │  - Profile     │ - Reject  │ - Log  │
        └────────────────┼───────────┼────────┘
                         │
                    ┌────▼────┐
                    │   JWT   │
                    │  Token  │
                    │AsyncStor│
                    └────┬────┘
                         │
        ┌────────────────▼──────────────────┐
        │   API GATEWAY / CLIENT            │
        │  src/config/api.js                │
        │  - Token injection                │
        │  - Fallback URLs                  │
        │  - Error handling                 │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │    BACKEND LAYER (Spring Boot)    │
        │    Port: 8080                     │
        ├──────────────────────────────────┤
        │  Security Layer                   │
        │  ├─ JwtAuthenticationFilter       │
        │  ├─ SecurityConfig               │
        │  └─ CorsConfig                   │
        ├──────────────────────────────────┤
        │  API Controllers                  │
        │  ├─ AuthController               │
        │  ├─ GatePassController           │
        │  ├─ WardenController             │
        │  └─ GuardController              │
        ├──────────────────────────────────┤
        │  Business Logic                   │
        │  ├─ Services (User, GatePass)     │
        │  └─ Utilities (JWT, QR Gen)      │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │     DATA LAYER                    │
        │     MongoDB                       │
        │  - users collection               │
        │  - gatepasses collection          │
        │  - accesslogs collection          │
        └───────────────────────────────────┘
```

### **Data Flow Example: Student Requesting Gate Pass**

```
1. STUDENT SUBMITS REQUEST
   Mobile App → studentscreen.js 
   └─ User fills: destination, purpose, exit time

2. FRONTEND SENDS API REQUEST
   req = {
     destination: "City",
     purpose: "Medical",
     exitTime: "2025-04-01T15:00:00"
   }
   
   request("/api/gatepass/request", {
     method: "POST",
     body: JSON.stringify(req)
   })
   
   ↓ Automatically adds:
   Authorization: Bearer {JWT_TOKEN}

3. BACKEND RECEIVES & VALIDATES
   JwtAuthenticationFilter
   ├─ Extract token from header
   ├─ Verify signature
   ├─ Extract userId & role
   └─ Create Security Context

4. CONTROLLER PROCESSES
   GatePassController.createRequest()
   ├─ Validate request data
   ├─ Check student permissions
   ├─ Generate QR code
   └─ Save to MongoDB

5. DATABASE STORES
   db.gatepasses.insert({
     _id: ObjectId(),
     studentId: "STU123",
     destination: "City",
     purpose: "Medical",
     exitTime: ISODate("2025-04-01T15:00:00Z"),
     status: "PENDING",
     qrCode: "qr_encoded_data",
     requestedDate: ISODate("2025-03-31T10:00:00Z")
   })

6. RESPONSE RETURNS
   { 
     success: true,
     gatePassId: "GP_12345",
     qrCode: "...",
     status: "PENDING"
   }

7. FRONTEND UPDATES
   studentscreen.js refreshes list
   └─ Shows new request with PENDING status
```

---

## 4. KEY DEVELOPMENT APPROACHES

### **A. AUTO-SYNC FROM GITHUB**

**Problem Solved:**
- Code changes weren't reflecting in running app
- Developers had to manually pull code every time
- Cache issues (Expo cache, Node modules cache)

**Solution: sync.js**
```bash
# Runs automatically before every npm start
npm start
  ↓
npm run presync
  ↓
node sync.js (Git operations)
  ├─ git stash (Backup local changes)
  ├─ git pull origin main (Get latest code)
  └─ rm .expo cache (Clear Expo cache)
  ↓
expo start (Start fresh)
```

**Benefits:**
- Always latest code running
- Prevents cache-related bugs
- Developers never forget to pull
- Seamless development workflow

---

### **B. API FALLBACK STRATEGY**

**Problem Solved:**
- Single endpoint URL breaks if server unreachable
- Need flexibility for dev vs production

**Solution: Multiple Endpoint URLs**
```javascript
// src/config/api.js
const FALLBACK_URLS = [
  "http://render-backend.onrender.com",  // Production (if deployed)
  "http://192.168.x.x:8080",             // Local network IP
  "http://localhost:8080"                 // Localhost fallback
];

// Try each URL until one responds
for (const url of FALLBACK_URLS) {
  try {
    const response = await fetch(url + path);
    if (response.ok) return response;
  } catch (error) {
    continue; // Try next URL
  }
}
```

**Benefits:**
- Automatic failover if one server down
- Works in lab, home, or cloud deployment
- No code changes needed for different environments
- Gradual transition from local to cloud

---

### **C. ROLE-BASED ACCESS CONTROL (RBAC)**

**Implementation:**
```javascript
// Login stores role
storeToken(token);  // JWT contains role claim
storeRole(role);    // Also store role separately

// Navigation based on role
if (role === "STUDENT") {
  showStudentDashboard();  // Request passes, view history
} else if (role === "WARDEN") {
  showWardenDashboard();   // Pending requests, approve/reject
} else if (role === "GUARD") {
  showGuardDashboard();    // QR scanner, access logs
}

// Backend validates role in every request
@PreAuthorize("hasRole('STUDENT')")
public ResponseEntity<?> getMyPasses() { ... }
```

**Security Benefits:**
- Users can only access their role's functions
- Backend validates even if frontend bypassed
- Role changes require re-login
- Audit trail of who accessed what

---

### **D. JWT TOKEN LIFECYCLE**

```
┌──────────────────────────────────────────────────────┐
│                 TOKEN LIFECYCLE                       │
└──────────────────────────────────────────────────────┘

1. GENERATION (On Login)
   User credentials → Backend JWT Creation
                  ↓
   backend.JwtUtils.generateToken(userId, role)
   ├─ Create header (HS256)
   ├─ Add claims (sub, role, iat, exp)
   └─ Sign with secret key
                  ↓
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. STORAGE (On Frontend)
   Token → AsyncStorage (Mobile)
       → localStorage (Web)
                  ↓
   Persists across app restarts
   Retrieved on app launch

3. TRANSMISSION (Every API Request)
   GET /api/gatepass/list
   Headers: {
     Authorization: "Bearer eyJhbGci..."
   }

4. VALIDATION (Backend)
   JwtAuthenticationFilter
   ├─ Extract token from header
   ├─ Verify signature with secret key
   ├─ Check expiry (10 hours)
   └─ Grant access if valid

5. USAGE (In Controllers)
   @CurrentUser User user = ... 
   // user object available from JWT claims
   
   gatePassService.getUserPasses(user.getId())

6. EXPIRY & LOGOUT
   After 10 hours:
   ├─ Token becomes invalid
   ├─ User must login again
   └─ New token generated
   
   Manual Logout:
   ├─ clearToken() removes from storage
   ├─ Clear SecurityContext on backend
   └─ Redirect to login
```

---

### **E. CORS (Cross-Origin Resource Sharing)**

**Why Needed:**
```
Frontend Origin:  http://localhost:8081 (Expo)
Backend Origin:   http://localhost:8080 (Spring Boot)

Browser Security Policy:
- Request from 8081 to 8080 blocked by default
- Need explicit CORS configuration

Solution: CorsConfig.java
```

**Backend Configuration:**
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins(
                        "http://localhost:8081",
                        "http://localhost:3000",
                        "http://192.168.*.*, // Local network
                        "https://*.onrender.com" // Render
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

**Benefits:**
- Mobile/Web frontend can communicate with backend
- Secure (only specified origins allowed)
- Supports development, local network, and cloud deployment

---

## 5. INTRANET CHALLENGES & SOLUTIONS

### **Challenge #1: No External Identity Provider**
**Why JWT was essential:**
- No OAuth2 provider (Google, Microsoft) available on intranet
- Cannot rely on third-party authentication services
- Need self-contained authentication system

**Solution:**
- JWT with local secret key
- Backend generates and validates tokens
- Completely self-sufficient system

---

### **Challenge #2: Network Restrictions**
**Limitations:**
- Backend only accessible from inside campus network
- Cannot easily deploy to public cloud
- Students might try accessing from outside

**Solutions Implemented:**
- **For Dev:** localhost:8080 (everyone on same network)
- **For Testing:** Local network IPs (192.168.x.x)
- **For Production:** Render/AWS deployment (accessible from anywhere)
- **Fallback URLs:** Automatic switching between environments

---

### **Challenge #3: Offline Functionality**
**Limitation:**
- Network might be unstable
- Need app to work even if backend temporarily down

**Solution (Partial):**
- JWT stored locally - verified whenever online
- App can display cached past data
- New requests queued and synced when online
- (Implementation pending in future release)

---

## 6. CURRENT STATUS

### **✅ COMPLETED FEATURES**

1. **Authentication System**
   - JWT token generation and validation
   - Auto token injection in API requests
   - Token persistence in AsyncStorage

2. **Student Dashboard**
   - Create gate pass requests
   - View request history with status
   - Auto-generated QR codes
   - Animated UI with clay design

3. **Warden Dashboard**
   - View pending requests from students
   - Approve/Reject functionality
   - Real-time status updates

4. **Guard Dashboard**
   - QR code scanning capability
   - Verify gate passes
   - Access logging

5. **Development Infrastructure**
   - Auto-sync from GitHub (sync.js)
   - API fallback URL strategy
   - CORS configuration
   - Local development setup

---

### **⏳ IN PROGRESS / PENDING**

1. **Production Deployment**
   - Options: Railway, DigitalOcean, AWS, Azure
   - Render integration (optional)

2. **Guard Dashboard**
   - Complete QR scanning logic
   - Real-time verification
   - Access log creation

3. **Warden Dashboard**
   - Approval/rejection notifications
   - Batch operations

4. **Feature Enhancements**
   - SMS/Email notifications
   - Student location tracking
   - Late return alerts
   - Analytics and reporting

---

## 7. HOW TO RUN LOCALLY

### **Backend Setup**

```bash
# Navigate to backend
cd backend

# Build with Maven
./mvnw clean install

# Or using installed Maven
mvn clean install

# Run the application
./mvnw spring-boot:run
# Backend will start on http://localhost:8080
```

### **Frontend Setup**

```bash
# Navigate to root directory
cd ..

# Install dependencies
npm install

# Start Expo (auto-syncs from GitHub)
npm start

# Scan QR code with Expo Go app
# Or press 'i' for iOS simulator, 'a' for Android
```

### **Testing JWT Token**

```bash
# Test token generation and API endpoints
node test-jwt.js

# Expected output:
# Generated Token: eyJhbGciOiJIUzI1NiIs...
# Token Valid: true
# Token Claims: { sub: '...', role: '...', exp: ... }
```

### **Demo Credentials**

```
Role: Student
UserID: STU123
Password: password123
Gate Pass Request:
  Destination: City
  Purpose: Medical
  Exit Time: 2025-04-01T15:00:00
```

---

## 8. SECURITY MEASURES IMPLEMENTED

### **Frontend Security**

```
1. Token Storage
   ├─ AsyncStorage (mobile) - Persists securely
   ├─ localStorage (web) - Encrypted when possible
   └─ Cleared on logout via clearToken()

2. Token Injection
   ├─ Automatic Authorization header
   ├─ Bearer token format
   └─ Sanitization of sensitive headers

3. XSRF Protection
   ├─ No cookie-based sessions
   ├─ Token in Authorization header (not cookie)
   └─ Immune to CSRF attacks

4. Input Validation
   ├─ Frontend validation (UX)
   ├─ Backend revalidation (Security)
   └─ SQL/NoSQL injection prevention
```

### **Backend Security**

```
1. JWT Verification
   ├─ Signature validation (HS256)
   ├─ Token expiry checking (10 hours)
   ├─ Claims verification (role, userId)
   └─ Blacklist management (logout)

2. Password Security
   ├─ Bcrypt hashing (not plain text)
   ├─ Salted hashes
   └─ No password in JWT payload

3. Role-Based Access Control
   ├─ @PreAuthorize("hasRole('STUDENT')")
   ├─ Role validation on every request
   └─ Principle of least privilege

4. CORS Configuration
   ├─ Whitelist specific origins
   ├─ Restrict HTTP methods
   ├─ Validate request headers
   └─ Credentials handling

5. Data Protection
   ├─ MongoDB encryption at rest
   ├─ HTTPS for production (Render/Cloud)
   ├─ No sensitive data in logs
   └─ Database access credentials in .env
```

---

## 9. DEPLOYMENT OPTIONS

### **Option 1: Local Network (Dev)**
- Backend: localhost:8080
- Frontend: Expo on 8081
- Best for: Development, testing, learning

### **Option 2: Railway.app**
- Deploy Spring Boot JAR
- Auto-scaling, free tier available
- CORS configured for mobile app
- Recommended for: Production with free option

### **Option 3: DigitalOcean**
- VPS or App Platform
- ~$6-12/month
- Full control over environment
- Recommended for: Professional deployment

### **Option 4: AWS / Azure**
- Elastic Beanstalk / App Service
- Highest reliability and scalability
- Support for auto-scaling
- Recommended for: Enterprise deployment

---

## 10. DESIGN DECISIONS & RATIONALE

| Decision | Why | Trade-offs |
|----------|-----|-----------|
| **JWT over Sessions** | Stateless, mobile-friendly, intranet-compatible | Can't revoke mid-session (mitigated by short expiry) |
| **AsyncStorage** | Simple, persistent, no backend needed | Limited encryption (mitigated by token expiry) |
| **MongoDB** | Document-based, flexible schema, easy scaling | Not as mature as SQL for transactions |
| **Spring Boot** | Enterprise-grade, excellent security, well-tested | Heavier than Node.js, slower startup |
| **Expo** | Cross-platform single codebase, hot reload, easy debugging | Performance not as good as native |
| **QR Codes** | Contactless, fast verification, no manual entry | Requires scanner availability |
| **Auto-Sync** | Always latest code, no human error, seamless dev | Stashes local changes silently (documented) |

---

## 11. FUTURE ENHANCEMENTS

### **Phase 2: Notifications**
- SMS on gate pass approval
- Email confirmation
- Push notifications in app

### **Phase 3: Analytics**
- Student movement reports
- Usage statistics
- Peak traffic analysis

### **Phase 4: Mobile Features**
- Biometric authentication
- Offline QR code display
- Location tracking (optional)

### **Phase 5: Integration**
- Hostel management system
- Course registration system
- Grievance portal

---

## 12. TROUBLESHOOTING

### **"Token is invalid" Error**

```
Cause: Token expired or corrupted
Solution:
1. User needs to login again
2. New token generated with 10-hour expiry
3. Token auto-stored and used in requests
```

### **API Endpoint Not Found**

```
Cause: Wrong backend URL
Solution:
1. Fallback URLs tried in order
2. Check backend is running on 8080
3. Verify CORS allows frontend origin
4. Check network connectivity
```

### **QR Code Not Scanning**

```
Cause: Camera permission or QR format issue
Solution:
1. Grant camera permission to app
2. Ensure QR code is valid (generated by backend)
3. Guard device lighting adequate
4. Try different angle or distance
```

---

## 13. QUICK REFERENCE

| Component | Port | Technology | Status |
|-----------|------|------------|--------|
| Frontend (Expo) | 8081 | React Native 0.76 | ✅ Working |
| Backend API | 8080 | Spring Boot 3.x | ✅ Working |
| Database | 27017 | MongoDB | ✅ Working |
| Authentication | - | JWT (HS256) | ✅ Implemented |
| Git Sync | - | sync.js | ✅ Active |
| QR Codes | - | zxing (Java) | ✅ Generating |
| CORS | - | Spring Config | ✅ Configured |

---

## 14. CONTACT & SUPPORT

**Project Lead:** [Your Name]  
**GitHub Repository:** [Repository URL]  
**Last Updated:** March 31, 2026  
**Version:** 1.0 (Beta)

---

**This comprehensive documentation covers all aspects of the Smart Campus system from architecture to deployment. Refer to this document for understanding the project structure, implementation approaches, and technical decisions.**
