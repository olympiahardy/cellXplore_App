import React, { useEffect, useRef, useState } from "react";
import Circos from "circos";
import Select from "react-select";

const CircosPlot = () => {
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorMapping, setColorMapping] = useState({});

  // Function to generate the color palette
  const scPalette = (n) => {
    const colorSpace = [
      "#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#F29403", "#F781BF",
      "#BC9DCC", "#A65628", "#54B0E4", "#222F75", "#1B9E77", "#B2DF8A",
      "#E3BE00", "#FB9A99", "#E7298A", "#910241", "#00CDD1", "#A6CEE3",
      "#CE1261", "#5E4FA2", "#8CA77B", "#00441B", "#DEDC00", "#DCF0B9",
      "#8DD3C7", "#999999",
    ];
    return colorSpace.slice(0, n);
  };

  // Fetch data from /circos endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/circos");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();

        // Validate and process the data
        const processedData = json.map((row) => ({
          source: row.source,
          target: row.target,
          prob: parseFloat(row.prob) || 0.1,
        }));
        setData(processedData);

        // Create color mapping for unique cell types
        const uniqueCellTypes = Array.from(
          new Set(processedData.flatMap((item) => [item.source, item.target]))
        );
        const palette = scPalette(uniqueCellTypes.length);
        const colorMap = uniqueCellTypes.reduce((acc, cellType, index) => {
          acc[cellType] = palette[index];
          return acc;
        }, {});
        setColorMapping(colorMap);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching Circos data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update filtered data based on selected sources and targets
  useEffect(() => {
    if (data.length > 0) {
      const filtered = data.filter(
        (item) =>
          (selectedSources.length === 0 || selectedSources.includes(item.source)) &&
          (selectedTargets.length === 0 || selectedTargets.includes(item.target))
      );
      setFilteredData(filtered);
    }
  }, [data, selectedSources, selectedTargets]);

  // Render Circos plot when filtered data changes
  useEffect(() => {
    if (filteredData.length > 0 && containerRef.current) {
      // Clear existing container
      containerRef.current.innerHTML = "";

      // Determine dimensions dynamically
      const width = Math.min(window.innerWidth * 0.8, 800);
      const height = width;

      // Initialize Circos
      const circos = new Circos({
        container: containerRef.current,
        width,
        height,
      });

      // Prepare layout and chords
      const nodes = Array.from(
        new Set(filteredData.flatMap((item) => [item.source, item.target]))
      ).map((id) => ({
        id,
        label: id,
        color: colorMapping[id], // Use color mapping
        len: 100,
      }));

      const maxProb = Math.max(...filteredData.map((item) => item.prob));
      const chords = filteredData.map((item) => ({
        source: { id: item.source, start: 0, end: 100 },
        target: { id: item.target, start: 0, end: 100 },
        value: item.prob,
        color: colorMapping[item.source], // Use source color for chord
      }));

      // Add layout to Circos
      circos.layout(nodes, {
        innerRadius: width / 4,
        outerRadius: width / 3.2, // Expand the outer track to cover the full circle
        labels: { display: true },
        ticks: { display: false },
        tracks: [
          {
            color: (d) => colorMapping[d.id], // Fill the track with node colors
            strokeWidth: 1,
          },
        ],
      });

      // Add chords to Circos
      circos.chords("chords", chords, {
        radius: width / 3.8,
        logScale: false,
        tooltipContent: (d) =>
          `<b>${d.source.id}</b> → <b>${d.target.id}</b><br>Probability: <b>${d.value.toFixed(2)}</b>`,
        color: (d) => d.color,
        opacity: 0.05, // Increased transparency for chords
        thickness: (d) => (d.value / maxProb) * 10, // Scaled thickness
      });

      // Render the Circos plot
      circos.render();
    }
  }, [filteredData, colorMapping]);

  // Options for the source and target dropdowns
  const sourceOptions = Array.from(
    new Set(data.map((item) => item.source))
  ).map((source) => ({ value: source, label: source }));
  const targetOptions = Array.from(
    new Set(data.map((item) => item.target))
  ).map((target) => ({ value: target, label: target }));

  if (loading) {
    return <p>Loading Circos plot data...</p>;
  }

  if (filteredData.length === 0) {
    return <p>No data to display. Adjust source and target filters.</p>;
  }

  return (
    <div style={{ margin: "1rem", color: "white" }}>
      <h2 style={{ textAlign: "center" }}>Interactive Circos Plot</h2>

      {/* Dropdowns for selecting sources and targets */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <div>
          <label>Select Sources:</label>
          <Select
            isMulti
            options={sourceOptions}
            onChange={(selected) =>
              setSelectedSources(selected.map((option) => option.value))
            }
            placeholder="Filter sources..."
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
        <div>
          <label>Select Targets:</label>
          <Select
            isMulti
            options={targetOptions}
            onChange={(selected) =>
              setSelectedTargets(selected.map((option) => option.value))
            }
            placeholder="Filter targets..."
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
      </div>

      {/* Circos Plot */}
      <div
        ref={containerRef}
        style={{
          margin: "2rem auto",
          width: "80%",
          maxWidth: "800px",
          height: "auto",
        }}
      ></div>
    </div>
  );
};

export default CircosPlot;
