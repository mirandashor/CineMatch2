export const handler = async (event) => {
    const apiKey = process.env.TMDB_API_KEY;
    const weatherKey = process.env.WEATHER_API_KEY;

    const path =
        event.path ||
        event.rawPath ||
        event.route ||
        "";

    const queryParams =
        event.queryStringParameters ||
        event.params ||
        {};

    const cleanPath = path.replace(/\/+/g, '/');

    const genreMap = {
        action: 28,
        adventure: 12,
        animation: 16,
        comedy: 35,
        crime: 80,
        documentary: 99,
        drama: 18,
        family: 10751,
        fantasy: 14,
        history: 36,
        horror: 27,
        music: 10402,
        mystery: 9648,
        romance: 10749,
        "science fiction": 878,
        "tv movie": 10770,
        thriller: 53,
        war: 10752,
        western: 37
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchJson = async (url) => {
        const res = await fetch(url);
        return res.json();
    };

    const routes = {
        "/search-movie": async () => {
            const query = queryParams.query || "";
            if (!query) {
                return { error: "Query parameter is required" };
            }
            const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
            return await fetchJson(url);
        },

        "/movie-details": async () => {
            const movie_id = queryParams.movie_id;
            if (!movie_id) {
                return { error: "movie_id is required" };
            }
            const url = `https://api.themoviedb.org/3/movie/${movie_id}?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/keywords": async () => {
            const movie_id = queryParams.movie_id;
            if (!movie_id) {
                return { error: "movie_id is required" };
            }
            const url = `https://api.themoviedb.org/3/movie/${movie_id}/keywords?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/genre-list": async () => {
            const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/movie-recommendations": async () => {
            const movie_id = queryParams.movie_id;
            if (!movie_id) {
                return { error: "movie_id is required" };
            }
            const url = `https://api.themoviedb.org/3/movie/${movie_id}/recommendations?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/similar-movies": async () => {
            const movie_id = queryParams.movie_id;
            if (!movie_id) {
                return { error: "movie_id is required" };
            }
            const url = `https://api.themoviedb.org/3/movie/${movie_id}/similar?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/discover": async () => {
            const params = new URLSearchParams();
            params.set("api_key", apiKey);

            if (queryParams.with_genres) params.set("with_genres", queryParams.with_genres);
            if (queryParams.with_keywords) params.set("with_keywords", queryParams.with_keywords);
            if (queryParams.sort_by) params.set("sort_by", queryParams.sort_by);

            const url = `https://api.themoviedb.org/3/discover/movie?${params.toString()}`;
            return await fetchJson(url);
        },

        "/popular-movies": async () => {
            const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/trending-movies": async () => {
            const time_window = queryParams.time_window || "day";
            const url = `https://api.themoviedb.org/3/trending/movie/${time_window}?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/now-playing-movies": async () => {
            const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/upcoming-movies": async () => {
            const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}`;
            return await fetchJson(url);
        },

        "/smart-recommendations": async () => {
            const movieTitle = queryParams.movieTitle || "";
            const genresRaw = queryParams.genres || "";
            const mood = queryParams.mood || "";
            const count = Math.min(parseInt(queryParams.count || "10", 10), 30);

            let movies = [];

            if (!movieTitle) {
                return { error: "movieTitle is required for smart-recommendations right now" };
            }

            // 1. Search movie
            const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieTitle)}`;
            const searchData = await fetchJson(searchUrl);

            if (!searchData.results || searchData.results.length === 0) {
                return { error: "No movie found" };
            }

            const firstMovie = searchData.results[0];
            const movieId = firstMovie.id;

            await delay(150);

            // 2. Movie details
            const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;
            const detailsData = await fetchJson(detailsUrl);

            await delay(150);

            // 3. Movie keywords
            const keywordsUrl = `https://api.themoviedb.org/3/movie/${movieId}/keywords?api_key=${apiKey}`;
            const keywordsData = await fetchJson(keywordsUrl);

            await delay(150);

            // 4. Genre list so we can map IDs -> names
            const genreListUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;
            const genreListData = await fetchJson(genreListUrl);

            const genreIdToName = {};
            for (const genre of genreListData.genres || []) {
                genreIdToName[genre.id] = genre.name;
            }

            await delay(150);

            // 5. Similar
            const similarUrl = `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${apiKey}`;
            const similarData = await fetchJson(similarUrl);

            await delay(150);

            // 6. Recommendations
            const recUrl = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${apiKey}`;
            const recData = await fetchJson(recUrl);

            // tag source so discover can be pushed lower later
            movies.push(...(similarData.results || []).map(movie => ({
                ...movie,
                source_type: "similar"
            })));

            movies.push(...(recData.results || []).map(movie => ({
                ...movie,
                source_type: "recommendation"
            })));

            const requestedGenres = genresRaw
                .split(",")
                .map(g => g.trim().toLowerCase())
                .filter(Boolean);

            const requestedGenreIds = requestedGenres
                .map(g => genreMap[g])
                .filter(id => id !== undefined);

            // remove duplicates
            let uniqueMovies = Array.from(
                new Map(movies.map(movie => [movie.id, movie])).values()
            );

            // strict filter first
            let filteredMovies = uniqueMovies.filter(movie =>
                movie.title &&
                movie.release_date &&
                movie.vote_count >= 100 &&
                movie.popularity >= 5
            );

            if (requestedGenreIds.length > 0) {
                filteredMovies = filteredMovies.filter(movie =>
                    requestedGenreIds.some(id => movie.genre_ids?.includes(id))
                );
            }

            // 7. Discover fallback ONLY if filtered pool is too small
            const referenceGenreIds = (detailsData.genres || []).map(g => g.id);
            const discoverGenreIds = requestedGenreIds.length > 0
                ? requestedGenreIds
                : referenceGenreIds;

            if (filteredMovies.length < count && discoverGenreIds.length > 0) {
                await delay(150);

                const discoverParams = new URLSearchParams();
                discoverParams.set("api_key", apiKey);
                discoverParams.set("with_genres", discoverGenreIds.join(","));
                discoverParams.set("sort_by", "popularity.desc");
                discoverParams.set("page", "1");

                const discoverUrl = `https://api.themoviedb.org/3/discover/movie?${discoverParams.toString()}`;
                const discoverData = await fetchJson(discoverUrl);

                movies.push(...(discoverData.results || []).map(movie => ({
                    ...movie,
                    source_type: "discover"
                })));

                uniqueMovies = Array.from(
                    new Map(movies.map(movie => [movie.id, movie])).values()
                );

                filteredMovies = uniqueMovies.filter(movie =>
                    movie.title &&
                    movie.release_date &&
                    movie.vote_count >= 100 &&
                    movie.popularity >= 5
                );

                if (requestedGenreIds.length > 0) {
                    filteredMovies = filteredMovies.filter(movie =>
                        requestedGenreIds.some(id => movie.genre_ids?.includes(id))
                    );
                }
            }

            // fallback 1: relax filter if too few remain
            if (filteredMovies.length < count) {
                filteredMovies = uniqueMovies.filter(movie =>
                    movie.title &&
                    movie.release_date &&
                    movie.vote_count >= 20
                );

                if (requestedGenreIds.length > 0) {
                    filteredMovies = filteredMovies.filter(movie =>
                        requestedGenreIds.some(id => movie.genre_ids?.includes(id))
                    );
                }
            }

            // fallback 2: if still too few, just keep valid movies
            if (filteredMovies.length < count) {
                filteredMovies = uniqueMovies.filter(movie =>
                    movie.title &&
                    movie.release_date
                );

                if (requestedGenreIds.length > 0) {
                    filteredMovies = filteredMovies.filter(movie =>
                        requestedGenreIds.some(id => movie.genre_ids?.includes(id))
                    );
                }
            }

            // similar/recommendation first, discover last
            const sourcePriority = {
                similar: 0,
                recommendation: 1,
                discover: 2
            };

            filteredMovies.sort((a, b) => {
                const aPriority = sourcePriority[a.source_type] ?? 99;
                const bPriority = sourcePriority[b.source_type] ?? 99;

                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                const scoreA = (a.vote_average || 0) * Math.log((a.vote_count || 0) + 1);
                const scoreB = (b.vote_average || 0) * Math.log((b.vote_count || 0) + 1);

                return scoreB - scoreA;
            });

            const referenceKeywords = (keywordsData.keywords || []).map(k => k.name);

            const cleaned = filteredMovies.slice(0, 30).map(movie => ({
                id: movie.id,
                title: movie.title,
                overview: movie.overview,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                genre_ids: movie.genre_ids || [],
                genres: (movie.genre_ids || []).map(id => genreIdToName[id]).filter(Boolean),
                vote_average: movie.vote_average || 0,
                vote_count: movie.vote_count || 0,
                popularity: movie.popularity || 0
            }));

            return {
                reference_movie: {
                    id: detailsData.id,
                    title: detailsData.title,
                    overview: detailsData.overview || "",
                    genres: (detailsData.genres || []).map(g => g.name),
                    genre_ids: (detailsData.genres || []).map(g => g.id),
                    keywords: referenceKeywords,
                    release_date: detailsData.release_date || ""
                },
                user_request: {
                    movieTitle,
                    genres: requestedGenres,
                    mood,
                    count
                },
                candidates: cleaned
            };
        },

        "/current-weather": async () => {
            const zip = queryParams.zip;
            const city = queryParams.city;
            const location = zip || city;
            if (!location) {
                return { error: "zip or city is required" };
            }
            const url = `https://api.weatherapi.com/v1/current.json?key=${weatherKey}&q=${encodeURIComponent(location)}`;
            return await fetchJson(url);
        },

        "/weather-forecast": async () => {
            const zip = queryParams.zip;
            const city = queryParams.city;
            const days = queryParams.days || 7;
            const location = zip || city;
            if (!location) {
                return { error: "zip or city is required" };
            }
            const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherKey}&q=${encodeURIComponent(location)}&days=${days}`;
            return await fetchJson(url);
        }
    };

    try {
        if (routes[cleanPath]) {
            const data = await routes[cleanPath]();
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
                },
                body: JSON.stringify(data),
            };
        }

        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
            },
            body: JSON.stringify({ error: "Endpoint not found" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
