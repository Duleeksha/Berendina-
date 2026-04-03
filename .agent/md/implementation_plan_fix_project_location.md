# Implementation Plan: Fix Project Edit Flow and Modal Behavior

Address the issues where:
1. The project edit modal stays open in "view mode" instead of returning to the list.
2. The project list fails to update automatically after editing due to an ID key mismatch (`id` vs `project_id`).
3. Refine any related data inconsistencies to ensure information persists correctly.

## User Review Required

> [!IMPORTANT]
> I have updated the plan to prioritize the **Modal Behavior**: When you click "Save" while editing a project, the modal will now **close automatically**, returning you to the updated project list.

> [!NOTE]
> I am still investigating which "location" field is not saving for you. I will fix the Edit flow first and then continue troubleshooting the location issue once clarified.

## Proposed Changes

### Backend

#### [MODIFY] [projectController.js](file:///c:/Users/dulee/Desktop/SDP%20UI/Backend/controllers/projectController.js)
- Update `addProject` and `updateProject` to return the same aliased keys as `getProjects` (`id`, `name`, `donor`, `location`, `start`, `end`).
  - Currently, `RETURNING *` returns raw database column names like `target_location`, which conflict with the frontend's expectation of `location`.
  - I will update the `RETURNING` clause or manually map the response keys.

---

### Frontend (Berendina UI)

#### [MODIFY] [ProjectForm.jsx](file:///c:/Users/dulee/Desktop/SDP%20UI/Berendina%20UI/src/pages/Projects/ProjectForm.jsx)
- Ensure the keys used in `formData` and the `name` attributes match the standardized backend keys.

#### [MODIFY] [Projects.jsx](file:///c:/Users/dulee/Desktop/SDP%20UI/Berendina%20UI/src/pages/Projects/Projects.jsx)
- Update `handleUpdateSubmit` to:
  - Wait for the standardized response.
  - Close the modal (`setIsModalOpen(false)`) upon success.
  - Fix the state update logic to correctly match IDs and include all updated fields.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1. Open the "Add New Project" form and save a project with a specific location.
2. Verify that the location appears correctly in the project list.
3. Open the "Edit" modal for the same project, change the location, and save.
4. Verify that the updated location persists in both the modal and the list view.
