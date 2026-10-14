# Build Prompt — Online College Admission Management System (MERN)

> Paste this whole file into Claude Code as the first message, or save it as
> `BUILD_PROMPT.md` in an empty folder and run `claude` then say:
> *"Read BUILD_PROMPT.md and build Phase 0 through Phase 3."*

---

## 0. Role and ground rules

You are building a full stack web application end to end. Follow these rules for the entire session:

- **Stack is fixed: MERN.** MongoDB + Mongoose, Express.js, React.js (Vite), Node.js. Do not substitute Next.js, PostgreSQL, Prisma, or any other stack.
- **JavaScript only**, ES modules (`"type": "module"`) on both client and server. No TypeScript.
- Build **phase by phase**. Finish a phase, run it, confirm it works, then move to the next. Do not scaffold all phases at once.
- After every phase, print a short summary: files created, how to run it, what to test manually.
- Never commit secrets. All config goes through `.env`, and ship a committed `.env.example`.
- Write small, single-responsibility modules. No file over ~200 lines.
- Seed data must be realistic Indian college data (departments, courses, cut-off marks, Indian names).

---

## 1. Project definition

**Name:** Online College Admission Management System

**Purpose:** Digitise the complete admission cycle of a college so applicants can apply online, upload documents, pay the fee, and track their status in real time, while administrators verify applications, apply course-wise cut-offs, and publish merit lists from one dashboard.

**Problem being solved:** Admission today is paper-driven — applicants travel to campus repeatedly just to learn their status, staff re-key the same data into spreadsheets, and there is no single source of truth for seats remaining or merit position.

---

## 2. Roles and permissions

| Role | Can do |
|---|---|
| **Applicant** | Register, complete the application form, upload documents, pay the fee, view own status timeline and merit result |
| **Verification Officer** | View assigned applications, approve/reject individual documents, flag discrepancies, move an application to *Verified* or back to *Action Required* |
| **Administrator** | Everything the officer can, plus manage courses and seat counts, set cut-offs, generate and publish merit lists, manage officer accounts, view analytics |

Enforce with a single `requireRole(...roles)` middleware. Never trust a role sent from the client.

---

## 3. Application status model

A single enum drives the whole app. Define it once in `server/src/constants/status.js` and import it everywhere (including the client, via a shared copy).

```
DRAFT → SUBMITTED → UNDER_REVIEW → ACTION_REQUIRED (→ back to UNDER_REVIEW)
                  → VERIFIED → SHORTLISTED → ADMITTED
                                           → REJECTED
                  → WITHDRAWN
```

Every transition appends to a `statusHistory` array on the application: `{ from, to, changedBy, remarks, at }`. This array is what the student timeline renders and what makes the process auditable.

---

## 4. Tech decisions (do not deviate)

| Concern | Choice |
|---|---|
| Client | React 18 + Vite, React Router v6, Axios, Tailwind CSS |
| Client state | React Context for auth + a `useApi` hook. No Redux. |
| Forms | react-hook-form + zod resolver |
| Server | Node.js + Express 4, ES modules |
| Database | MongoDB Atlas (or local) via Mongoose |
| Auth | JWT access token (15 min) + refresh token in httpOnly cookie; bcrypt (12 rounds) for passwords |
| Real-time | Socket.IO — server pushes status changes to the applicant's room |
| Email | Nodemailer (use Ethereal/Mailtrap in dev, never a real inbox) |
| File storage | Multer → Cloudinary. Abstract behind `services/storage.js` so a local-disk driver can be swapped in when no Cloudinary keys are present |
| Payments | Razorpay **test mode only**. Order creation server-side, signature verification on the webhook. Never put the key secret in client code. |
| Validation | zod on the client, express-validator on the server. Validate on both sides. |
| Logging | morgan (dev) + a small `logger.js` wrapper |

---

## 5. Repository layout

