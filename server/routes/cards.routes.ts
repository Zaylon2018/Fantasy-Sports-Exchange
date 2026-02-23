import type { Express } from "express";

interface RegisterCardsRoutesDeps {
  requireAuth: any;
  storage: any;
}

export function registerCardsRoutes(app: Express, deps: RegisterCardsRoutesDeps) {
  const { requireAuth, storage } = deps;

  const sendUserCards = async (req: any, res: any) => {
    try {
      const userId = req.authUserId;
      const cards = await storage.getUserCards(userId);
      return res.json({ cards });
    } catch (error: any) {
      console.error("Fetch my cards failed:", error);
      return res.status(500).json({ message: "Failed to fetch my cards" });
    }
  };

  app.get("/api/cards/my", requireAuth, sendUserCards);
  app.get("/api/user/cards", requireAuth, sendUserCards);
}
