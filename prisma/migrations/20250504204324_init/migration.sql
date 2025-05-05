-- CreateTable
CREATE TABLE "Conversion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "result" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Conversion_userId_idx" ON "Conversion"("userId");

-- CreateIndex
CREATE INDEX "Conversion_timestamp_idx" ON "Conversion"("timestamp");
