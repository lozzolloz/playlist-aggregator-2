import "./App.css";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import Navigation from "./components/Navigation/Navigation";
import PlayCountsTable from "./components/PlayCountsTable/PlayCountsTable";
import ImportPlaylist from "./components/ImportPlaylist/ImportPlaylist";
import PlaylistsTable from "./components/PlaylistsTable/PlaylistsTable";
import PlaySearchOptions from "./components/PlaySearchOptions/PlaySearchOptions";
import CreatePlaylist from "./components/CreatePlaylist/CreatePlaylist";
import ImportPlayCounts from "./components/ImportPlayCounts/ImportPlayCounts";

let deployment = false;
var urlServer = deployment === true ? "" : "http://localhost:5001";

const spotifyApi = new SpotifyWebApi();

const getTokenFromUrl = () => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

function App() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [plays, setPlays] = useState([]);
  const [allPlaylistsInPlays, setAllPlaylistsInPlays] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const terms = ["Top Tracks", "New Tracks", "Top Artists", "New Artists"];
  const [getPlaysDisabled, setGetPlaysDisabled] = useState(true);
  const [pushPlaysDisabled, setPushPlaysDisabled] = useState(true);
  const [year, setYear] = useState(2019);
  const [term, setTerm] = useState("Top Tracks");
  const [searchResults, setSearchResults] = useState([]);
  const [hideOptions, setHideOptions] = useState(true);
  const [hideWrapped, setHideWrapped] = useState(false);
  const [createdPlaylistId, setCreatedPlaylistId] = useState("");
  const [hideWrapped2, setHideWrapped2] = useState(false);
  const [editMode, setEditMode] = useState("export");
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [inputTerm, setInputTerm] = useState("");
  const [inputYear, setInputYear] = useState(2024);
  const [newPlaylistInfo, setNewPlaylistInfo] = useState(null);
  const [importError, setImportError] = useState(false);
  const [importPlaylistConfirmView, setImportPlaylistConfirmView] =
    useState(false);
  const [createPlaylistPage, setCreatePlaylistPage] = useState("home");
  const [playCountImportPage, setPlayCountImportPage] = useState("home");
  const [highlightedPlaylistsExist, setHighlightedPlaylistsExist] =
    useState(false);
  const [playlistsNotInPlays, setPlaylistsNotInPlays] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const tokenInfo = getTokenFromUrl();
      const spotifyToken = tokenInfo.access_token;

      if (spotifyToken) {
        setSpotifyToken(spotifyToken);
        spotifyApi.setAccessToken(spotifyToken);
        const user = await spotifyApi.getMe();
        console.log(user);
        setUserName(user.display_name);
        setUserId(user.id);
        setLoggedIn(true);
      }
    };

    fetchData();
  }, []);

  // spotify API calls

  const getPlaylistTracks = async (playlist) => {
    try {
      let offset = 0;
      let tracks = [];

      // Use a loop to handle pagination
      while (true) {
        const data = await spotifyApi.getPlaylistTracks(playlist.uri, {
          offset,
        });

        if (data.items.length === 0) {
          // No more tracks to fetch, exit the loop
          break;
        }

        tracks = [
          ...tracks,
          ...data.items.map((item) => ({
            title: item.track.name,
            artists: item.track.artists.map((artist) => artist.name),
            uri: item.track.uri,
            sourcePlaylist: playlist.uri,
          })),
        ];

        offset += data.items.length;

        // Spotify API returns at most 100 tracks per request, so we continue fetching until all tracks are obtained
      }

      setPlays((prevPlays) => [...prevPlays, ...tracks]);
    } catch (error) {
      console.error(`Error fetching tracks for ${playlist.year}:`, error);
    }
  };

  const createPlaylist = async (userId, options) => {
    try {
      const data = await spotifyApi.createPlaylist(userId, options);
      console.log(`Playlist created ${data.id} ${options.name}`);
      setCreatedPlaylistId(data.id);
    } catch (error) {
      console.error(`Error creating playlist`, error);
    }
  };

  const addTracksToPlaylist = async (playlistId, searchResults) => {
    const chunkSize = 100;

    for (let i = 0; i < searchResults.length; i += chunkSize) {
      const urisChunk = searchResults
        .slice(i, i + chunkSize)
        .map((result) => result.uri);

      try {
        await spotifyApi.addTracksToPlaylist(playlistId, urisChunk);
        console.log(
          `${urisChunk.length} tracks added to playlist ${playlistId}`
        );
      } catch (error) {
        console.error(`Error adding tracks to playlist`, error);
      }
    }
  };

  const getNewPlaylistInfo = async (uri) => {
    let playlistId = removePrefixes(uri);
    try {
      const data = await spotifyApi.getPlaylist(playlistId);
      setNewPlaylistInfo(data);
      setImportPlaylistConfirmView(true);
      setImportError(false);
    } catch (error) {
      setImportError(true);

      console.error(`Playlist not found with ID ${playlistId}`, error);
    }
  };

  // my database calls

  const getPlaylists = async (selectedYear) => {
    try {
      const response = await fetch(`${urlServer}/playlists/${selectedYear}`);
      const data = await response.json();
      console.log(data);
      setPlaylists(data);
    } catch (error) {
      console.error(`Error fetching playlists for ${selectedYear}:`, error);
    }
  };

  const getAllPlaylists = async () => {
    try {
      const response = await fetch(`${urlServer}/playlists`);
      const data = await response.json();
      console.log(data);
      setAllPlaylists(data);
    } catch (error) {
      console.error(`Error fetching playlists`, error);
    }
  };

  const pushPlays = async (selectedYear) => {
    try {
      // await fetch(`${urlServer}/removeallplays/${selectedYear}`, {
      //   method: "POST",
      // });
      for (let i = 0; i < plays.length; i++) {
        const response = await fetch(`${urlServer}/addplay/${selectedYear}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(plays[i]),
        });

        const data = await response.json();
        console.log(data);
      }
    } catch (error) {
      console.error(`Error pushing plays for ${selectedYear}:`, error);
    }
  };

  const pushPlaylist = async (newPlaylistInfo, inputYear) => {
    try {
      await fetch(`${urlServer}/addplaylist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Set the content type to JSON
        },
        body: JSON.stringify({
          name: newPlaylistInfo.name,
          year: inputYear,
          uri: removePrefixes(newPlaylistInfo.uri),
        }),
      });
    } catch (error) {
      console.error(`Error pushing playlist`, error);
    }
  };

  const getPlays = async (selectedYear) => {
    try {
      setPlays([]); // Clear the plays array before fetching new plays
      for (let i = 0; i < playlistsNotInPlays.length; i++) {
        await getPlaylistTracks(playlistsNotInPlays[i]);
      }
    } catch (error) {
      console.error(`Error fetching plays for ${selectedYear}:`, error);
    }
  };

  function removePrefixes(inputString) {
    const parts = inputString.split(":");
    const result = parts[parts.length - 1];
    return result;
  }

  async function getSearchResults(year, term) {
    let fetchUrl = "";
    if (year === "all") {
      switch (term) {
        case "Top Tracks":
        case "new tracks":
          fetchUrl = `http://localhost:5001/toptracksall`;
          break;
        case "Top Artists":
        case "New Artists":
          fetchUrl = `http://localhost:5001/topartistsall`;
          break;
        default:
          fetchUrl = `http://localhost:5001/toptracksall`;
      }
    } else if (year === 2019) {
      switch (term) {
        case "Top Tracks":
        case "New Tracks":
          fetchUrl = `http://localhost:5001/toptracks/${year}`;
          break;
        case "Top Artists":
        case "New Artists":
          fetchUrl = `http://localhost:5001/topartists/${year}`;
          break;
        default:
          fetchUrl = `http://localhost:5001/toptracks/${year}`;
      }
    } else {
      switch (term) {
        case "Top Tracks":
          fetchUrl = `http://localhost:5001/toptracks/${year}`;
          break;
        case "Top Artists":
          fetchUrl = `http://localhost:5001/topartists/${year}`;
          break;
        case "New Tracks":
          fetchUrl = `http://localhost:5001/newtracks/${year}`;
          break;
        case "New Artists":
          fetchUrl = `http://localhost:5001/newartists/${year}`;
          break;
        default:
          fetchUrl = `http://localhost:5001/toptracks/${year}`;
          break;
      }
    }

    try {
      const response = await fetch(fetchUrl);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error(`Error fetching data`, error);
    }
  }

  async function getAllPlaylistsInPlays() {
    try {
      const response = await fetch("http://localhost:5001/allplaylistsinplays");
      const data = await response.json();
      setAllPlaylistsInPlays(data);
    } catch (error) {
      console.error(`Error fetching data`, error);
    }
  }

  //effects

  useEffect(() => {
    if (createdPlaylistId === "") {
      setHideWrapped2(true);
    } else {
      setHideWrapped2(false);
    }
  }, [createdPlaylistId]);

  useEffect(() => {
    if (year === "all" || year === 2019) {
      setHideOptions(true);
    } else {
      setHideOptions(false);
    }
  }, [year]);

  useEffect(() => {
    getSearchResults(year, term);
  }, [year, term]);

  useEffect(() => {
    if (term === "new tracks" || term === "Top Tracks") {
      setHideWrapped(false);
    }
    if (term === "New Artists" || term === "Top Artists") {
      setHideWrapped(true);
    }
  }, [term]);

  useEffect(() => {
    if (hideOptions === true && term === "new tracks") {
      setTerm("Top Tracks");
    }
    if (hideOptions === true && term === "New Artists") {
      setTerm("Top Artists");
    }
  }, [hideOptions, year, term]);

  useEffect(() => {
    setCreatedPlaylistId("");
  }, [year, term]);

  useEffect(() => {
    playlistsNotInPlays.length > 0
      ? setHighlightedPlaylistsExist(true)
      : setHighlightedPlaylistsExist(false);
  }, [playlistsNotInPlays]);

