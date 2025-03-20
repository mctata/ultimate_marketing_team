# Ultimate Marketing Team Frontend

This is the frontend application for the Ultimate Marketing Team platform. It provides a unified dashboard and modular interfaces to interact with the backend APIs, displaying real-time analytics, content strategy outputs, scheduling calendars, and ad management controls.

## Features

- User authentication with OAuth integration
- Unified dashboard with real-time analytics
- Content strategy visualization and management
- Project and brand management
- Content creation and scheduling
- Ad campaign management and optimization
- Responsive and accessible design (WCAG 2.1 compliant)

## Technologies Used

- React 18
- TypeScript
- Vite
- Material UI
- Redux Toolkit
- React Router
- React Query
- Chart.js for data visualization
- Formik and Yup for form validation
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env.local` file based on `.env.example` and fill in the required environment variables.

### Development

To start the development server:

```
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To build the application for production:

```
npm run build
```

The build artifacts will be located in the `dist` directory.

### Testing

To run tests:

```
npm run test
```

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Page components for different routes
- `src/services`: API integration services
- `src/hooks`: Custom React hooks
- `src/utils`: Utility functions
- `src/store`: Redux store and slices
- `src/context`: React context providers
- `src/types`: TypeScript type definitions
- `src/assets`: Static assets like images and icons

## Docker Deployment

The application can be deployed using Docker:

```
docker-compose up -d frontend
```

## Authentication

The application supports the following authentication methods:

- Email and password
- Google OAuth
- Facebook OAuth
- LinkedIn OAuth

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request