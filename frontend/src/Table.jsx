import React, { useEffect, useState } from "react";
import Select from "react-select";
import { DataGrid, GridToolbar, GridOverlay } from "@mui/x-data-grid";

function InteractionDataTable({ selections, onSavedSelectionsChange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSelection, setSelectedSelection] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [savedSelections, setSavedSelections] = useState({});
  const [newSelectionName, setNewSelectionName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [renamingSelection, setRenamingSelection] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [multiFilters, setMultiFilters] = useState({});

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
      const response = await fetch("http://127.0.0.1:5000/data-table");
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
      const response = await fetch("http://127.0.0.1:5000/filter-table", {
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

  const stringColumns = columns.filter(
    (col) => data.length > 0 && typeof data[0][col.field] === "string"
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

  const filteredData = data.filter((row) => {
    const matchesSearch = Object.values(row).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
    );

    const matchesFilters = Object.entries(multiFilters).every(
      ([field, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        return selectedValues.includes(row[field]);
      }
    );

    return matchesSearch && matchesFilters;
  });

  const getUniqueColumnValues = (field) => {
    const values = new Set();
    data.forEach((row) => {
      const value = row[field];
      if (value !== undefined && value !== null) values.add(value);
    });
    return Array.from(values).sort();
  };

  const handleSaveSelection = () => {
    const selectedRowsData = data.filter((row) =>
      selectedRows.includes(row.id)
    );

    setSavedSelections((prev) => {
      const updated = { ...prev, [newSelectionName]: selectedRowsData };
      if (onSavedSelectionsChange) onSavedSelectionsChange(updated);
      return updated;
    });

    setNewSelectionName("");
  };

  const handleLoadSelection = (name) => {
    const rows = savedSelections[name];
    const ids = rows.map((row) => row.id);
    setSelectedRows(ids);
  };

  const handleConfirmRename = (oldName) => {
    if (!renameInput.trim()) return;

    setRenamingSelection(null);
    setRenameInput("");
  };

  const handleFilterSelection = (name) => {
    const selectedData = savedSelections[name] || [];
    setData(selectedData.map((row, idx) => ({ ...row, id: idx })));
  };

  const [showFilters, setShowFilters] = useState(true);

  const handleDeleteSelection = (name) => {
    setSavedSelections((prev) => {
      const updated = { ...prev };
      delete updated[name];
      if (onSavedSelectionsChange) onSavedSelectionsChange(updated);
      return updated;
    });
  };

  // Styles
  const inputStyle = {
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "#eee",
    fontSize: "0.9rem",
  };

  const buttonStyle = {
    padding: "0.25rem 0.5rem",
    backgroundColor: "#333",
    color: "#eee",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  };

  const dropdownStyle = {
    padding: "0.25rem",
    border: "1px solid #555",
    borderRadius: "4px",
    fontSize: "0.9rem",
    background: "#333",
    color: "#eee",
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#333",
      borderColor: "#555",
      color: "#eee",
    }),
    multiValue: (base) => ({ ...base, backgroundColor: "#555" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#555" : "#333",
      color: "#eee",
    }),
    singleValue: (base) => ({ ...base, color: "#eee" }),
    input: (base) => ({ ...base, color: "#eee" }),
    menu: (base) => ({ ...base, backgroundColor: "#333" }),
  };

  const dataGridStyles = {
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
      "&:nth-of-type(even)": { backgroundColor: "#222" },
    },
    "& .MuiDataGrid-cell": { color: "#eee", borderBottom: "1px solid #333" },
    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "#1e1e1e",
      color: "#eee",
    },
    "& .MuiTablePagination-root": { color: "#eee", backgroundColor: "#1e1e1e" },
    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-actions":
      { color: "#eee" },
    "& .MuiSelect-icon": { color: "#eee" },
  };

  return (
    <div
      className="interaction-data-table"
      style={{ backgroundColor: "#1e1e1e", height: "100%", width: "100%" }}
    >
      {/* Top Bar: Selection, Search, Export */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0.5rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{ color: "#ccc", fontSize: "0.9rem", marginRight: "0.5rem" }}
          >
            Single Cell View tab selections:
          </span>
          <select
            value={selectedSelection}
            onChange={(e) => setSelectedSelection(e.target.value)}
            style={dropdownStyle}
          >
            <option value="">All Data</option>
            {Object.keys(selections).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button style={buttonStyle} onClick={fetchFilteredData}>
            Apply
          </button>
          <button style={buttonStyle} onClick={fetchData}>
            Reset
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search in table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={inputStyle}
          />
          <button style={buttonStyle} onClick={exportToCsv}>
            Export CSV
          </button>
          <button style={buttonStyle} onClick={() => setMultiFilters({})}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Toggleable Filter Panel */}
      <div style={{ padding: "0 0.5rem", textAlign: "center" }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{ ...buttonStyle, marginBottom: "0.5rem" }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters && (
          <div>
            <h3
              style={{
                color: "#ccc",
                fontSize: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              Manual Table Filters
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              {stringColumns.map((col) => {
                const options = Array.from(
                  new Set(data.map((row) => row[col.field]))
                )
                  .filter(Boolean)
                  .sort()
                  .map((val) => ({ label: val, value: val }));
                return (
                  <div key={col.field} style={{ minWidth: "200px" }}>
                    <label style={{ color: "#ccc", fontSize: "0.8rem" }}>
                      {col.headerName}
                    </label>
                    <Select
                      isMulti
                      options={options}
                      value={(multiFilters[col.field] || []).map((val) => ({
                        label: val,
                        value: val,
                      }))}
                      onChange={(selected) =>
                        setMultiFilters((prev) => ({
                          ...prev,
                          [col.field]: selected.map((s) => s.value),
                        }))
                      }
                      styles={selectStyles}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Save Selection */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.5rem",
          gap: "0.5rem",
        }}
      >
        <input
          type="text"
          value={newSelectionName}
          onChange={(e) => setNewSelectionName(e.target.value)}
          placeholder="Save row selection as..."
          style={inputStyle}
        />
        <button
          onClick={handleSaveSelection}
          disabled={!newSelectionName || selectedRows.length === 0}
          style={buttonStyle}
        >
          Save Row Selection
        </button>
      </div>

      {/* Saved Selections */}
      <div style={{ padding: "0.5rem", color: "#eee" }}>
        <h4>Saved Table Selections:</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.keys(savedSelections).map((name) => (
            <li key={name} style={{ marginBottom: "0.5rem" }}>
              {renamingSelection === name ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    style={inputStyle}
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
                  <button
                    onClick={() => handleFilterSelection(name)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: "#1976d2",
                      fontSize: "0.8rem",
                    }}
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => handleDeleteSelection(name)}
                    style={buttonStyle}
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
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          loading={loading}
          checkboxSelection
          onRowSelectionModelChange={(newSelection) =>
            setSelectedRows(newSelection)
          }
          rowSelectionModel={selectedRows}
          pagination
          pageSizeOptions={[5, 10, 20, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          disableColumnMenu
          sx={dataGridStyles}
        />
      </div>
    </div>
  );
}

export default InteractionDataTable;
