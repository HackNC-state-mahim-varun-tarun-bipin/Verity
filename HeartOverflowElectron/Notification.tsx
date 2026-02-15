import React, { useState, useEffect } from "react";
import { Spin, Progress, Flex } from "antd";

const { ipcRenderer } = window.require("electron");

const Notification: React.FC = () => {
  const [truthLabel, setTruthLabel] = useState("Checking...");
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const handleTruthLabel = (_event: any, label: string) => {
      setTruthLabel(label);
      if (label !== "Checking...") {
        setLoading(false);
      } else {
        setLoading(true);
      }
    };
    
    const handleConfidence = (_event: any, conf: number) => {
      setConfidence(conf);
    };

    const handleFadeOut = () => {
      setFadeOut(true);
    };

    const handleFadeIn = () => {
      setFadeOut(false);
    };

    ipcRenderer.on("truth-label", handleTruthLabel);
    ipcRenderer.on("confidence", handleConfidence);
    ipcRenderer.on("fade-out", handleFadeOut);
    ipcRenderer.on("fade-in", handleFadeIn);

    return () => {
      ipcRenderer.removeListener("truth-label", handleTruthLabel);
      ipcRenderer.removeListener("confidence", handleConfidence);
      ipcRenderer.removeListener("fade-out", handleFadeOut);
      ipcRenderer.removeListener("fade-in", handleFadeIn);
    };
  }, []);

  const getLabelColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "likely true":
        return "#4CAF50";
      case "likely false":
        return "#f44336";
      case "unknown":
        return "#FF9800";
      case "mixed/uncertain":
        return "#FF9800";
      default:
        return "#FF9800";
    }
  };

  const getProgressColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "likely true":
        return "#4CAF50";
      case "likely false":
        return "#f44336";
      case "unknown":
        return "#808080";
      default:
        return "#FF9800";
    }
  };

  const handleClick = () => {
    if (!fadeOut) {
      ipcRenderer.send("open-dashboard");
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        margin: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        color: "white",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        cursor: "pointer",
        userSelect: "none",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 1.2s ease",
      }}
    >
      {loading ? (
        <Spin />
      ) : (
        <Flex align="center" gap="middle">
          <Progress 
            type="circle" 
            percent={Math.round(Math.abs(confidence) * 100)} 
            strokeColor={getProgressColor(truthLabel)}
            trailColor="#ffffff"
            format={(percent) => <span style={{ color: 'white', fontSize: '10px', fontWeight: 600 }}>{percent}%</span>}
            size={50}
          />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px"}}>
              {truthLabel}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.7 }}>
              Click for details
            </div>
          </div>
        </Flex>
      )}
    </div>
  );
};

export default Notification;
