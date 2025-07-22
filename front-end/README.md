# SWAPI Dashboard

A modern dashboard application built with React, TypeScript, and Tailwind CSS that visualizes Star Wars character data from the SWAPI (Star Wars API). The application features authentication, responsive UI components, and interactive data visualizations.

## Key Features

- **Data Visualization**: Interactive Pie and Bar charts showing character statistics (gender distribution, mass comparison)
- **Global Time Display**: Real-time clocks for major cities (London, New York, Tokyo)
- **Authentication**: Protected routes with login/logout functionality
- **Data Management**:
    - SWAPI data fetching with React Query
    - Caching and cache invalidation
    - Loading state tracking with progress indicators
- **UI Components**:
    - Responsive sidebar navigation
    - Theme switching (light/dark mode)
    - Form validation with Zod
    - Data tables with sorting/filtering
    - Toast notifications

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router
- **Styling**: Tailwind CSS with CSS variables, ShadCN UI components
- **State Management**: React Query, Context API
- **Build Tool**: Vite
- **Testing**: ESLint (with React Hooks/Refresh plugins)

## Project Structure

The application follows a modular structure with:
- Component-based architecture
- Custom hooks for API calls
- Protected route wrappers
- Theme provider context
- Type-safe TypeScript implementation

## Getting Started

1. Clone the repository
2. Install dependencies: `bun install` (or `npm install`)
3. Run development server: `bun run dev`
4. Build for production: `bun run build`