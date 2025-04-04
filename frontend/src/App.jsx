import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import VitessceVisualization from "./VitessceVisualisation.jsx";
import DualScatterLR from "./Ligand_Receptor_Search.jsx";
import InteractionDataTable from "./Table.jsx";
import FrequencyHeatmap from "./Frequency_Heatmap.jsx";
import InteractiveBubblePlot from "./Bubble_Plot.jsx";
import StackedProportionBarplot from "./Pathway_Proportion.jsx";
import SankeyPlot from "./Sankey_Plot.jsx";
import CircosPlot from "./Circos_Plot.jsx";
import "./App.css";
const App = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [selections, setSelections] = useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header with Logo, Title, and Sidebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#1e1e1e",
          color: "white",
          padding: "1rem",
          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Logo and Title */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="http://127.0.0.1:5000/frontend/cellXplore.png"
            alt="cellXplore Logo"
            style={{ width: "80px", height: "80px", marginRight: "10px" }}
          />
          <h1 style={{ margin: 0, fontSize: "2rem" }}>cellXplore</h1>
        </div>

        {/* Sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            textAlign: "right",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
            Interactively explore cellular interactions
          </h2>
          <p style={{ margin: 0, fontSize: "1rem" }}>
            Select a tab to view different visualizations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: "#242424", padding: "1rem" }}>
        <Tabs
          selectedIndex={tabIndex}
          onSelect={(index) => setTabIndex(index)}
          style={{ height: "100%" }}
        >
          <TabList>
            <Tab>Single Cell View</Tab>
            <Tab>Ligand-Receptor Search</Tab>
            <Tab>Interactions Table</Tab>
            <Tab>Pathway Proportions</Tab>
            <Tab>Bubble Plot</Tab>
            <Tab>Heatmap</Tab>
            <Tab>Sankey Plot</Tab>
            <Tab>Circos Plot</Tab>
          </TabList>

          <TabPanel>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <VitessceVisualization
                style={{ flex: 1, width: "100%" }}
                onSelectionChange={setSelections}
              />
            </div>
          </TabPanel>
          <TabPanel>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <DualScatterLR style={{ flex: 1, width: "100%" }} />
            </div>
          </TabPanel>
          <TabPanel>
            <div style={{ height: "100%", overflow: "auto" }}>
              <InteractionDataTable selections={selections} />
            </div>
          </TabPanel>
          <TabPanel>
            <div style={{ height: "100%", overflow: "auto" }}>
              <StackedProportionBarplot />
            </div>
          </TabPanel>
          <TabPanel>
            <div style={{ height: "100%", overflow: "auto" }}>
              <InteractiveBubblePlot selections={selections} />
            </div>
          </TabPanel>
          <TabPanel>
            <div style={{ height: "100%", overflow: "auto" }}>
              <FrequencyHeatmap selections={selections} />
            </div>
          </TabPanel>
          <TabPanel>
            <div style={{ height: "100%", overflow: "auto" }}>
              <SankeyPlot />
            </div>
          </TabPanel>
          <TabPanel>
            <div style={{ height: "100%", overflow: "auto" }}>
              <CircosPlot selections={selections} />
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

export default App;
