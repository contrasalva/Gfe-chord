-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_setlist_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setlistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "setlist_shares_setlistId_fkey" FOREIGN KEY ("setlistId") REFERENCES "setlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "setlist_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_setlist_shares" ("createdAt", "id", "setlistId", "userId") SELECT "createdAt", "id", "setlistId", "userId" FROM "setlist_shares";
DROP TABLE "setlist_shares";
ALTER TABLE "new_setlist_shares" RENAME TO "setlist_shares";
CREATE UNIQUE INDEX "setlist_shares_setlistId_userId_key" ON "setlist_shares"("setlistId", "userId");
CREATE TABLE "new_setlist_songs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setlistId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "transposeOffset" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "setlist_songs_setlistId_fkey" FOREIGN KEY ("setlistId") REFERENCES "setlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "setlist_songs_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_setlist_songs" ("id", "order", "setlistId", "songId") SELECT "id", "order", "setlistId", "songId" FROM "setlist_songs";
DROP TABLE "setlist_songs";
ALTER TABLE "new_setlist_songs" RENAME TO "setlist_songs";
CREATE UNIQUE INDEX "setlist_songs_setlistId_songId_key" ON "setlist_songs"("setlistId", "songId");
CREATE UNIQUE INDEX "setlist_songs_setlistId_order_key" ON "setlist_songs"("setlistId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
