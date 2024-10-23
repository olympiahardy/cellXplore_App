import React, { useEffect, useState } from "react";
import "./App.css";
import { Vitessce } from "vitessce";

// import { vcConfig } from "./my-view-config";
const VitessceVisualization = () => {
  const [config, setConfig] = useState();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const response = await fetch("http://127.0.0.1:5000/get_anndata");
    console.log("got response", response);
    const data = await response.json();
    console.log("data", data);
    console.log("data.config", data.config);
    setConfig(data);
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div style={{ height: "500px" }}>
      <Vitessce config={config} height={500} theme="dark" />
    </div>
  );
};

export default VitessceVisualization;
