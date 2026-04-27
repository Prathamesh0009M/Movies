// models/Category.ts
import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    categoryName: { type: String, required: true, unique: true },
    // No longer storing page ObjectIds — movies reference category by name.
    // PageLinks model is removed entirely; pages are traversed at scrape time.
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", CategorySchema);