import React, { useEffect, useState } from "react";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import "./App.css"; // Make sure to include your CSS file

function InteractionDataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/data-table");
        console.log("Response received:", response);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response is not JSON");
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        if (Array.isArray(data)) {
          setData(data);
          console.log("Data is set!");
        } else {
          console.error("Data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const columns = React.useMemo(() => {
    return data.length > 0
      ? Object.keys(data[0]).map((key) => ({ Header: key, accessor: key }))
      : [];
  }, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter,
    state,
  } = useTable({ columns, data }, useGlobalFilter, useSortBy);

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (data.length === 0) {
    return <p>No data available.</p>;
  }

  return (
    <div
      style={{
        width: "50%", // Adjust the width to fit your needs
        border: "1px solid #333",
        padding: "10px",
        borderRadius: "8px",
        position: "fixed",
        bottom: 0,
        left: "10px",
        backgroundColor: "#1e1e1e", // Dark gray background for dark theme
        color: "white", // White text for dark theme
        boxShadow: "0px 0px 10px rgba(255, 255, 255, 0.2)",
      }}
    >
      <div
        style={{
          padding: "8px",
          borderRadius: "4px",
          textAlign: "center",
          marginBottom: "10px",
          fontWeight: "bold",
        }}
      >
        Interaction Table
      </div>

      {/* Search bar for filtering table */}
      <input
        type="text"
        value={state.globalFilter || ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search for a cell type or interaction..."
        style={{
          width: "90%",
          padding: "8px",
          borderRadius: "4px",
          marginBottom: "10px",
          border: "1px solid #555",
          backgroundColor: "#333",
          color: "white",
        }}
      />

      <div style={{ maxHeight: "300px", overflow: "auto" }}>
        <table
          {...getTableProps()}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "white", // White text color for dark theme
          }}
        >
          <thead>
            {headerGroups.map((headerGroup, headerGroupIndex) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex}>
                {headerGroup.headers.map((column, columnIndex) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={columnIndex}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #555",
                      backgroundColor: "#333", // Darker header background for dark theme
                      cursor: "pointer",
                      userSelect: "none", // Prevent text selection while sorting
                    }}
                  >
                    {column.render("Header")}
                    {/* Add sorting indicator */}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={rowIndex}>
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      {...cell.getCellProps()}
                      key={cellIndex}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #444",
                        textAlign: "left",
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InteractionDataTable;
