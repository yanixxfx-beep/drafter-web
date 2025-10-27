# Codex CLI Guardrails for Drafter GeneratePage Refactor

## 🚨 CRITICAL: ZERO UI CHANGES ALLOWED

**ABSOLUTE REQUIREMENT**: This refactor must preserve the EXACT UI appearance, behavior, and user experience. Any visual changes, layout modifications, or functional alterations are STRICTLY FORBIDDEN.

## Project Context
- **Goal**: Split the large `GeneratePage.tsx` (4000+ lines) into smaller, manageable components
- **Critical**: Preserve EXACT UI and functionality - no visual changes
- **Approach**: Surgical refactor - extract components without changing behavior
- **Current Branch**: `simple-refactor`

## Files to Focus On
- `src/components/pages/GeneratePage.tsx` - Main target for refactoring
- `src/components/generate/parts/` - Where new components should go
- `src/lib/generate/` - Utility functions (if needed)

## 🎯 EXTRACTION TARGETS

### Step 1: Extract Step1Pane.tsx
- **Source**: `renderStep1()` function from GeneratePage.tsx
- **Location**: `src/components/generate/parts/Step1Pane.tsx`
- **Contains**: Google Sheets integration, content input, session management

### Step 2: Extract Step2Pane.tsx  
- **Source**: `renderStep2()` function from GeneratePage.tsx
- **Location**: `src/components/generate/parts/Step2Pane.tsx`
- **Contains**: Image upload, OPFS storage, image management

### Step 3: Extract Step3Pane.tsx
- **Source**: `renderStep3()` function from GeneratePage.tsx
- **Location**: `src/components/generate/parts/Step3Pane.tsx`
- **Contains**: Text styling controls, slide generation, export functionality

## ✅ WHAT TO DO (STRICT REQUIREMENTS)

### Component Extraction Rules
1. **Copy EXACTLY** - Copy the render function content exactly as-is
2. **Preserve ALL props** - Keep every prop, state, and function signature identical
3. **Maintain ALL styling** - Copy every className, style object, and CSS exactly
4. **Keep ALL event handlers** - Preserve every onClick, onChange, onSubmit exactly
5. **Preserve ALL state** - Don't change any useState, useEffect, or state management
6. **Keep ALL imports** - Copy every import statement exactly
7. **Maintain ALL types** - Keep every TypeScript interface and type exactly

### File Structure Rules
1. **Create new files** in `src/components/generate/parts/`
2. **Export as default** - Use `export default` for each component
3. **Keep same naming** - Use exact same function names and variable names
4. **Preserve comments** - Keep all existing comments and documentation

### GeneratePage Update Rules
1. **Replace render calls** - Replace `renderStep1()` with `<Step1Pane />`
2. **Add imports** - Import the new components
3. **Pass ALL props** - Pass every prop that the original functions used
4. **Keep ALL state** - Don't change any state management in GeneratePage
5. **Preserve ALL logic** - Keep every function, hook, and logic exactly

## ❌ WHAT NOT TO DO (ABSOLUTE PROHIBITIONS)

### UI/UX Changes (FORBIDDEN)
- ❌ Change ANY className or styling
- ❌ Modify ANY layout or positioning
- ❌ Change ANY colors, fonts, or visual appearance
- ❌ Alter ANY spacing, margins, or padding
- ❌ Change ANY button text, labels, or content
- ❌ Modify ANY form inputs or controls
- ❌ Change ANY icons or visual elements
- ❌ Alter ANY responsive behavior

### Functional Changes (FORBIDDEN)
- ❌ Change ANY function signatures
- ❌ Modify ANY state management
- ❌ Alter ANY event handling
- ❌ Change ANY data flow
- ❌ Modify ANY API calls
- ❌ Alter ANY validation logic
- ❌ Change ANY error handling
- ❌ Modify ANY loading states

### Code Structure Changes (FORBIDDEN)
- ❌ Change ANY import/export patterns
- ❌ Modify ANY TypeScript types
- ❌ Alter ANY component structure
- ❌ Change ANY prop interfaces
- ❌ Modify ANY hook usage
- ❌ Alter ANY context usage
- ❌ Change ANY utility functions

## 🔍 VERIFICATION CHECKLIST

Before considering the refactor complete, verify:

### Visual Verification
- [ ] UI looks EXACTLY the same as before
- [ ] All buttons, inputs, and controls work identically
- [ ] All styling, colors, and layout are preserved
- [ ] All animations and transitions work the same
- [ ] All responsive behavior is identical

### Functional Verification
- [ ] All user interactions work exactly the same
- [ ] All state changes behave identically
- [ ] All API calls work the same
- [ ] All validation works the same
- [ ] All error handling works the same

### Code Verification
- [ ] No TypeScript errors
- [ ] All imports are correct
- [ ] All props are passed correctly
- [ ] All state management is preserved
- [ ] All event handlers work the same

## 🎯 SUCCESS CRITERIA

### GeneratePage.tsx Changes
- [ ] Becomes a thin orchestrator (under 500 lines)
- [ ] Uses `<Step1Pane />`, `<Step2Pane />`, `<Step3Pane />` components
- [ ] All original functionality preserved
- [ ] All state management preserved
- [ ] All event handling preserved

### New Components
- [ ] Step1Pane.tsx - Contains renderStep1() content exactly
- [ ] Step2Pane.tsx - Contains renderStep2() content exactly  
- [ ] Step3Pane.tsx - Contains renderStep3() content exactly
- [ ] All components are fully functional
- [ ] All components preserve exact UI and behavior

### Code Quality
- [ ] No TypeScript errors
- [ ] All imports are correct
- [ ] All props are properly typed
- [ ] All components are properly exported
- [ ] All functionality is preserved

## 🚨 FINAL WARNING

**REMEMBER**: This is a SURGICAL refactor. The goal is to split code into smaller files while preserving EVERYTHING else exactly as it is. Any changes to UI, functionality, or behavior will be considered a FAILURE of this refactor.

**The user should not be able to tell the difference between before and after the refactor, except that the code is now better organized.**


