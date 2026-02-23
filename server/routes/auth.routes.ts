import type { Express } from "express";
import type passport from "passport";

interface RegisterAuthRoutesDeps {
  isReplit: boolean;
  useMockAuth: boolean;
  setupAuth: (app: Express) => Promise<void>;
  registerReplitAuthRoutes: (app: Express) => void;
  passport: typeof passport;
}

export async function registerAuthModeRoutes(app: Express, deps: RegisterAuthRoutesDeps) {
  const {
    isReplit,
    useMockAuth,
    setupAuth,
    registerReplitAuthRoutes,
    passport,
  } = deps;

  if (isReplit) {
    await setupAuth(app);
    registerReplitAuthRoutes(app);
    return;
  }

  if (useMockAuth) {
    console.log(
      "Using mock auth (Replit not detected; set SESSION_SECRET + Google vars for production auth).",
    );

    app.use((req: any, _res, next) => {
      const mockId = process.env.MOCK_USER_ID;
      if (!mockId) {
        throw new Error("MOCK_USER_ID is required when USE_MOCK_AUTH is enabled");
      }

      req.isAuthenticated = () => true;
      req.user = {
        id: mockId,
        claims: { sub: mockId },
        firstName: process.env.MOCK_FIRST_NAME || "Mock",
        lastName: process.env.MOCK_LAST_NAME || "User",
        email: process.env.MOCK_EMAIL || "admin@local.test",
      };

      req.authUserId = mockId;
      next();
    });

    app.get("/api/auth/user", (req: any, res) => res.json(req.user));
    app.get("/api/logout", (_req, res) => res.redirect("/"));
    app.post("/api/auth/logout", (_req, res) => res.json({ success: true }));
    return;
  }

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (_req, res) => res.redirect("/"),
  );

  app.get("/api/auth/user", (req: any, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  app.get("/api/logout", (req: any, res) => {
    req.logout?.(() => {});
    req.session?.destroy(() => {});
    res.clearCookie("connect.sid");
    res.redirect("/");
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.logout?.(() => {});
    req.session?.destroy(() => {});
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
}
