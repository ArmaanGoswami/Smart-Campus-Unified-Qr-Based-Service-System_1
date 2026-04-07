# 🎓 Smart Campus - Complete Project Guide (Team Edition)

**Likhne wale:** [TU NA - Lead Developer]  
**Bakiyon ka kaam:** Samjhna aur maintain karna  
**Last Update:** March 31, 2026

---

## 1️⃣ PROJECT KA BASIC IDEA

### Kya Problem Tha?

Campus mein gate pass ke liye:
- 📝 **Paper pass** likha padta tha (ruk-jata, tear hota, copy ban jata)
- 👮 **Guard ko manually check** karna padta tha (time waste)
- 📊 **Records nahi hote the** (kiski pass kab use hui, pata nahi)
- 🤔 **Reports banana impossible** tha

### Humne Kya Banaya?

✅ **Mobile app** - Student apne phone se gate pass request karega  
✅ **Approval system** - Warden (staff) 2 seconds mein approve/reject karega  
✅ **QR code verify** - Guard QR scan karega, automatically verify hoga  
✅ **Database** - Sab records automatically save honge (reports aasan)  
✅ **Security** - Sirf authorized students ko pass milega

### Kaise Kaam Karega?

```
STUDENTS:
  1. Phone mein app khol
  2. Login karo (STU123 / password123)
  3. Gate pass request bhejo (destination, time add karke)
  4. Warden ko notification mila -> approve/reject karega
  5. Approved pass ka QR code dikhega
  6. Gate par guard ko dikhao -> QR scan ho jaayega ✅

WARDEN (Staff):
  1. Login karo (role: WARDEN)
  2. Pending requests dekho
  3. Each student ke details check karo
  4. Approve ya Reject button press karo
  5. Record database mein save ho jaata hai

GUARD:
  1. Login karo (role: GUARD)
  2. Camera khul jaata hai
  3. Student pass se QR scan karo
  4. System automatically check karega:
     - Is pass valid hai?
     - Expired toh nahi?
     - Pehle scan hua ya nahi?
  5. ✅ atau ❌ dikhayega
```

---

## 2️⃣ TECHNOLOGY KYA HAI?

### 📱 FRONTEND (Phone app - jo users dekh payenge)

**Technology:** React Native + Expo

**Simple Explanation:**
- **React Native** = Ek programming language jo Android + iPhone dono pe chalti hai
- **Expo** = Tool jo development ke time easy banata hai (QR scan karke test kar sakte ho)

**Phone mein Jo Features Hain:**
```
LoginScreen
  ├─ Username/Password input
  ├─ Role select (Student/Warden/Guard)
  └─ Login button

StudentScreen
  ├─ Create new gate pass form
  │   ├─ Destination (jahan jaana hai)
  │   ├─ Purpose (medical/family visit/urgent)
  │   └─ Exit Time (kab nikle ge)
  ├─ View my requests (sab past requests)
  │   ├─ Status (PENDING/APPROVED/REJECTED)
  │   └─ QR Code (approved pass ka)
  └─ History

WardenScreen
  ├─ See all PENDING requests
  ├─ View student details
  ├─ Approve button
  └─ Reject button

GuardScreen
  ├─ Camera on
  ├─ Student QR scan
  ├─ Verify (is pass valid hai?)
  └─ Log access (entry/exit record)
```

**Data Storage mein Phone:**
- Phone mein **Token** (secret pass) save hoti hai
- Token ke liye `AsyncStorage` use hote hain (phone memory mein permanently)
- Jab bhi internet disconnect ho toh bhi token phone mein rehti hai

---

### 🖥️ BACKEND (Server - Jo data rakhti hai)

**Technology:** Spring Boot + Java

**Simple Explanation:**
- **Spring Boot** = Framework jo server banane mein madad karta hai
- **Java** = Programming language

**Kya Kaam Karti Hai:**
```
Login API (/api/auth/login)
  ├─ Username/password lete ho
  ├─ Database mein verify karte ho
  ├─ Valid hai toh JWT Token generate karte ho (secret pass)
  └─ Token user ke paas bhej dete ho

Gate Pass API (/api/gatepass/...)
  ├─ Student ke pass request save karte ho database mein
  ├─ Auto QR code generate karte ho
  ├─ Warden ko notification bhejte ho
  └─ Status update track karte ho

Warden API (/api/warden/...)
  ├─ Pending requests push karte ho
  ├─ Approve/Reject action save karte ho
  └─ Email/SMS notification bhejna

Guard API (/api/guard/...)
  ├─ QR scan verify karte ho
  ├─ Pass valid hai ya expired check karte ho
  ├─ Entry/Exit log karte ho
  └─ Analytics data collect karte ho
```

