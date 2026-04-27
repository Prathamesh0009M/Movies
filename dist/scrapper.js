"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/scrap", (req, res) => {
    try {
        const url = "https://www.filmyzilla35.com/server/32585/Dhurandhar-(2025)-V2-Hindi-Movie-480p-HDTC.mkv.html";
    }
    catch (e) {
        console.log("error", e);
    }
});
