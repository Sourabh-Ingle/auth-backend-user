import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path:"./.env"
})

const port = process.env.PORT ?? 8000;



connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on PORT : ${port}.`)
        })
    })
    .catch(err => {
        console.error("MongoDB connection error : ", err);
        process.exit(1);
})


app.listen(port, () => {
    console.log(`Server is running on PORT :${port}`)
})
