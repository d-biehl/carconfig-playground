# CarConfigurator Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive CarConfigurator web application built with Next.js 15, TypeScript, Tailwind CSS 4, and Prisma ORM. The application serves as a **test/demo application for Robot Framework training and education**, providing a realistic web application environment for:

- **Robot Framework Training**: Learning automated testing with a real-world application
- **Library Development**: Testing and developing custom Robot Framework libraries
- **Test Automation Workshops**: Hands-on practice with modern web technologies
- **Educational Purposes**: Demonstrating best practices in web development and test automation

The application features internationalization (i18n), dark/light theme support, and a complete car configuration system with user authentication and admin panel, making it an ideal candidate for comprehensive test automation scenarios.


## Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Framer Motion for animations
- **Database**: SQLite with Prisma ORM
- **Authentication**: Custom JWT-based auth with bcryptjs
- **Internationalization**: next-intl (German/English)
- **UI Components**: Headless UI, Lucide React icons
- **Theme**: next-themes for dark/light mode
- **Testing**: Vitest, Playwright, Jest with Testing Library
- **API Documentation**: OpenAPI/Swagger for REST API documentation
- **Test Automation**: Robot Framework compatible for training purposes

## Architecture Guidelines
- Use Next.js App Router with TypeScript strict mode
- Implement server-side rendering and static generation where appropriate
- Use Tailwind CSS 4 with CSS-in-JS approach and modern design system
- Implement proper TypeScript interfaces defined in `src/types/index.ts`
- Use React 19 features and functional components with hooks
- Implement proper error boundaries and loading states
- Follow Prisma best practices for database operations

## Implemented Features
1. **Car Configuration System**: ✅ Complete car model selection and option customization
2. **Pricing Calculator**: ✅ Real-time price calculation with selected options
3. **User Authentication**: ✅ Registration, login, logout with JWT tokens
4. **Admin Panel**: ✅ Full CRUD operations for cars, options, and user management
5. **Database Integration**: ✅ Prisma ORM with SQLite for all data persistence
6. **Internationalization**: ✅ German/English support with next-intl
7. **Theme System**: ✅ Dark/light mode with system preference detection
8. **Responsive Design**: ✅ Mobile-first responsive layouts

## Code Standards
- Follow established TypeScript interfaces in `src/types/index.ts`
- Use Prisma models consistently with the schema
- Implement proper component composition with props typing
- Use semantic HTML elements and ARIA attributes
- Follow accessibility best practices (WCAG guidelines)
- Implement responsive design with Tailwind breakpoints
- Use proper SEO meta tags and Open Graph data
- Follow internationalization patterns with next-intl keys

## API Design
- RESTful API endpoints in `src/app/api/` following Next.js conventions
- **OpenAPI Compliance**: All REST APIs follow OpenAPI 3.0 specification
- **Swagger Documentation**: Auto-generated API documentation available at `/api-docs`
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Input validation and sanitization for all endpoints
- JWT-based authentication middleware for protected routes
- Error handling with consistent response format
- Type-safe API responses matching TypeScript interfaces
- **Robot Framework Friendly**: APIs designed for easy automation testing

## Database Schema (Prisma)
```prisma
- Cars: id, name, category, basePrice, description, imageUrl, translations
- Options: id, name, category, price, description, imageUrl, translations
- Users: id, email, name, password, role (user/admin)
- Configurations: id, name, totalPrice, userId, carId, options
- CarOptions: Many-to-many relation between cars and compatible options
- Translations: Separate tables for car and option translations (i18n)
```

## Performance Considerations
- Use Next.js Image component for optimized images
- Implement proper caching strategies with revalidation
- Use React.lazy() and dynamic imports for code splitting
- Optimize Prisma queries with proper includes and selects
- Implement proper loading states and skeleton UIs
- Use Tailwind CSS purging for minimal bundle size

## Testing Strategy
- Unit tests with Vitest and Testing Library
- E2E tests with Playwright
- Security tests for authentication flows
- Integration tests for API endpoints
- Performance tests for critical user journeys
- **Robot Framework Integration**: Test cases designed for Robot Framework automation
- **API Testing**: OpenAPI-compliant endpoints for automated API testing
- **Cross-browser Testing**: Multi-browser support for comprehensive testing scenarios

## Development Guidelines
- Use TypeScript strict mode with proper type checking
- Follow ESLint and Prettier configurations
- Use conventional commit messages
- Implement proper error handling and user feedback
- Test all features across different devices and browsers
- Ensure proper i18n key usage for all user-facing text
- **Test-Driven Development**: Design features with testability in mind for Robot Framework
- **Documentation**: Maintain clear API documentation for training purposes
- **Accessibility**: Ensure proper element identification for automated testing

## Project Language
- **Primary Language**: English
- **Secondary Language**: German (i18n support)
- **Documentation**: English
- **Comments**: Use English for code comments and documentation
