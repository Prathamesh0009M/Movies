"use strict";
// //
// router.get("/scrap", async (req, res) => {
//   try {
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
//     const url = "https://www.filmyzilla35.com/server/32585/Dhurandhar-(2025)-V2-Hindi-Movie-480p-HDTC.mkv.html";
//     const response = await axios.get(url);
//     const data = response.data;
//     const $ = cheerio.load(data);  // new addition
//     const link = $(".newdl").attr("href");
//     const finalLink = "https://www.filmyzilla35.com" + link;
//     console.log(finalLink);
//     res.send("Scraping done");
//   } catch (e) {
//     console.log("error", e);
//   }
// })
// routes/scraper.ts
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const category_1 = require("./models/category");
const Movie_1 = require("./models/Movie");
const utils_1 = require("./utils");
const router = express_1.default.Router();
const BASE = "https://www.filmyzilla36.com";
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
};
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 1 — /scrape
// Scrapes all pages of a category and stores movies in MongoDB.
// Safe to call multiple times — skips already-saved movies (unique sourceUrl).
//
// GET /scrape?category=405&name=2026-latest-bollywood-movies
// ─────────────────────────────────────────────────────────────────────────────
router.get("/scrape", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { category = "409", name = "2026-latest-marathi-movies", } = req.query;
    const baseUrl = `${BASE}/category/${category}/${name}/default`;
    try {
        // How many pages does this category have?
        const { data: firstPageHtml } = yield axios_1.default.get(`${baseUrl}/1.html`, {
            headers: HEADERS,
        });
        const $first = cheerio.load(firstPageHtml);
        const lastHref = $first("a.navpage")
            .filter((_, el) => $first(el).text().trim().startsWith("Last"))
            .attr("href");
        const totalPages = lastHref
            ? parseInt(((_a = lastHref.match(/\/(\d+)\.html$/)) === null || _a === void 0 ? void 0 : _a[1]) || "1")
            : 1;
        console.log(`\n📂 Category: ${name} — ${totalPages} page(s)\n`);
        // Upsert the category document
        let categoryDoc = yield category_1.Category.findOne({ categoryName: name });
        if (!categoryDoc) {
            categoryDoc = yield category_1.Category.create({
                categoryName: name
                // pages: []
            });
        }
        let saved = 0, skipped = 0, failed = 0;
        for (let page = 1; page <= totalPages; page++) {
            const { data: pageHtml } = yield axios_1.default.get(`${baseUrl}/${page}.html`, {
                headers: HEADERS,
                timeout: 10000,
            });
            const $page = cheerio.load(pageHtml);
            // Collect unique movie URLs from this page
            const movieUrls = [];
            $page(".filmyvideo a").each((_, el) => {
                let href = $page(el).attr("href") || "";
                if (!href)
                    return;
                if (!href.startsWith("http"))
                    href = BASE + href;
                if (!movieUrls.includes(href))
                    movieUrls.push(href);
            });
            console.log(`  Page ${page}/${totalPages} — ${movieUrls.length} movie(s)`);
            for (const movieUrl of movieUrls) {
                try {
                    // Skip if already in DB
                    if (yield Movie_1.Movie.exists({ sourceUrl: movieUrl })) {
                        skipped++;
                        continue;
                    }
                    yield delay(1200); // polite delay
                    const movieData = yield (0, utils_1.fetchMovieData)(movieUrl);
                    yield Movie_1.Movie.create(Object.assign(Object.assign({}, movieData), { categoryName: name }));
                    console.log(`    ✅ ${movieData.title} (${movieData.downloadLinks.length} qualities)`);
                    saved++;
                }
                catch (e) {
                    console.error(`    ❌ ${movieUrl} — ${e.message}`);
                    failed++;
                }
            }
            yield delay(1000);
        }
        return res.json({ message: "Scrape complete", totalPages, saved, skipped, failed });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}));
