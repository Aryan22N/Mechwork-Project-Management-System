# Mechwork Project Management System

A comprehensive web-based platform designed exclusively for **Mechwork Private Limited** to manage solar field operations, project progress, workforce tracking, and multi-tier workflows. Built with a modern stack featuring **Next.js 16**, **Neon Postgres**, **Prisma**, **JWT**, and **Tailwind CSS / shadcn**.

## 🌟 Key Features

- 👥 **Role-Based Access Control (RBAC):** Hierarchical access for `SUPER_ADMIN`, `PROJECT_MANAGER`, and `SUPERVISOR` with dedicated dashboards.
- 🏗️ **Project & Progress Tracking:** Track project milestones, manage budgets, categorize expense heads, and maintain a history of project progress.
- 💰 **Payment & Bill Management:** A robust multi-tier approval system for payment requests (Supervisor -> PM -> Admin). Supports attaching materials, unit prices, and visual receipts.
- 👷 **Workforce Management:** Keep track of field workers, their assignments, and automated recurring payment reminders.
- 🖼️ **Asset Management:** Integrated with **ImageKit** to securely store and retrieve images of bills and material receipts.
- 🔒 **Secure Authentication:** Custom JWT-based authentication with bcrypt password hashing.

## 🔑 Roles & Demo Credentials

Use the following credentials to explore different role-based dashboards:

| Role | Dashboard Route | Phone | DOB (Password) |
|---|---|---|---|
| `SUPER_ADMIN` | `/superadmin/dashboard` | `8888888888` | `1990-01-01` |
| `PROJECT_MANAGER` | `/manager/dashboard` | `7777777777` | `1990-01-01` |
| `SUPERVISOR` | `/supervisor/dashboard` | `6666666666` | `1990-01-01` |

---
