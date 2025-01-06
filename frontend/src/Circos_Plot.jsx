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
          source: row.source, // Ensure this matches the actual column name in your data
          target: row.target, // Ensure this matches the actual column name in your data
          prob: parseFloat(row.prob) || 0.1, // Default to 0.1 if prob is missing or invalid
        }));
        setData(processedData);
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

      // Initialize Circos
      const circos = new Circos({
        container: containerRef.current,
        width: 800,
        height: 800,
      });

      // Prepare layout and chords
      const sources = [...new Set(filteredData.map((item) => item.source))];
      const targets = [...new Set(filteredData.map((item) => item.target))];
      const layout = [
        ...sources.map((source, index) => ({
          id: source,
          label: source,
          color: `hsl(${(index / sources.length) * 360}, 50%, 50%)`,
          len: 100,
        })),
        ...targets.map((target, index) => ({
          id: target,
          label: target,
          color: `hsl(${(index / targets.length) * 360 + 180}, 50%, 50%)`,
          len: 100,
        })),
      ];

      const chords = filteredData.map((item) => ({
        source: { id: item.source, start: 0, end: 100 },
        target: { id: item.target, start: 0, end: 100 },
        value: item.prob,
        color: "purple",
      }));

      // Add layout to Circos
      circos.layout(layout, {
        innerRadius: 200,
        outerRadius: 220,
        labels: { display: true },
        ticks: { display: false },
      });

      // Add chords to Circos
      circos.chords("chords", chords, {
        radius: 190,
        logScale: false,
        tooltipContent: (d) =>
          `${d.source.id} → ${d.target.id} (prob: ${d.value.toFixed(2)})`,
        color: (d) => d.color,
        opacity: 0.8,
        thickness: (d) => d.value * 10, // Scaled thickness
      });

      // Render the Circos plot
      circos.render();
    }
  }, [filteredData]);

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
          width: "800px",
          height: "800px",
        }}
      ></div>
    </div>
  );
};

export default CircosPlot;
