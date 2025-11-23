  //this creates an array of years to be every year from 2019 to detected currentyear
  const currentYear = new Date().getFullYear();
const years = [];
for (let year = 2019; year <= currentYear; year++) {
  years.push(year);
}

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

export const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5001;

const connectionString = process.env.DB_CONNECTION_STRING;

const pool = new Pool({
  connectionString: connectionString,
});

pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to PostgreSQL database!");
    done();
  }
});

app.get("/", (req, res) => {
  res.send("Hello, this is your backend server!");
});

// Always return an array for playlists
app.get("/playlists", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM playlists ORDER BY id DESC");
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error executing search query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/playlists/:year", async (req, res) => {
  const { year } = req.params;
  try {
    const result = await pool.query("SELECT * FROM playlists WHERE year = $1", [
      year,
    ]);
    res.json(result.rows || []);
  } catch (error) {
    console.error("Error executing search query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/addplaylist", async (req, res) => {
  const { name, year, uri } = req.body;
  try {
    await pool.query(
      "INSERT INTO playlists (name, year, uri) VALUES ($1, $2, $3);",
      [name, year, uri]
    );
    res.json({ message: "Playlist added successfully" });
  } catch (error) {
    console.error("Error posting to database", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/addplay/:playYear", async (req, res) => {
  const { title, artists, uri, sourcePlaylist } = req.body;
  const { playYear } = req.params;

  // Define a simple table schema for new years
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS plays${playYear} (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      artists TEXT[] NOT NULL,
      uri TEXT NOT NULL,
      sourcePlaylist TEXT
     
    );
  `;

  try {
    // Ensure the table exists
    await pool.query(createTableQuery);

    // Insert the play
    await pool.query(
      `INSERT INTO plays${playYear} (title, artists, uri, sourcePlaylist) 
       VALUES ($1, $2, $3, $4)`,
      [title, artists, uri, sourcePlaylist]
    );

    res.json({ message: `Play added successfully to plays${playYear}` });
  } catch (error) {
    console.error("Error adding play:", error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


app.post("/removeallplays/:year", async (req, res) => {
  const { year } = req.params;
  try {
    await pool.query(`DELETE FROM plays${year}`);
    res.json({ message: "All plays removed successfully" });
  } catch (error) {
    console.error("Error removing plays:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const capitalizeArtists = (artists) => {
  return Array.isArray(artists)
    ? artists.map((artist) => artist.toUpperCase())
    : artists?.toUpperCase() || "";
};

// Helper to safely map and capitalize
const safeMapArtists = (rows) =>
  (rows || []).map((row) => ({
    ...row,
    artists: capitalizeArtists(row.artists),
    artist: row.artist?.toUpperCase() || "",
  }));

// Top tracks per year
app.get("/toptracks/:year", async (req, res) => {
  const { year } = req.params;
  try {
    const result = await pool.query(
      `SELECT UPPER(title) as title, artists, MIN(uri) as uri, COUNT(*) as count
       FROM plays${year}
       GROUP BY UPPER(title), artists
       ORDER BY count DESC, title;`
    );
    res.json(safeMapArtists(result.rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

// Top tracks across all years
app.get("/toptracksall", async (req, res) => {
  try {
    // assume `years` is defined somewhere in scope or imported
    const unionQueries = years
      .map(year => `SELECT title, artists, uri FROM plays${year}`)
      .join(" UNION ALL ");

    const sql = `
      SELECT UPPER(title) as title, artists, MIN(uri) as uri, COUNT(*) as count
      FROM (${unionQueries}) AS combined_plays
      GROUP BY UPPER(title), artists
      ORDER BY count DESC, title;
    `;

    const result = await pool.query(sql);
    res.json(safeMapArtists(result.rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// All playlists in plays
app.get("/allplaylistsinplays", async (req, res) => {

  try {
    const unionQuery = years
      .map(year => `SELECT sourcePlaylist FROM plays${year}`)
      .join(" UNION ALL ");

    const result = await pool.query(
      `SELECT DISTINCT sourcePlaylist
       FROM (${unionQuery}) AS combinedTable;`
    );

    res.json(result.rows || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Top artists per year
app.get("/topartists/:year", async (req, res) => {
  const { year } = req.params;
  try {
    const result = await pool.query(
      `SELECT artist, COUNT(*) as count
       FROM (
         SELECT unnest(artists) as artist FROM plays${year}
       ) AS unnested_artists
       GROUP BY artist
       ORDER BY count DESC, artist;`
    );
    res.json(safeMapArtists(result.rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

// Top artists across all years
app.get("/topartistsall", async (req, res) => {
  try {
    const unionQuery = years
      .map(year => `SELECT unnest(artists) as artist FROM plays${year}`)
      .join(" UNION ALL ");

    const result = await pool.query(
      `SELECT artist, COUNT(*) as count
       FROM (${unionQuery}) AS unnested_artists
       GROUP BY artist
       ORDER BY count DESC, artist;`
    );

    res.json(safeMapArtists(result.rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// New tracks
app.get("/newtracks/:year", async (req, res) => {
  const { year } = req.params;
  const lastyear = year - 1;
  try {
    let query = `SELECT UPPER(title) as title, artists, MIN(uri) as uri, COUNT(*) as count
      FROM plays${year}
      WHERE NOT EXISTS (
        SELECT 1 FROM plays${lastyear}
        WHERE UPPER(plays${lastyear}.title) = UPPER(plays${year}.title)
          AND plays${lastyear}.artists = plays${year}.artists
      )`;
    for (let i = lastyear - 1; i >= 2019; i--) {
      query += ` AND NOT EXISTS (
        SELECT 1 FROM plays${i}
        WHERE UPPER(plays${i}.title) = UPPER(plays${year}.title)
          AND plays${i}.artists = plays${year}.artists
      )`;
    }
    query += ` GROUP BY UPPER(title), artists ORDER BY count DESC, title;`;
    const result = await pool.query(query);
    res.json(safeMapArtists(result.rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// New artists
app.get("/newartists/:year", async (req, res) => {
  const { year } = req.params;
  const lastyear = year - 1;
  try {
    let query = `SELECT artist, COUNT(*) as count
      FROM (
        SELECT unnest(artists) as artist FROM plays${year}
      ) AS unnested_artists
      WHERE NOT EXISTS (
        SELECT 1
        FROM plays${lastyear}, unnest(plays${lastyear}.artists) AS unnested_artists_${lastyear}
        WHERE unnested_artists_${lastyear} = unnested_artists.artist
      )`;
    for (let i = lastyear - 1; i >= 2019; i--) {
      query += ` AND NOT EXISTS (
        SELECT 1
        FROM plays${i}, unnest(plays${i}.artists) AS unnested_artists_${i}
        WHERE unnested_artists_${i} = unnested_artists.artist
      )`;
    }
    query += ` GROUP BY artist ORDER BY count DESC, artist;`;
    const result = await pool.query(query);
    res.json(safeMapArtists(result.rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Close DB on exit
process.on("SIGINT", () => {
  pool
    .end()
    .then(() => {
      console.log("Database connection closed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error closing database connection:", error);
      process.exit(1);
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
