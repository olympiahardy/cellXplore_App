import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./App.css";

const CircosPlot = ({ selections, savedTableSelections }) => {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorMapping, setColorMapping] = useState({});
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [selectedSelection, setSelectedSelection] = useState("");

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

  const updateColorMapping = (dataset) => {
    const rawCellTypes = Array.from(
      new Set(dataset.flatMap((item) => [item.source, item.target]))
    );
    const palette = scPalette(rawCellTypes.length);

    const baseColorMap = rawCellTypes.reduce((acc, cellType, index) => {
      acc[cellType] = palette[index];
      return acc;
    }, {});

    // 👇 Add (source) and (target) variants
    const extendedColorMap = {};
    rawCellTypes.forEach((type) => {
      extendedColorMap[`${type} (source)`] = baseColorMap[type];
      extendedColorMap[`${type} (target)`] = baseColorMap[type];
    });

    setColorMapping(extendedColorMap);
  };

  // Function to fetch full dataset initially
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/circos");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();

        const processedData = json.map((row) => ({
          source: row.source,
          target: row.target,
          prob: parseFloat(row.lr_probs) || 0.1,
          ligand: row.ligand,
          receptor: row.receptor,
        }));
        setData(processedData);
        updateColorMapping(processedData);
      } catch (error) {
        console.error("Error fetching Circos data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Load full dataset initially
  }, []);

  // Function to fetch filtered data when "Apply Filter" is clicked
  const fetchFilteredData = async () => {
    const allSelections = { ...selections, ...savedTableSelections };
    const selectedData = allSelections[selectedSelection];

    if (selectedData) {
      const processedData = selectedData.map((row) => ({
        source: row.source,
        target: row.target,
        prob: parseFloat(row.lr_probs || row.prob || 0.1),
      }));
      setData(processedData);
      updateColorMapping(processedData);
      return;
    }

    if (!selectedSelection) {
      fetchData(); // Reset to full dataset if "All Data" is selected
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://oh-cxg-dev.mvls.gla.ac.uk/filter-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_name: selectedSelection }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const json = await response.json();
      const processedFilteredData = json.map((row) => ({
        source: row.source,
        target: row.target,
        prob: parseFloat(row.prob) || 0.1,
        ligand: row.ligand,
        receptor: row.receptor,
      }));
      setData(processedFilteredData);
      updateColorMapping(processedFilteredData);
    } catch (error) {
      console.error("Error fetching filtered Circos data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDF = async () => {
    const container = containerRef.current;
    if (!container) return;

    const svg = container.querySelector("svg");
    const clonedSvg = svg.cloneNode(true);

    // Wrap in white background for clarity
    const wrapper = document.createElement("div");
    wrapper.style.backgroundColor = "white";
    wrapper.appendChild(clonedSvg);
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("circos_plot.pdf");

    wrapper.remove();
  };

  useEffect(() => {
    if (
      selectedSources.length > 0 &&
      selectedTargets.length > 0 &&
      containerRef.current
    ) {
      containerRef.current.innerHTML = "";

      const container = containerRef.current.parentElement;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const innerRadius = Math.min(width, height) / 2 - 250;
      const outerRadius = Math.min(width, height) / 2 - 200;
      const svg = d3
        .select(containerRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      // 1. Filter data by selected sources/targets
      const filteredData = data.filter(
        (item) =>
          selectedSources.includes(item.source) &&
          selectedTargets.includes(item.target)
      );

      if (filteredData.length === 0) {
        console.warn("No matching interactions after filtering!");
        return;
      }

      // 2. Aggregate into matrix
      const aggregateInteractions = (data) => {
        const uniqueCellTypes = Array.from(
          new Set(
            data
              .map((item) => `${item.source} (source)`)
              .concat(data.map((item) => `${item.target} (target)`))
          )
        );

        const indexMap = new Map(uniqueCellTypes.map((d, i) => [d, i]));

        const matrix = Array.from({ length: uniqueCellTypes.length }, () =>
          new Array(uniqueCellTypes.length).fill(0)
        );

        const interactionDetails = {};

        data.forEach(({ source, target, prob, ligand, receptor }) => {
          const sourceName = `${source} (source)`; // <-- move inside here
          const targetName = `${target} (target)`;

          const i = indexMap.get(sourceName);
          const j = indexMap.get(targetName);

          matrix[i][j] += prob;

          const key = `${i}-${j}`;
          if (!interactionDetails[key]) {
            interactionDetails[key] = {
              count: 0,
              ligrecPairs: [],
            };
          }

          interactionDetails[key].count += 1;
          interactionDetails[key].ligrecPairs.push({ ligand, receptor, prob });
        });

        return { matrix, uniqueCellTypes, interactionDetails };
      };

      const { matrix, uniqueCellTypes, interactionDetails } =
        aggregateInteractions(filteredData);

      // 3. Build D3 chord layout
      const chordLayout = d3
        .chord()
        .padAngle(0.08)
        .sortSubgroups(d3.descending)(matrix);

      const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

      const ribbon = d3.ribbon().radius(innerRadius);

      // 4. Color scale
      const color = d3
        .scaleOrdinal()
        .domain(uniqueCellTypes)
        .range(uniqueCellTypes.map((d) => colorMapping[d] || "#ccc"));

      // 5. Draw arcs (outer cell type arcs)
      svg
        .append("g")
        .attr("class", "arcs")
        .selectAll("path")
        .data(chordLayout.groups)
        .join("path")
        .attr("fill", (d) => color(uniqueCellTypes[d.index]))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("d", arc);

      // 6. Add cell type labels
      svg
        .append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(chordLayout.groups)
        .join("text")
        .each(function (d) {
          d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("dy", ".35em")
        .attr("transform", function (d) {
          return `
            rotate(${(d.angle * 180) / Math.PI - 90})
            translate(${outerRadius + 10})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
          `;
        })
        .attr("text-anchor", function (d) {
          return d.angle > Math.PI ? "end" : "start";
        })
        .text((d) =>
          uniqueCellTypes[d.index]
            .replace(" (source)", "")
            .replace(" (target)", "")
        )
        .text((d) =>
          uniqueCellTypes[d.index]
            .replace(" (source)", "")
            .replace(" (target)", "")
        )
        .style("fill", "white")
        .style("font-size", "18px")
        .style("font-weight", "bold");

      // 7. Draw ribbons (chords)
      svg
        .append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(chordLayout)
        .join("path")
        .attr("fill", (d) => color(uniqueCellTypes[d.target.index]))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .attr("d", ribbon)
        .on("mouseover", function (event, d) {
          const key = `${d.source.index}-${d.target.index}`;
          const details = interactionDetails[key] || {
            count: 0,
            ligrecPairs: [],
          };

          const ligrecText = details.ligrecPairs
            .sort((a, b) => b.prob - a.prob) // 🔥 sort descending by prob
            .slice(0, 10) // 🔥 keep only top 15
            .map(
              (pair) =>
                `${pair.ligand} → ${pair.receptor} (${pair.prob.toFixed(3)})`
            ) // show prob
            .join("<br/>");

          const tooltip = d3.select(tooltipRef.current);

          // 🧠 Manually calculate centroid
          const angle =
            (d.source.startAngle +
              d.source.endAngle +
              d.target.startAngle +
              d.target.endAngle) /
            4;
          const r = (innerRadius + outerRadius) / 2; // radius in between inner and outer
          const cx = r * Math.cos(angle - Math.PI / 2); // -90 degrees rotation
          const cy = r * Math.sin(angle - Math.PI / 2);

          const { left, top } = containerRef.current.getBoundingClientRect();

          tooltip
            .style("opacity", 1)
            .style("display", "block")
            .style("left", `${left + width / 2 + cx}px`) // SVG center + offset
            .style("top", `${top + height / 2 + cy}px`)
            .html(
              `<b>Source:</b> ${uniqueCellTypes[d.source.index]}<br/>
               <b>Target:</b> ${uniqueCellTypes[d.target.index]}<br/>
               <b>Sum Prob:</b> ${matrix[d.source.index][
                 d.target.index
               ].toFixed(2)}<br/>
               <b># Interactions:</b> ${details.count}<br/>
               <b>Ligand-Receptor Pairs:</b><br/>
               ${ligrecText}`
            );

          d3.select(this)
            .raise()
            .transition()
            .duration(200)
            .style("opacity", 1)
            .attr("stroke", "yellow")
            .attr("stroke-width", 3);

          d3.selectAll(".ribbons path")
            .filter((el) => el !== d)
            .transition()
            .duration(200)
            .style("opacity", 0.1);
        })
        .on("mouseout", function () {
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style("display", "none");

          d3.selectAll(".ribbons path")
            .transition()
            .duration(200)
            .style("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 1);
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
          {/* Selection Dropdown */}
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="filter-select" style={{ color: "white" }}>
              Select a Filter:
            </label>
            <select
              id="filter-select"
              value={selectedSelection}
              onChange={(e) => setSelectedSelection(e.target.value)}
              style={{
                padding: "5px",
                backgroundColor: "#444",
                color: "white",
                borderColor: "#555",
                width: "100%",
              }}
            >
              <option value="">All Data</option>
              {Object.keys({ ...selections, ...savedTableSelections }).map(
                (name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                )
              )}
            </select>
            <button
              onClick={fetchFilteredData}
              style={{ marginTop: "10px", padding: "5px 10px" }}
            >
              Apply Filter
            </button>
          </div>
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
          <button
            onClick={handleSavePDF}
            style={{ marginTop: "10px", padding: "5px 10px", width: "100%" }}
          >
            Save as PDF
          </button>
        </div>

        {/* Main Plot Area */}
        <div style={{ flex: 1, padding: 0, margin: 0, overflow: "hidden" }}>
          {selectedSources.length === 0 || selectedTargets.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>
              Please select at least one source and one target
            </p>
          ) : (
            <div
              style={{
                position: "relative", // 💥 Important
                width: "100%",
                height: "100%",
              }}
            >
              <div ref={containerRef}></div> {/* ONLY the SVG goes here */}
              <div ref={tooltipRef} className="tooltip"></div>
              {/* Tooltip floats separately */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircosPlot;
