import React from "react";
import "./PlayCountsTable.css";

export default function PlayCountsTable({ searchResults }) {

 // Ensure searchResults is always an array
  const safeResults = Array.isArray(searchResults) ? searchResults : [];


  // Get unique headers excluding "uri"
  const headers = [
    ...new Set(
      safeResults.flatMap((item) =>
        Object.keys(item).filter((key) => key !== "uri")
      )
    ),
  ];

  // Capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Create a map to store row numbers for each unique count value
  const countRowMap = {};

  // Define table rows with row numbers
  const rows = safeResults.map((item, index) => {
    // If count is not in the map, add it with the current row number
    if (!countRowMap[item.count]) {
      countRowMap[item.count] = index + 1;
    }

    // Format artists array with commas and spaces
    const formattedArtists = Array.isArray(item.artists)
      ? item.artists.join(", ")
      : item.artists;

    return (
      <tr key={index}>
        <td className="position">{countRowMap[item.count]}</td>{" "}
        {/* Position in the chart */}
        {headers.map((header, i) => (
          <td key={i} className={header}>
            {header === "artists" ? formattedArtists : item[header]}
          </td>
        ))}
      </tr>
    );
  });

  // Capitalize the first letter of each header
  const capitalizedHeaders = headers.map((header) =>
    header === "count" ? "🧮" : capitalizeFirstLetter(header)
  );

  // Add "Row" to the beginning of capitalized headers
  capitalizedHeaders.unshift("#");

  return (
    <div>
      <table border="1">
        <thead>
          <tr className="header-row">
            {capitalizedHeaders.map((header, index) => (
              <th className={header === "#" || header === "🧮" ? "header-numeric" : "header-text" }key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
