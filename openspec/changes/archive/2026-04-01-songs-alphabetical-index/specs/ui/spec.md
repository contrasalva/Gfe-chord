# Delta for UI & Store

## ADDED Requirements

### Requirement: FR-001 SongsPage Alphabetical Accordion
The system MUST display songs grouped by their starting letter (A-Z) in an accordion format on the SongsPage. The initial state of all groups MUST be closed.

#### Scenario: Open and close a letter group
- GIVEN the user is on the SongsPage
- WHEN the user clicks on a closed letter header (e.g., "A")
- THEN the accordion section expands to show all songs starting with that letter
- WHEN the user clicks on the same letter header again
- THEN the accordion section collapses

### Requirement: FR-002 SongsPage Special Characters Group
The system MUST group any song title starting with a number or symbol under a single '#' group.

#### Scenario: Titles with numbers or symbols
- GIVEN a song titled "1979" and a song titled "(I Can't Get No) Satisfaction"
- WHEN the user views the SongsPage accordion
- THEN both songs are displayed inside the '#' accordion group

### Requirement: FR-003 SongsPage Search Behavior
The system MUST override the accordion view when a search query is active, displaying a flat list of filtered results instead. The search MUST be debounced by 300ms.

#### Scenario: Active search collapses accordion
- GIVEN the user is on the SongsPage with some accordion sections open
- WHEN the user types "love" into the search bar
- THEN the accordion view is replaced by a flat list of songs matching "love"
- AND when the search query is cleared, the closed accordion view is restored

### Requirement: FR-004 Desktop Sidebar - Songs Index
The system MUST display a compact alphabetical accordion of songs in the Sidebar, visible only on desktop screens (`md:` breakpoint and above).

### Requirement: FR-005 Desktop Sidebar - Pinned Setlists
The system MUST allow users to pin and unpin setlists. Pinned setlists MUST be displayed in the Sidebar and persisted across sessions using `localStorage`.

#### Scenario: Pin and unpin a setlist
- GIVEN the user is viewing a setlist or the setlist list
- WHEN the user clicks the "Pin" icon for a setlist
- THEN the setlist is added to the "Pinned Setlists" section in the Sidebar
- AND the pinned state is saved to `localStorage`
- WHEN the user clicks the "Unpin" icon for a pinned setlist
- THEN it is removed from the "Pinned Setlists" section

### Requirement: FR-006 Desktop Sidebar - Recent Setlists
The system MUST automatically track the last N visited setlists and display them in a "Recent Setlists" section in the Sidebar.

#### Scenario: Recent setlists updated on navigation
- GIVEN the user has an empty "Recent Setlists" list
- WHEN the user navigates to the details page of "Summer Tour Setlist"
- THEN "Summer Tour Setlist" appears at the top of the "Recent Setlists" in the Sidebar

### Requirement: NFR-001 Accessibility
Accordion headers and sidebar links MUST have a minimum touch target size of 44x44px. All interactive elements MUST be keyboard navigable (Tab/Enter/Space).

### Requirement: NFR-002 Performance
The application MUST render the song list efficiently without blocking the main thread, even with large numbers of songs (React 19 concurrent rendering, list virtualization if necessary).

### Requirement: NFR-003 Responsive Design
The new Sidebar MUST NOT be rendered on mobile devices (screens smaller than the `md` breakpoint). Mobile navigation MUST remain unchanged.

## Out of Scope
- Backend, API, or Database changes.
- Modifications to the mobile bottom navigation bar.
- Persisting the open/closed state of accordion groups between page visits or refreshes.
