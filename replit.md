# Travelify - Conversational AI Travel Planning Platform

## Project Overview
A conversational AI travel planning platform that creates personalized travel packages through guided dialogue and real-time POI integration. Users interact with an AI through chat to clarify their travel preferences, then receive 3 customized travel package options with interactive day-by-day itineraries.

## Key Features
- Chat-based conversational interface (2-3 guided questions)
- Real-time travel package generation (A/B/C options)
- Google Places API integration for authentic POI data
- Interactive dashboard with package comparison
- Day-by-day itinerary with minimal editing capabilities
- JSON export for travel agency handoff
- Package refinement through conversation continuation

## User Preferences
- Focus on authentic data over mock/placeholder content
- Emphasize conversational flow over form-based input
- Prioritize user experience with interactive dashboard
- Keep conversation guided but natural

## Project Architecture
- Frontend: React with Wouter routing, TanStack Query for data management
- Backend: Express.js with in-memory storage
- Styling: Tailwind CSS with purple/gold color scheme (#2D1B69, #FFD700)
- External APIs: Google Places API for POI data
- Data Flow: Chat → Clarification → Package Generation → Dashboard → Export

## Recent Changes
- 2025-08-19: Initial project setup with conversational travel planning concept
- Removed budget breakdown and accommodation suggestions from scope
- Focused on core conversational experience and POI integration
- 2025-08-20: Enhanced chat experience with major improvements:
  - Added city-level destination support (recognizes both countries and cities)
  - Implemented fuzzy matching for typos (e.g., "lodon" → London, "kioto" → Kyoto)
  - Natural number parsing (accepts "five days" and "5 days")
  - Auto-focus on chat input after messages
  - Country → City flow (suggests 4-5 popular cities when country selected)
  - More conversational, less form-like dialogue
  - Graceful error recovery without freezing
  - Fixed redundant people count confirmation - typing "3" immediately proceeds
  - Expanded city database to 30+ countries with 5-10 major cities each
  - Cities not in curated list (like Okinawa) are now accepted without resetting
  - Context-aware number interpretation based on conversation step
  - Fixed critical city matching bug - "Dallas" no longer incorrectly matches to "Los Angeles"
  - Removed problematic partial string matching that caused false positives
  - Cities are now accepted exactly as typed when not in curated list

## Technical Stack
- Full-stack JavaScript with TypeScript
- Drizzle ORM with in-memory storage
- shadcn/ui components
- Google Places API integration
- Export functionality for JSON handoff

## Development Status
- Setting up: Data models, conversational interface, Google Places integration
- Next: Package generation, dashboard, and editing features