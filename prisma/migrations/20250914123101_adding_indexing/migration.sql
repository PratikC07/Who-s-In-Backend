-- CreateIndex
CREATE INDEX "Option_pollId_idx" ON "public"."Option"("pollId");

-- CreateIndex
CREATE INDEX "Poll_UserId_idx" ON "public"."Poll"("UserId");

-- CreateIndex
CREATE INDEX "Vote_PollId_idx" ON "public"."Vote"("PollId");

-- CreateIndex
CREATE INDEX "Vote_OptionId_idx" ON "public"."Vote"("OptionId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "public"."Vote"("userId");
