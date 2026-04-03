# Task: Fix Resource Save & Schema Errors

- [ ] Database Migration:
  - [x] Research existing schema (Done).
  - [ ] Create `Backend/update_resource_schema.js`.
  - [ ] Run migration to add `project_name`, `issuing_date` and relax constraints.
- [ ] Backend Code Fix:
  - [ ] Update `resourceController.js` to fix `resource_id` syntax error.
  - [ ] Update `resourceController.js` to correctly handle the new schema.
- [ ] Verification:
  - [ ] Verify `check_schema.js` output.
  - [ ] Verify manual "Add Resource" from UI.
