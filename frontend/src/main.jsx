import React from "react";
import ReactDOM from "react-dom/client";
import VitessceVisualization from "./VitessceVisualisation.jsx";
import InteractionDataTable from "./Table.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VitessceVisualization />
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InteractionDataTable />
  </React.StrictMode>
);