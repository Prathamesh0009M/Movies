import mongoose from "mongoose";


export const dbaconnector = async () => {
    // mongoose.connect("mongodb://localhost:27017/filmyzilla").then(() => {
    mongoose.connect("mongodb+srv://prathamesh:cpVFbfUcnqSIJb7p@cluster0.7ltoo.mongodb.net/movies").then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log("Error connecting to MongoDB", err);
    });
}