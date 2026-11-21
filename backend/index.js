import express from 'express';
import dotenv from 'dotenv';
// npm init -y
// npm install dotenv
// npm install express

dotenv.config(); //read file for keys
const app = express();
const PORT = 5000;

//api keys, process = access from .env file
const apiKey = process.env.TMDB_API_KEY;
const weatherApiKey = process.env.WEATHER_API_KEY;

//helper funtcion to use to get info from databases without writing request code every time
const fetchJson = async (url) => {
    const res = await fetch(url);
    return res.json();
};

//allow express to read incoming JSON data (frontend sends movie info to backend)
app.use(express.json());

//get route, incoming request info, response, send message back to browser
app.get("/", (req, res) => {
    res.send("cinematch backend is running");
});

//start server on port, print confirmation
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});

// search movie endpoint
//endpoint routes. get endpoint with parameters (req) and output (res).
// get query parameters from url
app.get("/search-movie", async (req, res) => {
    const query = req.query.query || "";
    //error if nothing entered
    if (!query) {
        return res.status(400).json({
            error: "query parameter is required"
        });
    }
    //get info from database using api key and inputted user data (query) to build address
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    //store api response and pass to url (TMDB)
    const data = await fetchJson(url);
    //send results back to frontend
    res.json(data);
});

// movie details endpoint
app.get("/movie-details", async (req, res) => {
    const movie_id = req.query.movie_id;

    if (!movie_id) {
        return res.status(400).json({
            error:"movie id is required"
        });
    }
    const url = `https://api.themoviedb.org/3/movie/${movie_id}?api_key=${apiKey}`;
        const data = await fetchJson(url);
    res.json(data);
});