useEffect(() => {
  // Make sure these are arrays even if the data hasn't loaded yet
  const safeAllPlaylists = Array.isArray(allPlaylists) ? allPlaylists : [];
  const safeAllPlaylistsInPlays = Array.isArray(allPlaylistsInPlays)
    ? allPlaylistsInPlays
    : [];

  setPlaylistsNotInPlays(
    safeAllPlaylists.filter(
      (playlist) =>
        !safeAllPlaylistsInPlays.some(
          (item) => item.sourceplaylist === playlist.uri
        )
    )
  );
}, [allPlaylists, allPlaylistsInPlays]);


  return (
    <div id="app">
      <Navigation
        loggedIn={loggedIn}
        userName={userName}
        editMode={editMode}
        setEditMode={setEditMode}
        getAllPlaylists={getAllPlaylists}
        getAllPlaylistsInPlays={getAllPlaylistsInPlays}
      />

      {editMode === "export" && (
        <div className="main-app">
          <div className="interface">
            <PlaySearchOptions
              year={year}
              setYear={setYear}
              term={term}
              setTerm={setTerm}
              years={years}
              terms={terms}
              hideOptions={hideOptions}
              setCreatePlaylistPage={setCreatePlaylistPage}
            />
          </div>
          <div>
            {loggedIn && (term === "Top Tracks" || term === "New Tracks") && (
              <CreatePlaylist
                createPlaylist={createPlaylist}
                userId={userId}
                term={term}
                year={year}
                addTracksToPlaylist={addTracksToPlaylist}
                createdPlaylistId={createdPlaylistId}
                searchResults={searchResults}
                createPlaylistPage={createPlaylistPage}
                setCreatePlaylistPage={setCreatePlaylistPage}
              />
            )}
          </div>
          <PlayCountsTable searchResults={searchResults} />
        </div>
      )}

      {editMode === "import" && (
        <div className="main-app">
          <div className="interface">
            <ImportPlaylist
              inputTerm={inputTerm}
              setInputTerm={setInputTerm}
              setInputYear={setInputYear}
              getNewPlaylistInfo={getNewPlaylistInfo}
              importError={importError}
              importPlaylistConfirmView={importPlaylistConfirmView}
              setImportPlaylistConfirmView={setImportPlaylistConfirmView}
              pushPlaylist={pushPlaylist}
              newPlaylistInfo={newPlaylistInfo}
              inputYear={inputYear}
              setNewPlaylistInfo={setNewPlaylistInfo}
              getAllPlaylists={getAllPlaylists}
            />
          </div>
          <div>
            <ImportPlayCounts
              getPlaylists={getPlaylists}
              getPlays={getPlays}
              pushPlays={pushPlays}
              playCountImportPage={playCountImportPage}
              setPlayCountImportPage={setPlayCountImportPage}
              getAllPlaylists={getAllPlaylists}
              highlightedPlaylistsExist={highlightedPlaylistsExist}
              playlistsNotInPlays={playlistsNotInPlays}
              setPlaylistsNotInPlays={setPlaylistsNotInPlays}
              plays={plays}
              getAllPlaylistsInPlays={getAllPlaylistsInPlays}
            />
          </div>
          <PlaylistsTable
            allPlaylists={allPlaylists}
            allPlaylistsInPlays={allPlaylistsInPlays}
          />
        </div>
      )}
    </div>
  );
}

export default App;