```
college-admission-system/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml          # mongo + mongo-express for local dev
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/                # axios instance + one module per resource
│       ├── context/            # AuthContext, SocketContext
│       ├── hooks/
│       ├── components/
│       │   ├── common/         # Button, Input, Modal, Table, StatusBadge, Stepper
│       │   └── layout/         # Navbar, Sidebar, ProtectedRoute
│       ├── pages/
│       │   ├── auth/           # Login, Register, VerifyOtp, ForgotPassword
│       │   ├── applicant/      # Dashboard, ApplicationForm, Documents, Payment, Status
│       │   └── admin/          # Dashboard, Applications, Review, Courses, CutOffs, MeritList, Officers
│       └── utils/
└── server/
    ├── src/
    │   ├── index.js            # entry: express + http server + socket.io
    │   ├── app.js              # express app, middleware chain
    │   ├── config/             # db.js, env.js, cloudinary.js, razorpay.js
    │   ├── constants/          # status.js, roles.js
    │   ├── models/             # User, Application, Course, Document, Payment, MeritList, Notification
    │   ├── routes/
    │   ├── controllers/
    │   ├── services/           # merit.js, storage.js, mailer.js, notify.js
    │   ├── middleware/         # auth.js, requireRole.js, validate.js, upload.js, errorHandler.js
    │   ├── sockets/            # index.js, emitStatusChange.js
    │   └── utils/
    ├── seed/seed.js
    └── tests/
```

---

## 6. Data models

Write these as Mongoose schemas with indexes and timestamps.

**User** — `name, email (unique, lowercase), passwordHash, phone, role, isEmailVerified, otp{code,expiresAt}, refreshTokenHash, createdAt`

**Course** — `code (unique), name, department, degreeLevel (UG|PG), durationYears, totalSeats, seatsFilled, eligibility{minPercentage, requiredSubjects[]}, cutOff{general, obc, sc, st}, admissionCycle, isActive`

**Application** — `applicationNo (auto, e.g. ADM2026000147), applicant (ref User), coursePreferences [{course, priority}], personal{dob, gender, category, nationality}, address{line1,line2,city,state,pincode}, academics{board, schoolName, yearOfPassing, subjects[{name, maxMarks, obtained}], percentage}, documents [ref Document], payment (ref Payment), status, statusHistory[], assignedOfficer (ref User), meritScore, meritRank, submittedAt`

**Document** — `application, type (TENTH_MARKSHEET|TWELFTH_MARKSHEET|TRANSFER_CERT|COMMUNITY_CERT|PHOTO|SIGNATURE|AADHAAR), url, publicId, mimeType, sizeBytes, verificationStatus (PENDING|APPROVED|REJECTED), rejectionReason, verifiedBy, verifiedAt`

**Payment** — `application, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, currency, status (CREATED|PAID|FAILED|REFUNDED), paidAt`

**MeritList** — `course, admissionCycle, publishedAt, publishedBy, isPublished, entries [{application, applicationNo, applicantName, meritScore, rank, category, allotted}]`

**Notification** — `user, title, body, link, channel (IN_APP|EMAIL), isRead, createdAt`

Indexes at minimum: `Application.applicationNo` unique, `Application.{status, assignedOfficer}` compound, `Document.application`, `MeritList.{course, admissionCycle}` compound.

---

## 7. API surface

Prefix everything with `/api/v1`. Every response uses `{ success, data, message }`. Every error goes through the central error handler and returns `{ success:false, message, errors? }`.

```
POST   /auth/register              { name, email, phone, password }  → sends OTP
POST   /auth/verify-otp            { email, code }
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /courses                    public, supports ?department=&degreeLevel=
POST   /courses                    admin
PATCH  /courses/:id                admin
PATCH  /courses/:id/cutoff         admin

POST   /applications               applicant — creates DRAFT
GET    /applications/mine          applicant
PATCH  /applications/:id           applicant — only while DRAFT or ACTION_REQUIRED
POST   /applications/:id/submit    applicant — validates completeness, sets SUBMITTED
GET    /applications               officer|admin — ?status=&course=&q=&page=&limit=
GET    /applications/:id           owner|officer|admin
PATCH  /applications/:id/status    officer|admin — { to, remarks }

POST   /applications/:id/documents applicant — multipart, one file per call
DELETE /documents/:id              applicant, only while PENDING
PATCH  /documents/:id/verify       officer|admin — { verificationStatus, rejectionReason }

POST   /payments/order             applicant — creates Razorpay order
POST   /payments/webhook           Razorpay → verify signature, mark PAID

POST   /merit/generate             admin — { courseId, admissionCycle } → computes, saves unpublished
GET    /merit/preview/:id          admin
POST   /merit/publish/:id          admin — publishes + notifies every applicant on the list
GET    /merit/published            public

GET    /notifications              authenticated
PATCH  /notifications/:id/read

GET    /admin/stats                admin — counts by status, per-course fill rate, docs pending
```

---

## 8. Merit calculation

