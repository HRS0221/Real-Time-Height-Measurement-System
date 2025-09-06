import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const CalibrationContainer = styled.div`
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

const StatusBadge = styled.div<{ isCalibrated: boolean }>`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  background: ${props => props.isCalibrated ? '#4CAF50' : '#FF9800'};
  color: white;
  margin-bottom: 15px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 12px;
  background: ${props => props.disabled ? '#ccc' : '#667eea'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background 0.3s;
  
  &:hover {
    background: ${props => props.disabled ? '#ccc' : '#5a6fd8'};
  }
`;

const Instructions = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #f44336;
  color: white;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  background: #4CAF50;
  color: white;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
`;

interface CalibrationComponentProps {
  onCalibrationComplete: () => void;
  isCalibrated: boolean;
}

const CalibrationComponent: React.FC<CalibrationComponentProps> = ({
  onCalibrationComplete,
  isCalibrated
}) => {
  const [referenceObject, setReferenceObject] = useState('credit_card');
  const [customHeight, setCustomHeight] = useState('');
  const [referenceHeightPixels, setReferenceHeightPixels] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const referenceObjects = {
    credit_card: { name: 'Credit Card', height: 5.4 },
    a4_paper: { name: 'A4 Paper (width)', height: 21.0 },
    a4_paper_height: { name: 'A4 Paper (height)', height: 29.7 },
    iphone: { name: 'iPhone (height)', height: 14.7 },
    custom: { name: 'Custom', height: 0 }
  };

  const handleCalibrate = async () => {
    if (!referenceHeightPixels || parseFloat(referenceHeightPixels) <= 0) {
      setError('Please enter a valid pixel height for the reference object');
      return;
    }

    const heightCm = referenceObject === 'custom' 
      ? parseFloat(customHeight) 
      : referenceObjects[referenceObject as keyof typeof referenceObjects].height;

    if (heightCm <= 0) {
      setError('Please enter a valid height for the reference object');
      return;
    }

    setIsCalibrating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:8000/calibrate', {
        reference_height_cm: heightCm,
        reference_height_pixels: parseFloat(referenceHeightPixels)
      });

      if (response.data.status === 'calibrated') {
        setSuccess('Calibration completed successfully!');
        onCalibrationComplete();
      } else {
        setError('Calibration failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running.');
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <CalibrationContainer>
      <Title>System Calibration</Title>
      
      <StatusBadge isCalibrated={true}>
        ✓ Auto-Calibrated
      </StatusBadge>

      <SuccessMessage>
        ✓ System uses automatic calibration - no manual setup required!
      </SuccessMessage>

      {false && (
        <>
          <FormGroup>
            <Label>Reference Object:</Label>
            <Select 
              value={referenceObject} 
              onChange={(e) => setReferenceObject(e.target.value)}
            >
              {Object.entries(referenceObjects).map(([key, obj]) => (
                <option key={key} value={key}>
                  {obj.name} {obj.height > 0 ? `(${obj.height}cm)` : ''}
                </option>
              ))}
            </Select>
          </FormGroup>

          {referenceObject === 'custom' && (
            <FormGroup>
              <Label>Custom Height (cm):</Label>
              <Input
                type="number"
                step="0.1"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                placeholder="Enter height in cm"
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Reference Object Height in Pixels:</Label>
            <Input
              type="number"
              step="1"
              value={referenceHeightPixels}
              onChange={(e) => setReferenceHeightPixels(e.target.value)}
              placeholder="Measure and enter pixel height"
            />
          </FormGroup>

          <Button 
            onClick={handleCalibrate}
            disabled={isCalibrating || !referenceHeightPixels}
          >
            {isCalibrating ? 'Calibrating...' : 'Calibrate System'}
          </Button>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Instructions>
            <strong>Calibration Instructions:</strong><br/>
            1. Place the reference object next to where the person will stand<br/>
            2. Take a photo or measure the object's height in pixels<br/>
            3. Enter the pixel height above<br/>
            4. Click "Calibrate System"<br/>
            <em>Note: The reference object should be at the same distance as the person will be.</em>
          </Instructions>
        </>
      )}

      <Instructions>
        <strong>Advanced Holistic Detection System:</strong><br/>
        • <strong>Full Body Detection:</strong> Detects pose, hands, and face landmarks<br/>
        • <strong>Kalman Filtering:</strong> Advanced smoothing for stable measurements<br/>
        • <strong>Smart Calibration:</strong> Uses torso length with 40 samples and trimmed mean<br/>
        • <strong>Precise Head Detection:</strong> Uses ears, eyes, and nose with body scale reference<br/>
        • <strong>Enhanced Accuracy:</strong> Measures from true head top to toe tips<br/>
        • <strong>Visual Feedback:</strong> Shows head top markers and measurement lines<br/>
        • Works best when you stand 2-3 meters from camera with full body visible
      </Instructions>
    </CalibrationContainer>
  );
};

export default CalibrationComponent;
