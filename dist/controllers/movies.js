"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadLink = exports.getCategoryWiseMovie = exports.getMovieDetails = exports.searchedMovies = exports.Homepage = void 0;
const express_1 = __importDefault(require("express"));
const category_1 = require("../models/category");
// import { fetchURL } from "../utils";
const Movie_1 = require("../models/Movie");
const utils_1 = require("../utils");
const router = express_1.default.Router();
const BASE = "https://www.filmyzilla36.com";
const Homepage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all category names from DB
        const categories = yield category_1.Category.find({}, { categoryName: 1 }).lean();
        // For each category, fetch top 10 most recently scraped movies
        const result = yield Promise.all(categories.map((cat) => __awaiter(void 0, void 0, void 0, function* () {
            const movies = yield Movie_1.Movie.find({ categoryName: cat.categoryName }, { downloadLinks: 0, story: 0 })
                .sort({ scrapedAt: -1 })
                .limit(10)
                .lean();
            return { categoryName: cat.categoryName, movies };
        })));
        return res.json({ categories: result });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e });
    }
});
exports.Homepage = Homepage;
// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED SEARCH
// GET /api/v1/search?q=border&category=bollywood&genre=action&year=2026&page=1&limit=20
//
// All params are optional — any combination works.
// ─────────────────────────────────────────────────────────────────────────────
const searchedMovies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q, // keyword — matches title OR starcast OR story
        category, // exact categoryName stored in DB
        genre, // partial match on genres field
        year, // matches releaseDate containing this year e.g. "2026"
        quality, // e.g. "720p", "1080p", "4K"
        page = "1", limit = "20", sortBy = "scrapedAt", // scrapedAt | title | releaseDate
        order = "desc", // asc | desc
         } = req.query;
        const filter = {};
        // Keyword search across title, starcast, story
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { starcast: { $regex: q, $options: "i" } },
                { story: { $regex: q, $options: "i" } },
            ];
        }
        if (category)
            filter.categoryName = { $regex: category, $options: "i" };
        if (genre)
            filter.genres = { $regex: genre, $options: "i" };
        if (year)
            filter.releaseDate = { $regex: year, $options: "i" };
        if (quality)
            filter.quality = { $regex: quality, $options: "i" };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === "asc" ? 1 : -1;
        const [movies, total] = yield Promise.all([
            Movie_1.Movie.find(filter, { downloadLinks: 0 }) // exclude links from search results
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Movie_1.Movie.countDocuments(filter),
        ]);
        return res.json({
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            movies,
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: e });
    }
});
exports.searchedMovies = searchedMovies;
// "/movies/:id"
const getMovieDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const movie = yield Movie_1.Movie.findById(id).lean();
        if (!movie) {
            return res.status(404).json({
                message: "Movie not found",
                success: false
            });
        }
        return res.json(movie);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
});
exports.getMovieDetails = getMovieDetails;
// ─────────────────────────────────────────────────────────────────────────
// ROUTE 2 — /movies
// List movies stored in DB with optional filters and pagination.
//
// GET /movies?category=2026-latest-bollywood-movies&page=1&limit=20&q=border
const getCategoryWiseMovie = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.params;
        const { page = "1", limit = "10", q } = req.query;
        const filter = {};
        if (category)
            filter.categoryName = category;
        if (q)
            filter.title = { $regex: q, $options: "i" };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [movies, total] = yield Promise.all([
            Movie_1.Movie.find(filter, { downloadLinks: 0 }) // exclude heavy array from list view
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Movie_1.Movie.countDocuments(filter),
        ]);
        return res.json({ total, page: parseInt(page), movies });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
});
exports.getCategoryWiseMovie = getCategoryWiseMovie;
// /download/:id/:qualityIndex"
const getDownloadLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id, qualityIndex } = req.params;
    try {
        const movie = yield Movie_1.Movie.findById(id).lean();
        if (!movie)
            return res.status(404).json({ error: "Movie not found" });
        const idx = parseInt(qualityIndex);
        const link = (_a = movie.downloadLinks) === null || _a === void 0 ? void 0 : _a[idx];
        if (!(link === null || link === void 0 ? void 0 : link.serverUrl))
            return res.status(400).json({ error: `No quality option at index ${idx}` });
        console.log(`🔗 Resolving fresh link: ${link.serverUrl}`);
        const directUrl = yield (0, utils_1.resolveDownloadLink)(link.serverUrl);
        return res.json({
            title: movie.title,
            quality: link.label,
            size: link.size,
            directUrl,
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
});
exports.getDownloadLink = getDownloadLink;
