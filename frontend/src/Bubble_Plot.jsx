import React, { useEffect, useState, useMemo, useRef } from "react";
import * as d3 from "d3";
import Select from "react-select";

const InteractiveBubblePlot = ({ selections }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plotData, setPlotData] = useState(null);
  const [svgWidth, setSvgWidth] = useState(50);
  const [svgHeight, setSvgHeight] = useState(500);
  const [selectedSelection, setSelectedSelection] = useState("");

  // User-selected columns
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedSourceValues, setSelectedSourceValues] = useState([]);
  const [selectedTargetValues, setSelectedTargetValues] = useState([]);
  const [selectedProbability, setSelectedProbability] = useState(null);
  const [selectedPValue, setSelectedPValue] = useState(null);

  // Allowed P-value thresholds
  const pValueOptions = [0, 0.01, 0.05, 1];
  const [selectedPValueIndex, setSelectedPValueIndex] = useState(2);

  // Allowed Top N selections, including "All"
  const topNOptions = [
    { value: "All", label: "All Interactions" },
    { value: 5, label: "Top 5" },
    { value: 10, label: "Top 10" },
    { value: 25, label: "Top 25" },
    { value: 50, label: "Top 50" },
  ];
  const [selectedTopN, setSelectedTopN] = useState(topNOptions[0]); // Default to All

  const [colorScheme, setColorScheme] = useState({
    value: "Viridis",
    label: "Viridis",
    scale: d3.interpolateViridis,
  });

  // Available color schemes
  const colorSchemes = [
    { value: "Viridis", label: "Viridis", scale: d3.interpolateViridis },
    { value: "Cividis", label: "Cividis", scale: d3.interpolateCividis },
    { value: "Blues", label: "Blues", scale: d3.interpolateBlues },
    { value: "Greens", label: "Greens", scale: d3.interpolateGreens },
    { value: "Reds", label: "Reds", scale: d3.interpolateReds },
    { value: "Oranges", label: "Oranges", scale: d3.interpolateOranges },
    { value: "Purples", label: "Purples", scale: d3.interpolatePurples },
  ];

  // Function to fetch filtered data when a selection is chosen
  const fetchFilteredData = async () => {
    if (!selectedSelection) return;

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/filter-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_name: selectedSelection }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const filteredData = await response.json();
      setData(filteredData);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    } finally {
      setLoading(false);
    }
  };

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

        if (df.length > 0) {
          const columnOptions = Object.keys(df[0]).map((col) => ({
            value: col,
            label: col,
          }));
          setColumns(columnOptions);
        }

        setData(df);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique values from the selected source & target columns
  const sourceValues = useMemo(() => {
    if (!selectedSource || !data.length) return [];
    return [...new Set(data.map((item) => item[selectedSource?.value]))]
      .filter(Boolean)
      .map((val) => ({ value: val, label: val }));
  }, [selectedSource, data]);

  const targetValues = useMemo(() => {
    if (!selectedTarget || !data.length) return [];
    return [...new Set(data.map((item) => item[selectedTarget?.value]))]
      .filter(Boolean)
      .map((val) => ({ value: val, label: val }));
  }, [selectedTarget, data]);

  // Convert index to actual P-value
  const selectedPValueThreshold = pValueOptions[selectedPValueIndex];

  // Handle slider change
  const handleSliderChange = (event) => {
    setSelectedPValueIndex(parseInt(event.target.value));
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (
      !selectedSourceValues.length ||
      !selectedTargetValues.length ||
      !selectedProbability ||
      !selectedPValue
    ) {
      return [];
    }

    // Filter by P-value threshold
    const filtered = data.filter(
      (item) =>
        selectedSourceValues.some(
          (s) => s.value === item[selectedSource?.value]
        ) &&
        selectedTargetValues.some(
          (t) => t.value === item[selectedTarget?.value]
        ) &&
        item[selectedPValue?.value] <= selectedPValueThreshold
    );

    // Sort by interaction probability (descending)
    filtered.sort(
      (a, b) => b[selectedProbability?.value] - a[selectedProbability?.value]
    );

    // If "All" is selected, return all filtered interactions
    if (selectedTopN.value === "All") {
      return filtered;
    }

    // Keep only the top N interactions for each interaction pair
    const topNFiltered = [];
    const interactionGroups = {};

    filtered.forEach((item) => {
      const pair = item.Interacting_Pair;
      if (!interactionGroups[pair]) interactionGroups[pair] = [];
      if (interactionGroups[pair].length < selectedTopN.value) {
        interactionGroups[pair].push(item);
        topNFiltered.push(item);
      }
    });

    return topNFiltered;
  }, [
    data,
    selectedSource,
    selectedTarget,
    selectedSourceValues,
    selectedTargetValues,
    selectedProbability,
    selectedPValue,
    selectedPValueThreshold,
    selectedTopN,
  ]);

  useEffect(() => {
    setPlotData(filteredData);
    if (filteredData.length > 0) {
      setSvgHeight(Math.max(500, filteredData.length * 30));
      setSvgWidth(500);
    }
  }, [filteredData]);

  // Render D3 visualization when plotData updates
  useEffect(() => {
    if (!plotData || !plotData.length) return;

    // Set dimensions
    const width = svgWidth;
    const height = svgHeight;
    const margin = { top: 40, right: 40, bottom: 120, left: 150 };

    // Select and clear the SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#1e1e1e")
      .style("color", "white");

    svg.selectAll("*").remove();

    // Create a tooltip group INSIDE the SVG
    const tooltipGroup = svg
      .append("g")
      .style("pointer-events", "none")
      .style("visibility", "hidden");

    // Tooltip background rectangle
    const tooltipRect = tooltipGroup
      .append("rect")
      .attr("fill", "rgba(0,0,0,0.8)")
      .attr("rx", 5)
      .attr("ry", 5);

    // Tooltip text
    const tooltipText = tooltipGroup
      .append("text")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-family", "sans-serif")
      .attr("dy", "1em")
      .attr("x", 10)
      .attr("y", 10);

    const tooltip = d3.select(tooltipRef.current);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(plotData.map((d) => d.Interacting_Pair))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleBand()
      .domain(plotData.map((d) => d.Interaction))
      .range([height - margin.bottom, margin.top])
      .padding(0.1);

    const sizeScale = d3
      .scaleThreshold()
      .domain([0, 0.01, 0.05, 1]) // P-value thresholds
      .range([3, 5, 7, 10]); // Corresponding bubble sizes

    const colorScale = d3
      .scaleSequential(colorScheme.scale)
      .domain(d3.extent(plotData, (d) => d[selectedProbability?.value]));

    // Add X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "white");

    // Add Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("fill", "white");

    // Add bubbles with hover tooltip
    svg
      .selectAll("circle")
      .data(plotData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.Interacting_Pair) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.Interaction) + yScale.bandwidth() / 2)
      .attr("r", (d) => sizeScale(d[selectedPValue?.value]))
      .attr("fill", (d) => colorScale(d[selectedProbability?.value]))
      .attr("stroke", "white")
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltipGroup.style("visibility", "visible");

        tooltipText.html(null); // Clear old text

        tooltipText
          .append("tspan")
          .attr("x", 10)
          .attr("dy", "1em")
          .text(`Interaction: ${d.Interaction}`);

        tooltipText
          .append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .text(`Pair: ${d.Interacting_Pair}`);

        tooltipText
          .append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .text(
            `Probability: ${d[selectedProbability?.value]?.toExponential(2)}`
          );

        tooltipText
          .append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .text(`P-value: ${d[selectedPValue?.value]}`);

        const bbox = tooltipText.node().getBBox();
        const padding = 10;

        tooltipRect
          .attr("width", bbox.width + padding * 2)
          .attr("height", bbox.height + padding * 2)
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding);

        // 🧡 Here's the important part:
        const cx = xScale(d.Interacting_Pair) + xScale.bandwidth() / 2;
        const cy = yScale(d.Interaction) + yScale.bandwidth() / 2;

        tooltipGroup.attr("transform", `translate(${cx + 15}, ${cy - 15})`);
      })
      .on("mousemove", (event, d) => {
        // You can even REMOVE this handler now or just keep it empty
      })
      .on("mouseout", () => {
        tooltipGroup.style("visibility", "hidden");
      });
  }, [plotData, selectedPValue, selectedProbability, colorScheme]);

  // Function to trigger plot rendering
  const handlePlotButtonClick = () => {
    setPlotData(filteredData);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        color: "white",
      }}
    >
      {/* Sidebar */}
      <div
        style={{ width: "25%", padding: "1rem", backgroundColor: "#2e2e2e" }}
      >
        <h4
          style={{ color: "white", textAlign: "center", marginBottom: "15px" }}
        >
          Customize Bubble Plot
        </h4>

        {/* Selection Dropdown & Filter Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
            backgroundColor: "#444",
            marginBottom: "20px", // Added spacing
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

        {/* Dropdown Sections with Spacing */}
        <div style={{ marginBottom: "15px" }}>
          <Select
            value={selectedSource}
            options={columns}
            onChange={setSelectedSource}
            placeholder="Choose Source Column"
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
                backgroundColor: state.isFocused ? "#555" : "#333",
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white", // Ensures selected value text is white
              }),
            }}
          />
        </div>

        {selectedSource && (
          <div style={{ marginBottom: "15px" }}>
            <Select
              isMulti
              value={selectedSourceValues}
              options={sourceValues}
              onChange={setSelectedSourceValues}
              placeholder="Choose Source Values"
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
                  backgroundColor: state.isFocused ? "#555" : "#333",
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

        <div style={{ marginBottom: "15px" }}>
          <Select
            value={selectedTarget}
            options={columns}
            onChange={setSelectedTarget}
            placeholder="Choose Target Column"
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
                backgroundColor: state.isFocused ? "#555" : "#333",
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white", // Ensures selected value text is white
              }),
            }}
          />
        </div>

        {selectedTarget && (
          <div style={{ marginBottom: "15px" }}>
            <Select
              isMulti
              value={selectedTargetValues}
              options={targetValues}
              onChange={setSelectedTargetValues}
              placeholder="Choose Target Values"
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
                  backgroundColor: state.isFocused ? "#555" : "#333",
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

        <div style={{ marginBottom: "15px" }}>
          <Select
            value={selectedProbability}
            options={columns}
            onChange={setSelectedProbability}
            placeholder="Choose Probability Column"
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
                backgroundColor: state.isFocused ? "#555" : "#333",
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white", // Ensures selected value text is white
              }),
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <Select
            value={selectedPValue}
            options={columns}
            onChange={setSelectedPValue}
            placeholder="Choose P-Value Column"
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
                backgroundColor: state.isFocused ? "#555" : "#333",
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white", // Ensures selected value text is white
              }),
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <Select
            value={colorScheme}
            options={colorSchemes}
            onChange={setColorScheme}
            placeholder="Choose Color Scheme"
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
                backgroundColor: state.isFocused ? "#555" : "#333",
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white", // Ensures selected value text is white
              }),
            }}
          />
        </div>

        {/* P-value Threshold Slider */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            P-value Threshold: {selectedPValueThreshold}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={selectedPValueIndex}
            onChange={handleSliderChange}
            list="pvalues"
            style={{ width: "100%" }}
          />
          <datalist id="pvalues">
            {pValueOptions.map((value, index) => (
              <option key={index} value={index} label={`${value}`} />
            ))}
          </datalist>

          <div style={{ marginTop: "15px" }}>
            <Select
              value={selectedTopN}
              options={topNOptions}
              onChange={setSelectedTopN}
              placeholder="Select Top N Interactions"
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
                  backgroundColor: state.isFocused ? "#555" : "#333",
                  color: "white",
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: "white", // Ensures selected value text is white
                }),
              }}
            />
          </div>
        </div>

        {/* Plot Button */}
        <button
          onClick={handlePlotButtonClick}
          disabled={
            !selectedSourceValues.length || !selectedTargetValues.length
          }
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Plot
        </button>
      </div>

      {/* D3 Visualization */}
      <div style={{ flex: 1, padding: "1rem", position: "relative" }}>
        <svg ref={svgRef} width={svgWidth} height={svgHeight}></svg>
      </div>
    </div>
  );
};

export default InteractiveBubblePlot;
