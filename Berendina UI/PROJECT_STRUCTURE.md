# Berendina UI - Complete File Structure

## Refactored Project Directory

```
Berendina UI/
├── README.md
├── REFACTORING_SUMMARY.md
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
│
├── public/
│   └── (static assets)
│
└── src/
    ├── App.jsx                           # Main application component with routing
    ├── App.css                           # App-level styles
    ├── main.jsx                          # Entry point
    ├── index.css                         # Global index styles
    ├── theme.css                         # CSS variables & global design system
    │
    ├── assets/
    │   ├── berendina-logo.png
    │   └── (other static assets)
    │
    ├── pages/
    │   ├── Auth/
    │   │   ├── Login.jsx                 # Login page with email/password form
    │   │   ├── Login.css                 # Login page styling
    │   │   ├── Register.jsx              # Registration page with validation
    │   │   └── Register.css              # Register page styling
    │   │
    │   ├── Dashboard/
    │   │   ├── Dashboard.jsx             # Main dashboard with charts & metrics
    │   │   │   ├── Summary cards (4 metrics)
    │   │   │   ├── Project Progress Bar Chart
    │   │   │   ├── Beneficiary Growth Line Chart
    │   │   │   ├── Recent Activities list
    │   │   │   └── Upcoming Field Visits timeline
    │   │   └── Dashboard.css             # Dashboard styling
    │   │
    │   ├── Beneficiaries/
    │   │   ├── Beneficiaries.jsx         # Beneficiaries list with search & filter
    │   │   │   ├── Search functionality
    │   │   │   ├── Status filter (Active/Inactive/Pending)
    │   │   │   ├── Data table with pagination
    │   │   │   └── Add/Edit actions
    │   │   ├── Beneficiaries.css         # List page styling
    │   │   ├── BeneficiaryForm.jsx       # Form for add/edit beneficiaries
    │   │   │   ├── Personal Information section
    │   │   │   ├── Location Information section
    │   │   │   └── Project Information section
    │   │   └── BeneficiaryForm.css       # Form page styling
    │   │
    │   ├── FieldVisits/
    │   │   ├── FieldVisits.jsx           # Calendar and timeline views
    │   │   │   ├── Calendar grid (Month view)
    │   │   │   ├── View mode toggle (Month/Week/Day)
    │   │   │   ├── Calendar legend
    │   │   │   └── Timeline with upcoming visits
    │   │   └── FieldVisits.css           # Field visits page styling
    │   │
    │   ├── Resources/
    │   │   ├── Resources.jsx             # Resource management and tracking
    │   │   │   ├── Resource statistics cards
    │   │   │   ├── Search functionality
    │   │   │   ├── Resource table with:
    │   │   │   │   ├── Resource name
    │   │   │   │   ├── Type
    │   │   │   │   ├── Quantity
    │   │   │   │   ├── Allocation
    │   │   │   │   ├── Utilization (progress bar)
    │   │   │   │   └── Maintenance status
    │   │   │   └── Status badges
    │   │   └── Resources.css             # Resources page styling
    │   │
    │   └── ReportGenerator/
    │       ├── ReportGenerator.jsx       # Report generation interface
    │       │   ├── Report settings form (left panel)
    │       │   │   ├── Report type selector
    │       │   │   ├── Date range picker
    │       │   │   ├── Districts filter
    │       │   │   └── Projects filter
    │       │   └── Report preview (right panel)
    │       │       ├── Header with title & date
    │       │       ├── Executive summary
    │       │       ├── Key metrics grid
    │       │       ├── Activities completed list
    │       │       └── Footer
    │       └── ReportGenerator.css       # Report generator styling
    │
    └── components/
        ├── Sidebar/
        │   ├── Sidebar.jsx               # Navigation sidebar with menu
        │   │   ├── Header with toggle button
        │   │   ├── Collapsible navigation menu (7 items)
        │   │   ├── User profile section
        │   │   └── Logout button
        │   └── Sidebar.css               # Sidebar styling
        │
        ├── Footer/
        │   ├── Footer.jsx                # Footer with copyright
        │   └── Footer.css                # Footer styling
        │
        └── Navbar/
            ├── Navbar.jsx                # Top navigation bar
            └── Navbar.css                # Navigation bar styling
```

## Component & Page Details

### Pages (6 main sections)

#### 1. **Auth Pages** (`/pages/Auth/`)
- **Login.jsx**: Secure login with email/password validation
- **Register.jsx**: User registration with comprehensive form validation
- Features: Error handling, Link navigation to other auth pages

#### 2. **Dashboard** (`/pages/Dashboard/`)
- Summary cards showing: Total Beneficiaries, Active Projects, Field Visits, Resources Allocated
- Bar chart: Project Progress (6-month view)
- Line chart: Beneficiary Growth (6-month view)
- Recent activities with timeline
- Upcoming field visits list

