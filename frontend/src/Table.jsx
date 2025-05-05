import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar, GridOverlay } from "@mui/x-data-grid";

function InteractionDataTable({ selections }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSelection, setSelectedSelection] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [savedSelections, setSavedSelections] = useState({});
  const [newSelectionName, setNewSelectionName] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25, // Default 25 rows per page
  });
  const [searchText, setSearchText] = useState("");
  const [renamingSelection, setRenamingSelection] = useState(null);
  const [renameInput, setRenameInput] = useState("");

  const columns = [
    { field: "ligand", headerName: "Ligand", flex: 1 },
    { field: "receptor", headerName: "Receptor", flex: 1 },
    { field: "source", headerName: "Source", flex: 1 },
    { field: "target", headerName: "Target", flex: 1 },
    { field: "lr_probs", headerName: "L-R Probability", flex: 1 },
    { field: "cellchat_pvals", headerName: "P-value", flex: 1 },
    { field: "interaction_name", headerName: "Interaction", flex: 1 },
    { field: "pathway_name", headerName: "Pathway", flex: 1 },
  ];

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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/data-table");
      const fetchedData = await response.json();
      const dataWithIds = fetchedData.map((row, index) => ({
        id: index,
        ...row,
      }));
      setData(preprocessData(dataWithIds));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredData = async () => {
    if (!selectedSelection) return;
    setLoading(true);
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/filter-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_name: selectedSelection }),
      });
      const filteredData = await response.json();
      const dataWithIds = filteredData.map((row, index) => ({
        id: index,
        ...row,
      }));
      setData(preprocessData(dataWithIds));
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <GridOverlay>
      <div style={{ textAlign: "center", fontSize: "1rem", color: "#666" }}>
        No interactions found
      </div>
    </GridOverlay>
  );

  const exportToCsv = () => {
    const csvRows = [];

    // Headers
    const headers = columns.map((col) => col.headerName);
    csvRows.push(headers.join(","));

    // Rows
    data.forEach((row) => {
      const values = columns.map((col) => JSON.stringify(row[col.field] ?? ""));
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "interaction_data.csv");
    link.click();
  };

  const filteredData = data.filter((row) =>
    Object.values(row).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const handleSaveSelection = () => {
    const selectedRowsData = data.filter((row) =>
      selectedRows.includes(row.id)
    );

    setSavedSelections((prev) => ({
      ...prev,
      [newSelectionName]: selectedRowsData,
    }));

    // Optional: notify parent component if needed
    if (onSelectionSaved) {
      onSelectionSaved(newSelectionName, selectedRowsData);
    }

    setNewSelectionName("");
  };

  const handleLoadSelection = (name) => {
    const rows = savedSelections[name];
    const ids = rows.map((row) => row.id);
    setSelectedRows(ids);
  };

  const handleConfirmRename = (oldName) => {
    if (!renameInput.trim()) return;

    setSavedSelections((prev) => {
      const newSelections = { ...prev };
      newSelections[renameInput.trim()] = newSelections[oldName];
      delete newSelections[oldName];
      return newSelections;
    });

    setRenamingSelection(null);
    setRenameInput("");
  };

  const handleDeleteSelection = (name) => {
    setSavedSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[name];
      return newSelections;
    });
  };

  const handleFilterSelection = (name) => {
    const selectedData = savedSelections[name] || [];
    setData(selectedData.map((row, idx) => ({ ...row, id: idx })));
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        backgroundColor: "#1e1e1e",
        fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {/* Top Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Filter Dropdown */}
          <select
            value={selectedSelection}
            onChange={(e) => setSelectedSelection(e.target.value)}
            style={{
              padding: "0.25rem",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "0.9rem",
              background: "#333",
              color: "#eee",
            }}
          >
            <option value="">All Data</option>
            {Object.keys(selections).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Filter and Reset Buttons */}
          <button
            onClick={fetchFilteredData}
            style={{
              padding: "0.25rem 0.5rem",
              backgroundColor: "#333",
              border: "1px solid #555",
              color: "#eee",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: "0.25rem 0.5rem",
              backgroundColor: "#333",
              border: "1px solid #555",
              color: "#eee",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {/* Search + Page Size + Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              border: "1px solid #555",
              backgroundColor: "#333",
              color: "#eee",
              fontSize: "0.9rem",
            }}
          />

          {/* Page Size Select */}
          <select
            value={paginationModel.pageSize}
            onChange={(e) =>
              setPaginationModel((prev) => ({
                ...prev,
                pageSize: parseInt(e.target.value),
                page: 0,
              }))
            }
            style={{
              padding: "0.25rem",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "0.9rem",
              background: "#333",
              color: "#eee",
            }}
          >
            {[5, 10, 20, 25, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={exportToCsv}
            style={{
              padding: "0.25rem 0.5rem",
              backgroundColor: "#333",
              color: "#eee",
              border: "1px solid #555",
              borderRadius: "4px",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Save Selection Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          paddingLeft: "0.5rem",
        }}
      >
        <input
          type="text"
          value={newSelectionName}
          onChange={(e) => setNewSelectionName(e.target.value)}
          placeholder="Save selection as..."
          style={{
            padding: "0.25rem",
            borderRadius: "4px",
            border: "1px solid #555",
            backgroundColor: "#333",
            color: "#eee",
          }}
        />
        <button
          onClick={handleSaveSelection}
          disabled={!newSelectionName || selectedRows.length === 0}
          style={{
            padding: "0.25rem 0.5rem",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Save Selection
        </button>
      </div>

      {/* Saved Selections */}
      <div style={{ paddingLeft: "0.5rem", color: "#eee" }}>
        <h4>Saved Selections:</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.keys(savedSelections).map((name) => (
            <li key={name} style={{ marginBottom: "0.5rem" }}>
              {renamingSelection === name ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    style={{
                      padding: "0.25rem",
                      borderRadius: "4px",
                      background: "#333",
                      color: "#eee",
                      border: "1px solid #555",
                    }}
                  />
                  <button onClick={() => handleConfirmRename(name)}>
                    Save
                  </button>
                  <button onClick={() => setRenamingSelection(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <button onClick={() => handleLoadSelection(name)}>
                    {name}
                  </button>
                  <button
                    onClick={() => {
                      setRenamingSelection(name);
                      setRenameInput(name);
                    }}
                  >
                    Rename
                  </button>

                  {/* 🆕 New FILTER Button */}
                  <button
                    onClick={() => handleFilterSelection(name)}
                    style={{
                      backgroundColor: "#1976d2",
                      border: "none",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => handleDeleteSelection(name)}
                    style={{
                      backgroundColor: "#333",
                      border: "none",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Data Table */}
      <div style={{ flexGrow: 1, width: "100%" }}>
        <DataGrid
          rows={filteredData.slice(
            paginationModel.page * paginationModel.pageSize,
            (paginationModel.page + 1) * paginationModel.pageSize
          )}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={filteredData.length}
          checkboxSelection // ✅ Allow user to click checkboxes
          onRowSelectionModelChange={(newSelection) =>
            setSelectedRows(newSelection)
          }
          rowSelectionModel={selectedRows}
          pagination
          disableColumnMenu
          sx={{
            backgroundColor: "#1e1e1e",
            color: "#eee",
            border: "none",
            fontSize: "0.85rem",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#2a2a2a",
              borderBottom: "1px solid #555",
            },
            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle": {
              backgroundColor: "#2a2a2a",
              color: "#eee",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#1e1e1e",
              "&:nth-of-type(even)": {
                backgroundColor: "#222",
              },
            },
            "& .MuiDataGrid-cell": {
              color: "#eee",
              borderBottom: "1px solid #333",
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "#1e1e1e",
              color: "#eee",
            },
            "& .MuiTablePagination-root": {
              color: "#eee",
              backgroundColor: "#1e1e1e",
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-actions":
              {
                color: "#eee",
              },
            "& .MuiSelect-icon": {
              color: "#eee",
            },
          }}
        />
      </div>
    </div>
  );
}

export default InteractionDataTable;