---

### 🗄️ DATABASE (Data ki almaari)

**Technology:** MongoDB

**Kya Store Hoga:**

```
USERS COLLECTION
├─ STU123 (Student)
│   ├─ Name: Raj Kumar
│   ├─ Email: raj@campus.edu
│   ├─ Hostel: H-101
│   └─ Role: STUDENT
├─ WAR456 (Warden/Staff)
│   ├─ Name: Mr. Singh
│   ├─ Department: Hostel Management
│   └─ Role: WARDEN
└─ GAR789 (Guard)
    ├─ Name: Ram
    ├─ Gate Assignment: Main Gate
    └─ Role: GUARD

GATE_PASSES COLLECTION
├─ GP_12345 (Pass #1)
│   ├─ Student: STU123
│   ├─ Destination: City
│   ├─ Purpose: Medical
│   ├─ Exit Time: 2025-04-01 15:00
│   ├─ Status: APPROVED ✅
│   ├─ QR Code: [encoded]
│   ├─ Approved By: WAR456
│   └─ Request Date: 2025-03-31 10:30
├─ GP_12346
│   ├─ Status: PENDING ⏳
│   └─ ...
└─ GP_12347
    ├─ Status: REJECTED ❌
    └─ ...

ACCESS_LOGS COLLECTION
├─ Entry #1001
│   ├─ Pass ID: GP_12345
│   ├─ Guard: GAR789
│   ├─ Scan Time: 2025-04-01 15:05
│   ├─ Gate: Main Gate
│   ├─ Type: ENTRY
│   └─ Status: VERIFIED ✅
└─ Entry #1002
    ├─ Pass ID: GP_12345
    ├─ Type: EXIT
    └─ ...
```

---

## 3️⃣ SECURITY - KYUN JWT TOKEN?

### 🔐 JWT Token Kya Hota Hai?

**Simple Example:**
```
JW-Token = Ek secret locked box jada:
├─ Student ka ID (STU123)
├─ Student ka Role (STUDENT)
├─ Issue time (kab banaya)
└─ Expiry time (kab expire hoga - 10 ghante baad)

Har Token mein ek SIGNATURE hota hai (lock jaise)
Sirf backend janta hai ye lock kaise khoolna hai
```

### Pehle Kya Hota Tha vs Ab Kya Hota Hai?

```
BEFORE (Session-based):
Student Login ─────────> Backend
                         ├─ File mein session ID likhi
                         ├─ Session memory store ki
                         └─ Return session ID
Student API Call -----> Backend
                         ├─ Session ID check karo
                         ├─ File mein search karo
                         └─ Request allow karo
                         
Problem: Agar 100 requests ho toh 100 bar file check karna padega
         Multiple servers ho toh sync karna mushkil

AFTER (JWT Token-based):
Student Login ─────────> Backend
                         ├─ Secret token banao
                         ├─ Student ID + Role encode karo
                         └─ Return token
Student App ----------> Phone mein TOKEN SAVE
Student API Call -----> Authorization: Bearer <TOKEN>
                         ├─ Backend signature verify karta hai (instant)
                         ├─ Expired check karta hai
                         └─ Request allow karo
                         
Advantage: Sirf signature check (0.01 seconds)
           Multiple servers ho toh bhi kaam karega
           Phone offline ho jaye toh bhi token valid
```

### Token Lifetime:

```
Timeline:
├─ Login: Student ko token milta hai
├─ Token issued: 1000 AM
├─ Token Expiry: 1010 AM (10 hours baad)
├─ 1005 AM: Token valid ✅ (API calls karo)
├─ 1010 AM: Token expired ❌ (dubara login karo)
└─ 1010 AM+: NEW Token mile
```

---

## 4️⃣ HOW IT WORKS - STEP BY STEP

### Scenario 1: Student Gate Pass Request

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: STUDENT LOGIN                                   │
└─────────────────────────────────────────────────────────┘

Student App:
  ├─ Username: STU123
  ├─ Password: password123
  ├─ Role: STUDENT
  └─ Login Button Press

Phone ─────── sends ────────> Backend (8080)
              STU123 + pwd

