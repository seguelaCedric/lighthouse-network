# Testing Workflow Guide - Quick Reference

This guide shows you exactly how to run tests and track progress.

---

## 🚀 Setup (Do This Once)

1. **Open 3 windows side-by-side:**
   - Window 1: `playwright-testing-prompts.md` (test scripts)
   - Window 2: `testing-progress-tracker.md` (your checklist)
   - Window 3: Playwright MCP tool

2. **Start your dev server:**
   ```bash
   pnpm dev
   ```

3. **Verify Playwright MCP is connected**

---

## 🔄 Testing Loop (Repeat for Each Test)

### Step 1: Pick a Test
- Start with **Test 1.2** (Login) - marked as ⭐ CRITICAL
- Follow the priority order in the prompts document

### Step 2: Mark Test as In Progress
In `testing-progress-tracker.md`, find the test and update:
```markdown
### Test 1.2: Successful Login Flow
- [ ] **Completed** ← Keep unchecked while working
- [x] **Status:** 🟡 In Progress ← Change from ⚪ to 🟡
- **Notes:** Starting test now...
- **Issues Found:**
```

### Step 3: Run the Test
1. Copy the test prompt from `playwright-testing-prompts.md`
2. Paste into Playwright MCP
3. Watch it run
4. Review screenshots and results

### Step 4: Update Tracker Immediately

#### If Test PASSED ✅
```markdown
### Test 1.2: Successful Login Flow
- [x] **Completed** ← Check it
- [x] **Status:** 🟢 Pass ← Update to green
- **Notes:** Login successful, redirected to /dashboard, no console errors
- **Issues Found:** None
```

#### If Test FAILED ❌
```markdown
### Test 1.2: Successful Login Flow
- [x] **Completed** ← Still check it (you ran it)
- [x] **Status:** 🔴 Fail ← Mark as red
- **Notes:** Login button didn't work, stayed on /auth/login
- **Issues Found:** Issue #1
```

Then scroll to **Issues Tracker** section and add:

```markdown
### Critical Issues

1. **Issue #1:**
   - **Test:** Test 1.2 - Login
   - **Page URL:** http://localhost:3004/auth/login
   - **Description:** Login button does not respond to clicks
   - **Expected:** Should redirect to dashboard after successful login
   - **Actual:** Stays on login page, no error message shown
   - **Screenshot:** login-failed-001.png
   - **Console Errors:** "TypeError: Cannot read property 'user' of undefined"
   - **Status:** Open
```

### Step 5: Update Quick Stats
At the top of `testing-progress-tracker.md`, update:
```markdown
## 🎯 Quick Stats

- **Total Tests:** 110+
- **Tests Completed:** 1  ← Increment this
- **Tests Passing:** 1   ← Increment if passed
- **Tests Failing:** 0   ← Increment if failed
- **Critical Issues Found:** 0  ← Increment if failed
```

### Step 6: Move to Next Test
Repeat the loop!

---

## 📊 Example Complete Session

### Before Testing
```markdown
## 🎯 Quick Stats
- Tests Completed: 0
- Tests Passing: 0
- Tests Failing: 0
- Critical Issues Found: 0
```

### After 3 Tests (2 Pass, 1 Fail)
```markdown
## 🎯 Quick Stats
- Tests Completed: 3
- Tests Passing: 2
- Tests Failing: 1
- Critical Issues Found: 1
```

**Tests in tracker:**
- ✅ Test 1.1 - 🟢 Pass
- ✅ Test 1.2 - 🟢 Pass
- ✅ Test 1.3 - 🔴 Fail (Issue #1)

**Issues tracker:**
- Issue #1: Login validation error message not showing

---

## 💡 Pro Tips

### Use Status Emojis
- ⚪ **Not Started** - Haven't run this test yet
- 🟡 **In Progress** - Currently running this test
- 🟢 **Pass** - Test completed successfully
- 🔴 **Fail** - Test found issues

### Number Issues Sequentially
- First issue = #1
- Second issue = #2
- Third issue = #3
- Makes it easy to reference in notes

### Take Good Notes
**Bad notes:**
- "Didn't work"
- "Error occurred"

**Good notes:**
- "Login button clicked but no redirect, console shows JWT error"
- "Brief parsing returned 60% confidence, missing vessel size"
- "Client feedback saved but success message didn't appear"

### Don't Skip Failed Tests
- If a test fails, still mark it as completed
- Document the failure
- **Keep going with other tests**
- Don't let one failure block all testing

### Update Stats Regularly
- Update Quick Stats after every 5-10 tests
- Gives you a sense of progress
- Helps prioritize fixes

---

## 🎯 Priority Testing Order

**Phase 1: Start Here** (Tests 1-2)
1. Test 1.2 - Login ⭐
2. Test 1.9 - Logout ⭐

**Phase 2: Core Workflows** (Tests 3-8)
3. Test 19.1 - E2E Brief to Job ⭐
4. Test 23.3 - Add Brief ⭐
5. Test 23.4 - Parse Brief ⭐
6. Test 21.2 - AI Brief Parser ⭐
7. Test 21.4 - AI Matching ⭐

**Phase 3: User Portals** (Tests 9-14)
8. Test 19.2 - Client Reviews ⭐
9. Test 25.2 - Client Feedback ⭐
10. Test 19.3 - Candidate Application ⭐
11. Test 19.4 - Verification Workflow ⭐

**Phase 4: Complete Remaining Tests**
Run all other tests for full coverage

---

## 📝 Quick Cheat Sheet

### Before Each Test:
```
1. Find test in tracker
2. Mark as 🟡 In Progress
3. Copy prompt from prompts doc
4. Run in Playwright MCP
```

### After Each Test:
```
1. Mark as ✅ Completed
2. Status: 🟢 or 🔴
3. Add notes
4. If failed: Add to Issues Tracker
5. Update Quick Stats every 5-10 tests
```

### End of Session:
```
1. Review all completed tests
2. Count total issues found
3. Update Testing Summary section
4. Plan next testing session
```

---

## 🐛 When You Find a Bug

1. **Finish the test** - Complete all steps
2. **Mark test as 🔴 Fail** in tracker
3. **Add to Issues Tracker:**
   - Assign next issue number
   - Full details (URL, expected, actual, errors)
   - Set severity (Critical/High/Medium/Low)
   - Status: Open
4. **Move to next test** - Don't get stuck!

---

## ✅ Testing Complete Checklist

When you've run all tests:

- [ ] All tests marked as completed
- [ ] Quick Stats updated with final counts
- [ ] All issues documented in Issues Tracker
- [ ] Testing Summary section filled out
- [ ] Critical workflows status updated
- [ ] Recommendations added
- [ ] Next steps identified

---

## 🎉 You're Ready!

1. Open your 3 windows
2. Start with Test 1.2
3. Follow the loop
4. Update the tracker after each test
5. Keep going until done!

Happy testing! 🚀
