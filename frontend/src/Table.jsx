import React, { useEffect, useState } from "react";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import Select from "react-select";

function InteractionDataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [uniqueValues, setUniqueValues] = useState([]);

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

        const fetchedData = await response.json();
        if (Array.isArray(fetchedData)) {
          setData(fetchedData);
          setFilteredData(fetchedData); // Set the initial filtered data
        } else {
          console.error("Data is not an array:", fetchedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // All columns for the table
  const columns = React.useMemo(() => {
    return data.length > 0
      ? Object.keys(data[0]).map((key) => ({ Header: key, accessor: key }))
      : [];
  }, [data]);

  // Only string columns for filtering
  const stringColumns = React.useMemo(() => {
    if (data.length === 0) return [];
    const sampleRow = data[0];
    return Object.keys(sampleRow).filter((key) =>
      typeof sampleRow[key] === "string"
    );
  }, [data]);

  const handleColumnChange = (selectedOption) => {
    setSelectedColumn(selectedOption);
    if (selectedOption) {
      const values = Array.from(
        new Set(data.map((row) => row[selectedOption.value]))
      ).sort();
      setUniqueValues(values.map((value) => ({ value, label: value })));
    } else {
      setUniqueValues([]);
    }
  };

  const handleValueChange = (selectedValues) => {
    const updatedFilters = { ...columnFilters };
    if (selectedColumn) {
      if (selectedValues.length > 0) {
        updatedFilters[selectedColumn.value] = selectedValues.map(
          (option) => option.value
        );
      } else {
        delete updatedFilters[selectedColumn.value];
      }
    }
    setColumnFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const applyFilters = (filters) => {
    if (Object.keys(filters).length === 0) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) =>
        Object.entries(filters).every(([column, values]) =>
          values.includes(row[column])
        )
      );
      setFilteredData(filtered);
    }
  };

  const resetFilters = () => {
    setColumnFilters({});
    setSelectedColumn(null);
    setUniqueValues([]);
    setFilteredData(data);
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter,
    state,
  } = useTable(
    { columns, data: filteredData },
    useGlobalFilter,
    useSortBy
  );

  const isFiltering =
    Object.keys(columnFilters).length > 0 || (state.globalFilter || "") !== "";

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (data.length === 0) {
    return (
      <p>
        No data available. Please complete your cell-cell interaction analysis
        first!
      </p>
    );
  }

  const columnOptions = stringColumns.map((key) => ({
    value: key,
    label: key,
  }));
  
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
        {/* Reset Button */}
        <button
          onClick={resetFilters}
          disabled={!isFiltering}
          style={{
            padding: "10px 15px",
            marginBottom: "10px",
            backgroundColor: isFiltering ? "#555" : "#333",
            color: isFiltering ? "white" : "#888",
            border: "none",
            borderRadius: "4px",
            cursor: isFiltering ? "pointer" : "not-allowed",
          }}
        >
          Show Full Table
        </button>

        {/* Column Selection */}
        <div style={{ marginBottom: "10px" }}>
          <label style={{ color: "white", marginRight: "10px" }}>
            Select Column:
          </label>
          <Select
            options={columnOptions}
            onChange={handleColumnChange}
            placeholder="Choose a column..."
            styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: "#333",
                color: "white",
                borderColor: "#555",
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: "#333",
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white",
              }),
            }}
          />
        </div>

        {/* Value Selection */}
        {uniqueValues.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "white", marginRight: "10px" }}>
              Select Values:
            </label>
            <Select
              isMulti
              options={uniqueValues}
              onChange={(selected) => handleValueChange(selected || [])}
              placeholder="Choose values..."
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "#333",
                  color: "white",
                  borderColor: "#555",
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: "#333",
                  color: "white",
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#555",
                  color: "white",
                }),
              }}
            />
          </div>
        )}

        {/* Search bar for global filtering */}
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

        {/* Table */}
        <div style={{ maxHeight: "calc(100% - 180px)", overflow: "auto" }}>
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
