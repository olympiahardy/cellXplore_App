import React, { useEffect, useState } from "react";
import { useTable, useSortBy, useGlobalFilter } from "react-table";

function InteractionDataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/data-table");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response is not JSON");
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setData(data);
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
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#1e1e1e",
        color: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#333",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Interaction Table
      </div>

      <div style={{ padding: "1rem", overflow: "hidden" }}>
        {/* Search bar for filtering table */}
        <input
          type="text"
          value={state.globalFilter || ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search for a cell type or interaction..."
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
            border: "1px solid #555",
            backgroundColor: "#333",
            color: "white",
          }}
        />

        <div style={{ maxHeight: "calc(100% - 80px)", overflow: "auto" }}>
          <table
            {...getTableProps()}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "white",
            }}
          >
            <thead>
              {headerGroups.map((headerGroup, headerGroupIndex) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroupIndex}
                >
                  {headerGroup.headers.map((column, columnIndex) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={columnIndex}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #555",
                        backgroundColor: "#333",
                        cursor: "pointer",
                      }}
                    >
                      {column.render("Header")}
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
    </div>
  );
}

export default InteractionDataTable;