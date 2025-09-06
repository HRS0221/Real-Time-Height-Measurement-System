import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
`;

const Title = styled.h3`
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const StatusItem = styled.div<{ status: 'good' | 'warning' | 'error' }>`
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  background: ${props => {
    switch (props.status) {
      case 'good': return '#e8f5e8';
      case 'warning': return '#fff3e0';
      case 'error': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  border: 2px solid ${props => {
    switch (props.status) {
      case 'good': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#f44336';
      default: return '#ddd';
    }
  }};
`;

const StatusLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
`;

const StatusValue = styled.div<{ status: 'good' | 'warning' | 'error' }>`
  font-size: 1rem;
  font-weight: bold;
  color: ${props => {
    switch (props.status) {
      case 'good': return '#2e7d32';
      case 'warning': return '#f57c00';
      case 'error': return '#d32f2f';
      default: return '#666';
    }
  }};
`;

const Instructions = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
`;

const InstructionList = styled.ul`
  margin: 10px 0;
  padding-left: 20px;
`;

const InstructionItem = styled.li`
  margin-bottom: 5px;
`;

const Button = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin: 10px 5px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #5a6fd8;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

interface ControlPanelProps {
  isCalibrated: boolean;
  isDetecting: boolean;
  cameraError: string | null;
  onReset?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isCalibrated,
  isDetecting,
  cameraError,
  onReset
}) => {
  const getCalibrationStatus = (): { status: 'good' | 'warning' | 'error', text: string } => {
    if (cameraError) {
      return { status: 'error', text: 'Camera Error' };
    }
    if (isCalibrated) {
      return { status: 'good', text: 'Calibrated' };
    }
    return { status: 'warning', text: 'Not Calibrated' };
  };

  const getDetectionStatus = (): { status: 'good' | 'warning' | 'error', text: string } => {
    if (cameraError) {
      return { status: 'error', text: 'Camera Error' };
    }
    if (isDetecting) {
      return { status: 'good', text: 'Detecting' };
    }
    if (isCalibrated) {
      return { status: 'warning', text: 'Ready' };
    }
    return { status: 'warning', text: 'Not Ready' };
  };

  const calibrationStatus = getCalibrationStatus();
  const detectionStatus = getDetectionStatus();

  return (
    <PanelContainer>
      <Title>System Status</Title>
      
      <StatusGrid>
        <StatusItem status={calibrationStatus.status}>
          <StatusLabel>Calibration</StatusLabel>
          <StatusValue status={calibrationStatus.status}>
            {calibrationStatus.text}
          </StatusValue>
        </StatusItem>
        
        <StatusItem status={detectionStatus.status}>
          <StatusLabel>Detection</StatusLabel>
          <StatusValue status={detectionStatus.status}>
            {detectionStatus.text}
          </StatusValue>
        </StatusItem>
      </StatusGrid>

      {onReset && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Button onClick={onReset}>
            Reset Calibration
          </Button>
        </div>
      )}

      <Instructions>
        <strong>Usage Instructions:</strong>
        <InstructionList>
          <InstructionItem>Ensure good lighting for better detection</InstructionItem>
          <InstructionItem>Stand straight against a wall or background</InstructionItem>
          <InstructionItem>Keep your full body visible in the camera frame</InstructionItem>
          <InstructionItem>System auto-calibrates using your body measurements</InstructionItem>
          <InstructionItem>Wait for pose landmarks to appear before measuring</InstructionItem>
        </InstructionList>
        
        <strong>Tips for Best Results:</strong>
        <InstructionList>
          <InstructionItem>Use a plain background if possible</InstructionItem>
          <InstructionItem>Stand still during auto-calibration for better accuracy</InstructionItem>
          <InstructionItem>Ensure shoulders and hips are clearly visible for calibration</InstructionItem>
          <InstructionItem>Check that confidence level is above 50%</InstructionItem>
        </InstructionList>
      </Instructions>
    </PanelContainer>
  );
};

export default ControlPanel;
