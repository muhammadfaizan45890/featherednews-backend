import mongoose from 'mongoose';
import slugify from 'slugify';

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      index: true,
      // `required: true` removed – the pre‑save hook will always set it
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Please provide at least one image URL',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    authorName: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ─── Auto‑generate slug from title before saving ──────
PostSchema.pre('save', async function (next) {
  // Only generate slug if title is new or modified
  if (!this.isModified('title') && this.slug) return next();

  try {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure uniqueness
    const Model = this.constructor;
    while (await Model.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
    next();
  } catch (error) {
    // Fallback: generate a random slug if something goes wrong
    this.slug = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.warn('Slug generation failed, using fallback:', this.slug);
    next();
  }
});

export const Post = mongoose.model('Post', PostSchema);