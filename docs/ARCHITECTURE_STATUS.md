# Taxis - Tax Calculator App

## Goal

Taxis is a web-based tax calculation application that allows users to create and manage multiple tax scenarios to compare different financial situations. The app calculates US federal income taxes for the 2024 tax year, supporting different filing statuses, income types, and deductions.

## Architecture

### Core Components

#### 1. **Tax Calculator (`src/taxCalculator.ts`)**
- **Purpose**: Pure calculation logic for US federal income tax
- **Responsibilities**: 
  - Calculate taxes based on 2024 tax brackets and rates
  - Handle ordinary income and long-term capital gains separately
  - Apply standard deductions and senior additional deductions
  - Compute effective tax rates
- **Key Features**:
  - Support for single, married filing jointly, and married filing separately
  - Separate tax brackets for ordinary income vs. long-term capital gains
  - Standard deductions with additional senior deductions (65+)
  - Capital loss handling

#### 2. **Scenario Manager (`src/scenarioManager.ts`)**
- **Purpose**: Data management and persistence layer
- **Responsibilities**:
  - Create, update, delete, and duplicate tax scenarios
  - Persist scenarios to localStorage
  - Automatically recalculate taxes when inputs change
  - Provide observer pattern for UI updates
- **Key Features**:
  - CRUD operations for scenarios
  - Automatic tax recalculation on input changes
  - localStorage persistence
  - Event-driven updates via listeners

#### 3. **UI Manager (`src/ui.ts`)**
- **Purpose**: User interface and interaction handling
- **Responsibilities**:
  - Render scenario cards with input forms and results
  - Handle user interactions (input changes, button clicks)
  - Display calculated tax results in formatted grids
  - Manage scenario actions (duplicate, delete)
  - Implement intelligent tab navigation system
- **Key Features**:
  - Dynamic scenario card rendering
  - Real-time input validation and updates
  - Formatted currency and percentage displays
  - Interactive scenario management
  - Smart tab navigation with focus management
  - Combined "Tax Table" dropdown for filing status and year selection
  - Conditional form fields based on filing status

#### 4. **Type Definitions (`src/types.ts`)**
- **Purpose**: TypeScript type definitions for data structures
- **Key Types**:
  - `FilingStatus`: Tax filing status options
  - `TaxInputs`: User input data structure
  - `TaxResults`: Calculated tax results
  - `TaxScenario`: Complete scenario with inputs and results

### Data Flow

1. **Initialization**: `main.ts` creates ScenarioManager and UIManager instances
2. **Scenario Creation**: User clicks "Add Scenario" → ScenarioManager creates new scenario → UI re-renders
3. **Input Changes**: User modifies inputs → UI triggers ScenarioManager.updateScenario() → TaxCalculator recalculates → UI updates results
4. **Persistence**: All changes automatically saved to localStorage
5. **Page Reload**: Scenarios loaded from localStorage with automatic tax recalculation

### Technical Stack

- **Language**: TypeScript
- **Build**: TypeScript compiler with source maps
- **Runtime**: Browser (ES modules)
- **Storage**: localStorage for scenario persistence
- **Styling**: CSS with responsive design
- **Architecture**: Modular ES6 modules with clear separation of concerns
- **Development Server**: Python HTTP server on port 8000

### File Structure

```
src/
├── main.ts              # Application entry point
├── taxCalculator.ts     # Pure tax calculation logic
├── scenarioManager.ts   # Data management and persistence
├── ui.ts               # User interface and interactions
└── types.ts            # TypeScript type definitions

dist/                   # Compiled JavaScript output
docs/                   # Documentation
index.html             # Main HTML file
styles.css             # Application styling
```

### Key Design Principles

1. **Separation of Concerns**: Tax calculation logic is completely separate from UI code
2. **Pure Functions**: Tax calculations are stateless and deterministic
3. **Data Persistence**: All scenarios automatically saved to localStorage
4. **Real-time Updates**: UI immediately reflects calculation changes
5. **Type Safety**: Full TypeScript coverage with strict typing
6. **Modular Architecture**: Each component has a single responsibility
7. **Accessibility**: Intelligent tab navigation and focus management for keyboard users

### Tax Calculation Details

