import React, { useState, useEffect, useCallback } from "react";
import { Vitessce } from "@vitessce/dev";

const VitessceVisualization = ({ onSelectionChange }) => {
  const [config, setConfig] = useState(null);
  const [newSelections, setSelections] = useState({}); // ✅ Fix: Initialize as an empty object

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/get_config");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const extractAllSelections = (newConfig) => {
    try {
      const additionalObsSets =
        newConfig?.coordinationSpace?.additionalObsSets?.A;
      if (!additionalObsSets || !additionalObsSets.tree) return {};

      let selectionsDict = {}; // Dictionary to store selections

      // Traverse the tree
      additionalObsSets.tree.forEach((node) => {
        if (node.children) {
          node.children.forEach((child) => {
            if (child.name && child.set) {
              selectionsDict[child.name] = child.set.map(
                ([barcode]) => barcode
              );
            }
          });
        }
      });

      return selectionsDict;
    } catch (error) {
      console.error("Error extracting selections:", error);
      return {};
    }
  };

  // Function to send all selections to Flask
  const sendSelectionsToBackend = async (selections) => {
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/process_selections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selections }), // Send entire selections dictionary
      });

      const result = await response.json();
      console.log("Response from Flask:", result);
    } catch (error) {
      console.error("Error sending selections to backend:", error);
    }
  };

  const handleConfigChange = useCallback(
    (newConfig) => {
      const newSelections = extractAllSelections(newConfig);

      console.log("Updated Selections:", newSelections);

      setSelections(newSelections); // Store selections in state
      if (onSelectionChange) {
        onSelectionChange(newSelections); // ✅ Fix: Only call if prop exists
      }
      sendSelectionsToBackend(newSelections); // Send to Flask
    },
    [setSelections, onSelectionChange]
  );

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
          onConfigChange={handleConfigChange}
        />
      </div>
    </div>
  );
};

export default VitessceVisualization;
