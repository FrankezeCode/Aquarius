# App Router – UI Composition Layer

This folder defines Aquarius’ navigational structure.

## Concept
This is a **map**, not the territory.

## Responsibilities
- Root layout (global-only concerns)
- Semantic route boundaries
- World isolation via routing

## Must NOT do
- Assume protocol identity
- Mix protocol data
- Store protocol state globally

## Mental Model
If you can reach it via URL,
it belongs here.
