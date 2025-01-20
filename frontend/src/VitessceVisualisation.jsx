import React, { useEffect, useState } from "react";
import { Vitessce } from "vitessce";

const VitessceVisualization = () => {
  const [config, setConfig] = useState();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_config");
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
        Viewing Sample: <span style={{ color: "#FFD700" }}>Breast Cancer</span>
      </div>

      <div style={{ flex: 1, display: "flex", backgroundColor: "#242424" }}>
        <Vitessce
          config={config}
          theme="dark"
          height={window.innerHeight - 120}
          width="100%"
        />
      </div>
    </div>
  );
};

export default VitessceVisualization;