Backend:
  ├─ Database check: STU123 password valid? ✅
  ├─ JWT Token banao (secret key se lock karo)
  ├─ Token content:
  │   ├─ ID: STU123
  │   ├─ Role: STUDENT
  │   ├─ Issued: 10:00 AM
  │   ├─ Expires: 8:00 PM
  │   └─ [SIGNATURE - LOCKED]
  └─ Return token

Phone ─────── gets token ────────> Phone mein save
              eyJhbGciOiJIUzI1...

Phone Memory (AsyncStorage):
  ├─ TOKEN: eyJhbGciOiJIUzI1...
  ├─ ROLE: STUDENT
  ├─ USER_ID: STU123
  └─ (Ye token har request ke saath bhejta hai)

Screen Change: LoginScreen ──> StudentScreen


┌─────────────────────────────────────────────────────────┐
│ STEP 2: STUDENT CREATES GATE PASS                       │
└─────────────────────────────────────────────────────────┘

Student Screen:
  ├─ Destination: "City"
  ├─ Purpose: "Medical"
  ├─ Exit Time: "2025-04-01 15:00"
  └─ Submit Button

Phone ─────── sends ────────> Authorization: Bearer eyJhbGci...
                              Data: destination, purpose, time

Backend receives:
  ├─ Token extract karo header se
  ├─ Signature verify karo (iska hi signature match?)
  ├─ Token expired? Nahi ✅
  ├─ Student ID: STU123
  ├─ Database mein gate pass create karo:
  │   ├─ ID: GP_12345 (auto)
  │   ├─ Student: STU123
  │   ├─ Destination: City
  │   ├─ Purpose: Medical
  │   ├─ Exit Time: 2025-04-01 15:00
  │   ├─ Status: PENDING
  │   └─ QR Code: [auto generated]
  ├─ Send notification to all wardens
  └─ Return: "Request submitted successfully"

Phone ────────────────────> "Request Submitted ✅"
                             Refresh student screen
                             New request in list: PENDING status

Student Screen:
  └─ My Requests
      ├─ ID: GP_12345
      ├─ Destination: City
      ├─ Status: ⏳ PENDING
      └─ Created: 2025-03-31 10:30


┌─────────────────────────────────────────────────────────┐
│ STEP 3: WARDEN APPROVES REQUEST                         │
└─────────────────────────────────────────────────────────┘

Warden (Staff):
  ├─ Login: WAR456 (role: WARDEN)
  ├─ Gets token (sirf warden role wala)
  └─ Screen: Pending Requests

Warden App:
  └─ Can only see PENDING requests (token mein role check)

Warden sees:
  ├─ GP_12345 - Raj Kumar to City (Medical)
  ├─ [View Details Button]
  │   ├─ Student Name: Raj Kumar
  │   ├─ Hostel: H-101
  │   ├─ Past passes: None
  │   ├─ [Approve Button] [Reject Button]
  │   └─ [Add Note]
  └─ [Approve]

Phone ─────── sends ────────> Authorization: Bearer [TOKEN]
              Action: APPROVE
              Gate Pass ID: GP_12345

Backend:
  ├─ Warden token verify
  ├─ GP_12345 update:
  │   ├─ Status: APPROVED ✅
  │   ├─ Approved By: WAR456
  │   ├─ Approval Time: 2025-03-31 10:35
  │   └─ Generate QR Code (if not existed)
  ├─ Database save
  └─ Send notification to student

Student App:
  └─ Notification: "Your gate pass approved! ✅"
     Request status changes: PENDING ──> APPROVED
     QR Code visible now


┌─────────────────────────────────────────────────────────┐
│ STEP 4: GUARD SCANS QR CODE                             │
└─────────────────────────────────────────────────────────┘

Next Day - 3:00 PM:

Student:
  ├─ Phone nikal
  ├─ Student App open
  ├─ Approved pass dikhta hai
  ├─ QR Code visible
  └─ Gate par jaata hai

Guard:
  ├─ Approved pass request: GP_12345
  ├─ Login: GAR789 (role: GUARD)
  ├─ Opens Guard Screen
  └─ Camera opens

Guard ──────> Points camera at QR code

Camera:
  ├─ QR Code scan hota hai
  ├─ Data extract: GP_12345, STU123, APPROVED, expires: 2:00 AM next day
  └─ Send to backend