- **Tax Year**: 2024
- **Supported Filing Statuses**: Single, Married Filing Jointly, Married Filing Separately
- **Income Types**: Ordinary income, ordinary earnings (interest/short-term gains), long-term capital gains
- **Deductions**: Standard deductions + additional senior deductions for 65+
- **Tax Brackets**: Separate progressive brackets for ordinary income and long-term capital gains
- **Capital Losses**: Applied against total income before deductions
 - **Capital Gains Stacking**: Long-term capital gains stack on top of taxable ordinary income; 0%/15%/20% applied to portions exceeding ordinary taxable
 - **NIIT**: 3.8% Net Investment Income Tax applied per thresholds (Single $200k, MFJ $250k, MFS $125k) on lesser of NII or MAGI excess

## Current Status

The application is fully functional with:
- ✅ Complete tax calculation engine for 2024 tax year, including LTCG stacking and NIIT
- ✅ Scenario management (create, edit, duplicate, delete)
- ✅ Real-time tax recalculation
- ✅ localStorage persistence
- ✅ Responsive web interface with modern design and tightened spacing
- ✅ TypeScript implementation with proper typing
- ✅ Intelligent tab navigation system
- ✅ Conditional form fields based on filing status
- ✅ Smart focus management and field selection
- ✅ Compact inline form layout (labels next to inputs)
- ✅ Modern gradient color scheme with glassmorphism effects

## Tab Navigation Implementation

The application features a sophisticated tab navigation system designed for optimal user experience:

### **Table-Driven Tab Order**
- **Implementation**: Sequential `tabIndex` assignment to ensure predictable tab flow
- **Filing Status**: Excluded from tab navigation (tabIndex = -1), accessible only by clicking
- **Cycling**: After 65+ field, Tab returns to Ordinary Income for continuous data entry

| Current Field | Tab → Next Field |
|---------------|------------------|
| Scenario Name | Ordinary Income |
| Filing Status | Ordinary Income (when clicked and tabbed out) |
| Ordinary Income | Ordinary Earnings |
| Ordinary Earnings | Long-term Capital Gains |
| Long-term Capital Gains | Capital Losses |
| Capital Losses | Number of People 65+ |
| Number of People 65+ | Ordinary Income (cycles back) |

### **Smart Focus Management**
- **Initial Focus**: Automatically focuses on Ordinary Income field when app loads
- **Text Selection**: All input fields select their contents when focused for easy replacement
- **Focus Preservation**: Prevents focus loss during re-renders caused by tab navigation

### **Change Detection & Performance**
- **Efficient Updates**: Only recalculates taxes when field values actually change
- **Real-time Updates**: All input fields trigger calculations on every change (with 150ms debouncing for text inputs)
- **Focus Preservation**: Text fields maintain focus during real-time updates using silent scenario updates
- **Immediate Updates**: Checkboxes, select dropdowns, and number inputs update immediately on change
- **Debounced Text Inputs**: Text fields use 150ms debounce to prevent excessive calculations during typing
- **Selective Re-rendering**: Real-time updates use silent scenario updates with manual results display updates to preserve focus
- **Configurable Focus Preservation**: Focus preservation can be toggled via `uiManager.setFocusPreservation(true/false)`

### **Conditional Field Rendering**
- **Seniors Field**: Dynamically renders as "65+" label + checkbox (Single/MFS) or number input 0-2 (MFJ)
- **Auto-Update**: Field type changes immediately when filing status changes
- **Type-Aware Handling**: Different input types (text, number, checkbox, select) handled appropriately

### **Event Handling Strategy**
- **Checkbox Fields**: Use `change` event for immediate updates
- **Select Fields**: Use `change` event for immediate updates (triggers re-rendering)
- **Text/Number Fields**: Use `input` event with 150ms debouncing for real-time updates
- **Tab Navigation**: Preserved through all event handling without interference

### **Detailed Tax Breakdown Modal**
- **Disclosure Indicator**: Chevron icon next to "Results" heading
- **Modal Overlay**: Glassmorphism design with backdrop blur
- **Detailed Breakdown**: Shows income summary, deductions, tax bracket calculations, capital gains tiers, and NIIT details
- **Interactive Features**: ESC key close, click-outside close, smooth animations
- **Responsive Design**: Mobile-optimized modal layout

## Configuration Options

### Focus Preservation During Real-time Updates

The application includes a configurable focus preservation system to prevent input fields from losing focus during real-time tax calculations:

