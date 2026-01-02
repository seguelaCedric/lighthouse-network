# Playwright MCP Testing Prompts - Lighthouse Crew Network

**App URL:** http://localhost:3004

This document contains comprehensive testing prompts to test all pages, navigation, and functionality of the Lighthouse Crew Network platform using Playwright MCP.

## 🆕 First Time Testing? Start Here!
👉 **Read [TESTING-README.md](./TESTING-README.md) for complete overview**
👉 **Read [testing-workflow-guide.md](./testing-workflow-guide.md) for step-by-step instructions**

## 📝 Required Files (Open All Three)
1. **This file** - Test prompts to run
2. [testing-progress-tracker.md](./testing-progress-tracker.md) - Track your progress
3. Playwright MCP tool - Where you run tests

## 🔑 Test Credentials

Field	Value
Email	admin@lighthouse.careers
Password	TestPassword123!

---

## 🎯 Testing Strategy

This document contains **two types of tests**:

### 1. **UI Tests** - Check if elements exist
- Verify pages load
- Check if buttons, forms, and UI elements are present
- Take screenshots for visual review

### 2. **Functional Tests** - Verify features actually work
- Fill out forms and submit
- Click buttons and verify actions complete
- Check if workflows complete successfully
- Validate data is saved and displayed correctly

**Both types are important**: UI tests catch missing pages, Functional tests catch broken features.

---

## 📋 Pre-Testing Setup

Before running tests, ensure:
1. Development server is running: `pnpm dev`
2. Database is seeded with test data
3. Playwright MCP server is connected
4. Test credentials ready:
   - Admin: `admin@lighthouse.careers` / `TestPassword123!`
5. Open `testing-progress-tracker.md` in a separate window/tab for tracking

---

## 📝 How to Use These Prompts

### 📖 NEW TO TESTING? Read the [Testing Workflow Guide](./testing-workflow-guide.md) first!
**It has step-by-step instructions with examples.**

### For EVERY test you run:

1. **Copy the test prompt** from below
2. **Paste into Playwright MCP** and run it
3. **Review the results** and screenshots
4. **IMMEDIATELY update `testing-progress-tracker.md`:**
   - ✅ Mark `[x] Completed` checkbox
   - 🎨 Update status: ⚪ Not Started → 🟡 In Progress → 🟢 Pass or 🔴 Fail
   - 📝 Add notes: What happened, any observations
   - 🐛 Document issues: Add to Issues Tracker section if test failed
