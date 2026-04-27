"use strict";
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
exports.fetchMovieData = fetchMovieData;
exports.resolveDownloadLink = resolveDownloadLink;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const BASE = "https://www.filmyzilla36.com";
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
};
// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Parse a single movie page → plain data object (no DB touch)
// Stores serverUrl (div.touch link) but NOT the tokenised download href
// ─────────────────────────────────────────────────────────────────────────────
function fetchMovieData(movieUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { data } = yield axios_1.default.get(movieUrl, { headers: HEADERS, timeout: 15000 });
        const $ = cheerio.load(data);
        // Title — strip "Download " prefix that filmyzilla adds
        const title = $(".head").first().text().replace(/^download\s+/i, "").trim() ||
            $("h1").first().text().trim() ||
            ((_b = (_a = movieUrl.match(/\/movie\/\d+\/(.*?)\.html/i)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.replace(/-/g, " ")) ||
            "";
        const thumbnail = $("span.imglarge img").attr("src") || "";
        // Generic field extractor — reads value from blue font next to red label
        const field = (label) => {
            let val = "";
            $("p.black, p.info").each((_, el) => {
                const $el = $(el);
                if ($el.find('font[color="red"]').text().toLowerCase().includes(label.toLowerCase())) {
                    val =
                        $el.find('font[color="#1A83CD"]').text().trim() ||
                            $el.text().slice($el.text().indexOf(":") + 1).trim();
                    return false; // break .each
                }
            });
            return val;
        };
        // Download links — save ONLY the /server/... URL (no token needed yet)
        // Token is fetched fresh on demand in /download route
        const downloadLinks = [];
        $("div.touch").each((_, el) => {
            const $el = $(el);
            const anchor = $el.find("a");
            let serverUrl = anchor.attr("href") || "";
            if (serverUrl && !serverUrl.startsWith("http"))
                serverUrl = BASE + serverUrl;
            const label = anchor.find("font").text().trim() || anchor.text().trim() || "Unknown";
            const size = $el.find("small").text().trim();
            if (serverUrl)
                downloadLinks.push({ label, serverUrl, size });
        });
        return {
            sourceUrl: movieUrl,
            title,
            thumbnail,
            starcast: field("starcast"),
            genres: field("genres"),
            quality: field("quality"),
            length: field("length"),
            releaseDate: field("release date"),
            story: field("movie story"),
            downloadLinks,
        };
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Hit the /server/... page and extract fresh .newdl token link
// Always called live — token expires, so never cache this
// ─────────────────────────────────────────────────────────────────────────────
function resolveDownloadLink(serverUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data } = yield axios_1.default.get(serverUrl, { headers: HEADERS, timeout: 15000 });
        const $ = cheerio.load(data);
        const href = $("a.newdl").attr("href");
        if (!href)
            throw new Error(`No .newdl button found on: ${serverUrl}`);
        return href.startsWith("http") ? href : BASE + href;
    });
}
