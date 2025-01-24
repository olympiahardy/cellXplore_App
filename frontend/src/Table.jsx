import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar, GridOverlay } from "@mui/x-data-grid";

function InteractionDataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);

  // Function to round floats to 4 significant figures
  const roundToSignificantFigures = (value) => {
    if (typeof value === "number" && !Number.isInteger(value)) {
      return parseFloat(value.toPrecision(3));
    }
    return value;
  };

  // Preprocess data to round float values
  const preprocessData = (rawData) => {
    return rawData.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          roundToSignificantFigures(value),
        ])
      )
    );
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/data-table");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const fetchedData = await response.json();
        const dataWithIds = fetchedData.map((row, index) => ({
          id: index, // Assign a unique id to each row
          ...row,
        }));
        setData(preprocessData(dataWithIds));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Generate columns, rounding floats for display
  const columns = React.useMemo(() => {
    return data.length > 0
      ? Object.keys(data[0])
          .filter((key) => key !== "id") // Exclude the id column
          .map((key) => ({
            field: key,
            headerName: key
              .replace(/_/g, " ") // Replace underscores with spaces
              .replace(/\b\w/g, (char) => char.toUpperCase()), // Capitalize each word
            flex: 1,
          }))
      : [];
  }, [data]);

  const CustomNoRowsOverlay = () => (
    <GridOverlay>
      <div style={{ textAlign: "center", color: "#333", fontSize: "1.2rem" }}>
        No interactions found!
      </div>
    </GridOverlay>
  );

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
      }}
    >
      <div
        style={{
          backgroundColor: "#333",
          color: "white",
          textAlign: "center",
          padding: "1rem",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        Table of Interactions
      </div>

      {/* Instructions Section */}
      <div
        style={{
          backgroundColor: "#444",
          color: "#ddd",
          textAlign: "center",
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          fontStyle: "italic",
        }}
      >
        Here we can see a nice clear tabular view of our interaction results!
        Click the three dots on each column of the table to sort, filter and
        search results quickly. You can also sort columns by clicking on the
        column headers. Columns can also be hidden if you feel they are
        irrelavent, and can be restored whenever you need them again. Use the
        controls at the bottom of the table to navigate between the pages of
        results.
      </div>

      <div style={{ flex: 1, padding: "1rem" }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 20]}
          pagination
          checkboxSelection
          disableSelectionOnClick
          components={{
            Toolbar: GridToolbar, // Use the built-in toolbar
            NoRowsOverlay: CustomNoRowsOverlay, // Custom overlay when no rows are displayed
          }}
          sx={{
            backgroundColor: "#fff",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f5f5f5",
              color: "#333",
              fontSize: "1.2rem", // Increased font size
              fontWeight: "bold", // Bold column headers
              borderBottom: "2px solid #ddd",
            },
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: "#f9f9f9",
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: "#ffffff",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #e0e0e0",
            },
          }}
        />
      </div>
    </div>
  );
}

export default InteractionDataTable;
