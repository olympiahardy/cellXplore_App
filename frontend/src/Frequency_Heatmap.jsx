import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  interpolateViridis,
  interpolateCividis,
  interpolateBlues,
  interpolateGreens,
  interpolateReds,
  interpolateOranges,
  interpolatePurples,
  interpolateYlGnBu,
  interpolateYlOrRd,
  interpolateRdBu,
} from "d3-scale-chromatic";

const FrequencyHeatmap = ({ selections }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [colorScheme, setColorScheme] = useState("Viridis");
  const [selectedSelection, setSelectedSelection] = useState("");
  const svgRef = useRef(null);
  const getInterpolator = (scheme) => {
    const map = {
      Viridis: interpolateViridis,
      Cividis: interpolateCividis,
      Blues: interpolateBlues,
      Greens: interpolateGreens,
      Reds: interpolateReds,
      Oranges: interpolateOranges,
      Purples: interpolatePurples,
      YlGnBu: interpolateYlGnBu,
      YlOrRd: interpolateYlOrRd,
      RdBu: interpolateRdBu,
    };
    return map[scheme] || interpolateViridis;
  };

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

  const handleExportPDF = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#1e1e1e",
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("frequency_heatmap.pdf");
  };

  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Fetch the full dataset
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/breastcancer/get_cellchat_data");
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
      setSelectedLabels(labels); // Ensure all labels are selected initially
      setData(df);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtered data when a selection is chosen
  const fetchFilteredData = async () => {
    if (!selectedSelection) {
      fetchData(); // Reset to full dataset if "All Data" is selected
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/breastcancer/filter-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_name: selectedSelection }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const filteredData = await response.json();
      setData(filteredData);

      const filteredLabels = [
        ...new Set([
          ...filteredData.map((item) => item.source),
          ...filteredData.map((item) => item.target),
        ]),
      ].sort();
      setUniqueLabels(filteredLabels);
      setSelectedLabels(filteredLabels); // Automatically select all filtered labels
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (selectedOptions) => {
    setSelectedLabels(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
  };

  const handleColorSchemeChange = (selectedOption) => {
    setColorScheme(selectedOption.value);
  };

  // Use selected labels or default to uniqueLabels if none selected
  const labelsToUse = selectedLabels.length > 0 ? selectedLabels : uniqueLabels;

  console.log("🟢 Selected Labels for Filtering:", selectedLabels);
  console.log("🟢 Labels To Use (after checking selection):", labelsToUse);

  // Generate frequency map from the original dataset **(remains unchanged)**
  const frequencyMap = {};
  data.forEach(({ source, target }) => {
    const key = `${source}-${target}`;
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  });

  // Print the complete frequency map for debugging
  console.log(
    "🟢 Original Frequency Map (Before Filtering):",
    JSON.stringify(frequencyMap, null, 2)
  );

  // Check total interactions for CD4+ and CD8+ before filtering
  console.log(
    "🟢 CD4+ ↔ CD8+ Before Filtering:",
    frequencyMap["CD4+ T Cells-CD8+ T Cells"] || 0
  );

  // Compute interaction totals for each label **using the original frequency map**
  const labelScores = labelsToUse.map((label) => ({
    label,
    total: labelsToUse.reduce(
      (sum, otherLabel) => sum + (frequencyMap[`${label}-${otherLabel}`] || 0),
      0
    ),
  }));

  // Print label scores before sorting
  console.log(
    "🟢 Label Scores Before Sorting:",
    JSON.stringify(labelScores, null, 2)
  );

  // Sort labels based on total interaction count **without altering the matrix values**
  const sortedLabels = [...labelScores]
    .sort((a, b) => b.total - a.total)
    .map(({ label }) => label);

  // Print sorted labels for verification
  console.log("🟢 Sorted Labels (Based on Interaction Count):", sortedLabels);

  // **Subset the original matrix based on the sorted order**
  const sortedFrequencyMatrix = sortedLabels.map((source) =>
    sortedLabels.map((target) => frequencyMap[`${source}-${target}`] || 0)
  );

  // Check total interactions for CD4+ and CD8+ after filtering
  console.log(
    "🔴 CD4+ ↔ CD8+ After Filtering:",
    frequencyMap["CD4+ T Cells-CD8+ T Cells"] || 0
  );

  // Print sorted matrix for debugging
  console.log(
    "🟢 Sorted Frequency Matrix:",
    JSON.stringify(sortedFrequencyMatrix, null, 2)
  );

  // Ensure we use the correct labels for visualization
  const finalFrequencyMatrix = sortedFrequencyMatrix;
  const orderedLabels = sortedLabels;

  // Print final outputs before rendering
  console.log("🟢 Final Ordered Labels:", orderedLabels);
  console.log(
    "🟢 Final Frequency Matrix:",
    JSON.stringify(finalFrequencyMatrix, null, 2)
  );

  useEffect(() => {
    if (!svgRef.current || !finalFrequencyMatrix.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 150, right: 80, bottom: 80, left: 180 };
    const cellSize = Math.floor((width - margin.left) / orderedLabels.length);

    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(finalFrequencyMatrix.flat())])
      .interpolator(getInterpolator(colorScheme));

    // Add group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw cells
    finalFrequencyMatrix.forEach((row, i) => {
      row.forEach((value, j) => {
        g.append("rect")
          .attr("x", j * cellSize)
          .attr("y", i * cellSize)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", colorScale(value))
          .append("title")
          .text(`${orderedLabels[i]} → ${orderedLabels[j]}: ${value}`);
      });
    });

    // Add labels
    const labelG = svg.append("g");

    // Y labels
    labelG
      .selectAll(".rowLabel")
      .data(orderedLabels)
      .enter()
      .append("text")
      .attr("x", margin.left - 6)
      .attr("y", (d, i) => margin.top + i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .text((d) => d);

    // X labels
    labelG
      .selectAll(".colLabel")
      .data(orderedLabels)
      .enter()
      .append("text")
      .attr("x", (d, i) => margin.left + i * cellSize + cellSize / 2)
      .attr("y", margin.top - 6)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        (d, i) =>
          `rotate(-45, ${margin.left + i * cellSize + cellSize / 2}, ${
            margin.top - 6
          })`
      )
      .attr("fill", "white")
      .text((d) => d);
  }, [finalFrequencyMatrix, orderedLabels, colorScheme]);

  if (loading) {
    return <div>Loading...</div>;
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
          {/* Selection Dropdown & Filter Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "#444",
            }}
          >
            <label style={{ color: "white", marginRight: "10px" }}>
              Select a Filter:
            </label>
            <select
              value={selectedSelection}
              onChange={(e) => setSelectedSelection(e.target.value)}
              style={{ padding: "5px", marginRight: "10px" }}
            >
              <option value="">All Data</option>
              {Object.keys(selections).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button onClick={fetchFilteredData} style={{ padding: "5px 10px" }}>
              Apply Filter
            </button>
          </div>
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
              value={selectedLabels.map((label) => ({
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
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#555",
                  color: "white",
                }),
              }}
            />
            <button
              onClick={handleExportPDF}
              style={{ marginTop: "10px", padding: "5px 10px", width: "100%" }}
            >
              Save as PDF
            </button>
          </div>
        </div>

        {/* Heatmap */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            padding: "1rem",
            overflow: "auto",
            position: "relative",
          }}
        >
          <svg
            ref={svgRef}
            style={{ width: "100%", height: "100%" }}
            preserveAspectRatio="xMinYMin meet"
          ></svg>
        </div>
      </div>
    </div>
  );
};

export default FrequencyHeatmap;
