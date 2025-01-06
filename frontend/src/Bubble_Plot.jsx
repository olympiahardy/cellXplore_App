import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Select from "react-select";

const InteractiveBubblePlot = () => {
  const [data, setData] = useState([]);
  const [uniqueSources, setUniqueSources] = useState([]);
  const [uniqueTargets, setUniqueTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
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
        const response = await fetch(
          "http://127.0.0.1:5000/get_cellchat_bubble"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const df = await response.json();

        const sources = [...new Set(df.map((item) => item.source))].sort();
        const targets = [...new Set(df.map((item) => item.target))].sort();

        const formattedSources = sources.map((source) => ({
          value: source,
          label: source,
        }));
        const formattedTargets = targets.map((target) => ({
          value: target,
          label: target,
        }));

        setUniqueSources(formattedSources);
        setUniqueTargets(formattedTargets);
        setData(df);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSourceChange = (selectedOptions) => {
    setSelectedSources(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  const handleTargetChange = (selectedOptions) => {
    setSelectedTargets(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  const handleColorSchemeChange = (selectedOption) => {
    setColorScheme(selectedOption.value);
  };

  const filteredData = data.filter(
    (item) =>
      (selectedSources.length === 0 || selectedSources.includes(item.source)) &&
      (selectedTargets.length === 0 || selectedTargets.includes(item.target))
  );

  const pvals = filteredData.map((item) =>
    item.pval !== undefined ? item.pval : 0.01
  );
  const minPval = Math.min(...pvals);
  const maxPval = Math.max(...pvals);

  const bubbleSizes = pvals.map((pval) => {
    if (maxPval === minPval) {
      return 50;
    }
    return ((maxPval - pval) / (maxPval - minPval)) * 100 + 10;
  });

  const bubbleColors = filteredData.map((item) => item.prob || 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (data.length === 0) {
    return (
      <p>
        No data available. Please complete your cell-cell interaction analysis
        first!
      </p>
    );
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
        Interactive Bubble Plot
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            width: "20%",
            backgroundColor: "#2e2e2e",
            padding: "1rem",
            boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.5)",
            overflowY: "auto",
          }}
        >
          <h4>Customize Bubble Plot</h4>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="source-select" style={{ color: "white" }}>
              Sources:
            </label>
            <Select
              id="source-select"
              isMulti
              options={uniqueSources}
              onChange={handleSourceChange}
              placeholder="Select sources..."
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
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "#555" : "#333", // Darker highlight
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
            <label htmlFor="target-select" style={{ color: "white" }}>
              Targets:
            </label>
            <Select
              id="target-select"
              isMulti
              options={uniqueTargets}
              onChange={handleTargetChange}
              placeholder="Select targets..."
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
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "#555" : "#333", // Darker highlight
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
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "#555" : "#333", // Darker highlight
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

        <div style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
          {selectedSources.length > 0 || selectedTargets.length > 0 ? (
            <Plot
              data={[
                {
                  x: filteredData.map((item) => item.Interacting_Pair),
                  y: filteredData.map((item) => item.interaction_name_2),
                  text: filteredData.map(
                    (item) =>
                      `pval: ${item.pval || 0.01}, prob: ${item.prob || 0}`
                  ),
                  mode: "markers",
                  marker: {
                    size: bubbleSizes,
                    sizemode: "area",
                    color: bubbleColors,
                    colorscale: colorScheme,
                    showscale: true,
                  },
                  type: "scatter",
                },
              ]}
              layout={{
                title: "Interactive Bubble Plot",
                paper_bgcolor: "#1e1e1e",
                plot_bgcolor: "#1e1e1e",
                font: { color: "white" },
                xaxis: {
                  title: "Interacting Pair",
                  tickangle: -45,
                  automargin: true,
                },
                yaxis: {
                  title: "Interaction Name",
                  automargin: true,
                },
                margin: {
                  l: 50,
                  r: 50,
                  t: 50,
                  b: 50,
                },
                responsive: true,
              }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <p>Select sources or targets of interest to begin plotting.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveBubblePlot;
