import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        {
          id: req.user._id,
          email: req.user.email,
        },
        process.env.SECRET_KEY,
        {
          expiresIn: "7d",
        }
      );

      const clientURL =
        process.env.CLIENT_URL || "http://localhost:5173";

      res.redirect(
        `${clientURL}/auth-success?token=${token}`
      );
    } catch (error) {
      console.error("Google login error:", error);

      const clientURL =
        process.env.CLIENT_URL || "http://localhost:5173";

      res.redirect(
        `${clientURL}/login?error=google_failed`
      );
    }
  }
);

// Current User
router.get("/me", isAuthenticated, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;