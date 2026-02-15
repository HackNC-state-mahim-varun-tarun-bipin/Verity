import React, { useState, useEffect } from "react";
import { Card, Typography, Progress, Flex } from "antd";

const { Title, Text } = Typography;

const App: React.FC = () => {
  const [clipboardText, setClipboardText] = useState(
    "Waiting for clipboard text...",
  );
  const [truthLabel, setTruthLabel] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  const getProgressColor = () => {
    if (confidence > 0.6) return "#4CAF50";
    if (confidence < -0.6) return "#f44336";
    if (confidence === 0) return "#FF9800";
    return "#1890ff";
  };

  useEffect(() => {
    const { ipcRenderer } = window.require("electron");

    ipcRenderer.on("clipboard-update", (_event: any, text: string) => {
      setClipboardText(text);
      setTruthLabel("");
      setConfidence(0);
      setLoading(true);
    });

    ipcRenderer.on("verification-result", (_event: any, response: any) => {
      setLoading(false);

      if (response && response.body) {
        try {
          const body = JSON.parse(response.body);
          if (body.truth_label) {
            setTruthLabel(body.truth_label);
          }
          if (body.confidence !== undefined) {
            setConfidence(body.confidence);
          }
        } catch (e) {
          setTruthLabel("Error");
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ipcRenderer.send("hide-window");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      style={{
        backgroundColor: "rgba(21, 21, 20, 0.6)",
        padding: "32px",
        minHeight: "90vh",
        borderRadius: "16px",
        overflow: "visible",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Title
        level={2}
        style={{ color: "#fff", marginBottom: "16px", marginTop: "0px" }}
      >
        HeartOverflow
      </Title>
      <Card
        type="inner"
        title="Content"
        style={{
          backgroundColor: "#b9b9b9",
          border: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          marginBottom: "16px",
        }}
        headStyle={{ backgroundColor: "#b9b9b9", borderBottom: "none" }}
        bodyStyle={{ backgroundColor: "#b9b9b9" }}
      >
        {clipboardText}
      </Card>
      <Card
        loading={loading}
        style={{
          backgroundColor: "#2f2f2e",
          border: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Flex align="center" gap="large">
          <Progress
            type="circle"
            percent={Math.abs(confidence) * 100}
            strokeColor={getProgressColor()}
            trailColor="#ffffff"
            format={(percent) => (
              <span style={{ color: '#b9b9b9' }}>{`${Math.round(confidence * 100)}%`}</span>
            )}
          />
          <Text
            style={{
              color: getLabelColor(truthLabel),
              fontSize: "18px",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          >
            {truthLabel || "Waiting for verification..."}
          </Text>
        </Flex>
      </Card>
    </div>
  );
};

export default App;
