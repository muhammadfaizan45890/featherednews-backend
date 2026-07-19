import mongoose from 'mongoose';
import slugify from 'slugify';
import { Post } from '../models/Post.js';

// ─── Helper: generate a unique slug ──────────────────
const generateUniqueSlug = async (title, excludeId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };

  while (await Post.findOne(query)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    query.slug = slug;
  }
  return slug;
};

// ─── Get all posts (public) ──────────────────────────
export const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'desc',
      category,
      search,
      published = 'true',
    } = req.query;

    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (published === 'true') filter.isPublished = true;
    else if (published === 'false') filter.isPublished = false;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortOrder = sort === 'asc' ? 1 : -1;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'fullname email avatar')
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
        hasMore: parseInt(page, 10) * parseInt(limit, 10) < total,
      },
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

// ─── Get single post (by _id or slug) ────────────────
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    let post;
    if (isObjectId) {
      post = await Post.findById(id).populate('author', 'fullname email avatar');
    } else {
      post = await Post.findOne({ slug: id }).populate('author', 'fullname email avatar');
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post', error: error.message });
  }
};

// ─── Create a new post (admin only) ──────────────────
export const createPost = async (req, res) => {
  try {
    const { title, category, images, description } = req.body;

    // Validate required fields
    if (!title || !category || !images || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, category, images, description) are required',
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image URL is required',
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const author = req.user._id;
    const authorName = req.user.fullname || req.user.email || 'Admin';

    // ─── Generate unique slug ──────────────────────────
    const slug = await generateUniqueSlug(title);

    const post = new Post({
      title,
      slug,
      category,
      images,
      description,
      author,
      authorName,
    });

    await post.save();
    await post.populate('author', 'fullname email avatar');

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

// ─── Update a post (admin only) ──────────────────────
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const allowed = ['title', 'category', 'images', 'description', 'isPublished'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        filtered[key] = updates[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    // If images is being updated, validate it's a non‑empty array
    if (filtered.images && (!Array.isArray(filtered.images) || filtered.images.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Images must be a non‑empty array',
      });
    }

    // ─── If title is updated, regenerate slug ──────────
    if (filtered.title) {
      filtered.slug = await generateUniqueSlug(filtered.title, id);
    }

    const post = await Post.findByIdAndUpdate(
      id,
      filtered,
      { new: true, runValidators: true }
    ).populate('author', 'fullname email avatar');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
  }
};

// ─── Delete a post (admin only) ──────────────────────
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
};