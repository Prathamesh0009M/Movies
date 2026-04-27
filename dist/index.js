"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scrapper_1 = __importDefault(require("./scrapper"));
const db_1 = require("./db");
const movierouter_1 = __importDefault(require("./routers/movierouter"));
const cors_1 = __importDefault(require("cors"));
(0, db_1.dbaconnector)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*"
}));
app.get("/p", (req, res) => {
    res.send("<h1>Hello world </h1>");
});
app.use("/api/v1/s", scrapper_1.default);
app.use("/api/v1/", movierouter_1.default);
app.listen(3000, () => {
    console.log("App is running on port 5000");
});
