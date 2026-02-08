# Protocol Routing Layer

This folder defines entry into protocol worlds.

## Concept
A protocol is a WORLD.
Not a filter.
Not a dropdown.

URL shape:
/protocol/{protocol}/...

## Responsibilities
- Protocol shell (labs context)
- World boundary enforcement
- Navigation semantics

## Must NOT do
- Fetch protocol metrics
- Know which protocol is active
- Store protocol logic

## Rule
Protocol identity comes from the URL — always.
