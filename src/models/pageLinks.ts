import mongoose, { Schema } from "mongoose";

interface PageData {
    pageNumber: number;
    links: string[];
}

const pageSchema = new Schema<PageData>({
    pageNumber: {
        type: Number,
        required: true,
    },
    links: [
        {
            type: String,
        }
    ]
});


export default mongoose.model("PagesData", pageSchema);