Put this in `services/merit.js` as a pure function so it is unit-testable:

```
meritScore = (academicPercentage × 0.80) + (subjectBonus × 0.20)
```
where `subjectBonus` is the average percentage across the course's `requiredSubjects`.

Ranking rules, applied in order:
1. Only applications with status `VERIFIED` are eligible.
2. Sort by `meritScore` descending.
3. Tie-break: higher required-subject average, then earlier `submittedAt`, then earlier date of birth.
4. Allot seats top-down until `course.totalSeats` is reached; mark `allotted: true`.
5. Applicants below the course `cutOff` for their category are excluded before ranking.

Generating a list must be **idempotent** — regenerating for the same course and cycle replaces the unpublished draft, and refuses to touch an already-published list.

---

## 9. Real-time layer

- On socket connect, authenticate the JWT from the handshake and join the socket to room `user:<userId>`.
- `services/notify.js` exposes one function: `notify(userId, { title, body, link })`. It writes a `Notification` document, emits `notification:new` to that user's room, and queues an email through Nodemailer.
- Call `notify()` from exactly these places: application submitted, status changed, a document approved or rejected, payment confirmed, merit list published.
- The client's `SocketContext` listens for `notification:new`, increments a navbar badge, and toasts the message. The status page refetches its timeline on receipt.

---

## 10. Build phases

Finish and verify each phase before starting the next.

### Phase 0 — Scaffold
Create the repo layout, both `package.json` files, Vite + Tailwind config, `.env.example`, `.gitignore`, `docker-compose.yml`, and a root `README.md` with setup steps. Wire `server/src/index.js` to connect to MongoDB and serve `GET /api/v1/health`. Confirm both dev servers start.

### Phase 1 — Auth and users
Models `User`. Register → OTP email → verify → login → refresh → logout. bcrypt hashing, JWT issuing, `auth` and `requireRole` middleware. Client: Login, Register, VerifyOtp pages, `AuthContext`, `ProtectedRoute`. Seed one admin and one verification officer.

### Phase 2 — Courses and the application form
Models `Course`, `Application`. Admin course CRUD. Applicant multi-step form (Personal → Address → Academics → Course Preferences → Review) saving a draft on each step. Submit validates completeness and transitions to `SUBMITTED`. Seed 8–10 realistic courses across departments.

### Phase 3 — Documents and payment
Model `Document`, `Payment`. Multer upload with a 5 MB limit and a mime allow-list (`pdf, jpeg, png`). Cloudinary via `services/storage.js` with a local-disk fallback. Razorpay test order + webhook signature verification. Applicant document page showing per-document verification state.

### Phase 4 — Review workflow
Officer/admin applications table with filters, search, and pagination. Review screen: document viewer, per-document approve/reject with reason, and application status transitions with remarks. Status timeline rendered from `statusHistory`.

### Phase 5 — Real-time and notifications
Socket.IO server + client, `services/notify.js`, Nodemailer templates, in-app notification centre, navbar badge.

### Phase 6 — Merit list
`services/merit.js`, generate/preview/publish endpoints, admin merit screen with a seat-fill summary, public published-list page, applicant result card showing rank and allotment.

### Phase 7 — Analytics and polish
Admin stats endpoint and dashboard cards (applications by status, per-course fill rate, documents pending, payments collected). Responsive pass down to 375 px. Loading skeletons, empty states, error boundaries. Rate-limit auth routes with express-rate-limit, add helmet and a CORS allow-list.

### Phase 8 — Tests and docs
Vitest + supertest for auth, the merit function, and status transitions. Seed script that produces ~40 applications spread across statuses. README: architecture diagram (mermaid), ER diagram, full env var table, run instructions, and a demo walkthrough script for a project review.

---

## 11. Quality bar

- Protected routes must fail closed — a missing or malformed token returns 401, a wrong role returns 403.
- Status transitions must be validated against a transition map; an illegal transition returns 400, never silently succeeds.
- No `console.log` left in the server; use the logger.
- The client never holds the Razorpay key secret, the JWT secret, or any Cloudinary credential.
- Every list endpoint paginates. Default `limit=20`, hard cap 100.
- `npm run lint` passes on both workspaces (ESLint, Airbnb-base relaxed).

---

## 12. Start here

Begin with **Phase 0** now. Create the repository structure and the two `package.json` files, then stop and show me:
1. the tree you created,
2. the contents of `.env.example`,
3. the exact commands to install and run both dev servers.
