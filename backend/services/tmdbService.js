const axios = require("axios");

// TMDB API Configuration
// Get your API key from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = process.env.TMDB_API_KEY || "YOUR_TMDB_API_KEY_HERE";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Search for movies
 */
exports.searchMovies = async (query) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: "en-US",
        page: 1
      }
    });

    return response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
      genreIds: movie.genre_ids,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      type: "movie"
    }));
  } catch (error) {
    console.error("TMDB Movie search error:", error.message);
    if (error.response?.status === 401) {
      throw new Error("Invalid TMDB API key. Please check your TMDB_API_KEY in .env file.");
    }
    throw error;
  }
};

/**
 * Search for TV shows
 */
exports.searchTVShows = async (query) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: "en-US",
        page: 1
      }
    });

    return response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      firstAirDate: show.first_air_date,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w200${show.poster_path}` : null,
      genreIds: show.genre_ids,
      popularity: show.popularity,
      voteAverage: show.vote_average,
      type: "tv"
    }));
  } catch (error) {
    console.error("TMDB TV search error:", error.message);
    if (error.response?.status === 401) {
      throw new Error("Invalid TMDB API key. Please check your TMDB_API_KEY in .env file.");
    }
    throw error;
  }
};

/**
 * Get movie details by ID
 */
exports.getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US"
      }
    });

    return {
      id: response.data.id,
      title: response.data.title,
      releaseDate: response.data.release_date,
      overview: response.data.overview,
      posterPath: response.data.poster_path ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}` : null,
      genres: response.data.genres.map(g => g.name),
      popularity: response.data.popularity,
      voteAverage: response.data.vote_average,
      runtime: response.data.runtime,
      type: "movie"
    };
  } catch (error) {
    console.error("TMDB Movie details error:", error.message);
    if (error.response?.status === 401) {
      throw new Error("Invalid TMDB API key. Please check your TMDB_API_KEY in .env file.");
    }
    return null;
  }
};

/**
 * Get TV show details by ID
 */
exports.getTVDetails = async (tvId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US"
      }
    });

    return {
      id: response.data.id,
      title: response.data.name,
      firstAirDate: response.data.first_air_date,
      overview: response.data.overview,
      posterPath: response.data.poster_path ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}` : null,
      genres: response.data.genres.map(g => g.name),
      popularity: response.data.popularity,
      voteAverage: response.data.vote_average,
      numberOfSeasons: response.data.number_of_seasons,
      type: "tv"
    };
  } catch (error) {
    console.error("TMDB TV details error:", error.message);
    if (error.response?.status === 401) {
      throw new Error("Invalid TMDB API key. Please check your TMDB_API_KEY in .env file.");
    }
    return null;
  }
};

/**
 * Get genre list for movies
 */
exports.getMovieGenres = async () => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US"
      }
    });
    return response.data.genres;
  } catch (error) {
    console.error("TMDB Movie genres error:", error.message);
    return [];
  }
};

/**
 * Get genre list for TV shows
 */
exports.getTVGenres = async () => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "en-US"
      }
    });
    return response.data.genres;
  } catch (error) {
    console.error("TMDB TV genres error:", error.message);
    return [];
  }
};

/**
 * Discover movies with filters
 */
exports.discoverMovies = async (filters = {}) => {
  try {
    const params = {
      api_key: TMDB_API_KEY,
      language: filters.language || "en-US",
      sort_by: "popularity.desc",
      page: filters.page || 1,
      include_adult: false
    };

    if (filters.genre) {
      params.with_genres = filters.genre;
    }

    if (filters.year) {
      params.primary_release_year = filters.year;
    }

    if (filters.region) {
      params.region = filters.region;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, { params });

    const results = response.data.results || [];
    console.log(`TMDB Discover movies: Found ${results.length} results`);

    return results.map(movie => ({
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
      genreIds: movie.genre_ids,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      type: "movie"
    }));
  } catch (error) {
    console.error("TMDB Discover movies error:", error.message);
    if (error.response) {
      console.error("TMDB API response:", error.response.status, error.response.data);
    }
    throw error;
  }
};

/**
 * Discover TV shows with filters
 */
exports.discoverTVShows = async (filters = {}) => {
  try {
    const params = {
      api_key: TMDB_API_KEY,
      language: filters.language || "en-US",
      sort_by: "popularity.desc",
      page: filters.page || 1,
      include_adult: false
    };

    if (filters.genre) {
      params.with_genres = filters.genre;
    }

    if (filters.year) {
      params.first_air_date_year = filters.year;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, { params });

    const results = response.data.results || [];
    console.log(`TMDB Discover TV: Found ${results.length} results`);

    return results.map(show => ({
      id: show.id,
      title: show.name,
      firstAirDate: show.first_air_date,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w200${show.poster_path}` : null,
      genreIds: show.genre_ids,
      popularity: show.popularity,
      voteAverage: show.vote_average,
      type: "tv"
    }));
  } catch (error) {
    console.error("TMDB Discover TV error:", error.message);
    if (error.response) {
      console.error("TMDB API response:", error.response.status, error.response.data);
    }
    throw error;
  }
};

