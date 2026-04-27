import express from "express";
import {
  getMovieDetails,
  getCategoryWiseMovie,
  getDownloadLink,
  Homepage,
  searchedMovies,
} from "../controllers/movies";

const router = express.Router();

// 🎬 Homepage (latest / trending / mixed)
router.get("/home", Homepage);

// 🔍 Search movies
router.get("/search", searchedMovies);

// 📂 Category-wise movies
// example: /movies/category/bollywood?page=2
router.get("/movies/category/:category", getCategoryWiseMovie);

// 🎥 Movie details by ID
// example: /movies/4055
router.get("/movies/:id", getMovieDetails);


// ⬇️ Get download link from server page
// example: /download?url=...
router.get("/download/:id/:qualityIndex", getDownloadLink);
export default router;