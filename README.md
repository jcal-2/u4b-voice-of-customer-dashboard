U4B Voice of Customer Platform

A B2B customer experience analytics dashboard for Uber for Business (U4B) VoC managers. The app ingests structured customer feedback signals and turns them into actionable executive dashboards.

Tech Stack
React 18 + TypeScript + Vite
Tailwind CSS with a custom Uber-inspired design system
Recharts for data visualization
React Router for navigation
PapaParse for CSV data ingestion

Key Pages
Page	Purpose
VoC Synthesis	Executive dashboard with NPS, CSAT, CES, ORS scores, sentiment breakdowns, key driver analysis, source health, and H1/H2 trend comparisons
Master Feedback	Browseable signal feed with filtering by source, sentiment, CDJ stage, and customer segment
Action Items	Prioritized, team-assigned action cards (Product, CS/Support, Marketing) with impact tags and heat matrix
Survey Framework	Reference page mapping 13 survey instruments across 6 Customer Decision Journey stages
Customer Archetypes	Account segmentation and role-based persona profiles
Raw Data	Full tabular view of the underlying signal dataset

Data Model
The app loads a voc_signals.csv containing structured feedback records with fields like:

Customer/account metadata (segment, region, tenure, acquisition type)
Feedback source (CES, ORS, CSAT, NPS surveys; CRM notes; support tickets; etc.)
Sentiment, themes, action tags, and active U4B drivers
Survey scores and key driver selections
Design System
Dark navigation with Uber green accent (#06C167)
Custom color tokens: uber-black, uber-ink-3, uber-gray-border
Typography via font-display and font-body tokens
Gauge cards, pie charts, line charts, and signal heat matrices
