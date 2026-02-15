import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Typography } from 'antd';

const { Title } = Typography;

const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [affiliation, setAffiliation] = useState('');
  const [initialValue, setInitialValue] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('affiliation') || '';
    setAffiliation(saved);
    setInitialValue(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem('affiliation', affiliation);
    onBack();
  };

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(10px)",
        padding: '32px',
        minHeight: '90vh',
        borderRadius: '16px',
        overflow: 'visible',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Title level={2} style={{ color: '#fff', marginBottom: '16px', marginTop: '0px' }}>
        Settings
      </Title>
      <Card
        style={{
          backgroundColor: '#2f2f2e',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        bodyStyle={{ backgroundColor: '#2f2f2e' }}
      >
        <label style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>
          Affiliation
        </label>
        <Input
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Enter your affiliation"
          style={{
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            backgroundColor: "#b9b9b9"
          }}
        />
        <Button
          type="primary"
          onClick={handleSave}
          disabled={affiliation === initialValue}
          style={{
            backgroundColor: '#257cf1',
            borderColor: '#257cf1',
            borderRadius: '20px',
            marginRight: '8px',
          }}
        >
          Save
        </Button>
        <Button
          onClick={onBack}
          style={{
            borderRadius: '20px',
            backgroundColor:"#b9b9b9"
          }}
        >
          Back
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
