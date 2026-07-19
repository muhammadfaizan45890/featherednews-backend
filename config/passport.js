import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const username = profile.displayName;
        const avatar = profile.photos[0]?.value;

        // 1. Try to find user by email (email is unique in your DB)
        let user = await User.findOne({ email });

        if (user) {
          // Existing user – link Google account if not already linked
          if (!user.googleId) {
            user.googleId = googleId;
            user.avatar = avatar || user.avatar;
            user.isVerified = true;   // Google emails are verified
            // Optionally update username if desired
            if (!user.username) user.username = username;
            await user.save();
          }
          // Optional: update isLoggedIn flag (if you use it)
          user.isLoggedIn = true;
          await user.save();
          return cb(null, user);
        } else {
          // No user with this email – create new
          user = await User.create({
            googleId,
            email,
            username,
            avatar,
            isLoggedIn: true,
            isVerified: true,
          });
          return cb(null, user);
        }
      } catch (error) {
        console.error("Google Auth Error:", error);
        return cb(error, null);
      }
    }
  )
);