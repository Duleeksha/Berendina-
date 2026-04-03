# Implementation Plan: Redirect Root to Login Page

The goal is to change the default behavior of the application when accessing the root URL (`/`). Currently, if a user is logged in, they are automatically redirected to their respective dashboard. We want this to go to the login page instead.

## Proposed Changes

### Berendina UI

#### [MODIFY] [App.jsx](file:///c:/Users/dulee/Desktop/SDP%20UI/Berendina%20UI/src/App.jsx)
- Update the `<Route path="/" ... />` logic in `App.jsx` to always redirect to `/login`.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1. Navigate to `http://localhost:5173/`.
2. Confirm it redirects to `http://localhost:5173/login` in all cases.
