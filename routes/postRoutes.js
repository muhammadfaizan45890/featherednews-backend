import express from 'express';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { isAuthenticated, isAdmin } from '../middleware/isAuthenticated.js';

const router = express.Router();

// ─── Public routes ──────────────────────────────────
router.get('/', getPosts);
router.get('/:id', getPostById);

// ─── Admin routes ──────────────────────────────────
router.post('/', isAuthenticated, isAdmin, createPost);
router.put('/:id', isAuthenticated, isAdmin, updatePost);
router.patch('/:id', isAuthenticated, isAdmin, updatePost); // supports partial updates
router.delete('/:id', isAuthenticated, isAdmin, deletePost);

export default router;