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
const { Title } = antd_1.Typography;
const Settings = ({ onBack }) => {
    const [affiliation, setAffiliation] = (0, react_1.useState)('');
    const [initialValue, setInitialValue] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const saved = localStorage.getItem('affiliation') || '';
        setAffiliation(saved);
        setInitialValue(saved);
    }, []);
    const handleSave = () => {
        localStorage.setItem('affiliation', affiliation);
        onBack();
    };
    return (react_1.default.createElement("div", { style: {
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(10px)",
            padding: '32px',
            minHeight: '90vh',
            borderRadius: '16px',
            overflow: 'visible',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        } },
        react_1.default.createElement(Title, { level: 2, style: { color: '#fff', marginBottom: '16px', marginTop: '0px' } }, "Settings"),
        react_1.default.createElement(antd_1.Card, { style: {
                backgroundColor: '#2f2f2e',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }, bodyStyle: { backgroundColor: '#2f2f2e' } },
            react_1.default.createElement("label", { style: { color: '#fff', display: 'block', marginBottom: '8px' } }, "Affiliation"),
            react_1.default.createElement(antd_1.Input, { value: affiliation, onChange: (e) => setAffiliation(e.target.value), placeholder: "Enter your affiliation", style: {
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    backgroundColor: "#b9b9b9"
                } }),
            react_1.default.createElement(antd_1.Button, { type: "primary", onClick: handleSave, disabled: affiliation === initialValue, style: {
                    backgroundColor: '#257cf1',
                    borderColor: '#257cf1',
                    borderRadius: '20px',
                    marginRight: '8px',
                } }, "Save"),
            react_1.default.createElement(antd_1.Button, { onClick: onBack, style: {
                    borderRadius: '20px',
                    backgroundColor: "#b9b9b9"
                } }, "Back"))));
};
exports.default = Settings;
