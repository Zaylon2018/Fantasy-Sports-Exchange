import type { Express } from "express";

interface RegisterAuctionsRoutesDeps {
  requireAuth: any;
  isAdmin: any;
  storage: any;
  getAuction: (auctionId: number) => Promise<any>;
  getAuctionBids: (auctionId: number) => Promise<any[]>;
}

function toMoney(amount: unknown): number {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function registerAuctionsRoutes(app: Express, deps: RegisterAuctionsRoutesDeps) {
  const { requireAuth, isAdmin, storage, getAuction, getAuctionBids } = deps;

  app.post("/api/auctions/:id/settle", requireAuth, isAdmin, async (req: any, res) => {
    try {
      const auctionId = parseInt(req.params.id, 10);

      const auction = await getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      if (auction.status === "settled") {
        return res.status(400).json({ message: "Auction already settled" });
      }

      const bids = await getAuctionBids(auctionId);
      const winningBid = bids[0];

      if (!winningBid) {
        const { db } = await import("../db.js");
        const { auctions } = await import("../../shared/schema.js");
        const { eq } = await import("drizzle-orm");

        await db
          .update(auctions)
          .set({ status: "ended" } as any)
          .where(eq(auctions.id, auctionId));

        return res.json({
          success: true,
          message: "Auction ended with no bids",
        });
      }

      if (toMoney(winningBid.amount) < toMoney(auction.reservePrice || 0)) {
        await storage.unlockFunds(winningBid.bidderUserId, winningBid.amount);

        const { db } = await import("../db.js");
        const { auctions } = await import("../../shared/schema.js");
        const { eq } = await import("drizzle-orm");

        await db
          .update(auctions)
          .set({ status: "ended" } as any)
          .where(eq(auctions.id, auctionId));

        return res.json({
          success: true,
          message: "Auction ended - reserve price not met",
        });
      }

      const { db } = await import("../db.js");
      const { auctions, playerCards, wallets, transactions } = await import("../../shared/schema.js");
      const { eq, sql } = await import("drizzle-orm");

      const winningAmount = toMoney(winningBid.amount);

      await db.transaction(async (tx) => {
        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance}`,
            lockedBalance: sql`${wallets.lockedBalance} - ${winningAmount}`,
          } as any)
          .where(eq(wallets.userId, winningBid.bidderUserId));

        await tx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${winningAmount}` } as any)
          .where(eq(wallets.userId, auction.sellerUserId));

        await tx
          .update(playerCards)
          .set({ ownerId: winningBid.bidderUserId } as any)
          .where(eq(playerCards.id, auction.cardId));

        await tx
          .update(auctions)
          .set({ status: "settled" } as any)
          .where(eq(auctions.id, auctionId));

        await tx.insert(transactions).values({
          userId: winningBid.bidderUserId,
          type: "auction_settlement",
          amount: -winningAmount,
          description: `Auction won: Card #${auction.cardId}`,
        } as any);

        await tx.insert(transactions).values({
          userId: auction.sellerUserId,
          type: "auction_settlement",
          amount: winningAmount,
          description: `Auction sale: Card #${auction.cardId}`,
        } as any);

        for (let i = 1; i < bids.length; i++) {
          await tx
            .update(wallets)
            .set({
              lockedBalance: sql`${wallets.lockedBalance} - ${bids[i].amount}`,
            } as any)
            .where(eq(wallets.userId, bids[i].bidderUserId));
        }
      });

      res.json({
        success: true,
        message: "Auction settled successfully",
        winnerId: winningBid.bidderUserId,
        winningAmount,
      });
    } catch (error: any) {
      console.error("Failed to settle auction:", error);
      res.status(500).json({ message: "Failed to settle auction" });
    }
  });
}
