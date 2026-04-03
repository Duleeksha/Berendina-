# Task: Resources Tab Full Implementation

- [ ] Standardize Backend `resourceController.js`:
  - [ ] Update `getResources` with `LEFT JOIN` and aliased keys (`id`, `name`, `type`, `quantity`, `status`, `condition`, `allocatedToId`, `allocatedToName`).
  - [ ] Standardize `addResource` and `updateResource` keys.
  - [ ] Implement `deleteResource` function.
- [ ] Update `resourceRoutes.js` to map DELETE route.
- [ ] Update Frontend `Resources.jsx`:
  - [ ] Fetch beneficiaries list for allocation.
  - [ ] Update Add/Edit modal:
    - [ ] Add "Allocated To" beneficiary dropdown.
    - [ ] Match standardized backend keys.
  - [ ] Add "Delete" button with confirmation prompt.
  - [ ] Polish table UI and status badges.
- [ ] Refine Status & Condition Badge Styling in `Resources.css`.
- [ ] Verify CRUD & Allocation Workflow.
- [ ] Create walkthrough.
