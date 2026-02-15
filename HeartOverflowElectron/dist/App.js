"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const antd_1 = require("antd");
const icons_1 = require("@ant-design/icons");
const Settings_1 = __importDefault(require("./Settings"));
const { Title, Text } = antd_1.Typography;
const App = () => {
    const [clipboardText, setClipboardText] = (0, react_1.useState)("Waiting for clipboard text...");
    const [truthLabel, setTruthLabel] = (0, react_1.useState)("UNKNOWN");
    const [confidence, setConfidence] = (0, react_1.useState)(0);
    const [citations, setCitations] = (0, react_1.useState)([]);
    const [source, setSource] = (0, react_1.useState)("");
    const [summary, setSummary] = (0, react_1.useState)("");
    const [matchSnippet, setMatchSnippet] = (0, react_1.useState)("");
    const [document, setDocument] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [isContentExpanded, setIsContentExpanded] = (0, react_1.useState)(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = (0, react_1.useState)(false);
    const getLabelColor = (label) => {
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
    const getStanceColor = (stance) => {
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
        if (confidence > 0.6)
            return "#4CAF50";
        if (confidence < -0.6)
            return "#f44336";
        if (confidence === 0)
            return "#1890ff";
        return "#FF9800";
    };
    (0, react_1.useEffect)(() => {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.on("clipboard-update", (_event, text) => {
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
        ipcRenderer.on("verification-result", (_event, response) => {
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
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                ipcRenderer.send("hide-window");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    if (showSettings) {
        return react_1.default.createElement(Settings_1.default, { onBack: () => setShowSettings(false) });
    }
    return (react_1.default.createElement("div", { style: {
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(10px)",
            padding: "32px",
            minHeight: "90vh",
            borderRadius: "16px",
            overflow: "visible",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
        } },
        react_1.default.createElement(Title, { level: 2, style: { color: "#fff", marginBottom: "16px", marginTop: "0px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            "Verity",
            react_1.default.createElement(antd_1.Button, { icon: react_1.default.createElement(icons_1.SettingOutlined, null), onClick: () => setShowSettings(true), style: { backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '20px' } })),
        react_1.default.createElement(antd_1.Card, { type: "inner", title: "Content", onClick: () => clipboardText.length > 100 && setIsContentExpanded(!isContentExpanded), style: {
                backgroundColor: "#b9b9b9",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                marginBottom: "16px",
                cursor: clipboardText.length > 100 ? "pointer" : "default",
            }, headStyle: { backgroundColor: "#b9b9b9", borderBottom: "none" }, bodyStyle: { backgroundColor: "#b9b9b9", fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } }, clipboardText.length > 100 && !isContentExpanded
            ? `${clipboardText.substring(0, 100)}...`
            : clipboardText),
        react_1.default.createElement(antd_1.Card, { loading: loading, style: {
                backgroundColor: "#2f2f2e",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            } },
            react_1.default.createElement(antd_1.Flex, { align: "center", gap: "large" },
                react_1.default.createElement(antd_1.Progress, { type: "circle", percent: Math.abs(confidence) * 100, strokeColor: getProgressColor(), trailColor: "#ffffff", format: (percent) => (react_1.default.createElement("span", { style: { color: '#b9b9b9' } }, `${Math.round(Math.abs(confidence) * 100)}%`)) }),
                react_1.default.createElement("div", { style: { flex: 1 } },
                    react_1.default.createElement(Text, { style: {
                            color: getLabelColor(truthLabel),
                            fontSize: "18px",
                            fontWeight: "bold",
                            textTransform: "capitalize",
                        } }, truthLabel || "Waiting for verification..."),
                    source && (react_1.default.createElement("div", { style: { marginTop: "8px" } },
                        react_1.default.createElement(antd_1.Tag, { color: source === "public" ? "orange" : "geekblue" }, source.toUpperCase()))),
                    summary && (react_1.default.createElement(antd_1.Card, { onClick: (e) => {
                            e.stopPropagation();
                            summary.length > 400 && setIsSummaryExpanded(!isSummaryExpanded);
                        }, style: {
                            backgroundColor: "#1f1f1e",
                            border: "1px solid #444",
                            borderRadius: "8px",
                            marginTop: "12px",
                            cursor: summary.length > 400 ? "pointer" : "default",
                        }, bodyStyle: { backgroundColor: "#1f1f1e", padding: "12px" } },
                        react_1.default.createElement(Text, { style: { color: "#b9b9b9", fontSize: "14px", fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } }, summary.length > 400 && !isSummaryExpanded
                            ? `${summary.substring(0, 400)}...`
                            : summary)))))),
        citations.length > 0 && (react_1.default.createElement(antd_1.Card, { title: "Citations", style: {
                backgroundColor: "#2f2f2e",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                marginTop: "16px"
            }, headStyle: { color: "#fff", backgroundColor: "#2f2f2e", borderBottom: "1px solid #444" }, bodyStyle: { backgroundColor: "#2f2f2e" } }, source !== "public" ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: 0, listStyle: "none" } }, citations.map((citation, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: "12px" } },
                react_1.default.createElement("a", { rel: "noopener noreferrer", style: { color: "#257cf1", textDecoration: "none", fontWeight: "bold" }, 
                    // onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                    onMouseOut: (e) => e.currentTarget.style.textDecoration = "none" }, citation.document),
                citation.match_snippet && (react_1.default.createElement(Text, { style: { color: "#b9b9b9", fontSize: "14px", display: "block", marginTop: "4px" } }, citation.match_snippet)))))))) : (react_1.default.createElement("ul", { style: { margin: 0, paddingLeft: 0, listStyle: "none" } }, citations.map((citation, index) => (react_1.default.createElement("li", { key: index, style: { marginBottom: "12px" } },
            react_1.default.createElement("a", { href: citation.url, target: "_blank", rel: "noopener noreferrer", style: { color: getStanceColor(citation.stance), textDecoration: "none", fontWeight: "bold" }, onMouseOver: (e) => e.currentTarget.style.textDecoration = "underline", onMouseOut: (e) => e.currentTarget.style.textDecoration = "none" }, citation.source || citation.url),
            citation.snippet && (react_1.default.createElement(Text, { style: { color: "#b9b9b9", fontSize: "14px", display: "block", marginTop: "4px" } }, citation.snippet)))))))))));
};
exports.default = App;
