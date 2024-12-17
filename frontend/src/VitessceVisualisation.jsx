import React, { useEffect, useState } from "react";
import { Vitessce } from "vitessce";

const VitessceVisualization = () => {
  const [config, setConfig] = useState();
  const [width] = useState(500); // Set initial desired width
  const [height] = useState(700); // Set initial desired height

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
        border: "1px solid #333", // Darker border for dark theme
        padding: "10px",
        position: "fixed",
        left: "0",
        top: "0",
        margin: "10px",
        zIndex: 1000,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#1e1e1e", // Dark gray background to match the dark theme
        color: "white", // White text for better contrast
        boxShadow: "0px 0px 10px rgba(255, 255, 255, 0.2)", // Light shadow for better visibility
        borderRadius: "8px", // Add rounded corners for a polished look
      }}
    >
      {/* Header section */}
      <div
        style={{
          backgroundColor: "#333", // Darker header background for contrast
          padding: "8px",
          marginBottom: "10px",
          textAlign: "center",
          fontWeight: "bold",
          color: "white", // White text color for the header
        }}
      >
        UMAP View
      </div>

      {/* Vitessce component container with padding */}
      <div
        style={{
          padding: "10px", // Add padding around the Vitessce component
          backgroundColor: "#1e1e1e", // Same background color for consistency
          borderRadius: "8px", // Rounded corners for a polished look
        }}
      >
        {/* Vitessce component */}
        <Vitessce config={config} width={width - 20} height={height - 60} theme="dark" />
      </div>
    </div>
  );
};

export default VitessceVisualization;