exports.default = router;
// // ─── STEP 1: Search movies via Google site-restricted search ───
// router.get("/search", async (req, res) => {
//   try {
//     const query = req.query.q as string;
//     if (!query) return res.status(400).json({ error: "Missing ?q= parameter" });
//     const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&as_sitesearch=www.filmyzilla35.com`;
//     const { data } = await axios.get(googleUrl, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
//         "Accept-Language": "en-US,en;q=0.9",
//       },
//     });
//     console.log(data.slice(0, 1000));
//     const $ = cheerio.load(data);
//     const results: { title: string; link: string }[] = [];
//     $("a").each((_, el) => {
//       const href = $(el).attr("href") || "";
//       // Google wraps results in /url?q=ACTUAL_URL&sa=...
//       if (href.includes("filmyzilla") && href.includes("/url?q=")) {
//         const raw = href.split("/url?q=")[1]?.split("&")[0];
//         if (raw && raw.includes("/movie/")) {
//           const decoded = decodeURIComponent(raw);
//           const title = $(el).text().trim();
//           if (title && !results.find((r) => r.link === decoded)) {
//             results.push({ title, link: decoded });
//           }
//         }
//       }
//     });
//     //   console.log(results);
//     res.json({ query, $ });
//   } catch (e: any) {
//     console.error("Search error:", e.message);
//     res.status(500).json({ error: "Search failed" });
//   }
// });
// // ─── STEP 2: Get server/download links from a movie page ───
// router.get("/movie", async (req, res) => {
//   try {
//     const movieUrl = req.query.url as string;
//     if (!movieUrl) return res.status(400).json({ error: "Missing ?url= parameter" });
//     const { data } = await axios.get(movieUrl, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0",
//       },
//     });
//     const $ = cheerio.load(data);
//     // Grab all server links (480p, 720p, etc.)
//     const serverLinks: { quality: string; link: string }[] = [];
//     $("a").each((_, el) => {
//       const href = $(el).attr("href") || "";
//       const text = $(el).text().trim();
//       if (href.includes("/server/")) {
//         serverLinks.push({
//           quality: text || "Unknown",
//           link: href.startsWith("http") ? href : BASE + href,
//         });
//       }
//     });
//     // Also grab movie info
//     const title = $("h1").first().text().trim() || $("title").text().trim();
//     const poster = $("img.img-fluid, img.poster, .entry-content img").first().attr("src") || "";
//     res.json({
//       title,
//       poster: poster.startsWith("http") ? poster : BASE + poster,
//       serverLinks,
//     });
//   } catch (e: any) {
//     console.error("Movie page error:", e.message);
//     res.status(500).json({ error: "Failed to fetch movie page" });
//   }
// });
// // ─── STEP 3: Get actual download link from server page ───
// router.get("/download", async (req, res) => {
//   try {
//     const serverUrl = req.query.url as string;
//     if (!serverUrl) return res.status(400).json({ error: "Missing ?url= parameter" });
//     const { data } = await axios.get(serverUrl, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0",
//         Referer: BASE,
//       },
//     });
//     const $ = cheerio.load(data);
//     // Primary: .newdl button
//     let downloadLink = $(".newdl").attr("href") || "";
//     // Fallback: any anchor with "download" in href or text
//     if (!downloadLink) {
//       $("a").each((_, el) => {
//         const href = $(el).attr("href") || "";
//         const text = $(el).text().toLowerCase();
//         if (
//           (href.includes("/downloads/") || text.includes("download") || text.includes("server")) &&
//           !downloadLink
//         ) {
//           downloadLink = href;
//         }
//       });
//     }
//     if (!downloadLink) {
//       return res.status(404).json({ error: "No download link found — might need Puppeteer for JS-rendered tokens" });
//     }
//     const finalLink = downloadLink.startsWith("http") ? downloadLink : BASE + downloadLink;
//     res.json({ downloadLink: finalLink });
//   } catch (e: any) {
//     console.error("Download error:", e.message);
//     res.status(500).json({ error: "Failed to fetch download link" });
//   }
// });
// // ─── BONUS: Stream/proxy the file through your server (no ads for user) ───
// router.get("/stream", async (req, res) => {
//   try {
//     const fileUrl = req.query.url as string;
//     if (!fileUrl) return res.status(400).json({ error: "Missing ?url=" });
//     const response = await axios.get(fileUrl, {
//       responseType: "stream",
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0",
//         Referer: BASE,
//       },
//     });
//     // Forward content headers
//     res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");
//     if (response.headers["content-length"]) {
//       res.setHeader("Content-Length", response.headers["content-length"]);
//     }
//     res.setHeader("Content-Disposition", `attachment; filename="movie.mkv"`);
//     response.data.pipe(res);
//   } catch (e: any) {
//     console.error("Stream error:", e.message);
//     res.status(500).json({ error: "Stream failed" });
//   }
// });
