"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const movies_1 = require("../controllers/movies");
const router = express_1.default.Router();
// 🎬 Homepage (latest / trending / mixed)
router.get("/home", movies_1.Homepage);
// 🔍 Search movies
router.get("/search", movies_1.searchedMovies);
// 📂 Category-wise movies
// example: /movies/category/bollywood?page=2
router.get("/movies/category/:category", movies_1.getCategoryWiseMovie);
// 🎥 Movie details by ID
// example: /movies/4055
router.get("/movies/:id", movies_1.getMovieDetails);
// ⬇️ Get download link from server page
// example: /download?url=...
router.get("/download/:id/:qualityIndex", movies_1.getDownloadLink);
exports.default = router;
