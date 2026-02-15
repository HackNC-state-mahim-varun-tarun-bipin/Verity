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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const antd_1 = require("antd");
const { Title, Text } = antd_1.Typography;
const App = () => {
    const [clipboardText, setClipboardText] = (0, react_1.useState)("Waiting for clipboard text...");
    const [truthLabel, setTruthLabel] = (0, react_1.useState)("");
    const [confidence, setConfidence] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(true);
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
    const getProgressColor = () => {
        if (confidence > 0.6)
            return "#4CAF50";
        if (confidence < -0.6)
            return "#f44336";
        if (confidence === 0)
            return "#FF9800";
        return "#1890ff";
    };
    (0, react_1.useEffect)(() => {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.on("clipboard-update", (_event, text) => {
            setClipboardText(text);
            setTruthLabel("");
            setConfidence(0);
            setLoading(true);
        });
        ipcRenderer.on("verification-result", (_event, response) => {
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
                }
                catch (e) {
                    setTruthLabel("Error");
                }
            }
        });
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                ipcRenderer.send("hide-window");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    return (react_1.default.createElement("div", { style: {
            backgroundColor: "rgba(21, 21, 20, 0.6)",
            padding: "32px",
            minHeight: "90vh",
            borderRadius: "16px",
            overflow: "visible",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
        } },
        react_1.default.createElement(Title, { level: 2, style: { color: "#fff", marginBottom: "16px", marginTop: "0px" } }, "HeartOverflow"),
        react_1.default.createElement(antd_1.Card, { type: "inner", title: "Content", style: {
                backgroundColor: "#b9b9b9",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                marginBottom: "16px",
            }, headStyle: { backgroundColor: "#b9b9b9", borderBottom: "none" }, bodyStyle: { backgroundColor: "#b9b9b9" } }, clipboardText),
        react_1.default.createElement(antd_1.Card, { loading: loading, style: {
                backgroundColor: "#2f2f2e",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            } },
            react_1.default.createElement(antd_1.Flex, { align: "center", gap: "large" },
                react_1.default.createElement(antd_1.Progress, { type: "circle", percent: Math.abs(confidence) * 100, strokeColor: getProgressColor(), trailColor: "#ffffff", format: (percent) => (react_1.default.createElement("span", { style: { color: '#b9b9b9' } }, `${Math.round(confidence * 100)}%`)) }),
                react_1.default.createElement(Text, { style: {
                        color: getLabelColor(truthLabel),
                        fontSize: "18px",
                        fontWeight: "bold",
                        textTransform: "capitalize",
                    } }, truthLabel || "Waiting for verification...")))));
};
exports.default = App;
