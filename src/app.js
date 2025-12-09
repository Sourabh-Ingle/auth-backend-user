import express from "express";
import cors from "cors";

const app = express();
// basic config
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// cors configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["POST", "GET", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders:["Authorization","Content-Type"]
}));

// routes imports are here
import healthcheckRouter from "./routes/healthcheck.router.js";

app.use("/api/v1/healthcheck", healthcheckRouter);

app.get("/", (req, res) => {
    res.send("Hello world!!!")
})


export default app;