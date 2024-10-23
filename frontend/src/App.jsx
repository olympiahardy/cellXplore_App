import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import { Vitessce } from "vitessce";
import { Resizable } from "react-resizable";
console.log(Resizable);
import Draggable from "react-draggable";
console.log(Draggable);

// import { vcConfig } from "./my-view-config";
const VitessceVisualization = () => {
  const [config, setConfig] = useState();
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
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
      <div
        className="handle"
        style={{ border: "1px solid #ccc", padding: "10px", cursor: "move" }}
      >
        <Resizable
          width={width}
          height={height}
          onResize={onResize}
          minConstraints={[300, 300]} // Minimum dimensions
          maxConstraints={[1000, 1000]} // Optional max dimensions
        >
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              overflow: "hidden",
            }}
          >
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
