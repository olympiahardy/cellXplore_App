import React, { useRef, useEffect, useState } from "react";
import { Vitessce } from "vitessce";

const VitessceVisualization = () => {
  const [config, setConfig] = useState();
  const [width] = useState(400); // Set initial desired width
  const [height] = useState(400); // Set initial desired height

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_anndata");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        position: "absolute",
        right: "0",
        top: "0",
        margin: "10px",
        zIndex: 1000,
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {/* Header section */}
      <div
        style={{
          backgroundColor: "#eee",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        Header
      </div>

      {/* Vitessce component */}
      <Vitessce config={config} width={width} height={height} theme="dark" />
    </div>
  );
};

export default VitessceVisualization;
