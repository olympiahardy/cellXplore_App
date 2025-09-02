import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

function StackedProportionBarplot() {
  const [data, setData] = useState([]);
  const [stringColumns, setStringColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [pathwayColumn, setPathwayColumn] = useState(null);
  const [topN, setTopN] = useState(10);
  const [loading, setLoading] = useState(true);
  const [chartSize, setChartSize] = useState({ width: 800, height: 500 });
  const d3Container = useRef();

  const [showModal, setShowModal] = useState(false);
  const [pdfWidthCm, setPdfWidthCm] = useState(20); // default: 20 cm
  const [pdfHeightCm, setPdfHeightCm] = useState(15);
  const [pdfFilename, setPdfFilename] = useState("stacked_barplot");
  const [pdfDPI, setPdfDPI] = useState(300);

  const handleDownloadPDF = async () => {
    const container = d3Container.current;

    if (!container) {
      console.error("Chart container not found.");
      return;
    }
    const svgElement = container.querySelector("svg");
    if (!svgElement) {
      console.error("SVG element not found for PDF export.");
      return; // or show a message to the user
    }

    const svg = d3.select(svgElement);
    const texts = svg.selectAll("text");
    const originalFills = [];
    texts.each(function () {
      originalFills.push(d3.select(this).style("fill"));
    });
    texts.style("fill", "black");

    const axisLines = svg.selectAll(".domain, .tick line");
    const originalStrokes = [];
    axisLines.each(function () {
      originalStrokes.push(d3.select(this).style("stroke"));
    });
    axisLines.style("stroke", "black");

    // Convert cm to pixels at the selected DPI
    const pxPerCm = pdfDPI / 2.54;
    const pdfWidthPx = pdfWidthCm * pxPerCm;
    const pdfHeightPx = pdfHeightCm * pxPerCm;

    const canvas = await html2canvas(container, {
      backgroundColor: null,
      useCORS: true,
      scale: pdfDPI / 96, // For high-res export
    });

    texts.each(function (d, i) {
      d3.select(this).style("fill", originalFills[i]);
    });

    axisLines.each(function (d, i) {
      d3.select(this).style("stroke", originalStrokes[i]);
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: pdfWidthCm > pdfHeightCm ? "landscape" : "portrait",
      unit: "px",
      format: [pdfWidthPx, pdfHeightPx],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidthPx, pdfHeightPx);
    pdf.save(`${pdfFilename || "stacked_barplot"}.pdf`);

    setShowModal(false);
  };

  const openExportModal = () => {
    const svgNode = d3Container.current.querySelector("svg");
    if (svgNode) {
      const bbox = svgNode.getBBox(); // Gets the actual size of SVG content
      const pxPerCm = pdfDPI / 2.54;
      setPdfWidthCm((bbox.width || svgNode.clientWidth) / pxPerCm);
      setPdfHeightCm((bbox.height || svgNode.clientHeight) / pxPerCm);
    }
    setShowModal(true);
  };

  // Fetch data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/prop-freq");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);

        // Identify string columns
        if (json.length > 0) {
          const sampleRow = json[0];
          const stringCols = Object.keys(sampleRow).filter(
            (key) => typeof sampleRow[key] === "string"
          );
          setStringColumns(stringCols);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // D3 render logic
  useEffect(() => {
    if (!selectedColumn || !pathwayColumn || data.length === 0) return;

    const groupedData = data.reduce((acc, row) => {
      const group = row[selectedColumn];
      const pathway = row[pathwayColumn];
      if (!acc[group]) acc[group] = {};
      if (!acc[group][pathway]) acc[group][pathway] = 0;
      acc[group][pathway]++;
      return acc;
    }, {});

    const groups = Object.keys(groupedData).sort();
    // 1. Count total interactions for each pathway
    const pathwayCounts = {};
    data.forEach((row) => {
      const pathway = row[pathwayColumn];
      pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
    });

    // 2. Get top N pathways by total interaction count
    const topPathways = Object.entries(pathwayCounts)
      .sort((a, b) => b[1] - a[1]) // Descending
      .slice(0, topN)
      .map(([key]) => key); // Just pathway names
    // Step 4: Filter groupedData to only include topN pathways
    const filteredGroupedData = Object.fromEntries(
      Object.entries(groupedData).map(([group, pathwaysData]) => {
        const filteredPathwaysData = Object.fromEntries(
          Object.entries(pathwaysData).filter(([pathway]) =>
            topPathways.includes(pathway)
          )
        );
        return [group, filteredPathwaysData];
      })
    );

    // Step 5: Generate formatted data
    const formattedData = groups.map((group) => {
      const total = Object.values(filteredGroupedData[group]).reduce(
        (a, b) => a + b,
        0
      );
      const obj = { group };
      topPathways.forEach((pathway) => {
        obj[pathway] =
          total > 0 ? (groupedData[group][pathway] || 0) / total : 0;
      });
      return obj;
    });

    // Step 6: Calculate pathway totals for sorting
    const pathwayTotals = {};
    topPathways.forEach((pathway) => {
      pathwayTotals[pathway] = formattedData.reduce(
        (sum, groupObj) => sum + groupObj[pathway],
        0
      );
    });

    // Step 7: Sort pathways by total proportions (ascending)
    const sortedPathways = [...topPathways].sort(
      (a, b) => pathwayTotals[b] - pathwayTotals[a]
    );

    // Clear old chart
    d3.select(d3Container.current).selectAll("*").remove();

    // Dimensions
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const width = chartSize.width - margin.left - margin.right;
    const height = chartSize.height - margin.top - margin.bottom;

    const svg = d3
      .select(d3Container.current)
      .append("svg")
      .attr("width", chartSize.width)
      .attr("height", chartSize.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(groups).range([0, width]).padding(0.4);

    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    const color = d3
      .scaleOrdinal()
      .domain(sortedPathways)
      .range(d3.schemeTableau10);

    const stackedSeries = d3.stack().keys(sortedPathways)(formattedData);

    svg
      .append("g")
      .selectAll("g")
      .data(stackedSeries)
      .join("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.group))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .on("mouseover", function (event, d) {
        const group = d.data.group;
        const pathway = d3.select(this.parentNode).datum().key;
        const percentBarHeight = ((d[1] - d[0]) * 100).toFixed(1);

        // All rows in this group
        const allGroupRows = data.filter(
          (row) => row[selectedColumn] === group
        );

        // All rows in this group AND this pathway
        const groupPathwayRows = allGroupRows.filter(
          (row) => row[pathwayColumn] === pathway
        );

        // Global: all rows for this pathway
        const globalPathwayRows = data.filter(
          (row) => row[pathwayColumn] === pathway
        );

        const percentGroupLocal = (
          (groupPathwayRows.length / allGroupRows.length) *
          100
        ).toFixed(1);

        const percentGlobal = (
          (globalPathwayRows.length / data.length) *
          100
        ).toFixed(1);

        // Build Interacting_Pairs as `${source} → ${target}`
        const pairCounts = {};
        groupPathwayRows.forEach((row) => {
          const pair = `${row.source} → ${row.target}`;
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        });

        const topPairs = Object.entries(pairCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([pair, count]) => `• ${pair} (${count})`)
          .join("<br>");

        const htmlContent = `
          <strong>Pathway:</strong> ${pathway}<br>
          <strong>Group:</strong> ${group}<br>
          <strong>Plot Percentage:</strong> ${percentBarHeight}% of bar<br>
          <strong>Group Interactions:</strong> ${groupPathwayRows.length} (${percentGroupLocal}% of group)<br>
          <strong>Global Interactions:</strong> ${globalPathwayRows.length} (${percentGlobal}% of dataset)<br>
          <strong>Top 5 Interacting Pairs:</strong><br>
          ${topPairs}
        `;

        tooltip
          .html(htmlContent)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 40 + "px")
          .style("opacity", 1);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 40 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    xAxis.selectAll("text").style("font-size", "14px").style("fill", "white");
    xAxis.selectAll(".domain, .tick line").style("stroke", "white");

    const yAxis = svg
      .append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));
    yAxis.selectAll("text").style("font-size", "14px").style("fill", "white");
    yAxis.selectAll(".domain, .tick line").style("stroke", "white");

    // Add legend
    const legend = svg
      .selectAll(".legend")
      .data(sortedPathways)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend
      .append("rect")
      .attr("x", width - 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", (d) => color(d));

    legend
      .append("text")
      .attr("x", width - 26)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .style("fill", "white")
      .text((d) => d);
  }, [selectedColumn, pathwayColumn, data, topN, chartSize]);

  const columnOptions = stringColumns.map((col) => ({
    value: col,
    label: col,
  }));

  const tooltip = d3.select("#tooltip");

  const customSelectStyles = {
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
      backgroundColor: state.isFocused ? "#555" : "#333",
      color: "white",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
    }),
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        color: "white",
      }}
    >
      {/* Sidebar for dropdowns */}
      <div
        style={{ width: "25%", padding: "1rem", backgroundColor: "#2e2e2e" }}
      >
        <h4
          style={{ color: "white", textAlign: "center", marginBottom: "15px" }}
        >
          Customize Barplot
        </h4>

        {/* Dropdown for pathway column */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", color: "white" }}
          >
            Select the interaction pathway column:
          </label>
          <Select
            id="pathway-column-select"
            options={columnOptions}
            onChange={(selected) => setPathwayColumn(selected?.value || null)}
            placeholder="Choose the pathway column..."
            styles={customSelectStyles}
          />
        </div>

        {/* Dropdown for grouping column */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", color: "white" }}
          >
            Select the column to group by:
          </label>
          <Select
            id="column-select"
            options={columnOptions}
            onChange={(selected) => setSelectedColumn(selected?.value || null)}
            placeholder="Choose a column to group by..."
            styles={customSelectStyles}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", color: "white" }}
          >
            Show Top N Pathways:
          </label>
          <Select
            value={{ value: topN, label: `Top ${topN}` }}
            options={[5, 10, 15, 20].map((n) => ({
              value: n,
              label: `Top ${n}`,
            }))}
            onChange={(selected) => setTopN(selected.value)}
            styles={customSelectStyles}
          />
        </div>
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={openExportModal}
            style={{ marginTop: "10px", padding: "5px 10px", width: "100%" }}
          >
            Save as PDF
          </button>
        </div>
      </div>

      {/* Main content area for D3 chart */}
      <div style={{ flex: 1, padding: "1rem", position: "relative" }}>
        <ResizableBox
          width={chartSize.width}
          height={chartSize.height}
          onResizeStop={(e, data) => {
            setChartSize({ width: data.size.width, height: data.size.height });
          }}
          minConstraints={[300, 200]}
          maxConstraints={[1200, 1000]}
          style={{
            border: "1px solid #444",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            ref={d3Container}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </ResizableBox>
      </div>
      <div
        id="tooltip"
        style={{
          position: "absolute",
          backgroundColor: "#222",
          color: "white",
          padding: "8px",
          borderRadius: "5px",
          fontSize: "12px",
          pointerEvents: "none",
          opacity: 0,
          maxWidth: "300px",
          zIndex: 10,
        }}
      ></div>
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#2e2e2e",
              padding: "20px",
              borderRadius: "8px",
              color: "white",
              minWidth: "300px",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>Export Plot to PDF</h3>

            <label>Filename:</label>
            <input
              type="text"
              value={pdfFilename}
              onChange={(e) => setPdfFilename(e.target.value)}
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <label>Width (cm):</label>
            <input
              type="number"
              value={pdfWidthCm}
              onChange={(e) => setPdfWidthCm(Number(e.target.value))}
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <label>Height (cm):</label>
            <input
              type="number"
              value={pdfHeightCm}
              onChange={(e) => setPdfHeightCm(Number(e.target.value))}
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <label>DPI (dots per inch):</label>
            <input
              type="number"
              value={pdfDPI}
              onChange={(e) => setPdfDPI(Number(e.target.value))}
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "#666",
                  color: "white",
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StackedProportionBarplot;
