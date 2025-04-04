import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";

function SankeyPlot() {
  const [data, setData] = useState([]);
  const [plotData, setPlotData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from the /circos endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/sankey");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data and generate the plot
  useEffect(() => {
    if (data.length > 0) {
      // Prepare unique sources and targets
      const sources = [...new Set(data.map((item) => item.source))];
      const targets = [...new Set(data.map((item) => item.target))];

      // Create source-target mapping using the prob column as the value
      const chordData = data.map((item) => ({
        source: sources.indexOf(item.source),
        target: targets.indexOf(item.target),
        value: item.prob || 1, // Default to 1 if prob is missing
      }));

      // Create Plotly data structure for Sankey diagram
      const traces = [
        {
          type: "sankey",
          orientation: "h",
          node: {
            pad: 10,
            thickness: 20,
            line: {
              color: "black",
              width: 0.5,
            },
            label: [...sources, ...targets],
            color: [
              ...sources.map(() => "blue"),
              ...targets.map(() => "green"),
            ],
          },
          link: {
            source: chordData.map((d) => d.source),
            target: chordData.map((d) => d.target + sources.length),
            value: chordData.map((d) => d.value),
          },
        },
      ];

      setPlotData(traces);
    }
  }, [data]);

  return (
    <div
      style={{ backgroundColor: "#1e1e1e", color: "white", padding: "1rem" }}
    >
      <h2 style={{ textAlign: "center" }}>Interactive Circos Plot</h2>
      {loading ? (
        <p>Loading data...</p>
      ) : plotData.length > 0 ? (
        <Plot
          data={plotData}
          layout={{
            title: "Source-Target Relationships (Using prob Column)",
            paper_bgcolor: "#1e1e1e",
            plot_bgcolor: "#1e1e1e",
            font: { color: "white" },
            height: 600,
          }}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <p>No data available for plotting.</p>
      )}
    </div>
  );
}

export default SankeyPlot;