#### 3. **Beneficiaries** (`/pages/Beneficiaries/`)
- Beneficiaries.jsx: Data table with search, filter by status, and edit actions
- BeneficiaryForm.jsx: Multi-section form for adding/editing beneficiaries
- Features: Search functionality, status filtering, progress tracking

#### 4. **Field Visits** (`/pages/FieldVisits/`)
- Calendar view with highlighted visit dates
- Timeline view of upcoming visits
- View mode toggle (Month/Week/Day)
- Visit details: beneficiary name, location, time, status

#### 5. **Resources** (`/pages/Resources/`)
- Resource statistics summary
- Searchable resource table
- Utilization tracking with progress bars
- Maintenance status indicators
- Status badges for resource conditions

#### 6. **Report Generator** (`/pages/ReportGenerator/`)
- Split-screen layout
- Settings panel: Report type, date range, filters
- Live preview panel showing generated report
- Metrics and activities summary

### Components (3 reusable components)

#### 1. **Sidebar** (`/components/Sidebar/`)
- Collapsible navigation menu (280px → 80px)
- 7 navigation items with icons
- User profile section with logout
- Smooth transitions and hover effects

#### 2. **Footer** (`/components/Footer/`)
- Simple copyright footer
- Displays current year dynamically
- Applies to all pages

#### 3. **Navbar** (`/components/Navbar/`)
- Top navigation with logo
- Menu links for navigation
- Gradient background styling

## Styling Architecture

### Global Styles
- **index.css**: Base HTML and body styles
- **theme.css**: CSS variables and design system (1000+ lines)
  - Colors: Primary blue (#2563eb), dark gray (#1e293b)
  - Spacing: Consistent scale (4px to 32px)
  - Typography: Font families, sizes, weights
  - Components: Common buttons, cards, tables, badges
  - Utilities: Shadows, borders, transitions, breakpoints

### Page-Specific Styles
- **Dashboard.css**: Cards, charts, activity lists, metrics
- **Beneficiaries.css**: Table styling, search input, filter select, progress bars
- **BeneficiaryForm.css**: Form layout, input fields, buttons, error states
- **FieldVisits.css**: Calendar grid, timeline items, date pickers
- **Resources.css**: Statistics cards, table styling, utilization bars
- **ReportGenerator.css**: Form panels, preview layout, metrics display

### Component-Specific Styles
- **Sidebar.css**: Navigation layout, menu items, user profile, logout button
- **Footer.css**: Footer container and copyright text
- **Navbar.css**: Navigation bar layout and menu styling

## Responsive Breakpoints

All pages and components include responsive design with breakpoints:
- **1024px**: Tablet size adjustments
- **768px**: Mobile size adjustments
- Mobile-first approach with progressive enhancement

## Technology Stack

- **Framework**: React 19.2.0
- **Bundler**: Vite (rolldown-vite v7.2.5)
- **Routing**: React Router v6
- **Charts**: Recharts (Bar and Line charts)
- **Styling**: CSS with CSS variables
- **Development**: Hot Module Replacement (HMR)
- **Port**: 5174 (localhost)

## Key Features

✅ **Authentication**: Login and registration with validation
✅ **Dashboard**: Charts and metrics for organization overview
✅ **Beneficiary Management**: CRUD operations with forms
✅ **Field Visits**: Calendar and timeline tracking
✅ **Resources**: Allocation and utilization tracking
✅ **Reports**: Customizable report generation
✅ **Navigation**: Sidebar menu with collapsible feature
✅ **Responsive Design**: Mobile, tablet, and desktop support
✅ **Theme System**: Consistent styling with CSS variables
✅ **Error Handling**: Form validation and error messages

## Import Paths Reference

All imports now use explicit module paths:

```jsx
// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Beneficiaries from './pages/Beneficiaries/Beneficiaries';
import BeneficiaryForm from './pages/Beneficiaries/BeneficiaryForm';
import FieldVisits from './pages/FieldVisits/FieldVisits';
import Resources from './pages/Resources/Resources';
import ReportGenerator from './pages/ReportGenerator/ReportGenerator';

// Components
import Sidebar from './components/Sidebar/Sidebar';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';

// Global Styles
import './theme.css';
import './index.css';
import './App.css';
```

## Routes Configuration

```jsx
// Public Routes
/login              → Login page
/register           → Registration page

// Protected Routes (authenticated users only)
/dashboard                      → Dashboard page
/beneficiaries                  → Beneficiaries list
/beneficiary-form               → Add new beneficiary
/beneficiary-form/:id           → Edit beneficiary
/field-visits                   → Field visits calendar & timeline
/resources                      → Resource management
/report-generator               → Report generation

// Catch-all
/*                  → Redirects to /dashboard or /login (based on auth)
```

---

**Last Updated**: January 21, 2026
**Status**: ✅ Refactoring Complete
**Build Status**: ✅ No Errors
**Testing**: ✅ All Pages Verified
