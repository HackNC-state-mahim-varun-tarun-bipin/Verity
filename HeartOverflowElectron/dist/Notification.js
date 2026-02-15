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
const { ipcRenderer } = window.require("electron");
const Notification = () => {
    const [truthLabel, setTruthLabel] = (0, react_1.useState)("Checking...");
    const [confidence, setConfidence] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const handleTruthLabel = (_event, label) => {
            setTruthLabel(label);
            if (label !== "Checking...") {
                setLoading(false);
            }
            else {
                setLoading(true);
            }
        };
        const handleConfidence = (_event, conf) => {
            setConfidence(conf);
        };
        ipcRenderer.on("truth-label", handleTruthLabel);
        ipcRenderer.on("confidence", handleConfidence);
        return () => {
            ipcRenderer.removeListener("truth-label", handleTruthLabel);
            ipcRenderer.removeListener("confidence", handleConfidence);
        };
    }, []);
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
    const getProgressColor = (label) => {
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
        ipcRenderer.send("open-dashboard");
    };
    return (react_1.default.createElement("div", { onClick: handleClick, style: {
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
        } }, loading ? (react_1.default.createElement(antd_1.Spin, null)) : (react_1.default.createElement(antd_1.Flex, { align: "center", gap: "middle" },
        react_1.default.createElement(antd_1.Progress, { type: "circle", percent: Math.round(Math.abs(confidence) * 100), strokeColor: getProgressColor(truthLabel), trailColor: "#ffffff", format: (percent) => react_1.default.createElement("span", { style: { color: 'white', fontSize: '10px', fontWeight: 600 } },
                percent,
                "%"), size: 50 }),
        react_1.default.createElement("div", null,
            react_1.default.createElement("div", { style: { fontSize: "14px", fontWeight: 600, marginBottom: "4px" } }, truthLabel),
            react_1.default.createElement("div", { style: { fontSize: "10px", opacity: 0.7 } }, "Click for details"))))));
};
exports.default = Notification;