5. **If test fails:**
   - ❌ Mark test as 🔴 Fail in tracker
   - 📋 Add new issue to Issues Tracker with:
     - Issue number (sequential: #1, #2, #3...)
     - Test number that found it
     - Page URL
     - What you expected vs what actually happened
     - Screenshot reference
     - Console errors (if any)
   - ▶️ Continue with next test (don't stop!)

### Quick Tracker Update Template:

After each test, copy this to your tracker:
```
- [x] **Completed**
- [x] **Status:** 🟢 Pass
- **Notes:** [What you observed]
- **Issues Found:** [Issue #X if any, or "None"]
```

---

## 🚀 Quick Start - Priority Test Order

Run tests in this order for maximum coverage:

### Phase 1: Authentication (Critical)
- **Test 1.2**: Login functionality ← START HERE
- **Test 1.9**: Logout and protected routes

### Phase 2: Core Workflows (Critical)
- **Test 19.1**: E2E Brief to Job workflow
- **Test 23.3**: Add Brief workflow
- **Test 23.4**: Parse Brief workflow
- **Test 21.2**: AI Brief Parser workflow
- **Test 21.4**: AI Matching workflow

### Phase 3: Client Portal (High Priority)
- **Test 19.2**: E2E Client reviews shortlist
- **Test 25.2**: Client feedback workflow

### Phase 4: Candidate Portal (High Priority)
- **Test 19.3**: E2E Candidate application
- **Test 19.4**: E2E Verification workflow

### Phase 5: Verification System (High Priority)
- **Test 20.2-20.4**: ID, Reference, Voice verification

### Phase 6: UI Coverage (Medium Priority)
- Run all remaining UI tests to check page loads
- Verify navigation consistency
- Check mobile responsiveness

---

## 1️⃣ AUTHENTICATION & REGISTRATION TESTS

### Test 1.1: Login Page UI
```
Navigate to http://localhost:3004/auth/login
Take a screenshot of the login page
Check if there are email and password input fields
Check if there is a "Forgot Password" link
Check if there is a "Register" or "Sign Up" link
```

### Test 1.2: Successful Login Flow ⭐ CRITICAL - START HERE
```
Navigate to http://localhost:3004/auth/login
Fill in email field with: admin@lighthouse.careers
Fill in password field with: TestPassword123!
Click the login/sign in button
Wait for navigation to complete
Take a screenshot
Check if you were redirected to dashboard or home page
Verify if user is logged in (check for user menu/avatar in header)
Check console for any errors
```

**After completing this test, update `testing-progress-tracker.md`:**
- [ ] Mark Test 1.2 as completed
- [ ] Set status: 🟢 Pass or 🔴 Fail
- [ ] Add notes: (e.g., "Login successful, redirected to /dashboard")
- [ ] If failed, document issue in Issues Tracker section

### Test 1.3: Failed Login - Wrong Password
```
Navigate to http://localhost:3004/auth/login
Fill in email field with: admin@lighthouse.careers
Fill in password field with: WrongPassword123!
Click the login button
Take a screenshot
Check if error message appears (e.g., "Invalid credentials")
Verify you remain on login page
```

### Test 1.4: Failed Login - Invalid Email
```
Navigate to http://localhost:3004/auth/login
Fill in email field with: notauser@example.com
Fill in password field with: SomePassword123!
Click the login button
Take a screenshot
Check if error message appears
Verify you remain on login page
```

### Test 1.5: Login Form Validation
```
Navigate to http://localhost:3004/auth/login
Click the login button without entering any credentials
Take a screenshot
Check if validation errors appear for email and password fields
Try entering invalid email format (e.g., "notanemail")
Check if email validation error appears
```

### Test 1.6: Registration Page UI
```
Navigate to http://localhost:3004/auth/register
Take a screenshot of the registration page
Check if there are input fields for name, email, and password
Check if there is a user type selector (Recruiter/Client/Crew)
Verify if there's a "Back to Login" link
```

### Test 1.7: Registration Flow (if test mode allows)
```
Navigate to http://localhost:3004/auth/register
Fill in all required fields with test data
Select user type
Click register button
Take a screenshot
Check if registration succeeds or shows appropriate messages
Check if redirected to email verification or dashboard
```

### Test 1.8: Forgot Password Flow
```
Navigate to http://localhost:3004/auth/forgot-password
Take a screenshot
Enter email: admin@lighthouse.careers
Click submit/reset password button
Take a screenshot
Check if success message appears (e.g., "Check your email")
Check console for errors
```

### Test 1.9: Logout Flow
```
First login using Test 1.2
Navigate to http://localhost:3004
Find and click user menu/avatar/logout button
Click logout
Take a screenshot
Check if redirected to login page
Try navigating to http://localhost:3004/dashboard
Verify you're redirected back to login (protected route check)
```

---

## 2️⃣ DASHBOARD TESTS (Main Platform)

### Test 2.1: Main Dashboard Access
```
Navigate to http://localhost:3004
Take a screenshot of the landing page or dashboard
Check if the page loads without errors
List all navigation menu items visible
```

### Test 2.2: Dashboard Interview Section
```
Navigate to http://localhost:3004/interviews
Take a screenshot
Check if there's a list or table of interviews
Verify if there are filter or search options
```

---

## 3️⃣ JOBS MANAGEMENT TESTS

### Test 3.1: Jobs List Page
```
Navigate to http://localhost:3004/jobs
Take a screenshot of the jobs list
Check if there's a "New Job" or "Create Job" button
Verify if there's a search or filter bar
Check if jobs are displayed in a table or card format
```

### Test 3.2: Job Creation Page
```
Navigate to http://localhost:3004/jobs/new
Take a screenshot
List all form fields visible
Check if there's a "Save" or "Create" button
```

### Test 3.3: Job Details Page
```
Navigate to http://localhost:3004/jobs/[use any ID like 1]
Take a screenshot
Check if job details are displayed
Verify if there's an "Edit" button
Check if there's a "Submissions" tab or link
```

### Test 3.4: Job Submissions
```
Navigate to http://localhost:3004/jobs/[use any ID]/submissions
Take a screenshot
Check if there's a list of candidate submissions
Verify if each submission has action buttons
```

### Test 3.5: Job Pipeline View
```
Navigate to http://localhost:3004/jobs/pipeline
Take a screenshot
Check if there's a kanban board or pipeline view
Verify different stages are visible
```

### Test 3.6: Job Matching
```
Navigate to http://localhost:3004/jobs/match
Take a screenshot
Check if there's a matching interface
Verify if candidates can be viewed and matched
```

---

## 4️⃣ CANDIDATES TESTS

### Test 4.1: Candidates List
```
Navigate to http://localhost:3004/candidates
Take a screenshot
Check if there's a candidates table or grid
Verify if there's a search bar
Check for filter options
```

### Test 4.2: Candidate Search
```
Navigate to http://localhost:3004/candidates/search
Take a screenshot
List all search filters available
Check if there's an advanced search option
```

### Test 4.3: Candidate Profile
```
Navigate to http://localhost:3004/candidates/[use any ID like 1]
Take a screenshot
Check if candidate details are displayed
Verify if there are sections for experience, certificates, etc.
Check if there's an "Edit" button
```

---

## 5️⃣ CLIENTS TESTS

### Test 5.1: Clients List
```
Navigate to http://localhost:3004/clients
Take a screenshot
Check if there's a clients table
Verify if there's an "Add Client" button
```

### Test 5.2: Client Details
```
Navigate to http://localhost:3004/clients/[use any ID like 1]
Take a screenshot
Check if client information is displayed
Verify if there's a list of client's jobs
Check if there's an edit option
```

---

## 6️⃣ BRIEFS TESTS

### Test 6.1: Briefs List
```
Navigate to http://localhost:3004/briefs
Take a screenshot
Check if there's a list of briefs
Verify if there's a "New Brief" button
```

### Test 6.2: New Brief Creation
```
Navigate to http://localhost:3004/briefs/new
Take a screenshot
Check if there's a form or text area for brief input
Verify if there's AI parsing functionality mentioned
```

### Test 6.3: Brief Parsing
```
Navigate to http://localhost:3004/briefs/parse
Take a screenshot
Check if there's an input area for brief text
Verify if there's a "Parse" or "Analyze" button
```

### Test 6.4: Brief Details
```
Navigate to http://localhost:3004/briefs/[use any ID like 1]
Take a screenshot
Check if brief details are displayed
Verify if there's a "Convert to Job" option
```

### Test 6.5: Convert Brief to Job
```
Navigate to http://localhost:3004/briefs/[use any ID]/convert
Take a screenshot
Check if there's a conversion form
Verify if brief data is pre-filled
```

---

## 7️⃣ MESSAGES TESTS

### Test 7.1: Messages/Chat Interface
```
Navigate to http://localhost:3004/messages
Take a screenshot
Check if there's a message list or chat interface
Verify if there's a conversation area
Check if there's an input field for new messages
```

---

## 8️⃣ NOTIFICATIONS TESTS

### Test 8.1: Notifications Page
```
Navigate to http://localhost:3004/notifications
Take a screenshot
Check if there's a list of notifications
Verify if notifications can be marked as read
```

---

## 9️⃣ SETTINGS TESTS

### Test 9.1: Settings Main Page
```
Navigate to http://localhost:3004/settings
Take a screenshot
List all settings sections available in navigation
```

### Test 9.2: Profile Settings
```
Navigate to http://localhost:3004/settings/profile
Take a screenshot
Check if there are profile form fields
Verify if there's a "Save" button
```

### Test 9.3: Account Settings
```
Navigate to http://localhost:3004/settings/account
Take a screenshot
Check if there are account-related settings
Verify if password change option exists
```

### Test 9.4: Team Settings
```
Navigate to http://localhost:3004/settings/team
Take a screenshot
Check if there's a team members list
Verify if there's an "Invite" button
```

### Test 9.5: Notifications Settings
```
Navigate to http://localhost:3004/settings/notifications
Take a screenshot
Check if there are notification preference toggles
```

### Test 9.6: Integrations Settings
```
Navigate to http://localhost:3004/settings/integrations
Take a screenshot
Check if there are integration options (Vincere, Twilio, etc.)
Verify connection status indicators
```

### Test 9.7: Billing Settings
```
Navigate to http://localhost:3004/settings/billing
Take a screenshot
Check if there's billing information
Verify if there's a payment method section
```

### Test 9.8: Billing Plans
```
Navigate to http://localhost:3004/settings/billing/plans
Take a screenshot
Check if different pricing tiers are displayed
Verify if there's an upgrade/downgrade option
```

### Test 9.9: Billing Invoices
```
Navigate to http://localhost:3004/settings/billing/invoices
Take a screenshot
Check if there's a list of invoices
Verify if invoices can be downloaded
```

---

## 🔟 ADMIN PANEL TESTS

### Test 10.1: Admin Dashboard
```
Navigate to http://localhost:3004/admin
Take a screenshot
Check if admin-specific metrics are displayed
Verify admin navigation menu
```

### Test 10.2: Admin Billing Management
```
Navigate to http://localhost:3004/admin/billing
Take a screenshot
Check if there's a comprehensive billing overview
Verify if there are subscription management tools
```

---

## 1️⃣1️⃣ CREW PORTAL TESTS

### Test 11.1: Crew Dashboard
```
Navigate to http://localhost:3004/crew/dashboard
Take a screenshot
Check if crew-specific widgets are displayed
Verify if there are quick actions available
```

### Test 11.2: Crew Profile Edit
```
Navigate to http://localhost:3004/crew/profile/edit
Take a screenshot
Check if there's a profile form
Verify fields for experience, certificates, skills
```

### Test 11.3: Crew Applications
```
Navigate to http://localhost:3004/crew/applications
Take a screenshot
Check if there's a list of job applications
Verify application status indicators
```

### Test 11.4: Crew Verification
```
Navigate to http://localhost:3004/crew/verification
Take a screenshot
Check if there's a verification process interface
Verify if different verification tiers are shown
```

### Test 11.5: Crew Referrals
```
Navigate to http://localhost:3004/crew/referrals
Take a screenshot
Check if there's a referral code displayed
Verify if there's a referral history
```

---

## 1️⃣2️⃣ CLIENT PORTAL TESTS

### Test 12.1: Client Portal Landing
```
Navigate to http://localhost:3004/client
Take a screenshot
Check what's displayed on the client landing page
```

### Test 12.2: Client Login
```
Navigate to http://localhost:3004/client/auth/login
Take a screenshot
Check if there's a client-specific login form
```

### Test 12.3: Client Verification
```
Navigate to http://localhost:3004/client/auth/verify
Take a screenshot
Check if there's an email verification interface
```

### Test 12.4: Client Dashboard
```
Navigate to http://localhost:3004/client/dashboard
Take a screenshot
Check if client-specific metrics are displayed
Verify navigation options
```

### Test 12.5: Client Job Searches
```
Navigate to http://localhost:3004/client/searches
Take a screenshot
Check if there's a list of active job searches
Verify if new search can be created
```

### Test 12.6: Client Brief Submission
```
Navigate to http://localhost:3004/client/briefs/new
Take a screenshot
Check if clients can submit hiring briefs
Verify form fields available
```

### Test 12.7: Client Shortlist View
```
Navigate to http://localhost:3004/client/shortlist/[use any jobId]
Take a screenshot
Check if shortlisted candidates are displayed
Verify if candidates can be reviewed
```

### Test 12.8: Client Candidate Profile
```
Navigate to http://localhost:3004/client/candidate/[use any ID]
Take a screenshot
Check if client can view candidate details
Verify what information is visible vs. redacted
```

### Test 12.9: Client Interviews
```
Navigate to http://localhost:3004/client/interviews
Take a screenshot
Check if there's a list of scheduled interviews
```

### Test 12.10: Client Placements
```
Navigate to http://localhost:3004/client/placements
Take a screenshot
Check if completed placements are listed
```

### Test 12.11: Client Notifications
```
Navigate to http://localhost:3004/client/notifications
Take a screenshot
Check if client receives platform notifications
```

### Test 12.12: Client Portal Settings
```
Navigate to http://localhost:3004/client/settings
Take a screenshot
Check client-specific settings options
```

---

## 1️⃣3️⃣ PUBLIC PAGES TESTS

### Test 13.1: Pricing Page
```
Navigate to http://localhost:3004/pricing
Take a screenshot
Check if pricing tiers are displayed
Verify if there are feature comparisons
```

### Test 13.2: Mobile Demo
```
Navigate to http://localhost:3004/mobile-demo
Take a screenshot
Check if there's a mobile interface demonstration
```

---

## 1️⃣4️⃣ NAVIGATION & UI CONSISTENCY TESTS

### Test 14.1: Main Navigation Test
```
Navigate to http://localhost:3004
Take a screenshot
Click on each main navigation item and verify it loads
Take screenshots of each section
```

### Test 14.2: Sidebar Navigation (if exists)
```
Navigate to http://localhost:3004
Check if there's a sidebar menu
Click through all sidebar menu items
Take screenshots of each page
```

### Test 14.3: User Menu/Profile Dropdown
```
Navigate to http://localhost:3004
Look for user profile icon or menu in header
Click on it and verify dropdown options
Take a screenshot
```

### Test 14.4: Mobile Responsiveness
```
Resize browser to 375x667 (iPhone SE)
Navigate to http://localhost:3004
Take a screenshot
Check if hamburger menu appears
Test navigation on mobile view
```

---

## 1️⃣5️⃣ SEARCH & FILTER TESTS

### Test 15.1: Global Search (if exists)
```
Navigate to http://localhost:3004
Look for a global search bar
Type a test query
Check if search results appear
Take a screenshot
```

### Test 15.2: Candidate Filter Functionality
```
Navigate to http://localhost:3004/candidates
Apply various filters (role, location, experience)
Verify if results update
Take screenshots of filtered results
```

### Test 15.3: Job Filter Functionality
```
Navigate to http://localhost:3004/jobs
Apply filters (status, client, date)
Verify if job list updates accordingly
Take a screenshot
```

---

## 1️⃣6️⃣ FORM INTERACTION TESTS

### Test 16.1: Form Field Validation
```
Navigate to http://localhost:3004/briefs/new
Try submitting an empty form
Check if validation errors appear
Take a screenshot
```

### Test 16.2: Dropdown/Select Interactions
```
Navigate to http://localhost:3004/jobs/new
Find all dropdown/select fields
Click and verify options appear
Take screenshots
```

### Test 16.3: Date Picker Interactions
```
Navigate to any page with date inputs
Click on date picker fields
Verify calendar popup appears
Take a screenshot
```

---

## 1️⃣7️⃣ ERROR HANDLING TESTS

### Test 17.1: 404 Page
```
Navigate to http://localhost:3004/nonexistent-page
Take a screenshot
Check if there's a custom 404 page
Verify if there's a "Go Home" link
```

### Test 17.2: Auth Error Page
```
Navigate to http://localhost:3004/auth/error
Take a screenshot
Check if error message is displayed
```

---

## 1️⃣8️⃣ CONSOLE & NETWORK TESTS

### Test 18.1: Console Errors Check
```
Navigate to http://localhost:3004
Check browser console for errors
Report any JavaScript errors or warnings
```

### Test 18.2: Failed Network Requests
```
Navigate to http://localhost:3004/jobs
Monitor network requests
Report any failed API calls (400, 500 errors)
```

### Test 18.3: Page Load Performance
```
Navigate to http://localhost:3004
Measure page load time
Check if page loads within 3 seconds
```

---

## 🎯 END-TO-END WORKFLOW TESTS (Complete User Journeys)

### Test 19.1: E2E - Brief to Placement (Recruiter View) ⭐ CRITICAL
```
STEP 1: Create Brief
Navigate to http://localhost:3004/briefs
Click "+ Add Brief"
Select source: "WhatsApp"
Enter: "Captain needs 2nd Engineer for 60m motor yacht Artemis. Caribbean program. Min 3000GT license, 5+ years experience. Budget 7500 USD/month. Start Feb 1st."
Submit brief
Take a screenshot

STEP 2: Parse Brief
Click "Parse" on the new brief
Wait for AI parsing
Take a screenshot of parsed data
Verify extracted: Position, Vessel, License, Experience, Salary, Start date

STEP 3: Convert to Job
Click "Convert to Job"
Review pre-filled form
Add any missing details
Click "Create Job"
Take a screenshot of created job

STEP 4: Run AI Match
On the job page, click "Find Matches" or "Run AI Match"
Wait for matching to complete
Take a screenshot
Verify candidates are ranked with match scores

STEP 5: Build Shortlist
Select top 3-5 candidates
Click "Create Shortlist" or "Add to Shortlist"
Review shortlist
Take a screenshot

STEP 6: Send to Client
Click "Send Shortlist to Client"
Review email/notification
Submit
Take a screenshot
Verify success message

Check console for any errors throughout the flow
```

**📋 UPDATE TRACKER:** After this test, update Test 19.1 in `testing-progress-tracker.md`
- Status: 🟢 Pass if all 6 steps completed / 🔴 Fail if any step failed
- Notes: Which steps worked, which failed
- Issues: Document each failure separately (#1: Brief creation failed, #2: AI parsing error, etc.)

### Test 19.2: E2E - Client Reviews Shortlist ⭐ CRITICAL
```
STEP 1: Login as Client
Navigate to http://localhost:3004/client/auth/login
Login with client credentials
Take a screenshot

STEP 2: View Shortlist
Navigate to client dashboard
Find notification about new shortlist
Click to view shortlist
Take a screenshot

STEP 3: Review Candidates
For each candidate:
  - View profile details
  - Download CV
  - Review match reasoning
Take screenshots

STEP 4: Provide Feedback
Select "Interested" for 2 candidates
Select "Maybe" for 1 candidate
Select "Not Suitable" for others with reasons
Add notes
Click "Submit Feedback"
Take a screenshot

STEP 5: Request Interview
For top candidate, click "Request Interview"
Fill in preferred details
Submit request
Take a screenshot
Navigate to interviews page
Verify interview request appears

Check console for errors throughout
```

**📋 UPDATE TRACKER:** Update Test 19.2 - Client portal critical workflow
- 🟢 Pass if client can view, feedback, and request interviews / 🔴 Fail otherwise

### Test 19.3: E2E - Candidate Application (Public Job Board)
```
STEP 1: Find Job
Navigate to http://localhost:3004 (or public job board URL)
Browse available jobs
Use search: "Chief Stewardess Mediterranean"
Take a screenshot

STEP 2: View Job Details
Click on a job
Take a screenshot of job details
Verify job information is displayed

STEP 3: Apply (Creates Profile)
Click "Apply" button
Fill in quick signup form:
  - Email, Name, Phone
  - Position, Years experience
  - Upload CV
Take a screenshot
Click "Submit Application"

STEP 4: Verify Profile Created
Check if redirected to crew portal/dashboard
Take a screenshot
Verify profile was created
Navigate to "My Applications"
Verify job application appears

Check console for errors
```

### Test 19.4: E2E - Verification Workflow
```
STEP 1: Candidate Uploads Documents
Login as candidate
Navigate to http://localhost:3004/crew/verification
Upload ID document
Add reference details (2 references)
Request voice verification
Take screenshots

STEP 2: Recruiter Reviews ID
Login as recruiter/admin
Navigate to http://localhost:3004/verification
Filter to "ID Documents Pending"
Click on pending ID
Review document
Click "Approve"
Take a screenshot

STEP 3: Recruiter Verifies References
Click "References" tab
Click on pending reference
Fill in verification form after calling
Rate reference
Click "Mark as Verified"
Take a screenshot

STEP 4: Voice Verification
Click "Voice Verification" tab
Click "Start Vapi Call" for pending verification
Complete voice verification
Take a screenshot

STEP 5: Check Tier Update
Navigate back to candidate profile
Verify verification tier increased
Take a screenshot showing new tier badge

Check console for errors
```

---

---

## 2️⃣0️⃣ VERIFICATION WORKFLOW TESTS (CRITICAL)

### Test 20.1: Verification Queue Page
```
Navigate to http://localhost:3004/verification
Take a screenshot
Check if there's a verification queue dashboard
Verify if there are tabs/filters for: ID Documents, References, Voice
Check if pending verifications are displayed
```

### Test 20.2: ID Document Review
```
Navigate to http://localhost:3004/verification
Look for ID documents pending review
Click on a pending ID document
Check if document preview appears
Verify if there are Approve/Reject buttons
Take a screenshot
```

### Test 20.3: Reference Verification
```
Navigate to http://localhost:3004/verification
Look for references pending verification
Click on a pending reference
Check if reference details are displayed
Verify if there's a verification form (rating, feedback, etc.)
Take a screenshot
```

### Test 20.4: Voice Verification (Vapi)
```
Navigate to http://localhost:3004/verification
Look for voice verification pending
Check if there's a "Start Vapi Call" or similar button
Take a screenshot
```

### Test 20.5: Candidate Verification Status
```
Navigate to http://localhost:3004/candidates/[use any ID]
Scroll to verification section
Check if verification tier is displayed (Basic/Identity/Verified/Premium)
Verify if verification progress is shown
Check if there are quick action buttons for verification tasks
Take a screenshot
```

---

## 2️⃣1️⃣ AI MATCHING WORKFLOW TESTS (CRITICAL)

### Test 21.1: AI Brief Parser - UI Check
```
Navigate to http://localhost:3004/briefs/parse
Take a screenshot
Check if there's a text area for brief input
Verify if there's a Parse/Submit button
```

### Test 21.2: AI Brief Parser - Full Workflow
```
Navigate to http://localhost:3004/briefs/parse
Enter sample brief text: "Need chief stew for 55m motor yacht, Med summer, 5+ years experience, French speaking, budget 6000 EUR, starts March"
Click Parse button
Wait for parsing to complete
Take a screenshot of the results
Check if structured data is extracted:
  - Position (Chief Stewardess)
  - Vessel type (Motor yacht)
  - Vessel size (55m)
  - Location (Mediterranean)
  - Experience required (5+ years)
  - Languages (French)
  - Salary (6000 EUR)
  - Start date (March)
Verify if confidence score is displayed (should be high for this clear brief)
Check if there's a "Convert to Job" button
Check console for errors
```

### Test 21.3: Job Matching Results - UI Check
```
Navigate to http://localhost:3004/jobs/match
Take a screenshot
Check if there's a job selection interface
```

### Test 21.4: Job Matching - Full Workflow
```
Navigate to http://localhost:3004/jobs/match?jobId=1
Wait for AI matching to complete
Take a screenshot
Check if candidate results are displayed
Verify each candidate shows:
  - Match score/percentage
  - Match reasoning/explanation
  - Key qualifications that match
Verify candidates are sorted by match score (highest first)
Check if there's an option to add candidates to shortlist
Click on a top candidate to view details
Take a screenshot of candidate detail
Check console for errors
```

### Test 21.5: Match Score Display
```
Navigate to http://localhost:3004/candidates
Take a screenshot
Check if match scores are visible on candidate cards
Verify if match percentage or rating is shown
```

---

## 2️⃣2️⃣ PUBLIC JOB BOARD TESTS (CRITICAL)

### Test 22.1: Public Job Board Landing
```
Navigate to http://localhost:3004/jobs/public OR http://localhost:3004/board
Take a screenshot
Check if jobs are visible without login
Verify if there's a search bar
Check if filters are available (position, location, salary)
```

### Test 22.2: Public Job Details
```
Navigate to a public job posting
Take a screenshot
Check if job details are visible
Verify if there's an "Apply" button
Check if "Apply" redirects to signup/login
```

### Test 22.3: Apply Flow (Signup as Application)
```
Click "Apply" on a public job
Check if registration/signup form appears
Verify if applying creates a candidate profile
Take screenshots of the flow
```

---

## 2️⃣3️⃣ BRIEF INBOX TESTS (CRITICAL RECRUITER FEATURE)

### Test 23.1: Brief Inbox Main View
```
Navigate to http://localhost:3004/briefs
Take a screenshot
Check if there's an inbox-style view of briefs
Verify if briefs show source (WhatsApp, Email, Phone, Portal)
Check if status filters exist (New, Parsing, Parsed, Converted)
Check if briefs are displayed with timestamps
```

### Test 23.2: Add Brief - UI Check
```
Navigate to http://localhost:3004/briefs
Click "+ Add Brief" or "New Brief" button
Take a screenshot
Check if modal or form appears
Verify interface elements are present
```

### Test 23.3: Add Brief - Complete Workflow ⭐ CRITICAL
```
Navigate to http://localhost:3004/briefs
Click "+ Add Brief" button
Select source: "Phone"
Enter brief content: "Captain Mike called from Excellence. Need chief stew, 55m motor, Med summer, French speaking, 5+ years, ASAP"
Click Submit/Add button
Take a screenshot
Check if brief appears in the inbox
Verify brief shows correct source (Phone icon)
Verify status is "New"
Check console for errors
```

**📋 UPDATE TRACKER:** Test 23.3 - Brief creation is a core workflow!

### Test 23.4: Parse Brief Workflow
```
Navigate to http://localhost:3004/briefs
Find a brief with "New" status (use one from Test 23.3 or existing)
Click "Parse" button
Wait for parsing to complete
Take a screenshot
Check if status changes to "Parsed"
Verify if parsed data appears (position, vessel, requirements)
Check if confidence score is shown
Verify if "Convert to Job" option appears
Check console for errors
```

### Test 23.5: Brief to Job Conversion - Complete Flow
```
Navigate to http://localhost:3004/briefs
Find a parsed brief
Click "Convert to Job" button
Take a screenshot
Verify if form is pre-filled with parsed data
Edit any fields if needed
Click "Create Job" or "Convert" button
Wait for job creation
Take a screenshot
Check if redirected to new job page
Verify job was created successfully
Navigate back to briefs
Check if brief status changed to "Converted"
```

---

## 2️⃣4️⃣ SHORTLIST BUILDER TESTS (CRITICAL)

### Test 24.1: Shortlist Creation
```
Navigate to a job detail page
Look for "Create Shortlist" or "Build Shortlist" button
Click to create shortlist
Take a screenshot
Check if candidates can be added
```

### Test 24.2: Candidate Ordering
```
Navigate to shortlist builder
Check if candidates can be reordered (drag-and-drop)
Verify if there's a priority/ranking system
Take a screenshot
```

### Test 24.3: Send Shortlist to Client
```
Navigate to completed shortlist
Look for "Send to Client" or "Submit Shortlist" button
Click the button
Check if there's a confirmation or email preview
Take a screenshot
```

---

## 2️⃣5️⃣ CLIENT FEEDBACK WORKFLOW TESTS

### Test 25.1: Client Feedback Interface - UI
```
Navigate to http://localhost:3004/client/shortlist/[jobId]
Take a screenshot
Check if candidates are displayed with feedback options
Verify feedback options exist: "Interested", "Maybe", "Not Suitable"
Check if there's a notes/comments field
```

### Test 25.2: Submit Feedback - Complete Workflow
```
Login as client (or navigate to client portal)
Navigate to http://localhost:3004/client/shortlist/[jobId]
Take a screenshot of initial state
For the first candidate:
  - Select "Interested - request interview"
  - Add note: "Would like to schedule video interview"
For the second candidate:
  - Select "Maybe - need more information"
  - Add note: "Need more details about availability"
For the third candidate:
  - Select "Not suitable"
  - Select reason from dropdown
Take a screenshot with feedback filled in
Click "Submit Feedback" or "Submit All" button
Wait for submission
Take a screenshot
Check if success message appears
Verify if page updates to show feedback submitted status
Check console for errors
```

### Test 25.3: Interview Request - Complete Flow
```
Navigate to client shortlist view
Find a candidate marked as "Interested"
Click "Request Interview" button
Take a screenshot
Fill in interview details:
  - Preferred date/time
  - Interview type (Video/In-person/Phone)
  - Additional notes
Click "Submit Interview Request"
Take a screenshot
Check if success message appears
Verify interview request is shown in interviews section
Navigate to http://localhost:3004/client/interviews
Check if scheduled interview appears
```

---

## 2️⃣6️⃣ COMMUNICATION TESTS (WhatsApp/Email)

### Test 26.1: Communication History
```
Navigate to http://localhost:3004/messages
Take a screenshot
Check if communication threads are displayed
Verify if WhatsApp and Email messages are shown
```

### Test 26.2: Send Message Interface
```
Navigate to a candidate or client profile
Look for "Send Message" or communication button
Check if WhatsApp and Email options are available
Take a screenshot
```

---

## 2️⃣7️⃣ PLACEMENT TRACKING TESTS

### Test 27.1: Placements List
```
Navigate to http://localhost:3004/placements
Take a screenshot
Check if completed placements are listed
Verify if placement details are shown (candidate, job, date, fee)
```

### Test 27.2: Placement Details
```
Navigate to a placement detail page
Check if placement information is complete
Verify if invoice/billing information is shown
Take a screenshot
```

---

## 2️⃣8️⃣ INTERVIEW MANAGEMENT TESTS

### Test 28.1: Interview Scheduling
```
Navigate to http://localhost:3004/interviews
Take a screenshot
Check if scheduled interviews are listed
Verify if there's a "Schedule Interview" button
```

### Test 28.2: Interview Details
```
Click on an interview
Check if interview details are displayed (candidate, client, time, location)
Verify if there are status updates (Scheduled, Completed, Cancelled)
Take a screenshot
```

---

## 2️⃣9️⃣ SEARCH & FILTERING DEEP DIVE

### Test 29.1: Semantic Search (AI-Powered)
```
Navigate to http://localhost:3004/candidates/search
Try semantic search: "French speaking stewardess available in Monaco"
Check if AI-powered search returns relevant results
Verify if results show match reasoning
Take a screenshot
```

### Test 29.2: Advanced Filters
```
Navigate to candidate search
Open advanced filters
Check available filters: certifications, experience years, location, availability
Apply multiple filters
Verify results update correctly
Take a screenshot
```

---

## 3️⃣0️⃣ API INTEGRATION TESTS

### Test 30.1: Vincere Integration Status
```
Navigate to http://localhost:3004/settings/integrations
Look for Vincere integration section
Check connection status
Verify last sync time if connected
Take a screenshot
```

### Test 30.2: Twilio WhatsApp Status
```
Navigate to http://localhost:3004/settings/integrations
Look for Twilio/WhatsApp integration
Check if connection status is shown
Take a screenshot
```

---

## ✅ COMPREHENSIVE TESTING CHECKLIST

After running all tests, verify:

### Core Functionality
- [ ] All pages load without 404 errors
- [ ] No critical JavaScript console errors
- [ ] Forms have proper validation (client-side and server-side)
- [ ] Navigation is consistent across all user types
- [ ] Authentication flows work correctly
- [ ] CRUD operations function properly (Create, Read, Update, Delete)

### Authentication & Authorization (Tests 1.1-1.9)
- [ ] **Login**: Successfully logs in with valid credentials
- [ ] **Login Failure**: Shows error for invalid credentials
- [ ] **Form Validation**: Prevents submission with empty/invalid fields
- [ ] **Registration**: Can create new accounts (if test data allows)
- [ ] **Password Reset**: Sends reset email successfully
- [ ] **Logout**: Clears session and redirects to login
- [ ] **Protected Routes**: Redirects unauthenticated users to login

### Critical Workflows (Product Spec)
- [ ] **Brief Creation**: Can add briefs with different sources (Phone, WhatsApp, Email)
- [ ] **AI Brief Parser**: Successfully extracts structured data from text
- [ ] **Brief Parsing**: Displays confidence scores and parsed fields correctly
- [ ] **Brief to Job**: Converts parsed brief to job with pre-filled data
- [ ] **AI Matching**: Generates match scores with reasoning for candidates
- [ ] **Match Display**: Shows candidates ranked by match percentage
- [ ] **Public Job Board**: Jobs visible without login required
- [ ] **Job Application**: Creates candidate profile through application
- [ ] **Shortlist Builder**: Can add candidates and reorder them
- [ ] **Send Shortlist**: Successfully submits shortlist to client
- [ ] **Client Feedback**: Client can rate candidates (Interested/Maybe/Not Suitable)
- [ ] **Interview Request**: Client can request interviews successfully

### Verification Workflow (Tests 20.1-20.5)
- [ ] **ID Upload**: Candidates can upload identification documents
- [ ] **ID Review**: Recruiters can approve/reject ID documents
- [ ] **Reference Verification**: Can verify references with ratings
- [ ] **Voice Verification**: Vapi integration starts verification calls
- [ ] **Tier Display**: Verification tier badges show correctly
- [ ] **Tier Progression**: Tier updates after verification steps complete

### Search & Filters
- [ ] **Basic Search**: Returns relevant results
- [ ] **Semantic Search**: AI-powered search works with natural language
- [ ] **Filters Work**: Applying filters updates results correctly
- [ ] **Filter Combinations**: Multiple filters work together
- [ ] **Filter Reset**: Can clear filters to show all results

### Forms & Data Entry
- [ ] **Required Fields**: Forms validate required fields
- [ ] **Field Validation**: Email, phone, dates validated correctly
- [ ] **Error Messages**: Clear error messages for validation failures
- [ ] **Success Messages**: Confirmation shown after successful submission
- [ ] **Data Persistence**: Form data saves correctly to database
- [ ] **Pre-fill Data**: Forms load existing data for editing

### UI/UX
- [ ] **Mobile Responsive**: Layout adapts to mobile viewport
- [ ] **Loading States**: Spinners/skeletons show during async operations
- [ ] **Error Pages**: 404 and error pages display properly
- [ ] **Empty States**: Appropriate messages when no data exists
- [ ] **Tooltips/Help**: Guidance available for complex features
- [ ] **Accessibility**: Forms navigable via keyboard

### Technical Health
- [ ] **API Endpoints**: No 404 or 500 errors on API calls
- [ ] **Network Requests**: All requests complete successfully
- [ ] **Console Errors**: No JavaScript errors in console
- [ ] **Performance**: Pages load within 3 seconds
- [ ] **Database Operations**: Data saves and retrieves correctly
- [ ] **File Uploads**: Documents/images upload successfully

### End-to-End Workflows (Tests 19.1-19.4)
- [ ] **E2E Brief to Job**: Complete flow from brief creation to job posting works
- [ ] **E2E Client Review**: Client can review shortlist and provide feedback
- [ ] **E2E Candidate Apply**: Public user can find job and apply successfully
- [ ] **E2E Verification**: Full verification process from upload to tier upgrade

---

## 📝 REPORTING ISSUES

When you find issues during testing, document:
1. **Page URL**: Exact URL where issue occurred
2. **Expected**: What should happen according to product specs
3. **Actual**: What actually happened
4. **Screenshot**: Visual evidence of the issue
5. **Console errors**: Any JavaScript errors in browser console
6. **Network errors**: Failed API calls (check Network tab)
7. **Steps to reproduce**: Detailed steps to recreate the issue
8. **Severity**: Critical / High / Medium / Low

### Issue Severity Guidelines
- **Critical**: Core workflow broken (can't create briefs, matching doesn't work)
- **High**: Important feature missing or broken (verification queue not working)
- **Medium**: Feature works but has bugs (UI glitches, slow performance)
- **Low**: Minor issues (typos, styling inconsistencies)

All issues will be tracked in the TODO list.
