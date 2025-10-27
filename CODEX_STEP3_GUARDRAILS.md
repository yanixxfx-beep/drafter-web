# CODEX GUARDRAILS - Step 3 Fixes Implementation

## 🚨 CRITICAL WARNING: ZERO UI BREAKING ALLOWED

**The app MUST remain fully functional throughout ALL changes. If the UI breaks, STOP and revert immediately.**

---

## Current Working State

- ✅ **App is running** on localhost:3000
- ✅ **Sidebar text is visible** (set to `useState(true)`)
- ✅ **All functionality works** - Google Sheets, generation, export
- ✅ **Refactored components exist** - Step1Pane, Step2Pane, Step3Pane
- ⚠️ **TypeScript build errors exist** - IGNORE these unless they break functionality

---

## Implementation Rules

### 1. **SAFETY FIRST**
- **Test after EVERY change** - ensure app still runs on localhost:3000
- **If UI breaks** - immediately revert and try different approach
- **Never modify** existing working functionality
- **Only ADD new code** - don't change existing working code

### 2. **TypeScript Errors - IGNORE**
- **DO NOT fix** TypeScript build errors unless they break the app
- **Focus on functionality** - not code style or type compliance
- **Current errors are safe** - they don't prevent the app from running

### 3. **File Modifications - MINIMAL**
- **Don't touch** `src/components/layout/EnhancedSidebar.tsx` - it's working
- **Don't touch** `src/components/layout/Sidebar.tsx` - it's working  
- **Don't touch** `src/components/layout/TitleBar.tsx` - it's working
- **Only modify** files related to Step 3 fixes

---

## Step 3 Fixes Implementation Order

### Fix Pack 1: useCanvasRender Hook
**File:** `src/hooks/useCanvasRender.ts` (CREATE NEW)
- Implement the exact code from drafter_step3_fixes.txt
- **Test:** Ensure app still runs after creation

### Fix Pack 2: SlideRenderer
**File:** `src/lib/render/SlideRenderer.ts` (CREATE NEW)
- Implement the exact code from drafter_step3_fixes.txt
- **Test:** Ensure app still runs after creation

### Fix Pack 3: Thumbnail Queue
**File:** `src/lib/images/thumbnail.ts` (CREATE NEW)
- Implement the exact code from drafter_step3_fixes.txt
- **Test:** Ensure app still runs after creation

### Fix Pack 4: Editor Parity
**File:** `src/components/SlideEditorCanvas.tsx` (MODIFY EXISTING)
- **CAREFULLY** remove duplicate useCanvasRender calls
- **Test:** Ensure editor still works after changes

### Fix Pack 5: Performance
**Files:** Various (MODIFY EXISTING)
- **CAREFULLY** add performance improvements
- **Test:** Ensure app still runs after each change

---

## What NOT to Touch

### ❌ **NEVER MODIFY:**
- `src/components/layout/EnhancedSidebar.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TitleBar.tsx`
- `src/components/pages/GeneratePage.tsx` (main component)
- `src/components/generate/parts/Step1Pane.tsx`
- `src/components/generate/parts/Step2Pane.tsx`
- `src/components/generate/parts/Step3Pane.tsx`

### ❌ **NEVER FIX:**
- TypeScript build errors (unless they break functionality)
- Code style issues
- Import warnings
- Linting warnings

---

## Testing Protocol

### After Each Change:
1. **Check if app runs:** `npm run dev` should start successfully
2. **Check if UI loads:** Visit localhost:3000 - should see full interface
3. **Check if functionality works:** Test basic navigation and generation
4. **If anything breaks:** Immediately revert and try different approach

### Success Criteria:
- ✅ App starts without errors
- ✅ UI loads completely (not blank screen)
- ✅ Sidebar text is visible
- ✅ Navigation works
- ✅ Generate page loads
- ✅ All existing functionality preserved

---

## Emergency Procedures

### If UI Breaks:
1. **STOP immediately**
2. **Revert the last change:** `git restore <filename>`
3. **Test app:** Ensure it's working again
4. **Try different approach** or skip that fix pack

### If App Won't Start:
1. **Check console errors**
2. **Revert all changes:** `git restore .`
3. **Start fresh** with different approach

---

## Final Success Definition

**The Step 3 fixes are complete when:**
- ✅ All fix packs implemented
- ✅ App runs perfectly on localhost:3000
- ✅ UI is fully functional (no blank screens)
- ✅ All existing features work
- ✅ New Step 3 features work
- ✅ Performance is improved

**Remember: It's better to have a working app with fewer features than a broken app with all features.**

---

## Codex Instructions

```
Implement the Step 3 fixes from drafter_step3_fixes.txt following these guardrails:

1. Test after EVERY change - app must run on localhost:3000
2. IGNORE TypeScript errors unless they break functionality  
3. Only ADD new code - don't modify existing working code
4. If UI breaks, revert immediately and try different approach
5. Focus on functionality, not code style

Start with Fix Pack 1: useCanvasRender hook
Then proceed through Fix Packs 2-5
Test thoroughly after each change

The app MUST remain functional throughout the entire process.
```
