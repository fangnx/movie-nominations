import { EntityState, EntityAdapter, createEntityAdapter } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";
import { localStorageSync } from "ngrx-store-localstorage";
import {
  selectMovie,
  fetchMoviesSuccess,
  populateNominationsSuccess,
  unselectMovie,
  enterSearchTerm,
  goToPage,
  clearSearch,
} from "./app.actions";
import { Movie } from "../models/omdb.model";

export interface AppState extends EntityState<Movie> {
  movies: Movie[];
  searchTerm: string;
  numOfResults: number;
  searchError: string;
  page: number;
  nominatedMovies: Movie[];
}

export const adapter: EntityAdapter<Movie> = createEntityAdapter<Movie>({
  selectId: (movie: Movie) => movie.imdbID,
  sortComparer: false,
});

const initialState: AppState = adapter.getInitialState(<AppState>{
  searchTerm: null,
  numOfResults: 0,
  searchError: "",
  page: 1,
  nominatedMovies: [],
});

export function appReducer(state, action) {
  return createReducer(
    initialState,
    on(fetchMoviesSuccess, (state, { searchResponse, resetPage }) => {
      const page: number = resetPage ? 1 : state.page;
      if (!searchResponse.Error) {
        return {
          ...state,
          movies: searchResponse.Search,
          numOfResults: +searchResponse.totalResults,
          searchError: "",
          page,
        };
      }
      return {
        ...state,
        movies: [],
        numOfResults: 0,
        searchError: searchResponse.Error,
        page,
      };
    }),
    on(populateNominationsSuccess, (state, { movies }) => {
      if (movies) {
        return {
          ...state,
          nominatedMovies: movies,
        };
      }
      return state;
    }),
    on(selectMovie, (state, { movie }) => ({
      ...state,
      nominatedMovies: [...state.nominatedMovies, movie],
    })),
    on(unselectMovie, (state, { movieId }) => ({
      ...state,
      nominatedMovies: state.nominatedMovies.filter(
        (movie) => movie.imdbID !== movieId
      ),
    })),
    on(enterSearchTerm, (state, { searchTerm }) => ({
      ...state,
      searchTerm,
    })),
    on(clearSearch, (state) => ({
      ...state,
      searchTerm: null,
      searchError: "",
      page: 1,
      movies: [],
    })),
    on(goToPage, (state, { page }) => ({
      ...state,
      page,
    }))
  )(state, action);
}

export function localStorageSyncReducer(reducer) {
  return localStorageSync({
    keys: [
      {
        app: ["searchTerm", "movies", "page", "numOfResults"],
      },
    ],
    rehydrate: true,
  })(reducer);
}
