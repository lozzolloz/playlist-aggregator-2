import "./ImportPlaylist.css";

export default function ImportPlaylist({
  inputTerm,
  setInputTerm,
  setInputYear,
  getNewPlaylistInfo,
  importError,
  importPlaylistConfirmView,
  setImportPlaylistConfirmView,

  pushPlaylist,
  newPlaylistInfo,
  inputYear,
  setNewPlaylistInfo,
  getAllPlaylists,
  years,
  currentYear

}) {
  function handleInputTermChange(event) {
    setInputTerm(event.target.value);
  }

  function handleInputYearChange(event) {
    setInputYear(parseInt(event.target.value, 10));
  }

  function handleImportClick() {
    getNewPlaylistInfo(inputTerm);
  }

  async function handleConfirmClick() {
    await pushPlaylist(newPlaylistInfo, inputYear);
    setImportPlaylistConfirmView(false);
    setNewPlaylistInfo(null);
    getAllPlaylists();
    setInputTerm("");
  }

  function handleCancelClick() {
    setImportPlaylistConfirmView(false);
    setNewPlaylistInfo(null);
    setInputTerm("");
  }


  return (<div>
    {!importPlaylistConfirmView && (
      <div>
        <p className="add-playlist-heading">Add Playlist To Database</p>
        <div className="add-playlist__input">
          <input placeholder="URI" onChange={handleInputTermChange}></input>

<select className="year" onChange={handleInputYearChange} value={inputYear}>
  {years.slice().reverse().map(year => (
    <option key={year} value={year}>
      {year}
    </option>
  ))}
</select>




          <button onClick={handleImportClick}>import</button>
        </div>
        <p className={"import-interface__error-" + importError}>
          Playlist Not Found
        </p>
      </div>
    )}

    {importPlaylistConfirmView && (
      <div>
      <p className="new-playlist-info">{newPlaylistInfo.name}</p>
      <div className="import-confirm__buttons">
        <button className="add-playlist-button" onClick={handleConfirmClick}>
          add to {inputYear}
        </button>
        <button className="cancel-add-playlist-button" onClick={handleCancelClick}>cancel</button>
      </div>
      </div>
    )}

    </div>);
}
