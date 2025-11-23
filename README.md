# Playlist Aggregator

This app was created to solve a problem for a club night brand. A Spotify playlist is created after each event with all songs played, and at the end of each year, a 'Spotify Wrapped' style playlist is made with all songs played that year in order. This app was created to be able to take all the playlists and automatically collate all tracks and order by track number, and create the wrapped playlist for you.

## Components

This app is currently designed to run locally.

The whole app can be run via `npm start`in the root folder.

A breakdown of what this does:

The auth-server/authorization_code is run with `node app.js` to allow the user to log in to the app with Spotify and allow the app access to read and write in their Spotify account.

The frontend is run with `npm start` to load the user interface.

The backend is run with `npm start` which links to an SQL database of playlists and tracks.

## Usage

### Homepage

On load, users are able to view all stats of playlists already imported, filtering by year or by all time, as well as by filters for top tracks, top new tracks, top artists and top new artists.

### Create Wrapped

After logging in, this section allows the user to create a playlist and add all tracks that appear with the current filters.

### Import Plays

This section allows the user to add new playlists to the database, and import all tracks and play counts from those playlists to the database.

## Demo

As this app was designed for use by a specific brand, it is not available publically, but a full demonstration can be seen below.

[Youtube](https://www.youtube.com/watch?v=szanI6_5ih4)
