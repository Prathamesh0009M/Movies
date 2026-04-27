// models/Movie.ts
import mongoose, { Schema, Document } from "mongoose";

// Each entry in downloadLinks stores the /server/... URL (NOT the tokenised
// /downloads/... link — that is fetched fresh on every user request).
export interface IDownloadLink {
  label: string;     // e.g. "Dhurandhar 720p Web-DL.mkv"
  serverUrl: string; // https://filmyzilla36.com/server/35357/...
  size: string;      // e.g. "1.53 GB"
} 

export interface IMovie extends Document {
  sourceUrl: string;
  categoryName: string;
  title: string;
  thumbnail: string;
  starcast: string;
  genres: string;
  quality: string;
  length: string;
  releaseDate: string;
  story: string;
  downloadLinks: IDownloadLink[];
  scrapedAt: Date;
}

const DownloadLinkSchema = new Schema<IDownloadLink>(
  {
    label:     { type: String },
    serverUrl: { type: String }, // stored; token resolved on demand
    size:      { type: String },
  },
  { _id: false }
);

const MovieSchema = new Schema<IMovie>(
  {
    sourceUrl:    { type: String, required: true, unique: true, index: true },
    categoryName: { type: String, index: true },
    title:        { type: String },
    thumbnail:    { type: String },
    starcast:     { type: String },
    genres:       { type: String },
    quality:      { type: String },
    length:       { type: String },
    releaseDate:  { type: String },
    story:        { type: String },
    downloadLinks:{ type: [DownloadLinkSchema], default: [] },
    scrapedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Movie = mongoose.model<IMovie>("Movie", MovieSchema);