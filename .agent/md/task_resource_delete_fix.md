# Task: Custom Delete Confirmation Modal & Reliability Fix

- [ ] Frontend Enhancements (`Resources.jsx`):
  - [ ] Add `deletingResource` state to track items for deletion.
  - [ ] Create `confirmDelete` function to handle the final API call.
  - [ ] Add **Delete Confirmation Modal** UI at the bottom of the component.
  - [ ] Update table button to trigger the modal.
- [ ] Styling (`Resources.css`):
  - [ ] Add styles for `delete-modal-overlay` and `delete-modal-content`.
- [ ] Backend Reliability (`resourceController.js`):
  - [ ] Add verbose `console.log` for incoming DELETE requests.
- [ ] Verification:
  - [ ] Verify modal appears on "Delete" click.
  - [ ] Verify "Cancel" closes the modal.
  - [ ] Verify "Confirm" deletes the record and refreshes the list.
- [ ] Create walkthrough.