Backend:
  ├─ Token verify (guard ka)
  ├─ QR data: GP_12345, STU123
  ├─ Database query:
  │   ├─ Pass found? ✅
  │   ├─ Status = APPROVED? ✅
  │   ├─ Expired? Nahi ✅
  │   ├─ Already scanned? Nahi ✅
  │   └─ All checks pass ✅
  ├─ Update:
  │   ├─ Status: USED
  │   ├─ Entry logged: 3:05 PM
  │   ├─ Guard: GAR789
  │   └─ Location: Main Gate
  └─ Return: "VERIFIED ✅ - Raj Kumar can enter"

Guard Phone:
  ├─ ✅ VERIFIED
  ├─ Student: Raj Kumar
  ├─ Hostel: H-101
  ├─ Entry Time: 3:05 PM
  └─ [Next Student]
```

---

## 5️⃣ AUTO-SYNC SYSTEM KYA HAI?

### 🔄 sync.js - Code Update Automatic

**Problem Tha:**
```
Developer ne production code GitHub push kiya

But phone test device mein:
❌ Pehla code chal raha tha
❌ New feature nahi tha
❌ Manual "git pull" karna padta tha
❌ Cache clear karna padta tha
```

**Solution - sync.js:**

```
npm start
  │
  └─> npm run presync
       │
       └─> node sync.js (Automatic running)
            │
            ├─ git stash (local changes backup)
            ├─ git pull origin main (Latest code)
            ├─ Clear caches (.expo, node_modules)
            └─ npm finish
                │
                └─> expo start (Fresh app!)

Benefits:
✅ Always latest code
✅ No manual git operations
✅ No cache issues
✅ Seamless development
✅ Team members ko easy setup
```

---

## 6️⃣ RUNNING PROJECT LOCALLY

### Start Backend:

```bash
cd backend

# Option 1: Using Maven wrapper
./mvnw spring-boot:run

# Option 2: Using Maven directly
mvn spring-boot:run

# Backend starts on: http://localhost:8080
```

### Start Frontend:

```bash
cd ..  (root directory)

npm install  (First time only)

npm start    (Auto-syncs + starts Expo)

# Expo starts on: http://localhost:8081
# Open Expo Go app on phone, scan QR code
```

### Quick Test:

```bash
# Test token generation and verify
node test-jwt.js

# Output:
# ✅ Token generated successfully
# ✅ Token is valid
# ✅ Can make API calls
```

### Demo Login Credentials:

```
Student:
  ID: STU123
  Password: password123
  Role: STUDENT

Warden:
  ID: WAR456
  Password: wardenpass
  Role: WARDEN

Guard:
  ID: GAR789
  Password: guardpass
  Role: GUARD
```

---

## 7️⃣ DATA FLOW - SIMPLIFED DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                 SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────┘

MOBILE APPS (Phone PE):
┌─────────────────────────┐
│  Student/Warden/Guard   │
│  React Native App       │
├─────────────────────────┤
│ - Login Screen          │
│ - Token Storage (Local) │
│ - Auto-inject token     │
│ - QR Scanner (Guard)    │
└────────────┬────────────┘
             │
             │ HTTP/HTTPS
             │ Token in header
             ▼
┌────────────────────────┐
│  SPRING BOOT BACKEND   │ (port 8080)
├────────────────────────┤
│ Security Layer:        │
│ - JWT Verification     │
│ - Token validation     │
│ - CORS check           │
│                        │
│ API Layer:             │
│ - Auth endpoints       │
│ - Gate pass mgmt       │
│ - Warden approvals     │
│ - Guard scanning       │
│                        │
│ Business Logic:        │
│ - Token generation     │
│ - QR code creation     │
│ - Status updates       │
│ - Logging              │
└────────────┬───────────┘
             │
             │ Store/Retrieve
             ▼
┌──────────────────────────┐
│  MONGODB DATABASE        │
├──────────────────────────┤
│ Collections:             │
│ - users (logins)         │
│ - gatepasses (requests)  │
│ - accesslogs (scans)     │
│ - approvals (warden)     │
└──────────────────────────┘

GitHub:
│
├─ Source Code
├─ Documentation
└─ Latest updates
       │
       ▼ (sync.js pulls)
  Mobile App (always fresh)
```

---

## 8️⃣ COMMON ISSUES & FIXES

### ❌ "Token is invalid" Error

**Matlab:** Token expired ya corrupted
```
Fix:
1. User ko dubara login karna padega
2. New token generate hoga (10 ghante valid)
3. Api calls fir work karengi
```

