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


// GET search movie endpoint
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

// GET movie details endpoint
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

// GET keywords endpoint
app.get("/keywords", async (req, res) => {
    const movie_id = req.query.movie_id;

    if (!movie_id) {
        return res.staus(400).json ( {
            error:"movie id is required"
        });
    }
    const url = `https://api.themoviedb.org/3/movie/${movie_id}/keywords?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET genre list endpoint
app.get("/genre-list", async (req, res) => {
//no parameters so no need for const or if
    const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET movie recommendations endpoint
app.get("/movie-recommendations", async (req, res) => {
    const movie_id = req.query.movie_id;

    if (!movie_id) {
        return res.status(400).json({
            error:"movie id is required"
        });
    }
    const url = `https://api.themoviedb.org/3/movie/${movie_id}/recommendations?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET similar movies endpoint
app.get("/similar-movies", async (req, res) => {
    const movie_id = req.query.movie_id;

    if (!movie_id) {
        return res.status(400).json({
            error:"movie id is required"
        });
    }
    const url = `https://api.themoviedb.org/3/movie/${movie_id}/similar?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET discover endpoint for recc
app.get("/discover", async (req, res) => {
    //create empty collection to hold parameters that we might add to url
    const params = new URLSearchParams();
    //add parameter and its value (.set) to empty container (params). (prameter name for TMDB, API key)
    params.set("api_key", apiKey);

    //check if the frontend gave any parameter, add to the url if so for genre, keyword
    if (req.query.with_genres) params.set("with_genres", req.query.with_genres);
    if (req.query.with_keywords) params.set("with_keywords", req.query.with_keywords);
    if (req.query.sort_by) params.set("sort_by", req.query.sort_by);

    //params holds all + api key
    const url = `https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
    const data = await fetchJson(url);
    res.json(data);
})

// GET popular movies endpoint
app.get("/popular-movies", async (req, res) => {

    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET trending movies endpoint
app.get("/trending-movies", async (req, res) => {
    //optional time window value, OR default to day if none provided
    const time_window = req.query.time_window || "day";

    const url = `https://api.themoviedb.org/3/trending/movie/${time_window}?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET now playing movies endpoint
app.get("/now-playing-movies", async (req, res) => {

    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

// GET upcoming movies endpoint
app.get("/upcoming-movies", async (req, res) => {

    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}`;
    const data = await fetchJson(url);
    res.json(data);
});

