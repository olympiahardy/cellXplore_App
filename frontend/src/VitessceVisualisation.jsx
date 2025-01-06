import React, { useEffect, useState } from "react";
import { Vitessce } from "vitessce";

const VitessceVisualization = () => {
  const [config, setConfig] = useState();
  const [samples, setSamples] = useState([]); // List of available samples
  const [selectedSample, setSelectedSample] = useState(); // Selected sample

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    if (selectedSample) {
      fetchConfig(selectedSample);
    }
  }, [selectedSample]);

  // Fetch the list of available samples
  const fetchSamples = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_samples");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setSamples(data);
      setSelectedSample(data[0]); // Set the first sample as default
    } catch (error) {
      console.error("Error fetching samples:", error);
    }
  };

  // Fetch the config for the selected sample
  const fetchConfig = async (sample) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/get_config?sample=${sample}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
        color: "white",
        overflow: "hidden", // Prevent unwanted scrolling
      }}
    >
      {/* Dropdown Menu for Sample Selection */}
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#333",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        <label htmlFor="sample-select" style={{ marginRight: "10px" }}>
          Select Sample:
        </label>
        <select
          id="sample-select"
          value={selectedSample}
          onChange={(e) => setSelectedSample(e.target.value)}
          style={{
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "4px",
            padding: "5px",
          }}
        >
          {samples.map((sample) => (
            <option key={sample} value={sample}>
              {sample}
            </option>
          ))}
        </select>
      </div>

      {/* Vitessce Viewer */}
      <div
        style={{
          flex: 1,
          display: "flex",
          backgroundColor: "#242424",
        }}
      >
        <Vitessce
          config={config}
          theme="dark"
          height={window.innerHeight - 120} // Calculate height dynamically
          width="100%"
        />
      </div>
    </div>
  );
};

export default VitessceVisualization;
