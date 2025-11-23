import React from "react";
import "./PlaylistsTable.css";

export default function PlaylistsTable({ allPlaylists, allPlaylistsInPlays }) {
  // Ensure arrays are safe
  const safePlaylists = Array.isArray(allPlaylists) ? allPlaylists : [];
  const safePlaylistsInPlays = Array.isArray(allPlaylistsInPlays)
    ? allPlaylistsInPlays
    : [];

  return (
    <div className="playlists-table">
      <table>
        <thead>
          <tr className="header-row">
            <th className="header-numeric">#</th>
            <th className="header-numeric">Year</th>
            <th className="header-text">Name</th>
            <th className="header-text">ID</th>
          </tr>
        </thead>
        <tbody>
          {safePlaylists.length > 0 ? (
            safePlaylists.map((playlist, index) => (
              <tr
                key={playlist.id ?? index}
                className={
                  safePlaylistsInPlays.some(
                    (item) =>
                      item.sourceplaylist?.toLowerCase() ===
                      playlist.uri?.toLowerCase()
                  )
                    ? "normal-row"
                    : "highlighted-row"
                }
              >
                <td className="id-column">{safePlaylists.length - index}</td>
                <td className="playlist-year">{playlist.year ?? "-"}</td>
                <td className="playlist-name">{playlist.name ?? "-"}</td>
                <td className="uri-column">{playlist.uri ?? "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No playlists available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
