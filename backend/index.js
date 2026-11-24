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

//delay helper funciton to not send requests too quickly
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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



// *** movie recommendation generator endpoint ***

app.get("/smart-recommendations", async (req, res) => {
    // get info from the frontend user input (url with parameters (titles, genres))
    // e.g. /smart-recommendations?movieTitle=Titanic&genres=drama,romance&mood=sad
    const movieTitle = req.query.movieTitle || "";
    const genres = req.query.genres || "";
    const mood = req.query.mood || "";
    // get requested number of recs, default to 10, convert text to whole number, never exceed 30
    const count = Math.min(parseInt(req.query.count || "10", 10), 30);

    //empty list to store movies. let instead of const bc it needs to change later when movies are added
    let movies = [];

    //make sure the user provided a movie title, error if not
    if (!movieTitle) {
        return res.status(400).json({
            error:"movie title is required"
        });
    }

// 1. Search movie
    //url has api key and movie user entered. encode() turns the input text into URL safe text. search for the movie entered by the user
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieTitle)}`;
    //send request to TMDB & store info in searchData
    const searchData = await fetchJson(searchUrl);

    if (!searchData.results || searchData.results.length === 0) {
        return res.status(400).json ({
            error: "no movie found"
        });
    }

    //access the list of movies (result) from input search data and get the first movie in that list [0]
    const firstMovie = searchData.results[0];
    //get the id from the first movie with .id
    const movieId = firstMovie.id;

    await delay (150);


// 2. Movie details
    //get the details of the entered movie from TMDB using url
    const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;
    const detailsData = await fetchJson(detailsUrl);

    await delay(150);


// 3. Movie keywords
    //obtain keywords for the movie and store the results in keywordsData
    const keywordsUrl = `https://api.themoviedb.org/3/movie/${movieId}/keywords?api_key=${apiKey}`;
    const keywordsData = await fetchJson(keywordsUrl);

    await delay(150);


// 4. Genre list so we can map IDs -> names
    //get TMDB full list of movie genres. store the genre list in genreListData
    const genreListUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;
    const genreListData = await fetchJson(genreListUrl);

    //empty object to store genre id's with its name
    const genreIdToName = {};
    //loop through each genre in the list. (current genre being looked at) (access array of genres returned by TMDB). if list is missing use empty array instead
    //get current genre ID. save id and name together in object as id : name (take current genre Id, use it as key in genreIdtoname, then store the name as its value)
    for (const genre of genreListData.genres || []) {
        genreIdToName[genre.id] = genre.name;
    }

    await delay(150);


// 5. Similar
    //obtain the TMDB similar movies and store them in similarData
    const similarUrl = `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${apiKey}`;
    const similarData = await fetchJson(similarUrl);

    await delay(150);


// 6. Recommendations
    //obtain the TMDB recommended movies and store them in recData
    const recUrl = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${apiKey}`;
    const recData = await fetchJson(recUrl);


// 7. combine similar and recommended movie list into the existing movie array. add on their source as well
    //push the similar data results into movies array, map goes through the array and transforms each item to have the source type
    //...movie copies all properties from original movie
    //source_type adds new identifying property where it came from
    movies.push(...(similarData.results || []).map(movie => ({
        ...movie,
        source_type: "similar"
    })));

    movies.push(...(recData.results || []).map(movie => ({
        ...movie,
        source_type: "recommendation"
    })));
    //.push() = adds items to an existing array.
    // .map() = goes through an array and transforms each item.
    // ...movie = copies all properties from an existing object.


// 8. Get requested genres, turn it into an array so it can be used to filter movies
    // genresRaw holds user input. want to separate genres by commas, remove extra spaces, make it all lowercase, & remove empty entries
    const requestedGenres = genresRaw
        //split string into array whenever a comma is found
        .split(",")
        //go theough each genre (g) and remove extra spaces and convert to lowercase
        .map(g => g.trim().toLowerCase())
        //remove empty entries from array
        .filter(Boolean);

    // convert genre names to IDs
    const requestedGenreIds = requestedGenres
        //go through each genre in requestedGenres, look up genre (g) in genreMap, return its ID
        .map(g => genreMap[g])
        //remove anything without matching ID
        .filter(id => id !== undefined);

    // remove duplicates
    //creating a pair for each movie by id, movie
    // e.g. [597, { id: 597, title: "Titanic" }]
    //new map using those pairs, but each entry must be unique. if an ID appears twice, it doesnt count it twice
    //.values gets the movie objects without their id's as separate keys
    //array is needed because of later methods like filtering. the list gets converted to an array
    let uniqueMovies = Array.from(
        new Map(movies.map(movie => [movie.id, movie])).values()
    );

    // filter movies that dont meet the requirements
    //.filter looks at each movie, check if has title, release date, > 100 votes, popularity > 5, keep only if all conditions true
    //movie.property accesses property from the current movie object
    let filteredMovies = uniqueMovies.filter(movie =>
        movie.title &&
        movie.release_date &&
        movie.vote_count >= 100 &&
        movie.popularity >= 5
    );

    //filter movies by requested genres
    //check if there are any genres, if empty, skip
    //go through each movie in list and decide to keep or not
    //.some check whether at least one item in an array meets a condition
    //movie.genre_ids is the array of genre IDs for the current movie, .includes checks whether that array contains the requested ID, ? is optional chaining, prevents error if array is missing/unidentified
    if (requestedGenresId.length > 0) {
        filteredMovies = filteredMovies.filter(movie =>
        requestedGenresId.some(id => movie.genre_ids?.includess(id))
        );
    }


// 9. Fallback if the filtered pool is too small for 10 best movies
    //get genre ids from the original user inputted movie
    const referenceGenreIds = (detailsData.genres || []).map(g => g.id);
    //decide what genres discover should use (if else) if there is user input use that, otherwise use original movie genre
    const discoverGenreIds = requestedGenreIds.length > 0 ? requestedGenreIds : referenceGenreIds;

    //decide if we need more movies or not. if the number of filtered movies is less than 10, we need to get more & a genre provided
    if (filteredMovies.length < count && discoverGenreIds.length > 0) {
        await delay(150);
    }

    //discover endpoint for new movies
    //create empty container to hold URL parameters
    //set api key, genres (using array format), sorting highest to lowest popularity, and choose first page of results
    const discoverParams = new URLSearchParams();
    discoverParams.set("api_key", apiKey);
    discoverParams.set("with_genres", discoverGenreIds.join(","));
    discoverParams.set("sort_by", "popularity.desc");
    discoverParams.set("page", "1");

    //build the request url using .toString to attach object data into the url as regular test
    //store the results in discoverData
    const discoverUrl = `https://api.themoviedb.org/3/discover/movie?${discoverParams.toString()}`;
    const discoverData = await fetchJson(discoverUrl);

    //add the new discovered movies into our existing movies array
    //get array of movies returned by TMDB (results). go through every move and crate new version of it(.map)
    //copy all existing info from the movie (...map). add new property to identify that it is from discover (source type)
    movies.push(...(discoverData.results || []).map(movie => ({
        ...movie,
        source_type: "discover"
    })));



});


