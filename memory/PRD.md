# BoothIQ - AI-Driven Booth Management System

## Original Problem Statement
Develop an AI-Driven Booth Management System that transforms static voter lists into a living knowledge system. The system manages voters at booth level, tracks citizen grievances, enables field-level execution via workers, provides real-time status updates, and delivers simple analytics.

## Architecture
- **Frontend**: React (CRA) with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Primary Database**: Supabase (PostgreSQL) - voters, grievances, booths
- **Secondary Database**: MongoDB - users, calls, grievance assignments
- **AI**: Rule-based classification + sentiment analysis (with Sarvam API fallback)

## Core Workflow
```
Citizen → POST grievance → Supabase DB → Admin dashboard → Assign worker → Worker resolves → Citizen sees update
```

## User Personas / Roles
1. **Panna Pramukh** - Voter outreach, calls, sentiment tracking, issue reporting
2. **Booth Adhyaksh (Admin)** - View all grievances, assign workers, monitor status
3. **Field Worker** - View assigned tasks, start work, mark resolved
4. **Citizen** - Submit grievance, track status
5. **Analyst** - View KPIs, sentiment distribution, category breakdown, AI insights

## What's Been Implemented (March 25, 2026)
- [x] Role-based system with 5 roles (role switcher, no auth)
- [x] Supabase integration for voters (500 voters), grievances, booths
- [x] MongoDB integration for users (10 seeded), calls, assignments
- [x] Panna Dashboard: voter list, sentiment update, call logging, grievance creation
- [x] Admin Dashboard: grievance management with status filtering, worker assignment
- [x] Worker Dashboard: task list, start work, mark resolved
- [x] Citizen Portal: submit grievance, track status
- [x] Analyst Dashboard: KPIs, sentiment chart, category breakdown, resolution rate, AI insights
- [x] AI Classification: rule-based category detection (water/road/electricity/etc)
- [x] AI Sentiment Analysis: rule-based sentiment from descriptions and call notes
- [x] AI Insights: data-driven insights from real analytics
- [x] Seed data endpoint
- [x] Full end-to-end workflow tested and verified

## Prioritized Backlog
### P0 (Done)
- Full workflow: Citizen → Admin → Worker → Resolved → Citizen sees update

### P1 (Next)
- Booth-level filtering improvements
- Search/filter grievances by date range
- Worker performance metrics

### P2 (Future)
- Real Sarvam AI integration for Hindi/Bhojpuri text analysis
- WhatsApp/SMS notifications via Twilio/SendGrid
- Photo upload for grievances
- Map view of booths and issues
- Export analytics to PDF/CSV
- Multi-language support (Hindi, Bhojpuri)

## Tech Details
- Supabase Booths: ID 17 (Booth 43), ID 18 (Booth 42) - Varanasi
- 500 voters across 2 booths (voters_eci + voters tables)
- Grievance statuses: submitted → assigned → in_progress → resolved
- Categories: water, road, electricity, sanitation, healthcare, education, other