### ❌ "API Endpoint not found" Error

**Matlab:** Backend reach nahi ho raha
```
Fix:
1. Backend running hai? (http://localhost:8080 try karo)
2. CORS configured hai?
3. Network connected hai?
4. Fallback URLs mein try karega: render → local IP → localhost
```

### ❌ "QR Code not scanning"

**Matlab:** Camera issue ya QR format invalid
```
Fix:
1. Camera permission grant kara
2. Proper angle mein rakh
3. Light theek hai?
4. QR code backend ne properly generate ki?
```

### ❌ "Pehla code load ho raha hai (stale code)"

**Matlab:** Cache problem
```
Fix:
sync.js automatically handles this
But if issue persists:
1. Clear phone cache (Settings > App > Smart Campus > Clear Cache)
2. npm start again
3. Fresh code load hoga
```

---

## 9️⃣ SECURITY - MAIN POINTS

### Frontend Security:
```
✅ Tokens phone memory mein stored (AsyncStorage)
✅ Tokens automatically added to API requests
✅ No sensitive data in LocalStorage (web)
✅ Token auto-expires after 10 hours
✅ XSRF proof (token in header, not cookie)
```

### Backend Security:
```
✅ Password hashed with Bcrypt (not plain text)
✅ JWT signature verified every request
✅ Token expiry strictly checked
✅ Role-based access (student can't approve)
✅ CORS whitelist (only known apps)
✅ No sensitive data in logs
```

### Database Security:
```
✅ MongoDB credentials in .env file
✅ No direct internet access
✅ Connection pooling for efficiency
✅ Indexes for fast queries
```

---

## 🔟 FEATURES BREAKDOWN

### ✅ COMPLETED:

- [x] JWT authentication system
- [x] Student gate pass creation
- [x] Warden approval system
- [x] Guard QR scanning
- [x] Database integration
- [x] Role-based access
- [x] Auto-sync from GitHub
- [x] CORS configuration
- [x] Token storage in phone

### ⏳ IN PROGRESS:

- [ ] SMS notifications (approval alerts)
- [ ] Email confirmations
- [ ] Late return alerts
- [ ] Advanced analytics
- [ ] Offline mode (cache passes locally)

### 🚀 FUTURE:

- [ ] Biometric login (fingerprint/face)
- [ ] Hostel integration
- [ ] Hostel staff dashboard
- [ ] Location tracking (optional)
- [ ] Photo verification
- [ ] Mobile app signing for store

---

## 1️⃣1️⃣ NEXT STEPS FOR TEAM

### If You Join as Developer:

1. **Samjho Project**
   - Read this guide
   - Understand JWT token flow
   - Check sample screens

2. **Local Setup**
   - Clone GitHub repo
   - `npm install` (frontend)
   - `mvn clean install` (backend)
   - `npm start` (starts with auto-sync)
   - Backend start separately

3. **Small Feature Add Karo**
   - Add notification feature
   - Add new field to gate pass
   - Improve UI
   - Write tests

4. **Code Review Process**
   - GitHub pull request
   - Lead review karega
   - Merge after approval

### If You Join as Tester:

1. **Setup**
   - Install Expo Go (play store)
   - Run `npm start`
   - Scan QR code

2. **Test Scenarios**
   - Student creates pass ✅
   - Warden approves ✅
   - Guard scans QR ✅
   - Edge cases (invalid token, expired, etc.)

3. **Report Bugs**
   - Describe what happened
   - Screenshot
   - Log files (if errors)
   - Device info

---

## 1️⃣2️⃣ IMPORTANT CONTACTS

**Lead Developer:** [TU]  
**GitHub Repo:** [Repository Link]  
**Questions?** Ask lead developer first  
**Urgent Issues?** Contact on WhatsApp

---

## SUMMARY - EK SALAAM MEIN

**Smart Campus** ek digital gate pass system hai:
- Students phone se pass request karate hain
- Warden staff approve/reject karte hain
- Guard QR scan karke verify karte hain
- EVERYTHING AUTOMATIC aur SECURE hai
- Backend aur Frontend dono properly implement
- Security ke liye JWT tokens use kiye
- Always latest code sync hota hai

**Tum sirf samjho aur maintain karo, lead ne pehle hi sab build kar diya! 🎉**

---

**Document Version:** 1.0  
**Last Updated:** March 31, 2026  
**Created for Understanding:** Team Members

