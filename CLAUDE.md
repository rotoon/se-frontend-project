# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a Chiang Mai tourist places management system built with a separated architecture:

- **Backend**: Node.js/Express.js API server (port 3000)
- **Frontend**: Modern Webpack-powered tourist website (port 3001)
- **Admin Frontend**: Separate admin interface for content management (port 3002)

The system manages tourist places with authentication, CRUD operations, and file upload capabilities. It supports multi-language content (Thai, English, Chinese, Japanese) and uses JSON files as database storage with automatic backup systems.

## Important: Always read .kiro/specs/ directory

**CRITICAL**: Always check the `.kiro/specs/chiang-mai-admin/` directory for current project requirements:
- `requirements.md` - Contains 11 detailed user stories with acceptance criteria
- `design.md` - Contains system architecture and data models  
- `tasks.md` - Contains development progress and completed features

## Development Commands

### Starting the Applications

#### Backend (API Server - Port 3000)
```bash
cd backend
npm install                  # Install dependencies
npm start                    # Production mode
npm run dev                  # Development mode with nodemon
```

#### Frontend (Tourist Website - Port 3001)
```bash
cd frontend
npm install                  # Install dependencies
npm run dev                  # Development server with hot reloading
npm run build                # Production build
```

#### Admin Frontend (Admin Panel - Port 3002)
```bash
cd admin-frontend
npm install                  # Install dependencies
# Start with live-server or similar
```

### Running All Services
Start each service in separate terminals in this order:
1. Backend (port 3000)
2. Frontend (port 3001) 
3. Admin Frontend (port 3002)

### File Structure
```
se-frontend-project/
├── backend/                 # API Server (Port 3000)
│   ├── server.js            # Express API server
│   ├── package.json         # Backend dependencies
│   ├── data/                # JSON file database
│   │   ├── places.json      # Tourist places data
│   │   ├── categories.json  # Categories data
│   │   ├── users.json       # Admin users data
│   │   └── backups/         # Automatic backups
│   ├── routes/              # Express route handlers
│   │   ├── auth.js          # Authentication routes
│   │   ├── places.js        # Places CRUD operations
│   │   ├── categories.js    # Categories management
│   │   └── images.js        # Image upload handling
│   ├── utils/               # Utility modules
│   │   ├── dataManager.js   # Main data access layer
│   │   ├── jsonManager.js   # JSON file operations
│   │   ├── errorHandler.js  # Error handling and recovery
│   │   └── uploadManager.js # File upload utilities
│   └── public/              # Static assets (uploads)
├── frontend/                # Tourist Website (Port 3001)
│   ├── webpack.config.js    # Webpack configuration
│   ├── package.json         # Frontend dependencies
│   ├── index.html           # Main HTML template
│   ├── assets/              # Source assets
│   │   ├── js/              # JavaScript modules
│   │   │   ├── main.js      # Main entry point
│   │   │   ├── places.js    # Places page entry
│   │   │   ├── detail.js    # Detail page entry
│   │   │   └── modules/     # ES6 modules
│   │   │       ├── language.js    # Multi-language support
│   │   │       ├── utils.js       # Utility functions
│   │   │       ├── places-api.js  # Places API client
│   │   │       └── categories-api.js # Categories API client
│   │   └── css/             # Stylesheets
│   │       └── style.css    # Main CSS file
│   └── dist/                # Built assets (generated)
├── admin-frontend/          # Admin Panel (Port 3002)
│   ├── index.html           # Admin login page
│   ├── dashboard.html       # Admin dashboard
│   ├── places-list.html     # Places management
│   ├── place-form.html      # Place create/edit form
│   ├── categories.html      # Categories management
│   └── assets/              # Admin assets
│       ├── css/            # Admin styles
│       └── js/             # Admin JavaScript
├── webpage/                 # Original template
└── .kiro/specs/            # Project specifications
```

## Architecture

### Separated Architecture

#### Backend (API-Only Server)
- **Port**: 3000
- **Purpose**: RESTful API server
- **Technology**: Node.js, Express.js
- **CORS**: Enabled for frontend communication

#### Frontend (Tourist Website)  
- **Port**: 3001
- **Purpose**: Public tourist website
- **Technology**: Webpack 5, ES6 Modules, Bootstrap 5
- **Features**: Hot Module Replacement, video background, responsive design
- **API Communication**: Proxied to backend:3000

#### Admin Frontend (Management Panel)
- **Port**: 3002  
- **Purpose**: Content management interface
- **Technology**: HTML, CSS, JavaScript
- **Authentication**: Session-based with backend

