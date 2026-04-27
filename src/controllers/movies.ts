
import * as cheerio from "cheerio";
import express, { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";
import { Category } from "../models/category";
import PageLinks from "../models/pageLinks";
// import { fetchURL } from "../utils";
import { Movie } from "../models/Movie";
import { resolveDownloadLink } from "../utils";
const router = express.Router();
const BASE = "https://www.filmyzilla36.com";


export const Homepage = async (req: Request, res: Response) => {
  try {
    // Get all category names from DB
    const categories = await Category.find({}, { categoryName: 1 }).lean();

    // For each category, fetch top 10 most recently scraped movies
    const result = await Promise.all(
      categories.map(async (cat) => {
        const movies = await Movie.find(
          { categoryName: cat.categoryName },
          { downloadLinks: 0, story: 0 }
        )
          .sort({ scrapedAt: -1 })
          .limit(10)
          .lean();

        return { categoryName: cat.categoryName, movies };
      })
    );

    return res.json({ categories: result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED SEARCH
// GET /api/v1/search?q=border&category=bollywood&genre=action&year=2026&page=1&limit=20
//
// All params are optional — any combination works.
// ─────────────────────────────────────────────────────────────────────────────
export const searchedMovies = async (req: Request, res: Response) => {
  try {
    const {
      q,           // keyword — matches title OR starcast OR story
      category,    // exact categoryName stored in DB
      genre,       // partial match on genres field
      year,        // matches releaseDate containing this year e.g. "2026"
      quality,     // e.g. "720p", "1080p", "4K"
      page = "1",
      limit = "20",
      sortBy = "scrapedAt", // scrapedAt | title | releaseDate
      order = "desc",       // asc | desc
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};

    // Keyword search across title, starcast, story
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { starcast: { $regex: q, $options: "i" } },
        { story: { $regex: q, $options: "i" } },
      ];
    }

    if (category) filter.categoryName = { $regex: category, $options: "i" };
    if (genre) filter.genres = { $regex: genre, $options: "i" };
    if (year) filter.releaseDate = { $regex: year, $options: "i" };
    if (quality) filter.quality = { $regex: quality, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [movies, total] = await Promise.all([
      Movie.find(filter, { downloadLinks: 0 }) // exclude links from search results
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      movies,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e });
  }
};
// "/movies/:id"
export const getMovieDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id).lean();

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found",
        success: false
      })
    }

    return res.json(movie)

  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTE 2 — /movies
// List movies stored in DB with optional filters and pagination.
//
// GET /movies?category=2026-latest-bollywood-movies&page=1&limit=20&q=border
export const getCategoryWiseMovie = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { page = "1", limit = "10", q } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (category) filter.categoryName = category;
    if (q) filter.title = { $regex: q, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [movies, total] = await Promise.all([
      Movie.find(filter, { downloadLinks: 0 }) // exclude heavy array from list view
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      Movie.countDocuments(filter),
    ]);
    return res.json({ total, page: parseInt(page), movies });


  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}

interface downloadParams {
  id: string,
  qualityIndex: string
}
// /download/:id/:qualityIndex"
export const getDownloadLink = async (req: Request<downloadParams>, res: Response) => {
  const { id, qualityIndex } = req.params;
  try {
    const movie = await Movie.findById(id).lean();
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    const idx = parseInt(qualityIndex);
    const link = movie.downloadLinks?.[idx];
    if (!link?.serverUrl)
      return res.status(400).json({ error: `No quality option at index ${idx}` });

    console.log(`🔗 Resolving fresh link: ${link.serverUrl}`);
    const directUrl = await resolveDownloadLink(link.serverUrl);

    return res.json({
      title: movie.title,
      quality: link.label,
      size: link.size,
      directUrl,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}




