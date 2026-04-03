# Task: Advanced Resource Management & Project Filtering

- [ ] Standardize Backend `resourceController.js`:
  - [ ] Update `getResources` to include `r.project_name AS project` and `r.issuing_date AS "issuingDate"`.
  - [ ] Update `addResource` and `updateResource` to handle `project` and `issuingDate`.
- [ ] Update Frontend `Resources.jsx`:
  - [ ] Fetch Projects list to populate the Project dropdown.
  - [ ] Implement `filteredBeneficiaries` logic based on the selected Project.
  - [ ] Update Add/Edit Form:
    - [ ] Add **Project** dropdown.
    - [ ] Add **Beneficiary** dropdown (filtered).
    - [ ] Add **Issuing Date** picker.
    - [ ] Remove **Type** and **Status** fields (as previously requested).
  - [ ] Update List View:
    - [ ] Ensure "Issued Project" and "Issuing Date" columns are displayed.
- [ ] Verify Filtering & Data Persistence.
- [ ] Create walkthrough.
