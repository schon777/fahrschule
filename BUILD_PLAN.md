Project build plan

This plan describes how I would build the learning app based on your Projekt.txt.

1) Goals and scope
The app is a self-hosted learning platform (Fahrschulfragen style), offline-first, reachable on the local network and later via Tailscale. The content is sourced from your Markdown library and the Excel file. The app needs to support quiz modes, a topic browser, and progress tracking.

2) Architecture overview
Frontend: a single-page web app served by Apache for now.
Backend: a local API server to load content, serve quizzes, and store progress in a local database.
Data: the Markdown library and the Excel sheets are the source of truth. We will import them into a local database for fast queries.

3) Phases
Phase A: Minimum viable UI
Build a clean, usable UI in the browser with pages for Topic Browser, Quiz, and Progress. Use static mock data first.

Phase B: Backend API and data model
Choose a backend stack, define data tables, and build endpoints:
- Topics and tags
- Questions and options
- Progress (attempts, accuracy, mastery)
Add a one-time import step from the library and Excel.

Phase C: Integrate real data
Parse your library and Excel into the database. Make sure the multiple-answer rule and solution format are respected.

Phase D: Polish and tooling
Add search, filters, and progress dashboards. Add export/import utilities. Prepare for Tailscale access.

4) Key decisions to confirm before coding
- Backend stack: Python (FastAPI/Flask) or Node (Express)
- Database: SQLite (default for local) or Postgres
- Data import approach: direct read of Excel (Python with openpyxl) or a pre-exported CSV
- URL structure and language: German UI vs English UI

5) How we will work
I will propose one step at a time, ask questions when decisions are needed, then implement.
We will test locally using Apache for the frontend and a local API server.

6) First practical steps after your approval
- Create a basic frontend layout and navigation
- Create a backend skeleton with one health endpoint
- Decide the data import path and create a small sample dataset
