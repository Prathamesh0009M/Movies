import express from "express";
import * as cheerio from "cheerio"
import scrapperRouter from "./scrapper"
import { dbaconnector } from "./db";
import movieRouter from "./routers/movierouter"
import cors from "cors"
dbaconnector();



const app = express();
app.use(cors(
    {
        origin: "*"
    }
));


app.get("/p", (req, res) => {
    res.send("<h1>Hello world </h1>");
})

app.use("/api/v1/s", scrapperRouter);
app.use("/api/v1/", movieRouter)

app.listen(3000, () => {
    console.log("App is running on port 5000");
});