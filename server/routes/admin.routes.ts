import type { Express } from "express";
import { db } from "../db.js";
import { playerCards, users } from "../../shared/schema.js";
import { count, desc, sql } from "drizzle-orm";

interface RegisterAdminRoutesDeps {
  requireAuth: any;
  isAdmin: any;
  isAdminUser: (req: any) => Promise<boolean>;
}

export function registerAdminRoutes(app: Express, deps: RegisterAdminRoutesDeps) {
  const { requireAuth, isAdmin, isAdminUser } = deps;

  app.get("/api/admin/check", requireAuth, async (req: any, res) => {
    const allowed = await isAdminUser(req);
    res.json({ isAdmin: allowed });
  });

  app.get("/api/admin/debug/cards", requireAuth, isAdmin, async (_req: any, res) => {
    try {
      const [usersResult, cardsResult, cardsByUser, latestCards] = await Promise.all([
        db.select({ count: count(users.id) }).from(users),
        db.select({ count: count(playerCards.id) }).from(playerCards),
        db
          .select({
            userId: playerCards.ownerId,
            cardCount: sql<number>`count(*)`,
          })
          .from(playerCards)
          .groupBy(playerCards.ownerId)
          .orderBy(desc(sql`count(*)`)),
        db
          .select({
            id: playerCards.id,
            ownerId: playerCards.ownerId,
            playerId: playerCards.playerId,
            rarity: playerCards.rarity,
            forSale: playerCards.forSale,
            price: playerCards.price,
            acquiredAt: playerCards.acquiredAt,
          })
          .from(playerCards)
          .orderBy(desc(playerCards.id))
          .limit(20),
      ]);

      res.json({
        totals: {
          users: Number(usersResult[0]?.count || 0),
          playerCards: Number(cardsResult[0]?.count || 0),
        },
        cardsByUser: cardsByUser.map((row) => ({
          userId: row.userId,
          cardCount: Number(row.cardCount || 0),
        })),
        latestCards,
      });
    } catch (error: any) {
      console.error("Failed to load card debug snapshot:", error);
      res.status(500).json({ message: "Failed to load card debug snapshot" });
    }
  });
}