```typescript
// In src/main.ts
const uiManager = new UIManager(scenarioManager)

// Enable focus preservation (default behavior)
uiManager.setFocusPreservation(true)

// Disable focus preservation (may cause focus loss during typing)
uiManager.setFocusPreservation(false)
```

**When Enabled (default)**:
- Uses `updateScenarioSilently()` to update data without triggering full re-renders
- Manually updates only the results display section
- Preserves focus and cursor position during typing
- Slightly more complex but provides better user experience

**When Disabled**:
- Uses normal `updateScenario()` which triggers full re-renders
- Simpler implementation but may cause focus loss during typing
- Useful for debugging or if focus preservation causes issues

## Development Setup

### Running the Application Locally

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
   - This runs TypeScript compiler in watch mode AND starts Python HTTP server on port 8000
   - Alternative commands:
     - `npm run build` - Compile TypeScript once
     - `npm run watch` - Watch TypeScript files for changes
     - `npm run serve` - Start Python HTTP server only (port 8000)
3. **Open browser**: Navigate to `http://localhost:8000`

### GitHub Pages Deployment

The application is configured for automatic deployment to GitHub Pages:

#### **Live Site**
- **URL**: `https://[username].github.io/Taxis/` (replace [username] with your GitHub username)
- **Auto-deployment**: Triggered on every push to `main` branch

#### **Deployment Process**
1. **GitHub Actions Workflow**: `.github/workflows/deploy.yml`
2. **Build Steps**:
   - Install Node.js 18 and dependencies
   - Compile TypeScript to JavaScript (`npm run build`)
   - Deploy entire project (including `dist/` folder) to GitHub Pages
3. **Automatic Updates**: Any push to `main` branch triggers a new deployment

#### **Setup Instructions**
1. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
2. **Push Changes**: Workflow runs automatically on push to `main`
3. **View Deployment**: Check Actions tab for deployment status

#### **Important Notes**
- **Build Output**: `dist/` folder is generated during deployment (not in source control)
- **Source Maps**: Excluded from repository (*.js.map in .gitignore)
- **Workflow Permissions**: Configured for Pages deployment with appropriate permissions

### Server Configuration
- **Development Server**: Python 3 HTTP server (port 8000)
- **Production Server**: GitHub Pages static hosting
- **Build Process**: TypeScript compiler with source maps
- **File Serving**: Static files served from project root

### Design System

The application features a modern, professional design with the following characteristics:

#### Color Palette
- **Primary Gradient**: Blue-purple gradient (#667eea to #764ba2)
- **Secondary Gradient**: Green gradient (#56ab2f to #a8e6cf) for success/primary actions
- **Accent Gradient**: Red gradient (#ff6b6b to #ee5a24) for danger actions
- **Background**: Full-screen gradient background for visual appeal
- **Text**: Dark slate (#2c3e50) for excellent readability

#### Visual Effects
- **Glassmorphism**: Semi-transparent cards with backdrop blur effects
- **Smooth Animations**: 0.3s transitions with hover effects and transforms
- **Box Shadows**: Layered shadows for depth and modern appearance
- **Interactive States**: Hover effects with subtle elevation changes

#### Typography
- **Font Stack**: System fonts for optimal performance and native feel
- **Hierarchy**: Clear visual hierarchy with uppercase section headers
- **Weight**: Strategic use of font weights (500-700) for emphasis

#### Layout & Spacing
- **Results Grid**: Tight vertical spacing (0.25rem gap) for compact display
- **Item Padding**: 0.375rem vertical on regular items, 0.75rem on highlighted items
- **Column Alignment**: Right-aligned numeric values with 100px minimum width
- **Visual Guide**: Subtle vertical alignment guide (1px line, 8% opacity) positioned 100px from right edge
- **Hover States**: Consistent padding maintained with horizontal extension

### Troubleshooting
- **Changes not showing**: If UI changes aren't visible, check if an old server is still running on port 8000
  - Check running processes: `lsof -i :8000`
  - Kill old server if needed: `kill <PID>`
  - Restart development server: `npm run dev`
- **Port conflicts**: Ensure port 8000 is available before starting the server

## Future Enhancements

Potential areas for expansion:
- Additional tax years
- State tax calculations
- Itemized deductions
- Tax optimization suggestions
- Export/import functionality
- Advanced scenario comparison tools
