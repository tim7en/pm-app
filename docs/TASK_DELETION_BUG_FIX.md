# Task Deletion Permission Bug Fix

## 🐛 **Bug Description**
Users could not delete tasks they created if they were also assigned to those tasks. This was a critical permission bug that prevented proper task management.

## 🔍 **Root Cause**
In `src/lib/roles.ts`, the `canUserPerformTaskAction` function had incorrect permission priority logic:

**Before (Buggy Logic):**
```typescript
// Check assignee first (lower priority should have been higher)
if (task.assigneeId === userId) {
  return action === 'canEditTask'  // Only edit, never delete
}

// Check creator second (higher priority was checked last)
if (task.creatorId === userId) {
  return true  // Can both edit and delete
}
```

**Issue:** When a user was both creator AND assignee, the assignee check would run first and prevent deletion, even though the user created the task.

## ✅ **Fix Applied**
Reordered the permission checks to prioritize creator permissions:

**After (Fixed Logic):**
```typescript
// Check creator first (highest priority)
if (task.creatorId === userId) {
  return true  // Can both edit and delete
}

// Check assignee second (lower priority)
if (task.assigneeId === userId) {
  return action === 'canEditTask'  // Only edit, cannot delete unless creator
}
```

## 🎯 **Expected Behavior**
| Scenario | Can Edit | Can Delete | Notes |
|----------|----------|------------|-------|
| Creator + Assignee | ✅ Yes | ✅ Yes | **Fixed**: Creator permissions have priority |
| Only Creator | ✅ Yes | ✅ Yes | Always worked correctly |
| Only Assignee | ✅ Yes | ❌ No | Correct behavior maintained |
| Neither | ❌ No | ❌ No | Falls back to project permissions |

## 📁 **Files Modified**
- `src/lib/roles.ts` - Fixed permission priority logic in `canUserPerformTaskAction` function

## 🧪 **Testing**
- **Test File:** `src/tests/task-deletion-permission-fix.test.js`
- **Manual Testing:** Create a task, assign it to yourself, then try to delete it
- **Expected Result:** Task deletion should work without permission errors

## 🔗 **Related Components**
- Task deletion API: `src/app/api/tasks/[id]/route.ts`
- Task components: `src/components/tasks/`
- Permission system: `src/lib/roles.ts`

---

**Fix Status:** ✅ **COMPLETED**  
**Date:** July 31, 2025  
**Impact:** Users can now properly delete tasks they created, regardless of assignment status.