### Data Layer (Backend)
- **DataManager**: Central class that coordinates JSON file operations and error handling
- **JSONManager**: Handles low-level file read/write operations with backup creation
- **ErrorHandler**: Provides error recovery, file integrity checks, and system health monitoring

### Authentication (Backend)
- Session-based authentication using express-session
- bcrypt for password hashing
- Login attempt limiting and account lockout protection
- Global middleware for protecting admin routes

### API Routes (Backend)
- **Public API** (`/api/*`): Open endpoints for frontend
- **Admin API** (`/admin/api/*`): Protected admin endpoints
- **Auth routes** (`/auth/*`): Login, logout, session management
- **Places routes** (`/api/places/*`): Full CRUD for tourist places
- **Categories routes** (`/api/categories/*`): Category management
- **Images routes** (`/api/images/*`): File upload and management

### Frontend Architecture
- **Webpack 5**: Module bundling and development server
- **ES6 Modules**: Modern JavaScript module system
- **Hot Module Replacement**: Live reloading during development
- **Code Splitting**: Separate bundles for different pages
- **CSS Processing**: Style-loader and css-loader for development
- **API Proxy**: Automatic proxy to backend server for API calls

### Data Storage
- JSON files in `data/` directory serve as the database
- Automatic backup system creates timestamped backups before modifications
- File recovery system can restore from backups if corruption occurs
- Default data initialization for missing files

### Key Features
- **Multi-language support**: Thai (required), English, Chinese, Japanese content management
- **File uploads**: Image upload with validation (JPG, PNG, WebP, max 5MB)
- **Data validation**: Phone numbers (Thai format), URLs, coordinates, social media links
- **Error recovery**: Automatic backup and recovery system with timestamped backups
- **Session management**: Secure session with brute force protection (5 attempts, 15min lockout)
- **Status management**: Draft, published, inactive, featured status for places
- **Search & Filter**: Search by keywords, filter by category and status

### Default Credentials
- Username: `admin`
- Password: `password`
- These are set in `data/users.json` with bcrypt hashing

### Data Models (from design.md)
- **Places**: Multi-language name/description, category, images, contact info, coordinates, hours, price range, status
- **Categories**: Multi-language names, slug, icon, ordering
- **Users**: Username, hashed password, email, role, login attempts, lockout timing

## Development Notes

- The application uses JSON files as a simple database solution
- All data operations go through the DataManager layer for consistency
- Error handling includes automatic backup and recovery mechanisms
- Static files are served from the `public/` directory
- The server creates necessary directories on startup if they don't exist

## Important Files to Understand

### Backend
- `backend/server.js`: Express API server with CORS enabled
- `backend/utils/dataManager.js`: Central data access layer with error handling
- `backend/utils/jsonManager.js`: Low-level JSON file operations with backup creation
- `backend/utils/errorHandler.js`: Error recovery, file integrity checks, system health monitoring
- `backend/routes/auth.js`: User authentication logic with brute force protection
- `backend/routes/places.js`: Data validation middleware pattern
- `backend/routes/categories.js`: Category management with place count tracking

### Frontend  
- `frontend/webpack.config.js`: Webpack configuration with dev server and proxy
- `frontend/assets/js/main.js`: Main entry point with ES6 imports
- `frontend/assets/js/modules/language.js`: Multi-language manager
- `frontend/assets/js/modules/places-api.js`: API client for places
- `frontend/assets/css/style.css`: Complete CSS with video background styles
- `frontend/index.html`: Main HTML template with video hero section

### Admin Frontend
- `admin-frontend/assets/js/admin.js`: Admin panel JavaScript
- `admin-frontend/assets/css/admin.css`: Admin panel styles

## Development Context

### Current Status (from tasks.md)
**Architecture Migration Complete:**
- ✅ Separated monolithic app into backend/frontend/admin-frontend
- ✅ Backend converted to API-only server with CORS
- ✅ Frontend built with Webpack 5 and modern development workflow
- ✅ Admin frontend separated for content management

**Features Complete:**
- ✅ Authentication system with brute force protection
- ✅ Multi-language content management 
- ✅ Image upload system with validation
- ✅ JSON data management with backup/recovery
- ✅ Search and filtering capabilities
- ✅ Complete CRUD operations for places and categories
- ✅ Webpack development server with hot reloading
- ✅ ES6 module system with code splitting
- ✅ Modern responsive frontend with video background

### Testing Strategy (from design.md)
- **Frontend**: Form validation, UI responsiveness, multi-language switching, image upload
- **Backend**: API endpoints, JSON file management, authentication, data validation
- **Integration**: End-to-end workflows, file upload, backup/recovery systems