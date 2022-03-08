-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" INTEGER NOT NULL,
    "notifyMessageId" TEXT,
    "mentionUsers" TEXT[],
    "mentionRoles" TEXT[],

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "notifyChannelId" TEXT,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_channelId_key" ON "Channel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guildId_key" ON "Guild"("guildId");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
