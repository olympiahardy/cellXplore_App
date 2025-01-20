import React, { useEffect, useRef, useState } from "react";
import Circos from "circos";
import Select from "react-select";
import * as d3 from "d3";
import "./App.css";

const CircosPlot = () => {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorMapping, setColorMapping] = useState({});
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);

  // Generate a color palette
  const scPalette = (n) => {
    const colorSpace = [
      "#E41A1C",
      "#377EB8",
      "#4DAF4A",
      "#984EA3",
      "#F29403",
      "#F781BF",
      "#BC9DCC",
      "#A65628",
      "#54B0E4",
      "#222F75",
      "#1B9E77",
      "#B2DF8A",
      "#E3BE00",
      "#FB9A99",
      "#E7298A",
      "#910241",
      "#00CDD1",
      "#A6CEE3",
      "#CE1261",
      "#5E4FA2",
      "#8CA77B",
      "#00441B",
      "#DEDC00",
      "#DCF0B9",
      "#8DD3C7",
      "#999999",
    ];
    return colorSpace.slice(0, n);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/circos");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();

        const processedData = json.map((row) => ({
          source: row.source,
          target: row.target,
          prob: parseFloat(row.prob) || 0.1,
        }));
        setData(processedData);

        // Create color mapping
        const uniqueCellTypes = Array.from(
          new Set(processedData.flatMap((item) => [item.source, item.target]))
        );
        const palette = scPalette(uniqueCellTypes.length);
        const colorMap = uniqueCellTypes.reduce((acc, cellType, index) => {
          acc[cellType] = palette[index];
          return acc;
        }, {});
        setColorMapping(colorMap);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching Circos data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (
      selectedSources.length > 0 &&
      selectedTargets.length > 0 &&
      containerRef.current
    ) {
      containerRef.current.innerHTML = "";

      const width = Math.min(window.innerWidth * 0.8, 800);
      const height = width;

      const circos = new Circos({
        container: containerRef.current,
        width,
        height,
      });

      const filteredData = data.filter(
        (item) =>
          selectedSources.includes(item.source) &&
          selectedTargets.includes(item.target)
      );

      // Define radii for the tracks
      const innerHeatmapOuterRadius = width / 3.5 - 40; // Outer edge of the heatmap
      const outerSegmentOuterRadius = width / 3.7; // Outer edge of the outer segments

      // Generate layout for sources and targets
      const uniqueCellTypes = Array.from(
        new Set(filteredData.flatMap((item) => [item.source, item.target]))
      );

      const totalNodes = uniqueCellTypes.length;
      const senderLayout = uniqueCellTypes.map((id, index) => ({
        id: `${id}_sender`,
        label: "", // No labels within segments
        color: colorMapping[id],
        len: 100,
        start: (index / totalNodes) * Math.PI, // Senders in the first half
        end: ((index + 1) / totalNodes) * Math.PI,
      }));

      const targetLayout = uniqueCellTypes.map((id, index) => ({
        id: `${id}_receiver`,
        label: "", // No labels within segments
        color: colorMapping[id],
        len: 100,
        start: Math.PI + (index / totalNodes) * Math.PI, // Targets in the second half
        end: Math.PI + ((index + 1) / totalNodes) * Math.PI,
      }));

      const layout = [...senderLayout, ...targetLayout];

      // Add layout
      circos.layout(layout, {
        innerRadius: width / 3 - 20,
        outerRadius: outerSegmentOuterRadius,
        labels: { display: false },
        ticks: { display: false },
      });

      // Calculate heatmap data and chords
      const heatmapData = [];
      const chords = [];

      // Calculate total interactions per target for proportional chords
      const totalInteractionsPerTarget = filteredData.reduce((acc, item) => {
        acc[item.target] = (acc[item.target] || 0) + 1;
        return acc;
      }, {});

      uniqueCellTypes.forEach((sender) => {
        const senderData = filteredData.filter((d) => d.source === sender);

        // Group by target and sort by target cell type
        const groupedData = senderData.reduce((acc, item) => {
          acc[item.target] = (acc[item.target] || 0) + 1;
          return acc;
        }, {});

        const sortedTargets = Object.keys(groupedData).sort((a, b) =>
          a.localeCompare(b)
        );

        let currentStart = 0;
        const totalInteractions = senderData.length;

        sortedTargets.forEach((target) => {
          const count = groupedData[target];
          const proportion = (count / totalInteractions) * 100;

          heatmapData.push({
            block_id: `${sender}_sender`,
            start: currentStart,
            end: currentStart + proportion,
            value: count,
            color: colorMapping[target], // Use target's color
          });

          // Calculate proportional thickness for target side
          const targetProportion =
            (count / totalInteractionsPerTarget[target]) * 100;

          // Find the target range for chords
          const targetIndex = uniqueCellTypes.indexOf(target);
          const targetStart = Math.PI + (targetIndex / totalNodes) * Math.PI; // Target's start position
          const targetEnd =
            targetStart + (Math.PI / totalNodes) * (targetProportion / 100);

          // Determine the range of probabilities
          const minProb = d3.min(filteredData, (d) => d.prob) || 0;
          const maxProb = d3.max(filteredData, (d) => d.prob) || 1;

          // Create a linear scale for opacity
          const opacityScale = d3
            .scaleLinear()
            .domain([minProb, maxProb]) // Input range
            .range([0.3, 1]); // Output range (low to high opacity)

          // Create chords for each interaction
          senderData
            .filter((d) => d.target === target)
            .forEach((interaction, i) => {
              const senderSegmentStart =
                currentStart + (i / count) * proportion;
              const senderSegmentEnd =
                currentStart + ((i + 1) / count) * proportion;

              // Use scaled opacity
              const scaledOpacity = opacityScale(interaction.prob);

              chords.push({
                source: {
                  id: `${sender}_sender`,
                  start: senderSegmentStart,
                  end: senderSegmentEnd,
                  radius: innerHeatmapOuterRadius,
                },
                target: {
                  id: `${interaction.target}_receiver`,
                  start: targetStart + (i / count) * targetProportion,
                  end: targetStart + ((i + 1) / count) * targetProportion,
                  radius: outerSegmentOuterRadius,
                },
                value: interaction.prob,
                color: `rgba(${parseInt(
                  colorMapping[sender].substring(1, 3),
                  16
                )}, 
                              ${parseInt(
                                colorMapping[sender].substring(3, 5),
                                16
                              )}, 
                              ${parseInt(
                                colorMapping[sender].substring(5, 7),
                                16
                              )}, 
                              ${scaledOpacity})`, // Opacity reflects probability
              });
            });

          currentStart += proportion;
        });
      });

      // Add inner heatmap track to sender segments with a gap
      circos.heatmap("inner-heatmap", heatmapData, {
        innerRadius: width / 3 - 60, // Add a larger gap for clarity
        outerRadius: innerHeatmapOuterRadius,
        color: (d) => d.color,
      });

      // Add arrow-shaped chords for each heatmap segment
      circos.chords("chords", chords, {
        radius: innerHeatmapOuterRadius, // Match heatmap track outer radius
        color: (d) => d.color,
        arrow: true, // Enable arrow-shaped chords
      });

      // Add external labels for both senders and targets with larger font size
      circos.text(
        "external-labels",
        layout.map((d) => ({
          block_id: d.id,
          position: 50, // Middle of the block
          value: d.id.replace(/_sender|_receiver/, ""),
        })),
        {
          innerRadius: width / 3 + 10,
          outerRadius: width / 3 + 60,
          style: { "font-size": "16px", color: "black" }, // Increased font size
          radialOffset: 10,
        }
      );

      console.log("Chords Data:", chords);

      // Render the Circos plot
      circos.render();

      // Use D3 to set unique classes for the chords
      const svg = d3.select(containerRef.current).select("svg");

      svg.selectAll("path.chord").each((d, i, nodes) => {
        const path = d3.select(nodes[i]);
        if (d && d.source && d.target) {
          path
            .attr(
              "class",
              `chord chord-${d.source.id.replace(
                "_sender",
                ""
              )}-to-${d.target.id.replace("_receiver", "")}`
            )
            .datum(d); // Explicitly attach data to the path
        }
      });

      svg
        .selectAll("path.chord")
        .on("mouseover", function (event, d) {
          console.log("Mouseover data:", d); // Debugging

          if (!d || !d.source || !d.target) {
            console.error("Invalid data in mouseover:", d);
            return;
          }

          const chord = d3.select(this);

          // Highlight chord
          chord
            .attr("stroke", "white") // Match stroke with fill color
            .attr("stroke-width", 2)
            .attr("opacity", 1);

          // Ensure d contains valid data
          // Position and display tooltip
          const tooltip = d3.select(tooltipRef.current);
          tooltip
            .style("opacity", 1)
            .style("display", "block")
            .style("left", `${event.pageX + 10}px`) // Mouse X position
            .style("top", `${event.pageY + 10}px`) // Mouse Y position
            .html(
              `<b>Source:</b> ${d.source.id.replace("_sender", "")}<br/>
                <b>Target:</b> ${d.target.id.replace("_receiver", "")}<br/>
                <b>Probability:</b> ${d.value.toFixed(2)}`
            );
        })
        .on("mouseout", function () {
          const chord = d3.select(this);
          const tooltip = d3.select(tooltipRef.current);
          // Remove highlight
          chord
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .attr("opacity", 0.7);

          // Hide tooltip
          d3.select(tooltipRef.current).style("display", "none");
        });
    }
  }, [data, colorMapping, selectedSources, selectedTargets]);

  const uniqueSources = Array.from(new Set(data.map((item) => item.source)));
  const uniqueTargets = Array.from(new Set(data.map((item) => item.target)));

  const sourceOptions = uniqueSources.map((source) => ({
    value: source,
    label: source,
  }));

  const targetOptions = uniqueTargets.map((target) => ({
    value: target,
    label: target,
  }));

  if (loading) {
    return <p>Loading Circos plot data...</p>;
  }

  if (data.length === 0) {
    return <p>No data to display.</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#1e1e1e",
        color: "white",
      }}
    >
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#333",
          textAlign: "left",
          fontWeight: "bold",
          width: "20vw",
        }}
      >
        Interactive Circos Plot
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div
          style={{
            width: "20%",
            backgroundColor: "#2e2e2e",
            padding: "1rem",
            boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.5)",
            overflowY: "auto",
          }}
        >
          <h4>Customize Circos Plot</h4>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="source-select" style={{ color: "white" }}>
              Sources:
            </label>
            <Select
              id="source-select"
              isMulti
              options={sourceOptions}
              onChange={(selected) =>
                setSelectedSources(selected.map((option) => option.value))
              }
              placeholder="Select sources..."
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "#333",
                  color: "white",
                  borderColor: "#555",
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: "#333",
                  color: "white",
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "#555" : "#333", // Darker highlight
                  color: "white",
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#555",
                  color: "white",
                }),
              }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="target-select" style={{ color: "white" }}>
              Targets:
            </label>
            <Select
              id="target-select"
              isMulti
              options={targetOptions}
              onChange={(selected) =>
                setSelectedTargets(selected.map((option) => option.value))
              }
              placeholder="Select targets..."
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "#333",
                  color: "white",
                  borderColor: "#555",
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: "#333",
                  color: "white",
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "#555" : "#333", // Darker highlight
                  color: "white",
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#555",
                  color: "white",
                }),
              }}
            />
          </div>
        </div>

        {/* Main Plot Area */}
        <div style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
          {selectedSources.length === 0 || selectedTargets.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>
              Please select at least one source and one target
            </p>
          ) : (
            <div
              ref={containerRef}
              style={{
                margin: "2rem auto",
                width: "80%",
                maxWidth: "800px",
                height: "auto",
              }}
            >
              <div ref={tooltipRef} className="tooltip"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircosPlot;
