import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import styled, { keyframes } from 'styled-components';

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  aspect-ratio: 640 / 480;
  background: #000;
  border-radius: 10px;
  overflow: hidden; /* Ensures children with border-radius look right */
`;

const VideoElement = styled.video<{ isHidden: boolean }>`
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: ${props => props.isHidden ? 'none' : 'block'};
  transform: scaleX(-1); /* Mirror the video to show correct orientation */
`;

const ProcessedImage = styled.img`
  width: 100%;  
  height: auto;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  transform: scaleX(-1); /* Mirror the processed image to match video */
`;

const StatusOverlay = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
`;

const ErrorMessage = styled.div`
  background: #f44336;
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin: 20px 0;
`;

// --- NEW: Styles for the Start Button and its container ---
const StartContainer = styled(CameraContainer)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: #222;
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
`;

const StartButton = styled.button`
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s ease;
  animation: ${pulse} 2s infinite;

  &:hover {
    transform: scale(1.1);
    animation: none;
  }
`;

const StopButton = styled.button`
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  }
`;

const ButtonContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 10;
`;

interface CameraComponentProps {
  onHeightUpdate: (data: any) => void;
  onDetectionToggle: (detecting: boolean) => void;
  onCameraError: (error: string) => void;
}

export interface CameraComponentHandle {
  resetSystem: () => void;
}

const CameraComponent = forwardRef<CameraComponentHandle, CameraComponentProps>(({
  onHeightUpdate,
  onDetectionToggle,
  onCameraError,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calibrationProgress, setCalibrationProgress] = useState<number | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout>();

  // --- NEW: State to manage user interaction ---
  const [hasInteracted, setHasInteracted] = useState(false);

  const stopDetection = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = undefined;
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (videoRef.current.paused || videoRef.current.ended) videoRef.current.play().catch(console.error);

    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        wsRef.current.send(JSON.stringify({ type: 'image', data: base64Data }));
      }
    }
  }, []);

  const startDetection = useCallback(() => {
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    captureIntervalRef.current = setInterval(captureFrame, 200);
  }, [captureFrame]);

  const initializeWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) wsRef.current.close(1000);

    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => { setIsConnected(true); setError(null); startDetection(); };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.image) setProcessedImage(`data:image/jpeg;base64,${data.image}`);
      switch (data.type) {
        case 'calibrating': setCalibrationProgress(data.progress || 0); onHeightUpdate(null); onDetectionToggle(false); setIsDetecting(false); break;
        case 'height_update': setCalibrationProgress(null); onHeightUpdate(data.height); onDetectionToggle(true); setIsDetecting(true); break;
        case 'info': case 'no_person': onHeightUpdate(null); onDetectionToggle(false); setIsDetecting(false); break;
        case 'reset_ack': setCalibrationProgress(0); break;
      }
    };
    ws.onclose = (event) => {
      setIsConnected(false); stopDetection();
      if (event.code !== 1000) setTimeout(initializeWebSocket, 3000);
    };
    ws.onerror = () => { setError('Connection to server failed.'); onCameraError('Connection to server failed.'); stopDetection(); };
    wsRef.current = ws;
  }, [onHeightUpdate, onDetectionToggle, onCameraError, startDetection, stopDetection]);

  const initializeCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      initializeWebSocket();
      setError(null);
    } catch (err) {
      const errorMsg = 'Camera access denied or not available.';
      setError(errorMsg);
      onCameraError(errorMsg);
    }
  }, [onCameraError, initializeWebSocket]);

  // --- UPDATED: useEffect now waits for user interaction ---
  useEffect(() => {
    if (hasInteracted) {
      initializeCamera();
    }
    return () => {
      stopDetection();
      if (wsRef.current) wsRef.current.close(1000);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [hasInteracted, initializeCamera, stopDetection]);

  const resetSystem = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'reset' }));
    setProcessedImage(null);
    setCalibrationProgress(0);
  }, []);

  useImperativeHandle(ref, () => ({ resetSystem }));

  const getStatusText = () => {
    if (error) return 'Error';
    if (!isConnected) return 'Connecting...';
    if (calibrationProgress !== null) return `Calibrating: ${calibrationProgress}%`;
    if (isDetecting) return 'Detecting...';
    return 'Ready';
  };

  // --- NEW: Handler for the start button ---
  const handleStartClick = () => {
    setHasInteracted(true);
  };

  // --- NEW: Handler for the stop button ---
  const handleStopClick = () => {
    stopDetection();
    setIsDetecting(false);
    setProcessedImage(null);
    setCalibrationProgress(null);
    onDetectionToggle(false);
    
    // Stop the camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000);
    }
    
    // Reset to initial state
    setHasInteracted(false);
    setIsConnected(false);
  };
  
  // --- NEW: Render start screen before interaction ---
  if (!hasInteracted) {
    return (
      <StartContainer>
        <StartButton onClick={handleStartClick}>
          Start Camera
        </StartButton>
      </StartContainer>
    );
  }

  if (error) {
    return <ErrorMessage><h3>System Error</h3><p>{error}</p><button onClick={initializeCamera}>Retry</button></ErrorMessage>;
  }

  return (
    <CameraContainer>
      <StatusOverlay>{getStatusText()}</StatusOverlay>
      <VideoElement ref={videoRef} autoPlay muted playsInline isHidden={!!processedImage} />
      {processedImage && <ProcessedImage src={processedImage} alt="Processed video feed" />}
      <ButtonContainer>
        <StopButton onClick={handleStopClick}>
          Stop Detection
        </StopButton>
      </ButtonContainer>
    </CameraContainer>
  );
});

export default CameraComponent;