# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a Chiang Mai tourist places admin system built with Node.js and Express.js. It's a full-stack web application for managing tourist places with authentication, CRUD operations, and file upload capabilities. The system supports multi-language content (Thai, English, Chinese, Japanese) and uses JSON files as database storage with automatic backup systems.

## Important: Always read .kiro/specs/ directory

**CRITICAL**: Always check the `.kiro/specs/chiang-mai-admin/` directory for current project requirements:
- `requirements.md` - Contains 11 detailed user stories with acceptance criteria
- `design.md` - Contains system architecture and data models  
- `tasks.md` - Contains development progress and completed features

## Development Commands

### Starting the Application
```bash
cd chiang-mai-admin
npm start                    # Production mode
npm run dev                  # Development mode with nodemon
```

### Package Management
```bash
cd chiang-mai-admin
npm install                  # Install dependencies
```

### File Structure
```
chiang-mai-admin/
├── server.js                # Main Express server
├── package.json             # Dependencies and scripts
├── data/                    # JSON file database
│   ├── places.json          # Tourist places data
│   ├── categories.json      # Categories data
│   ├── users.json           # Admin users data
│   └── backups/             # Automatic backups
├── routes/                  # Express route handlers
│   ├── auth.js              # Authentication routes
│   ├── places.js            # Places CRUD operations
│   ├── categories.js        # Categories management
│   └── images.js            # Image upload handling
├── utils/                   # Utility modules
│   ├── dataManager.js       # Main data access layer
│   ├── jsonManager.js       # JSON file operations
│   ├── errorHandler.js      # Error handling and recovery
│   └── uploadManager.js     # File upload utilities
├── views/                   # HTML templates
└── public/                  # Static assets (CSS, JS, uploads)
```

## Architecture

### Data Layer
- **DataManager**: Central class that coordinates JSON file operations and error handling
- **JSONManager**: Handles low-level file read/write operations with backup creation
- **ErrorHandler**: Provides error recovery, file integrity checks, and system health monitoring

### Authentication
- Session-based authentication using express-session
- bcrypt for password hashing
- Login attempt limiting and account lockout protection
- Global middleware for protecting admin routes

### Route Structure
- **Auth routes** (`/auth/*`): Login, logout, session management
- **Places routes** (`/api/places/*`): Full CRUD for tourist places
- **Categories routes** (`/api/categories/*`): Category management
- **Images routes** (`/api/images/*`): File upload and management

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

- `server.js:44-84`: Global authentication middleware
- `utils/dataManager.js`: Central data access layer with error handling
- `utils/jsonManager.js`: Low-level JSON file operations with backup creation
- `utils/errorHandler.js`: Error recovery, file integrity checks, system health monitoring
- `routes/auth.js:11-30`: User authentication logic with brute force protection
- `routes/places.js:11-22`: Data validation middleware pattern
- `routes/categories.js`: Category management with place count tracking

## Development Context

### Current Status (from tasks.md)
All 13 major development phases are complete including:
- Authentication system with brute force protection
- Multi-language content management 
- Image upload system with validation
- JSON data management with backup/recovery
- Search and filtering capabilities
- Complete CRUD operations for places and categories

### Testing Strategy (from design.md)
- **Frontend**: Form validation, UI responsiveness, multi-language switching, image upload
- **Backend**: API endpoints, JSON file management, authentication, data validation
- **Integration**: End-to-end workflows, file upload, backup/recovery systems