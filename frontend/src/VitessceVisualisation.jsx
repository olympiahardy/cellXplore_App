import React, { useRef, useEffect, useState } from "react";
import { Vitessce } from "vitessce";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import Draggable from "react-draggable";

const VitessceVisualization = () => {
  const [config, setConfig] = useState();
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);
  const resizableRef = useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get_anndata");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
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
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          position: "absolute",
          right: "0",
          top: "0",
          margin: "10px",
          zIndex: 1000,
        }}
      >
        {/* This handle will be draggable */}
        <div
          className="handle"
          style={{
            cursor: "move",
            backgroundColor: "#eee",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          Drag here
        </div>

        {/* The Resizable section below remains unaffected by the drag */}
        <Resizable
          width={width}
          height={height}
          onResize={onResize}
          minConstraints={[300, 300]}
          maxConstraints={[1200, 1200]}
        >
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              overflow: "hidden",
            }}
          >
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
