# UI Specification

## 1. Domain Overview

This spec covers the frontend UI/UX requirements for songs navigation and setlists quick-access features.

---

## 2. Songs Alphabetical Index

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

---

## 3. Desktop Sidebar

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

---

## 4. Non-Functional Requirements (NFR)

### Requirement: NFR-001 Accessibility
Accordion headers and sidebar links MUST have a minimum touch target size of 44x44px. All interactive elements MUST be keyboard navigable (Tab/Enter/Space).

### Requirement: NFR-002 Performance
The application MUST render the song list efficiently without blocking the main thread, even with large numbers of songs (React 19 concurrent rendering, list virtualization if necessary).

### Requirement: NFR-003 Responsive Design
The new Sidebar MUST NOT be rendered on mobile devices (screens smaller than the `md` breakpoint). Mobile navigation MUST remain unchanged.

---

## 5. Sidebar Drag and Drop

### Requirement: Drag from Sidebar to Setlist Detail

The system MUST allow dragging a song from the sidebar and dropping it into the SetlistDetailPage droppable zone.
The feature MUST be available only on desktop viewports (`md:` breakpoint and above).
The system MUST NOT allow dropping a song if it is already present in the setlist.
The system MUST NOT allow a user with VIEWER permissions to drag songs.

#### Scenario: Drag song to empty setlist
- GIVEN the user is on desktop and viewing an empty SetlistDetailPage with EDITOR/OWNER permissions
- WHEN the user drags a song from the sidebar and drops it in the setlist droppable zone
- THEN the song is added to the setlist
- AND a success toast is displayed

#### Scenario: Drag song to populated setlist
- GIVEN the user is on desktop and viewing a SetlistDetailPage containing existing songs with EDITOR/OWNER permissions
- WHEN the user drags a song from the sidebar and drops it in the setlist droppable zone
- THEN the song is added at the end of the setlist
- AND a success toast is displayed

#### Scenario: Drag duplicate song to setlist
- GIVEN the user is on desktop and viewing a SetlistDetailPage with EDITOR/OWNER permissions
- AND a song X already exists in the current setlist
- WHEN the user drags song X from the sidebar and drops it in the setlist droppable zone
- THEN the song is NOT added to the setlist
- AND an informative toast "Ya está en el setlist" is displayed

#### Scenario: Drop outside droppable zone
- GIVEN the user is on desktop and has EDITOR/OWNER permissions
- WHEN the user drags a song from the sidebar and drops it outside the SetlistDetailPage droppable zone
- THEN the drag action is canceled with no effect

#### Scenario: VIEWER attempts to drag
- GIVEN the user is on desktop and has only VIEWER permissions
- WHEN the user hovers over or attempts to drag a song from the sidebar
- THEN the drag action MUST be visually disabled and unavailable

#### Scenario: Drag when not in SetlistDetailPage
- GIVEN the user is on desktop and viewing a page other than SetlistDetailPage
- WHEN the user attempts to drag a song from the sidebar
- THEN the droppable zone MUST NOT be visible or active

---

## 6. Out of Scope
- Backend, API, or Database changes.
- Modifications to the mobile bottom navigation bar.
- Persisting the open/closed state of accordion groups between page visits or refreshes.

---

## 7. Technical Debt (Warnings from Verification)

The following items were acknowledged as non-blocking at archive time (`2026-04-01`):

1. **FR-003**: No behavioral/runtime test for the SongsPage accordion ↔ flat-list swap during search. Static code review confirmed the implementation. Integration test is pending.
2. **FR-005/FR-006**: UI/integration test for Sidebar + `localStorage` end-to-end not yet written. Store-level tests cover the contract.
3. **NFR-002**: No performance validation with large lists has been executed.
4. **Drag from Sidebar to Setlist Detail**: UX polish items — drag overlay, cursor feedback, and accessible keyboard alternative for drag-and-drop — identified as non-blocking improvements at archive time (`2026-04-01`).
