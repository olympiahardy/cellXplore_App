import React, { useEffect, useState } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";

function StackedProportionBarplot() {
  const [data, setData] = useState([]);
  const [stringColumns, setStringColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [pathwayColumn, setPathwayColumn] = useState(null);
  const [plotData, setPlotData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/prop-freq");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);

        // Identify string columns
        if (json.length > 0) {
          const sampleRow = json[0];
          const stringCols = Object.keys(sampleRow).filter(
            (key) => typeof sampleRow[key] === "string"
          );
          setStringColumns(stringCols);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update plot data when a column or pathway column is selected
  useEffect(() => {
    if (selectedColumn && pathwayColumn && data.length > 0) {
      const groupedData = data.reduce((acc, row) => {
        const group = row[selectedColumn];
        const pathway = row[pathwayColumn];
        if (!acc[group]) acc[group] = {};
        if (!acc[group][pathway]) acc[group][pathway] = 0;
        acc[group][pathway]++;
        return acc;
      }, {});

      const groups = Object.keys(groupedData).sort();
      const pathways = Array.from(
        new Set(data.map((row) => row[pathwayColumn]))
      ).sort();

      const proportions = pathways.map((pathway) =>
        groups.map((group) => {
          const count = groupedData[group]?.[pathway] || 0;
          const total = Object.values(groupedData[group] || {}).reduce(
            (sum, val) => sum + val,
            0
          );
          return total > 0 ? count / total : 0;
        })
      );

      const traces = pathways.map((pathway, index) => ({
        x: groups,
        y: proportions[index],
        name: pathway,
        type: "bar",
        marker: { line: { width: 1, color: "white" } },
      }));

      setPlotData(traces);
    }
  }, [selectedColumn, pathwayColumn, data]);

  const columnOptions = stringColumns.map((col) => ({
    value: col,
    label: col,
  }));

  return (
    <div style={{ padding: "1rem", backgroundColor: "#1e1e1e", color: "white" }}>
      <h2 style={{ textAlign: "center" }}>Stacked Proportion Barplot</h2>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {/* Dropdown for selecting interaction pathway column */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="pathway-column-select"
              style={{ marginRight: "10px" }}
            >
              Select the interaction pathway column:
            </label>
            <Select
              id="pathway-column-select"
              options={columnOptions}
              onChange={(selected) =>
                setPathwayColumn(selected?.value || null)
              }
              placeholder="Choose the pathway column..."
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

          {/* Dropdown for selecting column to group by */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="column-select" style={{ marginRight: "10px" }}>
              Select the column to group by:
            </label>
            <Select
              id="column-select"
              options={columnOptions}
              onChange={(selected) =>
                setSelectedColumn(selected?.value || null)
              }
              placeholder="Choose a column to group by..."
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

          {/* Plot */}
          {plotData.length > 0 && (
            <Plot
              data={plotData}
              layout={{
                title: `Proportion of Interaction Pathways by ${selectedColumn}`,
                barmode: "stack",
                paper_bgcolor: "#1e1e1e",
                plot_bgcolor: "#1e1e1e",
                font: { color: "white" },
                xaxis: { title: selectedColumn },
                yaxis: { title: "Proportion", tickformat: ".0%" },
                legend: { orientation: "h", y: -0.2 },
              }}
              useResizeHandler
              style={{ width: "100%", height: "500px" }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default StackedProportionBarplot;