# 4uStream — Phase 1 UI/Studio Upgrade

Reference direction: the supplied 4uStream mobile/admin concept image.

Implemented in this phase:
- Added Sorani (`سۆرانی`) as a fourth UI language alongside Badini, English and Arabic.
- Corrected the Badini `News` label from `نەخۆش` to `هەواڵ`.
- Updated document language handling for Sorani (`ckb`).
- Added a mobile language selector option for Sorani.
- Added an Admin Dashboard tab with streaming-style overview cards, quick actions and a mobile-first workflow panel.
- Added episode thumbnail upload support using the existing Firebase Storage admin upload helper.
- Added episode thumbnails to the drama season/episode cards when available.
- Added responsive dashboard/chart/action styling inspired by the supplied reference.

Important verification note:
- Production dependency installation could not complete in the execution environment because `npm install --ignore-scripts --no-audit --no-fund` timed out after 60 seconds.
- Therefore no production `next build` success is claimed for this phase.
- Existing audit fixes from the previous phase remain in this working copy.

Scope:
- Website only. No iOS/Android app work is included.
