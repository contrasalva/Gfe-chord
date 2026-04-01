# Delta for UI / Sidebar Drag and Drop

## ADDED Requirements

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
