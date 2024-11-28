import React from "react";
import ReactDOM from "react-dom/client";
import VitessceVisualization from "./VitessceVisualisation.jsx";
import InteractionDataTable from "./Table.jsx";
import FrequencyHeatmap from "./Frequency_Heatmap.jsx";
import InteractiveBubblePlot from "./Bubble_Plot.jsx";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <VitessceVisualization />
    <InteractionDataTable />
    <FrequencyHeatmap />
    <InteractiveBubblePlot />
  </React.StrictMode>
);
