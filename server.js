import express from "express";
import "dotenv/config";
import cors from "cors";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import authRoute from "./routes/authRoute.js";
import adminRoute from "./routes/adminRoute.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import commentActionsRoutes from "./routes/commentActionsRoutes.js";
import heroRoutes from './routes/heroRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import advertiseRoutes from './routes/advertiseRoutes.js';




import "./config/passport.js";

// ------------------------------------------------------------
// 1. Setup __dirname for ES modules
// ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------------------------------------
// 2. Middleware (order matters)
// ------------------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://featherednews-frontend.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ added "PATCH"
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(passport.initialize());

// ✅ Serve static folders
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use("/files", express.static(path.join(__dirname, "public/files")));

// ------------------------------------------------------------
// 3. Routes (no duplicates)
// ------------------------------------------------------------
app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);

// ── Post & Comment routes ─────────────────────────────
app.use("/api/posts", postRoutes);                 // CRUD: /api/posts
app.use("/api/posts/:postId/comments", commentRoutes); // List & add comments: /api/posts/:postId/comments
app.use("/api/comments", commentActionsRoutes);   // /api/comments/:commentId/like etc.
app.use('/api/hero', heroRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/advertise', advertiseRoutes);




// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server running" });
});

// ------------------------------------------------------------
// 4. 404 handler – catch unknown routes
// ------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ------------------------------------------------------------
// 5. Global error handler
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ------------------------------------------------------------
// 6. Start server
// ------------------------------------------------------------
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");
    console.log(`🔧 CLIENT_URL: ${process.env.CLIENT_URL || "https://muhammadfaizan45890-featherednews-f.vercel.app"}`);
    console.log(
      `🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? "Loaded ✅" : "Missing ❌"}`
    );
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();








// import express from "express";
// import "dotenv/config";
// import cors from "cors";
// import passport from "passport";
// import path from "path";
// import { fileURLToPath } from "url";
// import { createServer } from "http"; // 👈 added
// import { Server as SocketServer } from "socket.io"; // 👈 added

// import connectDB from "./database/db.js";
// import userRoute from "./routes/userRoute.js";
// import authRoute from "./routes/authRoute.js";
// import adminRoute from "./routes/adminRoute.js";
// import postRoutes from "./routes/postRoutes.js";
// import commentRoutes from "./routes/commentRoutes.js";
// import commentActionsRoutes from "./routes/commentActionsRoutes.js";
// import heroRoutes from './routes/heroRoutes.js';
// import contactRoutes from './routes/contactRoutes.js';
// import advertiseRoutes from './routes/advertiseRoutes.js';

// import "./config/passport.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ── Create HTTP server ────────────────────────────────
// const httpServer = createServer(app);

// // ── CORS (same as before) ─────────────────────────────
// const allowedOrigins = [
//   process.env.CLIENT_URL,
//   'https://muhammadfaizan45890-featherednews-f.vercel.app',
//   'http://localhost:5173',
//   'http://localhost:3000'
// ].filter(Boolean);

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));

// // ── Express middleware ────────────────────────────────
// app.use(express.json());
// app.use(passport.initialize());

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/upload", express.static(path.join(__dirname, "upload")));
// app.use("/files", express.static(path.join(__dirname, "public/files")));

// // ── Routes ─────────────────────────────────────────────
// app.use("/auth", authRoute);
// app.use("/user", userRoute);
// app.use("/admin", adminRoute);

// app.use("/api/posts", postRoutes);
// app.use("/api/posts/:postId/comments", commentRoutes);
// app.use("/api/comments", commentActionsRoutes);
// app.use('/api/hero', heroRoutes);
// app.use('/api/contact', contactRoutes);
// app.use('/api/advertise', advertiseRoutes);

// app.get("/", (req, res) => {
//   res.status(200).json({ status: "ok", message: "Server running" });
// });

// // ── 404 & error handlers ──────────────────────────────
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`,
//   });
// });

// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   if (err.name === "MulterError") {
//     return res.status(400).json({ success: false, message: err.message });
//   }
//   res.status(500).json({
//     success: false,
//     message: process.env.NODE_ENV === "production"
//       ? "Internal server error"
//       : err.message,
//   });
// });

// // ── Socket.IO ──────────────────────────────────────────
// const io = new SocketServer(httpServer, {
//   cors: {
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ["GET", "POST"]
//   },
//   // If you use a custom path, uncomment:
//   // path: "/socket.io",
// });

// // Default namespace (optional)
// io.on("connection", (socket) => {
//   console.log("✅ New client connected:", socket.id);
//   socket.on("disconnect", () => {
//     console.log("❌ Client disconnected:", socket.id);
//   });
// });

// // ── Your missing namespace ────────────────────────────
// const noteApp = io.of("/note-app.users");
// noteApp.on("connection", (socket) => {
//   console.log("✅ User connected to /note-app.users:", socket.id);
//   // Add your real‑time logic here (e.g., notifications, chat, etc.)
//   socket.on("disconnect", () => {
//     console.log("❌ User disconnected from /note-app.users:", socket.id);
//   });
// });

// // ── Start server ──────────────────────────────────────
// const startServer = async () => {
//   try {
//     await connectDB();
//     console.log("✅ Database connected");
//     console.log(`🔧 CLIENT_URL: ${process.env.CLIENT_URL || "Not set"}`);
//     console.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? "Loaded ✅" : "Missing ❌"}`);
//     httpServer.listen(PORT, () => {
//       console.log(`🚀 Server listening on port ${PORT}`);
//       console.log(`📡 Socket.IO ready`);
//     });
//   } catch (error) {
//     console.error("❌ Failed to start server:", error);
//     process.exit(1);
//   }
// };

// startServer();
