import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import { Vitessce } from "vitessce";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css"; 
console.log(Resizable);
import Draggable from "react-draggable";
console.log(Draggable);

// import { vcConfig } from "./my-view-config";
const VitessceVisualization = () => {
  const [config, setConfig] = useState();
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(800);
  const resizableRef = useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_anndata");
      console.log("got response", response);
      const data = await response.json();
      console.log("data", data);
      setConfig(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const onResize = (event, { size }) => {
    setWidth(size.width);
    setHeight(size.height);
  };

  if (!config) return <div>Loading...</div>;

  return (
    <Draggable handle=".handle">
      <div style={{ border: "1px solid #ccc", padding: "10px", position: "relative" }}>
        {/* This handle will be draggable */}
        <div className="handle" style={{ cursor: "move", backgroundColor: "#eee", padding: "10px", marginBottom: "10px" }}>
          Drag here
        </div>

        {/* The Resizable section below remains unaffected by the drag */}
        <Resizable
          width={width}
          height={height}
          onResize={onResize}
          minConstraints={[300, 300]} // Optional min size
          maxConstraints={[1200, 1200]} // Optional max size
        >
          <div style={{ width: `${width}px`, height: `${height}px`, overflow: "hidden" }}>
            {/* Vitessce component with dynamic width and height */}
            <Vitessce
              config={config}
              width={width}
              height={height}
              theme="dark"
            />
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
};

export default VitessceVisualization;

// For spatial view
