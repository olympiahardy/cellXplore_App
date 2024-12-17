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
    // Fetch data from the Flask backend at /get_cellchat_bubble endpoint
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/get_cellchat_bubble"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const df = await response.json();

        // Extract unique values for dropdowns
        const sources = [...new Set(df.map((item) => item.source))].sort();
        const targets = [...new Set(df.map((item) => item.target))].sort();

        // Convert unique sources and targets to the format used by react-select
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

        // Store the entire dataset for later filtering
        setData(df);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false); // Ensure loading state is false even if there's an error
      }
    };

    fetchData();
  }, []);

  // Function to handle source selection change
  const handleSourceChange = (selectedOptions) => {
    setSelectedSources(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  // Function to handle target selection change
  const handleTargetChange = (selectedOptions) => {
    setSelectedTargets(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  // Function to handle color scheme change
  const handleColorSchemeChange = (selectedOption) => {
    setColorScheme(selectedOption.value);
  };

  // Filter data for the selected sources and targets
  const filteredData = data.filter(
    (item) =>
      (selectedSources.length === 0 || selectedSources.includes(item.source)) &&
      (selectedTargets.length === 0 || selectedTargets.includes(item.target))
  );

  // Extract pval values for dynamic scaling
  const pvals = filteredData.map((item) =>
    item.pval !== undefined ? item.pval : 0.01
  );
  const minPval = Math.min(...pvals);
  const maxPval = Math.max(...pvals);

  // Scale bubble sizes relative to pval (inverse scaling)
  const bubbleSizes = pvals.map((pval) => {
    // If maxPval and minPval are the same, avoid division by zero
    if (maxPval === minPval) {
      return 50; // Default size if all values are the same
    }
    // Use inverse scaling: larger bubbles for smaller p-values
    return ((maxPval - pval) / (maxPval - minPval)) * 100 + 10; // Adding 10 to ensure minimum bubble size
  });

  const bubbleColors = filteredData.map((item) => item.prob || 0); // Use prob for bubble color or default to 0

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        bottom: "10px",
        right: "10px",
        width: "45%", // Adjust as needed
        height: "50%", // Adjust as needed
        boxShadow: "0px 0px 10px rgba(255, 255, 255, 0.2)", // Light shadow for contrast
        backgroundColor: "#1e1e1e", // Dark gray background color for dark theme
        padding: "10px",
        color: "white", // Set text color to white for readability
        borderRadius: "8px", // Add rounded corners for a polished look
      }}
    >
      <div style={{ width: "20%", paddingRight: "10px" }}>
        <h4 style={{ color: "white" }}>Customise Bubble Plot</h4>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="source-select" style={{ color: "white" }}>
            Sources:{" "}
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
          <label htmlFor="target-select" style={{ color: "white" }}>
            Targets:{" "}
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
        {/* Show message if there are no interactions found for the selected combination */}
        {selectedSources.length > 0 &&
          selectedTargets.length > 0 &&
          filteredData.length === 0 && (
            <div style={{ marginTop: "20px", color: "red" }}>
              No interactions found for the selected source and target
              combination.
            </div>
          )}

        {/* Plot only if there are selected sources and targets and data is available */}
        {selectedSources.length > 0 &&
          selectedTargets.length > 0 &&
          filteredData.length > 0 && (
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
                    colorscale: colorScheme, // Apply selected color scheme
                    showscale: true, // Show color scale legend
                  },
                  type: "scatter",
                },
              ]}
              layout={{
                title:
                  "Interactive Bubble Plot for Selected Sources and Targets",
                paper_bgcolor: "black", // Set background color to black
                plot_bgcolor: "black", // Set the plot area background color to black
                font: {
                  color: "white", // Set font color to white for all texts
                },
                xaxis: {
                  title: "Interacting Pair",
                  tickangle: -45, // Rotate x-axis labels by 45 degrees
                  automargin: true, // Enable automargin for better label visibility
                  categoryorder: "total descending", // Ensure consistent ordering
                  categorygap: 0.01, // Reduce spacing between x-axis categories
                  tickfont: { color: "white" }, // Set x-axis labels color to white
                  titlefont: { color: "white" }, // Set x-axis title color to white
                },
                yaxis: {
                  title: "Interaction Name",
                  automargin: true, // Enable automargin for y-axis
                  titlefont: { size: 14, color: "white" }, // Set a reasonable font size and color for the y-axis title
                  tickfont: { size: 10, color: "white" }, // Set y-axis labels color to white
                },
                margin: {
                  l: 70, // Adjust left margin to fit the content well
                  r: 20,
                  t: 50,
                  b: 70,
                },
                height: "100%",
                width: "100%", // Set the layout width and height to 100% of the parent div
              }}
              useResizeHandler={true} // Use resize handler to ensure the plot fits dynamically
              style={{ width: "100%", height: "100%" }} // Set style to make sure the plot fills the div
            />
          )}
      </div>
    </div>
  );
};

export default InteractiveBubblePlot;
