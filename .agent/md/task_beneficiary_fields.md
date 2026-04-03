# Task: Expand Beneficiary Information Fields

- [ ] Backend Enhancements:
  - [ ] Update `getBeneficiaries` in `beneficiaryController.js` to return `maritalStatus`, `familyMembers`, `monthlyIncome`, and `occupation`.
  - [ ] Update `addBeneficiary` and `updateBeneficiary` to handle the new field values.
- [ ] Frontend Enhancements (`Beneficiaries.jsx`):
  - [ ] Update `formData` and `handleOpenModal` to include the new fields.
  - [ ] Add Form Inputs to the Add/Edit Modal:
    - [ ] Marital Status (Dropdown)
    - [ ] Family Members (Number)
    - [ ] Monthly Income (Number)
    - [ ] Primary Occupation (Text)
- [ ] Verification:
  - [ ] Test "Add Beneficiary" with new fields.
  - [ ] Test "Edit Beneficiary" to ensure data reloads correctly.
- [ ] Create walkthrough.
