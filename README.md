# ImpactHaus

ImpactHaus is a skill-based volunteering platform connecting skilled young Africans (18-35) with NGOs and grassroots organizations across Africa. Volunteers discover opportunities matched to their skills, apply, and complete engagements that automatically build a verified, shareable impact portfolio, turning informal volunteer work into a professional, credentialed experience.

**Live demo:** https://impacthaus-mvp.vercel.app

## Features

- Volunteer and NGO registration with role-specific profiles
- Email/password and Google OAuth login, password reset
- Skill-based volunteer profiling with proficiency levels
- NGO opportunity posting, editing, and closing
- Opportunity feed with filtering by cause area, location, and skill
- Application submission and NGO review (accept/decline)
- Engagement tracking (active, completed, cancelled)
- Auto-generated impact portfolio with a public shareable link and PDF export
- Profile photo upload

## Tech stack

- **Frontend:** React (Vite)
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **Routing:** React Router
- **PDF generation:** jsPDF
- **Deployment:** Vercel

## Prerequisites

- [Node.js](https://nodejs.org) (LTS version, 18 or higher)
- A free [Supabase](https://supabase.com) account
- Git

## Setup instructions

### 1. Clone the repository

```
git clone https://github.com/sultanhabibllah/impacthaus-mvp.git
cd impacthaus-mvp
```

### 2. Install dependencies

```
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings → API Keys** and copy:
   - Your **Project URL**
   - Your **anon / publishable key**

### 4. Set up the database

In your Supabase project, go to **SQL Editor → New query**, and run each of the following SQL files from this repository's `/database` folder, in this exact order:

1. `schema.sql` — creates all tables
2. `rls_policies.sql` — enables row-level security and access policies
3. `auth_trigger.sql` — auto-creates a profile row when a user signs up
4. `storage_policies.sql` — sets access rules for profile photo uploads
5. `cause_areas_schema.sql` — creates the cause areas table and seeds default values
6. `ngo_relationship_fix.sql` — adds a required foreign key relationship
7. `portfolio_view.sql` — creates the view that powers the impact portfolio
8. `allow_null_role.sql` — allows Google sign-ups to select a role after registration

### 5. Create a Storage bucket

In Supabase, go to **Storage → New bucket**, name it `avatars`, and toggle it **Public**.

### 6. Set up Google OAuth (optional)

If you want Google sign-in to work, follow Supabase's [Google Auth guide](https://supabase.com/docs/guides/auth/social-login/auth-google) to configure a Google Cloud OAuth client, then add the Client ID and Secret under **Authentication → Sign In / Providers → Google** in your Supabase dashboard.

### 7. Configure environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

### 8. Run the app locally

```
npm run dev
```

The app will be available at `http://localhost:5173`.

## Test accounts

If you'd like to explore the app without registering, these seeded accounts are available on the live demo (password for all: `TestPassword123!`):

| Role | Email |
|---|---|
| Volunteer | amara.volunteer@example.com |
| Volunteer | samuel.volunteer@example.com |
| NGO | green.rwanda@example.com |
| NGO | techbridge.africa@example.com |

## Project documentation

- [Software Requirements Specification (SRS)](https://docs.google.com/document/d/1ySpFtzYFfYXk9-H78z65_3jF20_WHeon3C5lqctccRw/edit?usp=sharing)

## Deployment

This project is deployed on [Vercel](https://vercel.com), connected directly to this GitHub repository. The same environment variables listed above (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) must be set in the Vercel project settings for the deployed build to connect to Supabase.