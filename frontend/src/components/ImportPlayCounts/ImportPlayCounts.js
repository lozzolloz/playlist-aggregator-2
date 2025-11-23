import "./ImportPlayCounts.css";

export default function ImportPlayCounts({
  getPlaylists,
  getPlays,
  pushPlays,
  playCountImportPage,
  setPlayCountImportPage,
  getAllPlaylists,
  highlightedPlaylistsExist,
  playlistsNotInPlays,
  setPlaylistsNotInPlays,
  plays,
  getAllPlaylistsInPlays,
  currentYear
}) {
  const handleGetClick = async () => {
    setPlayCountImportPage("loading");
    await getPlays(currentYear);
    setPlayCountImportPage("confirm");
  };

  const handlePushClick = async () => {
    try {
      setPlayCountImportPage("loading");
      await pushPlays(currentYear);
      await getAllPlaylists();
      await getAllPlaylistsInPlays();
      setTimeout(() => {
        setPlayCountImportPage("home");
      }, 500);
    } catch (error) {
      console.error("Import error:", error);
    }
  };

  return (
    <div>
      {!highlightedPlaylistsExist && playCountImportPage === "home" && (
        <div className="import-playcounts">
          <p className="info-text">All Play Counts Are Up To Date.</p>
        </div>
      )}
      {highlightedPlaylistsExist && playCountImportPage === "home" && (
        <div className="import-playcounts">
          <p className="highlighted-text">
            Play Counts Awaiting Import From {playlistsNotInPlays.length}{" "}
            Playlist
            {playlistsNotInPlays.length > 1 ? "s" : ""}
          </p>
          <button className="import-button" onClick={handleGetClick}>
            Import
          </button>
        </div>
      )}
      {playCountImportPage === "loading" && (
        <div className="import-playcounts">
          <p className="info">Importing...</p>
          <p className="loader"></p>
          <p className="warning">Do not navigate away from this page.</p>
        </div>
      )}

      {playCountImportPage === "confirm" && (
        <div className="import-playcounts">
          <p className="highlighted-text">Import {plays.length} Plays?</p>
          <div className="import-confirm__buttons">
            <button className="import-confirm-button" onClick={handlePushClick}>
              import
            </button>
            <button
              className="import-cancel-button"
              onClick={() => setPlayCountImportPage("home")}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
