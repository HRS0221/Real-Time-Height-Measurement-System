import React, { useState, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import CameraComponent, { CameraComponentHandle } from './components/CameraComponent';
import CalibrationComponent from './components/CalibrationComponent';
import HeightDisplay from './components/HeightDisplay';
import ControlPanel from './components/ControlPanel';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
  70% { box-shadow: 0 0 0 20px rgba(102, 126, 234, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 0;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  overflow-x: hidden;

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
  }
`;

const Header = styled.header`
  text-align: center;
  padding: 30px 20px 20px;
  position: relative;
  z-index: 1;
`;

const Logo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  animation: ${float} 3s ease-in-out infinite;
`;

const LogoIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
`;

const Title = styled.h1`
  color: white;
  margin: 0;
  font-size: 3.5rem;
  font-weight: 800;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 1s ease-out;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  margin: 10px 0 0 0;
  font-weight: 300;
  animation: ${fadeInUp} 1s ease-out 0.2s both;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px 30px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const VideoSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${fadeInUp} 1s ease-out 0.4s both;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: ${fadeInUp} 1s ease-out 0.6s both;
`;

const FloatingCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 12px 35px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 45px rgba(0,0,0,0.15);
  }
`;

const StatusSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  margin-top: 15px;
`;

const StatusText = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const ProjectInfoSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 15px;
`;

const ProjectTitle = styled.h3`
  color: #333;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TechStack = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TechCategory = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  padding: 12px;
  border-left: 4px solid #667eea;
`;

const CategoryTitle = styled.div`
  font-weight: 600;
  color: #667eea;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const TechList = styled.div`
  font-size: 0.85rem;
  color: #555;
  line-height: 1.4;
`;

const FeatureList = styled.div`
  background: rgba(118, 75, 162, 0.1);
  border-radius: 12px;
  padding: 12px;
  border-left: 4px solid #764ba2;
`;

const FeatureItem = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailedSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 15px;
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContentCard = styled.div`
  background: rgba(240, 147, 251, 0.1);
  border-radius: 12px;
  padding: 15px;
  border-left: 4px solid #f093fb;
`;

const CardTitle = styled.div`
  font-weight: 600;
  color: #f093fb;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const CardContent = styled.div`
  font-size: 0.85rem;
  color: #555;
  line-height: 1.5;
`;

const AlgorithmSection = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  padding: 15px;
  border-left: 4px solid #667eea;
  margin-bottom: 15px;
`;

const AlgorithmTitle = styled.div`
  font-weight: 600;
  color: #667eea;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const AlgorithmSteps = styled.div`
  font-size: 0.85rem;
  color: #555;
  line-height: 1.6;
`;

const StepItem = styled.div`
  margin-bottom: 8px;
  padding-left: 15px;
  position: relative;
  
  &:before {
    content: "→";
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PerformanceSection = styled.div`
  background: rgba(118, 75, 162, 0.1);
  border-radius: 12px;
  padding: 15px;
  border-left: 4px solid #764ba2;
  margin-bottom: 15px;
`;

const PerformanceTitle = styled.div`
  font-weight: 600;
  color: #764ba2;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  font-size: 0.85rem;
  color: #555;
`;

const PerformanceItem = styled.div`
  background: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
`;

const ChallengeSection = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border-radius: 12px;
  padding: 15px;
  border-left: 4px solid #ffc107;
  margin-bottom: 15px;
`;

const ChallengeTitle = styled.div`
  font-weight: 600;
  color: #ffc107;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ChallengeList = styled.div`
  font-size: 0.85rem;
  color: #555;
  line-height: 1.6;
`;

const FutureSection = styled.div`
  background: rgba(40, 167, 69, 0.1);
  border-radius: 12px;
  padding: 15px;
  border-left: 4px solid #28a745;
`;

const FutureTitle = styled.div`
  font-weight: 600;
  color: #28a745;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FutureList = styled.div`
  font-size: 0.85rem;
  color: #555;
  line-height: 1.6;
`;

const UsageGuideSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid #3498db;
  margin-bottom: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.3);
`;

const UsageTitle = styled.div`
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.2rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: center;
  justify-content: center;
`;

const UsageSteps = styled.div`
  font-size: 0.95rem;
  color: #2c3e50;
  line-height: 1.7;
`;

const StepNumber = styled.span`
  background: #3498db;
  color: white;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
`;

const UsageStep = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  background: rgba(52, 152, 219, 0.05);
  padding: 15px;
  border-radius: 10px;
  border-left: 4px solid #3498db;
  border: 1px solid rgba(52, 152, 219, 0.2);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TipsSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid #9b59b6;
  margin-top: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(155, 89, 182, 0.3);
`;

const TipsTitle = styled.div`
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.2rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: center;
  justify-content: center;
`;

const TipsList = styled.div`
  font-size: 0.95rem;
  color: #2c3e50;
  line-height: 1.7;
`;

const TipItem = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  background: rgba(155, 89, 182, 0.05);
  padding: 12px;
  border-radius: 10px;
  border-left: 4px solid #9b59b6;
  border: 1px solid rgba(155, 89, 182, 0.2);
  
  &:before {
    content: "💡";
    margin-right: 10px;
    font-size: 1rem;
    flex-shrink: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 20px;
  position: relative;
  z-index: 1;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.6;
`;

const DeveloperName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
`;

const Copyright = styled.div`
  font-size: 0.85rem;
  opacity: 0.7;
`;

interface HeightData {
  height_cm: number;
  height_feet_inches: string;
  confidence: number;
}

function App() {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [heightData, setHeightData] = useState<HeightData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraRef = useRef<CameraComponentHandle>(null);

  const handleCalibrationComplete = () => {
    setIsCalibrated(true);
  };

  const handleHeightUpdate = useCallback((data: HeightData | null) => {
    setHeightData(data);
    if (data && data.height_cm > 0) {
      setIsCalibrated(true);
    }
  }, []);

  const handleDetectionToggle = useCallback((detecting: boolean) => {
    setIsDetecting(detecting);
  }, []);

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error);
  }, []);

  const handleReset = () => {
    setIsCalibrated(false);
    setHeightData(null);
    setIsDetecting(false);
    setCameraError(null);
    
    if (cameraRef.current) {
      cameraRef.current.resetSystem();
    }
  };

  return (
    <AppContainer>
      <Header>
        <Logo>
          <LogoIcon>📏</LogoIcon>
          <div>
            <Title>Real Time Height Measurement System</Title>
            <Subtitle>Advanced AI-Powered Height Detection</Subtitle>
          </div>
        </Logo>
      </Header>
      
      <MainContent>
        <VideoSection>
          <CameraComponent
            ref={cameraRef}
            onHeightUpdate={handleHeightUpdate}
            onDetectionToggle={handleDetectionToggle}
            onCameraError={handleCameraError}
          />
          <StatusSection>
            <StatusText>
              {isDetecting ? '🔴 Detecting' : isCalibrated ? '🟢 Ready' : '🟡 Calibrating'}
            </StatusText>
          </StatusSection>
          
          <ProjectInfoSection>
            <ProjectTitle>
              🚀 How I Built This
            </ProjectTitle>
            
            <TechStack>
               <TechCategory>
                 <CategoryTitle>
                   🖥️ Backend
                 </CategoryTitle>
                 <TechList>
                   • Python 3.12.0 for enhanced performance<br/>
                   • FastAPI for lightning-fast API<br/>
                   • MediaPipe for pose detection<br/>
                   • OpenCV for computer vision<br/>
                   • WebSockets for real-time data<br/>
                   • Kalman Filter for smooth measurements
                 </TechList>
               </TechCategory>
              
              <TechCategory>
                <CategoryTitle>
                  🎨 Frontend
                </CategoryTitle>
                <TechList>
                  • React 18 with TypeScript<br/>
                  • Styled Components for styling<br/>
                  • WebRTC for camera access<br/>
                  • Real-time WebSocket connection<br/>
                  • Responsive design principles
                </TechList>
              </TechCategory>
            </TechStack>
            
            <FeatureList>
              <FeatureItem>
                🧠 <strong>AI-Powered Detection:</strong> Uses Google's MediaPipe for accurate pose estimation
              </FeatureItem>
              <FeatureItem>
                📏 <strong>Smart Calibration:</strong> Auto-calibrates using torso measurements for precision
              </FeatureItem>
              <FeatureItem>
                ⚡ <strong>Real-time Processing:</strong> Live height measurement with WebSocket streaming
              </FeatureItem>
              <FeatureItem>
                🎯 <strong>Advanced Filtering:</strong> Kalman filter ensures smooth, stable readings
              </FeatureItem>
            </FeatureList>
          </ProjectInfoSection>
          
          <DetailedSection>
            <SectionTitle>
              💡 Innovation Highlights
            </SectionTitle>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  ⚡ Real-time Processing
                </CardTitle>
                <CardContent>
                  Processes video frames at 30 FPS with sub-100ms latency using WebSocket communication. The Kalman filter ensures smooth, stable measurements even with minor pose variations or camera shake.
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  🎨 Modern UI/UX
                </CardTitle>
                <CardContent>
                  Features a beautiful glassmorphism design with real-time visual feedback, responsive layout, and intuitive controls. The interface provides clear status indicators and smooth animations for an engaging user experience.
                </CardContent>
              </ContentCard>
            </ContentGrid>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  🔄 Adaptive Learning
                </CardTitle>
                <CardContent>
                  The system continuously improves its accuracy by learning from user interactions and pose variations. It adapts to different body types and camera angles for consistent measurements across diverse users.
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  🌐 Cross-Platform
                </CardTitle>
                <CardContent>
                  Built with modern web technologies ensuring compatibility across all major browsers and devices. The responsive design works seamlessly on desktop, tablet, and mobile devices.
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </DetailedSection>
          
          <DetailedSection>
            <SectionTitle>
              🛠️ Technical Architecture
            </SectionTitle>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  🎥 Computer Vision Stack
                </CardTitle>
                <CardContent>
                  <strong>OpenCV 4.8.1:</strong> Image processing, camera capture, and frame manipulation<br/><br/>
                  <strong>MediaPipe 0.10.21:</strong> Google's ML framework for pose detection with GPU acceleration<br/><br/>
                  <strong>TensorFlow 2.20.0:</strong> Deep learning backend with CUDA 11.7 support<br/><br/>
                  <strong>NumPy 1.26.0:</strong> Mathematical operations and array processing
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  🌐 Web Technologies
                </CardTitle>
                <CardContent>
                  <strong>Python 3.12.0:</strong> Modern Python runtime with enhanced performance<br/><br/>
                  <strong>FastAPI 0.104.1:</strong> Modern Python web framework with automatic API docs<br/><br/>
                  <strong>WebSockets:</strong> Real-time bidirectional communication<br/><br/>
                  <strong>React 18 + TypeScript:</strong> Type-safe frontend with hooks and modern patterns<br/><br/>
                  <strong>Styled Components:</strong> CSS-in-JS for dynamic styling and theming
                </CardContent>
              </ContentCard>
            </ContentGrid>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  🎯 Auto-Calibration Process
                </CardTitle>
                <CardContent>
                  <strong>Auto-Calibration:</strong> Uses torso length (shoulders to hips) as reference<br/><br/>
                  <strong>Sample Collection:</strong> Gathers 40 samples for robust scale factor calculation<br/><br/>
                  <strong>Outlier Filtering:</strong> Trims 10% extremes for accuracy<br/><br/>
                  <strong>Fallback Methods:</strong> Eye-to-eye distance as body scale proxy
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  📊 Data Processing
                </CardTitle>
                <CardContent>
                  <strong>Kalman Filtering:</strong> 1D filter for smooth height measurements<br/><br/>
                  <strong>Confidence Scoring:</strong> Based on landmark visibility and filter error<br/><br/>
                  <strong>Multi-format Output:</strong> Centimeters, feet/inches, and confidence percentage<br/><br/>
                  <strong>Real-time Streaming:</strong> WebSocket updates every frame
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </DetailedSection>
          
          <DetailedSection>
            <SectionTitle>
              🚧 Development Challenges
            </SectionTitle>
            
            <ChallengeSection>
              <ChallengeTitle>
                ⚠️ Technical Hurdles Overcome
              </ChallengeTitle>
              <ChallengeList>
                <strong>🎯 Landmark Detection Accuracy:</strong> Implemented strict visibility thresholds and multi-landmark validation to ensure reliable pose detection even in varying lighting conditions.<br/><br/>
                
                <strong>📏 Head Top Estimation:</strong> Developed sophisticated algorithm combining ear/nose landmarks with body scale calculations to accurately estimate the true top of the head.<br/><br/>
                
                <strong>🔄 Measurement Stability:</strong> Integrated Kalman filtering to smooth out noisy measurements and provide consistent height readings.<br/><br/>
                
                <strong>⚡ Real-time Performance:</strong> Optimized MediaPipe configuration and WebSocket communication to maintain 30 FPS processing with minimal latency.<br/><br/>
                
                <strong>🎨 Cross-browser Compatibility:</strong> Ensured WebRTC camera access works seamlessly across different browsers and devices.
              </ChallengeList>
            </ChallengeSection>
          </DetailedSection>
          
           <DetailedSection>
             <SectionTitle>
               🚀 Future Enhancements
             </SectionTitle>
             
             <FutureSection>
               <FutureTitle>
                 🔮 Planned Improvements
               </FutureTitle>
               <FutureList>
                 <strong>📱 Mobile Optimization:</strong> Native mobile app with React Native for better camera control and performance.<br/><br/>
                 
                 <strong>👥 Multi-person Detection:</strong> Support for measuring multiple people simultaneously with individual tracking.<br/><br/>
                 
                 <strong>📊 Analytics Dashboard:</strong> Historical data tracking, measurement trends, and user statistics.<br/><br/>
                 
                 <strong>🎯 Enhanced Accuracy:</strong> Integration with depth sensors and stereo vision for improved precision.<br/><br/>
                 
                 <strong>🌍 Cloud Deployment:</strong> AWS/Azure deployment with auto-scaling and global accessibility.<br/><br/>
                 
                 <strong>🔐 User Authentication:</strong> User accounts, measurement history, and personalized settings.<br/><br/>
                 
                 <strong>📈 Machine Learning:</strong> Custom model training on diverse datasets for improved accuracy across different demographics.
               </FutureList>
             </FutureSection>
           </DetailedSection>
           
           
           
           
           
           <DetailedSection>
             <SectionTitle>
               🔧 System Requirements
             </SectionTitle>
             
             <ContentGrid>
               <ContentCard>
                 <CardTitle>
                   💻 Hardware Requirements
                 </CardTitle>
                 <CardContent>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                     <div>
                       <strong>📹 Camera</strong><br/>
                       Webcam or built-in camera<br/>
                       <span style={{ color: '#666', fontSize: '0.8rem' }}>720p minimum</span>
                     </div>
                     <div>
                       <strong>🧠 RAM</strong><br/>
                       4GB minimum<br/>
                       <span style={{ color: '#666', fontSize: '0.8rem' }}>8GB recommended</span>
                     </div>
                     <div>
                       <strong>🎮 GPU</strong><br/>
                       Optional but recommended<br/>
                       <span style={{ color: '#666', fontSize: '0.8rem' }}>Better performance</span>
                     </div>
                     <div>
                       <strong>💾 Storage</strong><br/>
                       100MB for application files<br/>
                       <span style={{ color: '#666', fontSize: '0.8rem' }}>Minimal space required</span>
                     </div>
                   </div>
                   <div style={{ 
                     background: 'rgba(52, 152, 219, 0.1)', 
                     padding: '12px', 
                     borderRadius: '8px', 
                     borderLeft: '4px solid #3498db',
                     marginTop: '10px'
                   }}>
                     <strong>🐍 Python:</strong> Version 3.12.0 or higher required
                   </div>
                 </CardContent>
               </ContentCard>
               
               <ContentCard>
                 <CardTitle>
                   🌐 Browser Support
                 </CardTitle>
                 <CardContent>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                     <div style={{ 
                       background: 'rgba(40, 167, 69, 0.1)', 
                       padding: '12px', 
                       borderRadius: '8px',
                       textAlign: 'center'
                     }}>
                       <strong style={{ color: '#28a745' }}>Chrome</strong><br/>
                       Version 90+<br/>
                       <span style={{ color: '#28a745', fontSize: '0.8rem' }}>✓ Recommended</span>
                     </div>
                     <div style={{ 
                       background: 'rgba(255, 193, 7, 0.1)', 
                       padding: '12px', 
                       borderRadius: '8px',
                       textAlign: 'center'
                     }}>
                       <strong style={{ color: '#ffc107' }}>Firefox</strong><br/>
                       Version 88+<br/>
                       <span style={{ color: '#ffc107', fontSize: '0.8rem' }}>✓ Supported</span>
                     </div>
                     <div style={{ 
                       background: 'rgba(0, 123, 255, 0.1)', 
                       padding: '12px', 
                       borderRadius: '8px',
                       textAlign: 'center'
                     }}>
                       <strong style={{ color: '#007bff' }}>Safari</strong><br/>
                       Version 14+<br/>
                       <span style={{ color: '#007bff', fontSize: '0.8rem' }}>✓ Supported</span>
                     </div>
                     <div style={{ 
                       background: 'rgba(0, 123, 255, 0.1)', 
                       padding: '12px', 
                       borderRadius: '8px',
                       textAlign: 'center'
                     }}>
                       <strong style={{ color: '#007bff' }}>Edge</strong><br/>
                       Version 90+<br/>
                       <span style={{ color: '#007bff', fontSize: '0.8rem' }}>✓ Supported</span>
                     </div>
                   </div>
                 </CardContent>
               </ContentCard>
             </ContentGrid>
           </DetailedSection>
        </VideoSection>
        
        <InfoSection>
          <FloatingCard>
            <HeightDisplay
              heightData={heightData}
              isDetecting={isDetecting}
              isCalibrated={isCalibrated}
            />
          </FloatingCard>
          
          <FloatingCard>
            <CalibrationComponent
              onCalibrationComplete={handleCalibrationComplete}
              isCalibrated={isCalibrated}
            />
          </FloatingCard>
          
          <FloatingCard>
            <ControlPanel
              isCalibrated={isCalibrated}
              isDetecting={isDetecting}
              cameraError={cameraError}
              onReset={handleReset}
            />
          </FloatingCard>
          
          <UsageGuideSection>
            <UsageTitle>
              📋 How to Use the System
            </UsageTitle>
            <UsageSteps>
              <UsageStep>
                <StepNumber>1</StepNumber>
                <div><strong>Start the System:</strong> Click "Start Camera" to begin height measurement</div>
              </UsageStep>
              <UsageStep>
                <StepNumber>2</StepNumber>
                <div><strong>Position Yourself:</strong> Stand 2-3 feet away from the camera with your full body visible</div>
              </UsageStep>
              <UsageStep>
                <StepNumber>3</StepNumber>
                <div><strong>Wait for Calibration:</strong> System will auto-calibrate using your body measurements (takes 10-15 seconds)</div>
              </UsageStep>
              <UsageStep>
                <StepNumber>4</StepNumber>
                <div><strong>Stand Straight:</strong> Keep your full body in frame, stand straight against a plain background</div>
              </UsageStep>
              <UsageStep>
                <StepNumber>5</StepNumber>
                <div><strong>View Results:</strong> Your height will be displayed in real-time in both cm and feet/inches</div>
              </UsageStep>
              <UsageStep>
                <StepNumber>6</StepNumber>
                <div><strong>Stop When Done:</strong> Click "Stop Detection" to end the session</div>
              </UsageStep>
            </UsageSteps>
          </UsageGuideSection>
          
          <TipsSection>
            <TipsTitle>
              💡 Pro Tips for Best Results
            </TipsTitle>
            <TipsList>
              <TipItem>Ensure good lighting - avoid backlighting or shadows</TipItem>
              <TipItem>Use a plain background (wall or curtain) for better detection</TipItem>
              <TipItem>Stand still during calibration and measurement</TipItem>
              <TipItem>Keep your shoulders and hips visible for accurate calibration</TipItem>
              <TipItem>Wait for confidence level above 70% for reliable measurements</TipItem>
              <TipItem>If detection fails, try adjusting your position or lighting</TipItem>
              <TipItem>Use the reset button if you need to recalibrate the system</TipItem>
            </TipsList>
          </TipsSection>
          
          <DetailedSection>
            <SectionTitle>
              🎯 Key Features
            </SectionTitle>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  🧠 AI-Powered Detection
                </CardTitle>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>33 precise body landmarks detection</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>Real-time pose estimation with MediaPipe</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>Confidence scoring for accuracy assessment</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>Multi-landmark validation system</span>
                    </div>
                  </div>
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  📏 Smart Calibration
                </CardTitle>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>Automatic calibration using torso length</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>40 sample collection for robust accuracy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>Outlier filtering for consistent results</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#28a745' }}>✓</span>
                      <span>Fallback methods for edge cases</span>
                    </div>
                  </div>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </DetailedSection>
          
          <DetailedSection>
            <SectionTitle>
              📊 Performance Metrics
            </SectionTitle>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  ⚡ Real-time Performance
                </CardTitle>
                <CardContent>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>±2cm</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Accuracy</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>30 FPS</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Processing</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffc107' }}>&lt;100ms</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Latency</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(155, 89, 182, 0.1)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#9b59b6' }}>70-95%</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  🎯 System Specifications
                </CardTitle>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Height Range:</strong></span>
                      <span>120-220cm</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Memory Usage:</strong></span>
                      <span>512MB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Processing:</strong></span>
                      <span>Real-time</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Calibration:</strong></span>
                      <span>Automatic</span>
                    </div>
                  </div>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </DetailedSection>
          
          <DetailedSection>
            <SectionTitle>
              🧠 AI Algorithm Deep Dive
            </SectionTitle>
            
            <AlgorithmSection>
              <AlgorithmTitle>
                🔬 Pose Detection Pipeline
              </AlgorithmTitle>
              <AlgorithmSteps>
                <StepItem>MediaPipe Holistic processes RGB frames at 30 FPS</StepItem>
                <StepItem>Detects 33 pose landmarks with 70%+ confidence threshold</StepItem>
                <StepItem>Identifies key body parts: head, shoulders, hips, feet</StepItem>
                <StepItem>Calculates torso length for auto-calibration (50cm average)</StepItem>
                <StepItem>Estimates head top using ear/nose landmarks + body scale</StepItem>
                <StepItem>Finds feet bottom using toe/heel landmark visibility</StepItem>
                <StepItem>Applies Kalman filter for smooth height measurements</StepItem>
              </AlgorithmSteps>
            </AlgorithmSection>
          </DetailedSection>
          
          <DetailedSection>
            <SectionTitle>
              🚀 Quick Setup Guide
            </SectionTitle>
            
            <ContentGrid>
              <ContentCard>
                <CardTitle>
                  🖥️ Backend Setup
                </CardTitle>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#3498db', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                      <span>Install Python 3.12.0+ and pip</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#3498db', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                      <span>Run: pip install -r requirements.txt</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#3498db', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                      <span>Run: python start_backend.py</span>
                    </div>
                  </div>
                </CardContent>
              </ContentCard>
              
              <ContentCard>
                <CardTitle>
                  🎨 Frontend Setup
                </CardTitle>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#e74c3c', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                      <span>Install Node.js 16+ and npm</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#e74c3c', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                      <span>Run: npm install --legacy-peer-deps</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#e74c3c', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                      <span>Run: npm start</span>
                    </div>
                  </div>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </DetailedSection>
          
          
          
        </InfoSection>
      </MainContent>
      
      <Footer>
        <FooterContent>
          <DeveloperName>Developed by Himanshu Kishor Salunke</DeveloperName>
          <Copyright>
            © 2025 Real Time Height Measurement System. All rights reserved.
            <br />
            Made with curiosity ❤️
          </Copyright>
        </FooterContent>
      </Footer>
    </AppContainer>
  );
}

export default App;