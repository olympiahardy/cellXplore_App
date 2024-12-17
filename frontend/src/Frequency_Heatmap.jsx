import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Select from "react-select";

const FrequencyHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [colorScheme, setColorScheme] = useState("Viridis"); // Default color scheme

  // Available color schemes
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
    // Fetch data from the Flask backend
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_cellchat_data");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const df = await response.json();

        // Extract unique sources and targets
        const labels = [
          ...new Set([
            ...df.map((item) => item.source),
            ...df.map((item) => item.target),
          ]),
        ].sort();

        setUniqueLabels(labels);

        // Store data for future filtering
        setData(df);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false); // Ensure loading state is false even if there's an error
      }
    };

    fetchData();
  }, []);

  // Function to handle label selection change
  const handleLabelChange = (selectedOptions) => {
    setSelectedLabels(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  // Function to handle color scheme change
  const handleColorSchemeChange = (selectedOption) => {
    setColorScheme(selectedOption.value);
  };

  // Determine labels to use for plotting based on selection
  const labelsToUse = selectedLabels.length > 0 ? selectedLabels : uniqueLabels;

  // Generate frequency matrix based on selected labels
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
        position: "fixed",
        top: "10px",
        right: "10px",
        width: "45%", // Adjust as needed
        height: "40%", // Adjust as needed
        boxShadow: "0px 0px 10px rgba(255, 255, 255, 0.2)", // Light shadow for contrast on dark background
        backgroundColor: "#1e1e1e", // Dark gray background color for dark theme
        padding: "10px",
        color: "white", // Set text color to white for readability
        borderRadius: "8px", // Add rounded corners for a polished look
      }}
    >
      <div style={{ width: "20%", paddingRight: "10px" }}>
        <h4 style={{ color: "white" }}>Customise Heatmap</h4>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="label-select" style={{ color: "white" }}>
            Cell Types:{" "}
          </label>
          <Select
            id="label-select"
            isMulti
            options={uniqueLabels.map((label) => ({
              value: label,
              label: label,
            }))}
            onChange={handleLabelChange}
            placeholder="Select cell types or leave empty for all..."
            styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: "#333", // Darken the dropdown control
                color: "white", // Set text color to white
                borderColor: "#555", // Darker border color
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: "#333", // Darken the dropdown menu
                color: "white",
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: "#555", // Darker background for selected items
                color: "white",
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: "white", // Set text color for selected items
              }),
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="color-select" style={{ color: "white" }}>
            Colour Scheme:{" "}
          </label>
          <Select
            id="color-select"
            options={colorSchemes}
            onChange={handleColorSchemeChange}
            placeholder="Select colour scheme..."
            styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: "#333", // Darken the dropdown control
                color: "white", // Set text color to white
                borderColor: "#555", // Darker border color
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: "#333", // Darken the dropdown menu
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white", // Set text color to white
              }),
            }}
          />
        </div>
      </div>

      <div style={{ width: "80%" }}>
        <Plot
          data={[
            {
              z: frequencyMatrix,
              x: labelsToUse,
              y: labelsToUse,
              type: "heatmap",
              colorscale: colorScheme, // Apply selected color scheme
            },
          ]}
          layout={{
            title: {
              text: "Interaction Frequency Heatmap",
              x: 0.5,
              xanchor: "center",
              y: 0.95,
              yanchor: "top",
              pad: { b: 5 },
              font: { size: 16, color: "white" }, // Set title text color to white
            },
            xaxis: {
              title: "Target",
              tickangle: -45, // Rotates x-axis labels for better visibility
              automargin: true,
              titlefont: { size: 14, color: "white" }, // Set x-axis title color to white
              tickfont: { color: "white" }, // Set x-axis tick labels to white
            },
            yaxis: {
              title: "Source",
              automargin: true,
              titlefont: { size: 14, color: "white" }, // Set y-axis title color to white
              tickfont: { color: "white" }, // Set y-axis tick labels to white
            },
            paper_bgcolor: "black", // Set the entire background to black
            plot_bgcolor: "black", // Set the plot area background to black
            margin: {
              l: 70, // Minimized left margin for y-axis labels
              r: 20, // Minimized right margin
              t: 50, // Minimized top margin for title
              b: 70, // Minimized bottom margin for x-axis labels
            },
            font: {
              color: "white", // Set font color to white for all texts
            },
            height: "100%",
            width: "100%",
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};

export default FrequencyHeatmap;
