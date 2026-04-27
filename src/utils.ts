import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
const BASE = "https://www.filmyzilla36.com";


const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Parse a single movie page → plain data object (no DB touch)
// Stores serverUrl (div.touch link) but NOT the tokenised download href
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchMovieData(movieUrl: string) {
  const { data } = await axios.get(movieUrl, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);

  // Title — strip "Download " prefix that filmyzilla adds
  const title =
    $(".head").first().text().replace(/^download\s+/i, "").trim() ||
    $("h1").first().text().trim() ||
    movieUrl.match(/\/movie\/\d+\/(.*?)\.html/i)?.[1]?.replace(/-/g, " ") ||
    "";

  const thumbnail = $("span.imglarge img").attr("src") || "";

  // Generic field extractor — reads value from blue font next to red label
  const field = (label: string) => {
    let val = "";
    $("p.black, p.info").each((_, el) => {
      const $el = $(el);
      if (
        $el.find('font[color="red"]').text().toLowerCase().includes(label.toLowerCase())
      ) {
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
  const downloadLinks: { label: string; serverUrl: string; size: string }[] = [];
  $("div.touch").each((_, el) => {
    const $el = $(el);
    const anchor = $el.find("a");
    let serverUrl = anchor.attr("href") || "";
    if (serverUrl && !serverUrl.startsWith("http")) serverUrl = BASE + serverUrl;
    const label =
      anchor.find("font").text().trim() || anchor.text().trim() || "Unknown";
    const size = $el.find("small").text().trim();
    if (serverUrl) downloadLinks.push({ label, serverUrl, size });
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
}
    

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Hit the /server/... page and extract fresh .newdl token link
// Always called live — token expires, so never cache this
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveDownloadLink(serverUrl: string): Promise<string> {
  const { data } = await axios.get(serverUrl, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);
  const href = $("a.newdl").attr("href");
  if (!href) throw new Error(`No .newdl button found on: ${serverUrl}`);
  return href.startsWith("http") ? href : BASE + href;
}
