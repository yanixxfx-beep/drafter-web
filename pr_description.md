# Debug: Multi-sheet processing still merging ideas and reusing images

## Problem

When selecting multiple sheets (WEDNESDAY, THURSDAY, FRIDAY, etc.), the app:
1. Still merges ideas into one big list (e.g., all 60 ideas processed together)
2. Reuses the same images across sheets (e.g., 'WEDNESDAY Idea 1' and 'THURSDAY Idea 1' get the same affiliate image)
3. Doesn't maintain sheet isolation

## Console Output

See attached log file `Drafter_generation_process_bug12.log`:
- Line 77-171: WEDNESDAY ideas 1-12 generated successfully
- Line 171-239: THURSDAY ideas 1-12 generated successfully  
- Line 432-471: Image assignment for WEDNESDAY ideas 1-12
- Line 472-514: Image assignment for THURSDAY ideas 1-12 - same images as WEDNESDAY (e.g., both Idea 4 use 'IMG_0283.png', both Idea 6 use 'IMG_7212 2.png')

## Current Code Analysis

The multi-sheet processing code (lines 1718-1824 in GeneratePage.tsx):
- Iterates through `step1Data.sheetsData`
- Processes each sheet independently
- Uses per-sheet idea numbering (`ideaId = idx + 1`)
- Tags ideas with correct sheet name

**BUT** the image assignment (`assignImagesToIdeas`) runs AFTER all sheets are processed and receives the merged `baseIdeas` array, causing:
- Same image pool being used for all sheets
- No randomization reset between sheets
- Identical image assignments across sheets

## Questions for ChatGPT

1. **Should `assignImagesToIdeas` be called separately for each sheet's ideas** to maintain image isolation per sheet?

2. **Should images be shuffled/reassigned per sheet** to prevent image reuse across sheets?

3. **Is there a state management issue** where `baseIdeas` is being shared between sheet iterations?

4. **What's the best pattern** for processing multiple independent datasets (sheets) that each need their own image pool?

5. **Should we modify `assignImagesToIdeas` to accept a sheet identifier** to track which sheet's ideas are being processed?

## Expected Behavior

- WEDNESDAY: Ideas 1-12 with unique images from the pool
- THURSDAY: Ideas 1-12 with unique images from the SAME pool (can reuse but should be randomized)
- FRIDAY: Ideas 1-12 with unique images from the SAME pool
- etc.

Currently, each sheet gets identical image assignments, which suggests the randomization seed or index is not being reset per sheet.

---

**Branch**: simple-refactor (commit 5bb43bef)  
**Files modified**: `src/components/pages/GeneratePage.tsx`

