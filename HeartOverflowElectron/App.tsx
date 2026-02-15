import React, { useState, useEffect } from "react";
import { Card, Typography, Progress, Flex, Button, Tag } from "antd";
import { SettingOutlined } from '@ant-design/icons';
import Settings from './Settings';

const { Title, Text } = Typography;

const App: React.FC = () => {
  const [clipboardText, setClipboardText] = useState(
    "Waiting for clipboard text...",
  );
  const [truthLabel, setTruthLabel] = useState<string>("UNKNOWN");
  const [confidence, setConfidence] = useState<number>(0);
  const [citations, setCitations] = useState<any[]>([]);
  const [source, setSource] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [matchSnippet, setMatchSnippet] = useState<string>("");
  const [document, setDocument] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

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

  const getStanceColor = (stance: string) => {
    switch (stance?.toLowerCase()) {
      case "support":
        return "#4CAF50";
      case "contradict":
        return "#f44336";
      case "neutral":
        return "#FFD700";
      default:
        return "#257cf1";
    }
  };

  const getProgressColor = () => {
    if (confidence > 0.6) return "#4CAF50";
    if (confidence < -0.6) return "#f44336";
    if (confidence === 0) return "#1890ff";
    return "#FF9800";
  };

  useEffect(() => {
    const { ipcRenderer } = window.require("electron");

    ipcRenderer.on("clipboard-update", (_event: any, text: string) => {
      setClipboardText(text);
      setTruthLabel("UNKNOWN");
      setConfidence(0);
      setCitations([]);
      setSource("");
      setSummary("");
      setMatchSnippet("");
      setDocument("");
      setIsContentExpanded(false);
      setIsSummaryExpanded(false);
      setLoading(true);
    });

    ipcRenderer.on("verification-result", (_event: any, response: any) => {
      setLoading(false);

      if (response) {
        if (response.verdict) {
          setTruthLabel(response.verdict);
        }
        if (response.confidence !== undefined) {
          setConfidence(response.confidence);
        }
        if (response.source) {
          setSource(response.source);
        }
        if (response.citations) {
          setCitations(response.citations);
          if (response.source !== "public" && response.citations.length > 0) {
            const firstCitation = response.citations[0];
            if (firstCitation.match_snippet) {
              setMatchSnippet(firstCitation.match_snippet);
            }
            if (firstCitation.document) {
              setDocument(firstCitation.document);
            }
          }
        }
        if (response.summary) {
          setSummary(response.summary);
        }
      }
    });

    ipcRenderer.on("open-settings", () => {
      setShowSettings(true);
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
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(10px)",
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
        Verity
        <Button
          icon={<SettingOutlined />}
          onClick={() => setShowSettings(true)}
          style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '20px' }}
        />
      </Title>
      <Card
        type="inner"
        title="Content"
        onClick={() => clipboardText.length > 100 && setIsContentExpanded(!isContentExpanded)}
        style={{
          backgroundColor: "#b9b9b9",
          border: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          marginBottom: "16px",
          cursor: clipboardText.length > 100 ? "pointer" : "default",
        }}
        headStyle={{ backgroundColor: "#b9b9b9", borderBottom: "none" }}
        bodyStyle={{ backgroundColor: "#b9b9b9", fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        {clipboardText.length > 100 && !isContentExpanded
          ? `${clipboardText.substring(0, 100)}...`
          : clipboardText}
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
          <div style={{ flex: 1 }}>
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
            {source && (
              <div style={{ marginTop: "8px" }}>
                <Tag color={source === "public" ? "orange" : "geekblue"}>
                  {source.toUpperCase()}
                </Tag>
              </div>
            )}
            {summary && (
              <Card
                onClick={(e) => {
                  e.stopPropagation();
                  summary.length > 400 && setIsSummaryExpanded(!isSummaryExpanded);
                }}
                style={{
                  backgroundColor: "#1f1f1e",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  marginTop: "12px",
                  cursor: summary.length > 400 ? "pointer" : "default",
                }}
                bodyStyle={{ backgroundColor: "#1f1f1e", padding: "12px" }}
              >
                <Text style={{ color: "#b9b9b9", fontSize: "14px", fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                  {summary.length > 400 && !isSummaryExpanded
                    ? `${summary.substring(0, 400)}...`
                    : summary}
                </Text>
              </Card>
            )}
          </div>
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
          {source !== "public" ? (
            <>
                        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
              {citations.map((citation, index) => (
                <li key={index} style={{ marginBottom: "12px" }}>
                  <a 
                    rel="noopener noreferrer"
                    style={{ color: "#257cf1", textDecoration: "none", fontWeight: "bold" }}
                    // onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                    onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
                  >
                    {citation.document}
                  </a>
                  {citation.match_snippet && (
                    <Text style={{ color: "#b9b9b9", fontSize: "14px", display: "block", marginTop: "4px" }}>
                      {citation.match_snippet}
                    </Text>
                  )}
                </li>
              ))}
            </ul>
              {/* {document && (
                <Card
                  style={{
                    backgroundColor: "#1f1f1e",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    marginBottom: matchSnippet ? "12px" : "0",
                  }}
                  bodyStyle={{ backgroundColor: "#1f1f1e", padding: "12px" }}
                >
                  <Text style={{ color: "#b9b9b9", fontSize: "14px", fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                    {document}
                  </Text>
                </Card>
              )}
              {matchSnippet && (
                <Card
                  style={{
                    backgroundColor: "#1f1f1e",
                    border: "1px solid #444",
                    borderRadius: "8px",
                  }}
                  bodyStyle={{ backgroundColor: "#1f1f1e", padding: "12px" }}
                >
                  <Text style={{ color: "#b9b9b9", fontSize: "14px", fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                    {matchSnippet}
                  </Text>
                </Card>
              )} */}
            </>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
              {citations.map((citation, index) => (
                <li key={index} style={{ marginBottom: "12px" }}>
                  <a 
                    href={citation.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: getStanceColor(citation.stance), textDecoration: "none", fontWeight: "bold" }}
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
          )}
        </Card>
      )}
    </div>
  );
};

export default App;
