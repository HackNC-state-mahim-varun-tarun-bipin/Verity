import React, { useState, useEffect } from "react";
import { Card, Typography, Progress, Flex, Button } from "antd";
import { SettingOutlined } from '@ant-design/icons';
import Settings from './Settings';

const { Title, Text } = Typography;

const App: React.FC = () => {
  const [clipboardText, setClipboardText] = useState(
    "Waiting for clipboard text...",
  );
  const [truthLabel, setTruthLabel] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [citations, setCitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
      setCitations([]);
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
          if (body.citations) {
            setCitations(body.citations);
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

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />;
  }

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
        style={{ color: "#fff", marginBottom: "16px", marginTop: "0px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        HeartOverflow
        <Button
          icon={<SettingOutlined />}
          onClick={() => setShowSettings(true)}
          style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '20px' }}
        />
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
              <span style={{ color: '#b9b9b9' }}>{`${Math.round(Math.abs(confidence) * 100)}%`}</span>
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
      {citations.length > 0 && (
        <Card
          title="Citations"
          style={{
            backgroundColor: "#2f2f2e",
            border: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            marginTop: "16px"
          }}
          headStyle={{ color: "#fff", backgroundColor: "#2f2f2e", borderBottom: "1px solid #444" }}
          bodyStyle={{ backgroundColor: "#2f2f2e" }}
        >
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {citations.map((citation, index) => (
              <li key={index} style={{ marginBottom: "12px" }}>
                <a 
                  href={citation.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: getLabelColor(truthLabel), textDecoration: "none", fontWeight: "bold" }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  {citation.source || citation.url}
                </a>
                {citation.snippet && (
                  <Text style={{ color: "#b9b9b9", fontSize: "14px", display: "block", marginTop: "4px" }}>
                    {citation.snippet}
                  </Text>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default App;
