import React, { useState, useEffect, useCallback } from "react";
import { Vitessce } from "@vitessce/dev";

const DualScatterLR = ({ onSelectionChange }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/braintbrucei/get_dual_config");
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

export default DualScatterLR;
