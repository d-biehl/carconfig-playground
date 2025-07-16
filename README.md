# 🚗 CarConfigurator Playground

> A realistic vehicle configurator for **test automation training** - built with modern web technologies and intentionally imperfect for educational purposes

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright)](https://playwright.dev/)
[![Robot Framework](https://img.shields.io/badge/Robot%20Framework-Ready-000000?logo=robotframework)](https://robotframework.org/)

The perfect **playground for Robot Framework enthusiasts** and test automation professionals. This application simulates real-world development challenges with modern tech stack, providing an authentic environment for learning, training, and experimenting with test automation tools.

## ⚠️ Important Note

This project was intentionally created in **"vibe coding" mode** and is **not a perfect application**. Some features may be incomplete, buggy, or not fully polished. This is by design!

The goal is to provide a **realistic testing environment** that mirrors real-world scenarios where:

- 🐛 Code has bugs and imperfections
- 🔧 Features might not work perfectly
- 📝 Documentation may be incomplete
- 🎯 Test automation needs to handle edge cases

This makes it an ideal simulation for creating and practicing **test automation projects of any kind** – just like you'd encounter in actual software development.

## ✨ Features

- 🚙 **Vehicle Configuration** - Premium BMW, Audi & Mercedes models
- 💰 **Real-time Pricing** - Instant price updates as you configure
- 🔐 **Authentication** - JWT-based user management
- 👑 **Admin Panel** - Complete CRUD operations
- 🌍 **Internationalization** - German & English support
- 🌓 **Dark/Light Mode** - System preference detection
- 📱 **Responsive Design** - Mobile-first approach
- 🔧 **API Documentation** - OpenAPI 3.1.1 compliant REST APIs

## � Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:generate && npm run db:push && npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start configuring!

**API Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## � Tech Stack

| Category     | Technology                          |
| ------------ | ----------------------------------- |
| **Frontend** | Next.js 15, React 19, TypeScript 5  |
| **Styling**  | Tailwind CSS 4, Framer Motion       |
| **Database** | Prisma ORM, SQLite                  |
| **Auth**     | JWT, bcryptjs                       |
| **i18n**     | next-intl (DE/EN)                   |
| **Testing**  | Vitest, Playwright, Robot Framework |

## � Available Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Create production build  |
| `npm run test`      | Run unit tests           |
| `npm run test:e2e`  | Run E2E tests            |
| `npm run db:studio` | Open Prisma Studio       |

## 🎓 Perfect for Learning

- 🤖 **Robot Framework Training** - Realistic web app for test automation
- 🔧 **Library Development** - Test custom Robot Framework libraries
- 🎯 **API Testing** - OpenAPI 3.1.1 compliant REST endpoints
- 🌐 **Cross-browser Testing** - Multi-browser automation scenarios
- 🛡️ **Security Testing** - Authentication & authorization flows

## 🤝 Contributing

This project is designed for educational purposes. Feel free to use it for training, workshops, or as a reference for modern web development with test automation in mind.

## 📄 License

MIT License - feel free to use, modify, and distribute this project for educational and training purposes.
