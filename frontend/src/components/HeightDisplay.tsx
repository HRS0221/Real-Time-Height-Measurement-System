import React from 'react';
import styled from 'styled-components';

const DisplayContainer = styled.div`
  text-align: center;
  position: relative;
`;

const Title = styled.h3`
  margin: 0 0 25px 0;
  color: #333;
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HeightValue = styled.div<{ isDetecting: boolean }>`
  font-size: 4rem;
  font-weight: 900;
  color: ${props => props.isDetecting ? '#4CAF50' : '#999'};
  margin-bottom: 20px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  position: relative;
  
  ${props => props.isDetecting && `
    animation: pulse 2s infinite;
    transform: scale(1.05);
  `}
  
  @keyframes pulse {
    0%, 100% { transform: scale(1.05); }
    50% { transform: scale(1.1); }
  }
`;

const UnitDisplay = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 25px;
`;

const UnitCard = styled.div`
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
  }
`;

const UnitLabel = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const UnitValue = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  color: #333;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatusMessage = styled.div<{ type: 'info' | 'warning' | 'error' }>`
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  font-weight: 500;
  background: ${props => {
    switch (props.type) {
      case 'info': return '#e3f2fd';
      case 'warning': return '#fff3e0';
      case 'error': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'info': return '#1976d2';
      case 'warning': return '#f57c00';
      case 'error': return '#d32f2f';
      default: return '#666';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'info': return '#2196f3';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#ccc';
    }
  }};
`;

const ConfidenceBar = styled.div`
  margin-top: 15px;
`;

const ConfidenceLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
`;

const ConfidenceBarFill = styled.div<{ confidence: number }>`
  height: 8px;
  background: linear-gradient(90deg, #f44336 0%, #ff9800 50%, #4CAF50 100%);
  border-radius: 4px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: ${props => props.confidence * 100}%;
    top: 0;
    width: 2px;
    height: 100%;
    background: white;
    box-shadow: 0 0 3px rgba(0,0,0,0.3);
  }
`;

const ConfidenceValue = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  text-align: right;
`;

interface HeightData {
  height_cm: number;
  height_feet_inches: string;
  confidence: number;
  method?: string;
  marker_seen?: boolean;
}

interface HeightDisplayProps {
  heightData: HeightData | null;
  isDetecting: boolean;
  isCalibrated: boolean;
}

const HeightDisplay: React.FC<HeightDisplayProps> = ({
  heightData,
  isDetecting,
  isCalibrated
}) => {
  // No need for formatFeetInches since backend now provides formatted string

  const getStatusMessage = () => {
    if (!isCalibrated) {
      return {
        type: 'info' as const,
        message: 'System will auto-calibrate when you stand in front of the camera with full body visible.'
      };
    }
    
    if (!isDetecting) {
      return {
        type: 'info' as const,
        message: 'Stand in front of the camera to measure your height.'
      };
    }
    
    if (heightData && heightData.confidence < 0.5) {
      return {
        type: 'warning' as const,
        message: 'Low confidence detection. Try standing straight and ensure good lighting.'
      };
    }
    
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <DisplayContainer>
      <Title>Height Measurement</Title>
      
      {heightData && isDetecting ? (
        <>
          <HeightValue isDetecting={isDetecting}>
            {heightData.height_cm.toFixed(1)} cm
          </HeightValue>
          
          <UnitDisplay>
            <UnitCard>
              <UnitLabel>Centimeters</UnitLabel>
              <UnitValue>{heightData.height_cm.toFixed(1)}</UnitValue>
            </UnitCard>
            
            <UnitCard>
              <UnitLabel>Feet & Inches</UnitLabel>
              <UnitValue>{heightData.height_feet_inches}</UnitValue>
            </UnitCard>
          </UnitDisplay>
          
          <ConfidenceBar>
            <ConfidenceLabel>Detection Confidence</ConfidenceLabel>
            <ConfidenceBarFill confidence={heightData.confidence / 100} />
            <ConfidenceValue>{heightData.confidence.toFixed(0)}%</ConfidenceValue>
          </ConfidenceBar>
          
          <StatusMessage type="info">
            <strong>System:</strong> Advanced Holistic Detection with Kalman Filtering
            {heightData.method && ` - ${heightData.method}`}
          </StatusMessage>
        </>
      ) : (
        <HeightValue isDetecting={false}>
          {isCalibrated ? '--' : 'N/A'}
        </HeightValue>
      )}
      
      {statusMessage && (
        <StatusMessage type={statusMessage.type}>
          {statusMessage.message}
        </StatusMessage>
      )}
    </DisplayContainer>
  );
};

export default HeightDisplay;
