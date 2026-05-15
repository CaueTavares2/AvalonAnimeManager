# Security Specification - Avalon

## 1. Data Invariants
- **Identity Integrity**: Every document containing a `userId`, `authorId`, or `from` field MUST match the authenticated `request.auth.uid`.
- **Relational Sync**: Access to sub-resources (like chat messages) is strictly gated by membership in the parent resource (chat participants).
- **Temporal Integrity**: `createdAt` is immutable. `updatedAt` MUST match `request.time`.
- **PII Isolation**: Personally Identifiable Information (email) is isolated in a private sub-collection.

## 2. The "Dirty Dozen" (Attack Vectors)
1. **The Ghost Profile**: Attempting to create a user profile with a UID that doesn't match the path.
2. **The Point Heist**: Manually updating `otakuPoints` with a massive value.
3. **The Identity Spoof**: Creating an activity feed event on behalf of another user.
4. **The Shadow Update**: Adding a field like `isAdmin: true` to a profile.
5. **The Friend Hijack**: Accepting a friend request intended for someone else.
6. **The Chat Lurker**: Reading messages from a chat the user is not a participant of.
7. **The Time Traveler**: Setting a fake `createdAt` in the future.
8. **The PII Scraper**: Listing all user emails via the `users` collection.
9. **The Orphan Maker**: Adding a media item to a non-existent user list.
10. **The Self-Liker**: Artificially inflating points by repeating an action.
11. **The ID Poisoner**: Using a 1MB string as a document ID to cause resource exhaustion.
12. **The Achievement Forger**: Manually unlocking a Legendary achievement without meeting criteria.

## 3. Test Runner (Draft)
A comprehensive test suite will be implemented in `firestore.rules.test.ts` to verify these invariants.
