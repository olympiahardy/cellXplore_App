import React from "react";
import VitessceVisualization from "./VitessceVisualization.jsx";
import Table from "./Table.jsx";
import "./App.css"; // Optional CSS for styling

const App = () => {
  return (
    <div className="app-container">
      <h1>CellXplore Dashboard</h1>
      <div className="components-wrapper">
        {/* Rendering the Vitessce Visualization Component */}
        <div className="visualization-container">
          <VitessceVisualization />
        </div>
        
        {/* Rendering the Table Component */}
        <div className="table-container">
          <Table />
        </div>
      </div>
    </div>
  );
};

export default App;