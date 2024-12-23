import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Select from "react-select";

const FrequencyHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [colorScheme, setColorScheme] = useState("Viridis");

  const colorSchemes = [
    { value: "Viridis", label: "Viridis" },
    { value: "Cividis", label: "Cividis" },
    { value: "Blues", label: "Blues" },
    { value: "Greens", label: "Greens" },
    { value: "Reds", label: "Reds" },
    { value: "Oranges", label: "Oranges" },
    { value: "Purples", label: "Purples" },
    { value: "YlGnBu", label: "Yellow-Green-Blue" },
    { value: "YlOrRd", label: "Yellow-Orange-Red" },
    { value: "RdBu", label: "Red-Blue" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_cellchat_data");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const df = await response.json();

        const labels = [
          ...new Set([
            ...df.map((item) => item.source),
            ...df.map((item) => item.target),
          ]),
        ].sort();

        setUniqueLabels(labels);
        setData(df);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLabelChange = (selectedOptions) => {
    setSelectedLabels(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  const handleColorSchemeChange = (selectedOption) => {
    setColorScheme(selectedOption.value);
  };

  const labelsToUse = selectedLabels.length > 0 ? selectedLabels : uniqueLabels;

  const frequencyMap = {};
  data.forEach((item) => {
    const { source, target } = item;
    const key = `${source}-${target}`;
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  });

  const frequencyMatrix = labelsToUse.map((source) =>
    labelsToUse.map((target) => frequencyMap[`${source}-${target}`] || 0)
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh", // Full window height
        width: "100vw", // Full window width
        backgroundColor: "#1e1e1e",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#333",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Interaction Frequency Heatmap
      </div>

      {/* Content Section */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar for customization */}
        <div
          style={{
            width: "20%",
            backgroundColor: "#2e2e2e",
            padding: "1rem",
            boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.5)",
            overflowY: "auto",
          }}
        >
          <h4>Customise Heatmap</h4>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="label-select" style={{ color: "white" }}>
              Cell Types:
            </label>
            <Select
              id="label-select"
              isMulti
              options={uniqueLabels.map((label) => ({
                value: label,
                label: label,
              }))}
              onChange={handleLabelChange}
              placeholder="Select cell types..."
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
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="color-select" style={{ color: "white" }}>
              Colour Scheme:
            </label>
            <Select
              id="color-select"
              options={colorSchemes}
              onChange={handleColorSchemeChange}
              placeholder="Select colour scheme..."
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
        </div>

        {/* Heatmap */}
        <div style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
          <Plot
            data={[
              {
                z: frequencyMatrix,
                x: labelsToUse,
                y: labelsToUse,
                type: "heatmap",
                colorscale: colorScheme,
              },
            ]}
            layout={{
              title: "Interaction Frequency Heatmap",
              xaxis: {
                title: "Target",
                tickangle: -45,
                automargin: true,
              },
              yaxis: {
                title: "Source",
                automargin: true,
              },
              margin: {
                l: 50,
                r: 50,
                t: 50,
                b: 50,
              },
              font: { color: "white" },
              paper_bgcolor: "#1e1e1e",
              plot_bgcolor: "#1e1e1e",
              responsive: true,
            }}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default FrequencyHeatmap;