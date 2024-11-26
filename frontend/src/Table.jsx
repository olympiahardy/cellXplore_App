import React, { useEffect, useState } from "react";
import { useTable } from "react-table";
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

  const tableInstance = useTable({ columns, data });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (data.length === 0) {
    return <p>No data available.</p>;
  }

  return (
    <div
      style={{
        width: "90%", // Adjust the width to fit your needs
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "8px",
        position: "fixed", // Keep it fixed to the bottom left as per your requirement
        bottom: 0,
        left: 0,
      }}
    >
      <div
        className="handle"
        style={{
          padding: "8px",
          borderRadius: "4px",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        Table Header
      </div>
      <div style={{ maxHeight: "200px", overflow: "auto" }}>
        <table
          {...getTableProps()}
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            {headerGroups.map((headerGroup, headerGroupIndex) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex}>
                {headerGroup.headers.map((column, columnIndex) => (
                  <th
                    {...column.getHeaderProps()}
                    key={columnIndex}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {column.render("Header")}
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
                        borderBottom: "1px solid #eee",
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
