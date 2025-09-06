import cv2
import mediapipe as mp
import numpy as np
import json
import base64
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from collections import deque

# Configure logging for better server-side insights
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Advanced Height & Full Body Detection System")

# Allow all origins for easy frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class KalmanFilter1D:
    """
    A simple 1D Kalman Filter for smoothing measurements.
    """
    def __init__(self, process_variance, measurement_variance, initial_value=0, initial_estimate_error=1):
        self.process_variance = process_variance  # Q: How much the actual value changes between updates
        self.measurement_variance = measurement_variance # R: How much noise is in the measurement
        self.estimate = initial_value
        self.estimate_error = initial_estimate_error # P: Error in the estimate

    def update(self, measurement):
        # Prediction update
        self.estimate_error += self.process_variance

        # Measurement update
        kalman_gain = self.estimate_error / (self.estimate_error + self.measurement_variance)
        self.estimate = self.estimate + kalman_gain * (measurement - self.estimate)
        self.estimate_error = (1 - kalman_gain) * self.estimate_error
        return self.estimate

    def predict(self):
        # Only update error for prediction, actual value update happens in 'update'
        self.estimate_error += self.process_variance
        return self.estimate # Return current estimate, it's not changed by prediction alone


class HeightAndHolisticDetector:
    """
    Handles holistic body detection, calibration, and height calculation with advanced filtering and accuracy enhancements.
    """
    def __init__(self):
        self.mp_holistic = mp.solutions.holistic
        self.holistic = self.mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=2,  # Max complexity for best accuracy in all detections
            enable_segmentation=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.vis_threshold = 0.7  # Stricter visibility threshold for all landmarks

        # Kalman Filter for smoothing height measurements
        # process_variance: How much we expect the actual height to change (very little for a still person)
        # measurement_variance: How much noise we expect in our pixel-to-CM conversion
        self.kalman_filter = KalmanFilter1D(process_variance=0.005, measurement_variance=0.1) # Tuned for height
        
        self.reset()

    def reset(self):
        """Resets the detector's state for recalibration."""
        self.scale_factor = None
        self.calibration_samples = []
        self.max_calibration_samples = 40  # Increased samples for more robust calibration
        self._is_calibrated = False
        self.kalman_filter = KalmanFilter1D(process_variance=0.005, measurement_variance=0.1)
        logger.info("Height and Holistic detector has been reset for recalibration.")

    def auto_calibrate(self, holistic_results, image_height: int):
        """
        Collects calibration samples using the torso length (shoulders to hips) for a more stable scale factor.
        Requires good visibility of shoulders and hips.
        """
        if not holistic_results.pose_landmarks:
            return 0.0, "No pose detected for calibration."

        landmarks = holistic_results.pose_landmarks.landmark
        
        # Check visibility of key calibration landmarks
        required_landmarks = [
            self.mp_holistic.PoseLandmark.LEFT_SHOULDER,
            self.mp_holistic.PoseLandmark.RIGHT_SHOULDER,
            self.mp_holistic.PoseLandmark.LEFT_HIP,
            self.mp_holistic.PoseLandmark.RIGHT_HIP,
        ]

        for lm_enum in required_landmarks:
            if landmarks[lm_enum.value].visibility < self.vis_threshold:
                return 0.0, "Ensure shoulders and hips are clearly visible and facing camera for calibration."

        shoulder_mid_y = (landmarks[self.mp_holistic.PoseLandmark.LEFT_SHOULDER.value].y + 
                          landmarks[self.mp_holistic.PoseLandmark.RIGHT_SHOULDER.value].y) / 2
        hip_mid_y = (landmarks[self.mp_holistic.PoseLandmark.LEFT_HIP.value].y + 
                     landmarks[self.mp_holistic.PoseLandmark.RIGHT_HIP.value].y) / 2
        
        torso_pixels = abs(shoulder_mid_y - hip_mid_y) * image_height
        
        # Use an average adult torso length in cm. This is a critical assumption.
        # This value can be adjusted based on the typical demographic of users.
        avg_torso_cm = 50.0 # From shoulders to hips, generally stable for adults

        if torso_pixels > 20:  # Basic sanity check for reasonable pixel distance
            current_scale_factor = avg_torso_cm / torso_pixels
            self.calibration_samples.append(current_scale_factor)

            if len(self.calibration_samples) >= self.max_calibration_samples:
                # Use a more robust average like median or trimmed mean to discard outliers
                sorted_samples = sorted(self.calibration_samples)
                # Trim 10% from both ends
                trim_count = int(len(sorted_samples) * 0.1)
                trimmed_samples = sorted_samples[trim_count:-trim_count] if trim_count > 0 else sorted_samples
                
                if trimmed_samples:
                    self.scale_factor = np.mean(trimmed_samples)
                    self._is_calibrated = True
                    logger.info(f"Auto-calibration complete. Scale factor set to {self.scale_factor:.4f}")
                else:
                    return 0.0, "Not enough valid samples after trimming. Try again."
        
        progress = len(self.calibration_samples) / self.max_calibration_samples
        return progress, "Stand still, facing the camera, with full torso visible."

    def get_body_landmarks_status(self, holistic_results):
        """Checks the visibility of key body landmarks for height calculation."""
        if not holistic_results.pose_landmarks:
            return False, False, False, "No pose detected."
        
        landmarks = holistic_results.pose_landmarks.landmark
        
        # Check head visibility (eyes and nose)
        head_landmarks = [
            landmarks[self.mp_holistic.PoseLandmark.LEFT_EYE.value],
            landmarks[self.mp_holistic.PoseLandmark.RIGHT_EYE.value],
            landmarks[self.mp_holistic.PoseLandmark.NOSE.value]
        ]
        head_visible = all(lm.visibility > self.vis_threshold for lm in head_landmarks)

        # Check feet visibility (foot index and heels)
        feet_landmarks = [
            landmarks[self.mp_holistic.PoseLandmark.LEFT_FOOT_INDEX.value],
            landmarks[self.mp_holistic.PoseLandmark.RIGHT_FOOT_INDEX.value],
            landmarks[self.mp_holistic.PoseLandmark.LEFT_HEEL.value],
            landmarks[self.mp_holistic.PoseLandmark.RIGHT_HEEL.value]
        ]
        feet_visible = any(lm.visibility > self.vis_threshold for lm in feet_landmarks) # At least one foot landmark must be visible

        # Check hand visibility (wrist as a proxy for general hand presence)
        hands_visible = False
        if holistic_results.left_hand_landmarks and holistic_results.right_hand_landmarks:
             hands_visible = True # We have landmarks for both hands
        elif holistic_results.left_hand_landmarks or holistic_results.right_hand_landmarks:
             hands_visible = True # At least one hand detected

        if not head_visible:
            return False, False, hands_visible, "Ensure head (eyes, nose) is visible."
        if not feet_visible:
            return head_visible, False, hands_visible, "Ensure feet are visible."
            
        return head_visible, feet_visible, hands_visible, "All major body parts visible."

    def calculate_height(self, holistic_results, image_shape):
        """
        Calculates height from the estimated top of the head to the bottom of the feet.
        This version uses a more robust estimation for the true head top.
        """
        image_height, image_width = image_shape[:2]
        
        if not holistic_results.pose_landmarks:
            return None, None, None, "No pose detected for height calculation."

        landmarks = holistic_results.pose_landmarks.landmark
        
        # --- 1. Estimate Top of the Head ---
        # Using a combination of ear, eye, and nose for robustness
        potential_head_top_landmarks = []
        # Prioritize ears for robust side-profile detection
        if landmarks[self.mp_holistic.PoseLandmark.LEFT_EAR.value].visibility > self.vis_threshold:
            potential_head_top_landmarks.append(landmarks[self.mp_holistic.PoseLandmark.LEFT_EAR.value])
        if landmarks[self.mp_holistic.PoseLandmark.RIGHT_EAR.value].visibility > self.vis_threshold:
            potential_head_top_landmarks.append(landmarks[self.mp_holistic.PoseLandmark.RIGHT_EAR.value])
        
        # Fallback to nose if ears aren't visible enough, or for front-facing
        if not potential_head_top_landmarks and landmarks[self.mp_holistic.PoseLandmark.NOSE.value].visibility > self.vis_threshold:
            potential_head_top_landmarks.append(landmarks[self.mp_holistic.PoseLandmark.NOSE.value])

        if not potential_head_top_landmarks:
            return None, None, None, "Head landmarks (ears/nose) not clearly visible."

        # Find the highest point among visible upper head landmarks
        highest_head_lm = min(potential_head_top_landmarks, key=lambda lm: lm.y)
        highest_head_y_pixels = highest_head_lm.y * image_height
        
        # Estimate head size (cranium height above the eyes/ears)
        # Using shoulder width as a proxy for body scale if available
        shoulder_width_pixels = 0
        if (landmarks[self.mp_holistic.PoseLandmark.LEFT_SHOULDER.value].visibility > self.vis_threshold and 
            landmarks[self.mp_holistic.PoseLandmark.RIGHT_SHOULDER.value].visibility > self.vis_threshold):
            shoulder_width_pixels = abs(landmarks[self.mp_holistic.PoseLandmark.LEFT_SHOULDER.value].x - 
                                        landmarks[self.mp_holistic.PoseLandmark.RIGHT_SHOULDER.value].x) * image_width
        
        # If shoulders are not visible, use eye-to-eye distance (interocular)
        elif (landmarks[self.mp_holistic.PoseLandmark.LEFT_EYE.value].visibility > self.vis_threshold and 
              landmarks[self.mp_holistic.PoseLandmark.RIGHT_EYE.value].visibility > self.vis_threshold):
            interocular_dist_pixels = np.sqrt(((landmarks[self.mp_holistic.PoseLandmark.LEFT_EYE.value].x - 
                                                 landmarks[self.mp_holistic.PoseLandmark.RIGHT_EYE.value].x) * image_width)**2 + 
                                               ((landmarks[self.mp_holistic.PoseLandmark.LEFT_EYE.value].y - 
                                                 landmarks[self.mp_holistic.PoseLandmark.RIGHT_EYE.value].y) * image_height)**2)
            # Head width is roughly 2.5-3x interocular distance
            shoulder_width_pixels = interocular_dist_pixels * 2.8 # Use this as a proxy for a wider body scale
        
        # Fallback head offset if no scale reference
        if shoulder_width_pixels < 50: # Minimum reasonable value
            head_offset_pixels = 0.08 * image_height # A fixed small percentage of image height as fallback
        else:
            # Estimate head height above visible point based on body scale (e.g., shoulder width)
            # This ratio (0.2-0.3) needs to be tuned - head height is about 20-30% of shoulder width.
            head_offset_pixels = shoulder_width_pixels * 0.25 
        
        estimated_head_top_y_pixels = highest_head_y_pixels - head_offset_pixels
        
        # --- 2. Find Bottom of the Feet ---
        # Prioritize foot index (toes) for the lowest point, fallback to heels.
        foot_landmarks_y = []
        
        if landmarks[self.mp_holistic.PoseLandmark.LEFT_FOOT_INDEX.value].visibility > self.vis_threshold:
            foot_landmarks_y.append(landmarks[self.mp_holistic.PoseLandmark.LEFT_FOOT_INDEX.value].y)
        if landmarks[self.mp_holistic.PoseLandmark.RIGHT_FOOT_INDEX.value].visibility > self.vis_threshold:
            foot_landmarks_y.append(landmarks[self.mp_holistic.PoseLandmark.RIGHT_FOOT_INDEX.value].y)
        
        # Fallback to heels if toes aren't visible
        if not foot_landmarks_y:
            if landmarks[self.mp_holistic.PoseLandmark.LEFT_HEEL.value].visibility > self.vis_threshold:
                foot_landmarks_y.append(landmarks[self.mp_holistic.PoseLandmark.LEFT_HEEL.value].y)
            if landmarks[self.mp_holistic.PoseLandmark.RIGHT_HEEL.value].visibility > self.vis_threshold:
                foot_landmarks_y.append(landmarks[self.mp_holistic.PoseLandmark.RIGHT_HEEL.value].y)
                
        if not foot_landmarks_y:
            return None, None, None, "Feet landmarks (toes/heels) not clearly visible."
            
        lowest_foot_y_pixels = max(foot_landmarks_y) * image_height

        # --- 3. Calculate and Smooth Height ---
        height_pixels = abs(estimated_head_top_y_pixels - lowest_foot_y_pixels)
        
        if height_pixels < 100: # Sanity check: min reasonable pixel height
            return None, None, None, "Calculated pixel height too small, check pose."

        raw_height_cm = height_pixels * self.scale_factor
        
        # Update Kalman filter
        self.kalman_filter.predict()
        smoothed_height_cm = self.kalman_filter.update(raw_height_cm)
        
        # --- 4. Calculate Confidence Score ---
        # Confidence based on visibility of key landmarks and Kalman filter estimate error
        # Include hands if they were detected well.
        
        total_visible_landmarks_count = 0
        total_visibility_sum = 0
        
        # Pose landmarks involved in height calculation
        pose_lms_for_confidence = potential_head_top_landmarks + [landmarks[self.mp_holistic.PoseLandmark.LEFT_HIP.value], 
                                                                    landmarks[self.mp_holistic.PoseLandmark.RIGHT_HIP.value]]
        if foot_landmarks_y: # Add visible feet landmarks used
            pose_lms_for_confidence.extend([landmarks[self.mp_holistic.PoseLandmark.LEFT_FOOT_INDEX.value], 
                                             landmarks[self.mp_holistic.PoseLandmark.RIGHT_FOOT_INDEX.value],
                                             landmarks[self.mp_holistic.PoseLandmark.LEFT_HEEL.value],
                                             landmarks[self.mp_holistic.PoseLandmark.RIGHT_HEEL.value]])

        for lm in pose_lms_for_confidence:
            if lm.visibility > self.vis_threshold:
                total_visible_landmarks_count += 1
                total_visibility_sum += lm.visibility

        # Add hand landmark visibility to overall confidence if hands are detected
        if holistic_results.left_hand_landmarks:
            for lm in holistic_results.left_hand_landmarks.landmark:
                if lm.visibility > self.vis_threshold:
                    total_visible_landmarks_count += 1
                    total_visibility_sum += lm.visibility
        if holistic_results.right_hand_landmarks:
            for lm in holistic_results.right_hand_landmarks.landmark:
                if lm.visibility > self.vis_threshold:
                    total_visible_landmarks_count += 1
                    total_visibility_sum += lm.visibility
        
        avg_visibility_score = (total_visibility_sum / total_visible_landmarks_count) if total_visible_landmarks_count > 0 else 0
        
        # Incorporate Kalman filter's estimate error: smaller error means higher confidence
        kalman_confidence_factor = max(0.1, 1 - self.kalman_filter.estimate_error * 5) # Scale factor for error
        
        final_confidence = avg_visibility_score * kalman_confidence_factor * 100
        
        # Clamp confidence to a reasonable range
        final_confidence = max(0, min(final_confidence, 99.9))

        return {
            'height_cm': round(smoothed_height_cm, 1),
            'height_feet_inches': f"{int(smoothed_height_cm / 30.48)}' {round((smoothed_height_cm / 2.54) % 12, 1)}\"",
            'confidence': round(final_confidence, 1)
        }, (int(highest_head_lm.x * image_width), int(estimated_head_top_y_pixels)), int(head_offset_pixels * 1.5), "Height calculated successfully."

    def draw_landmarks(self, image, holistic_results):
        """
        Draws pose, face, and hand landmarks and their connections on the image.
        """
        # Draw pose landmarks
        if holistic_results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                image, holistic_results.pose_landmarks, self.mp_holistic.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
            )
        
        # Draw left hand landmarks
        if holistic_results.left_hand_landmarks:
            self.mp_drawing.draw_landmarks(
                image, holistic_results.left_hand_landmarks, self.mp_holistic.HAND_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(121,22,76), thickness=2, circle_radius=2),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(121,44,250), thickness=2, circle_radius=2)
            )

        # Draw right hand landmarks
        if holistic_results.right_hand_landmarks:
            self.mp_drawing.draw_landmarks(
                image, holistic_results.right_hand_landmarks, self.mp_holistic.HAND_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(color=(80,110,10), thickness=2, circle_radius=2),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(10,140,255), thickness=2, circle_radius=2)
            )
        
        # Draw face mesh (optional, can be very dense, removed for simplicity unless specifically requested)
        # if holistic_results.face_landmarks:
        #     self.mp_drawing.draw_landmarks(
        #         image, holistic_results.face_landmarks, self.mp_holistic.FACEMESH_TESSELATION,
        #         landmark_drawing_spec=None,
        #         connection_drawing_spec=self.mp_drawing.DrawingSpec(color=(0,255,0), thickness=1, circle_radius=1)
        #     )
        
        return image

# Instantiate the detector
detector = HeightAndHolisticDetector()

def process_frame(image):
    """Processes a single frame for holistic detection and height calculation."""
    response = {"type": "info", "message": "No person detected.", "image": None}
    
    # Process the image with Holistic model
    holistic_results = detector.holistic.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    # Draw all detected landmarks
    image_with_landmarks = detector.draw_landmarks(image.copy(), holistic_results) # Draw on a copy

    if not holistic_results.pose_landmarks:
        response = {"type": "info", "message": "No full body pose detected."}
    else:
        head_visible, feet_visible, hands_visible, status_message = detector.get_body_landmarks_status(holistic_results)

        if not (head_visible and feet_visible):
            response = {"type": "info", "message": status_message}
        elif not detector._is_calibrated:
            progress, message = detector.auto_calibrate(holistic_results, image.shape[0])
            response = {"type": "calibrating", "progress": round(progress * 100), "message": message}
        else:
            height_data, head_top_coords, head_marker_radius, height_message = detector.calculate_height(holistic_results, image.shape)
            if height_data:
                response = {"type": "height_update", "height": height_data}
                # Draw visual indicator for the estimated head top
                if head_top_coords:
                    cv2.circle(image_with_landmarks, head_top_coords, max(5, int(head_marker_radius)), (0, 255, 0), -1)
                    # Draw a vertical line from head top to bottom (for visual debugging)
                    lowest_foot_y = max([lm.y for lm in holistic_results.pose_landmarks.landmark if lm.visibility > detector.vis_threshold and lm.y > 0.5] ) * image.shape[0] if holistic_results.pose_landmarks else image.shape[0]
                    cv2.line(image_with_landmarks, (head_top_coords[0], head_top_coords[1]), (head_top_coords[0], int(lowest_foot_y)), (0, 255, 255), 2)
            else:
                response = {"type": "info", "message": height_message}

    # Encode and add image to response
    _, buffer = cv2.imencode('.jpg', image_with_landmarks)
    response["image"] = base64.b64encode(buffer).decode('utf-8')
    return response

@app.get("/")
async def root():
    return {"message": "Advanced Height & Full Body Detection System API is running."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established.")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "reset":
                detector.reset()
                await websocket.send_text(json.dumps({"type": "reset_ack"}))
                continue

            if message["type"] == "image":
                image_data = base64.b64decode(message["data"])
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if image is None:
                    continue

                response = process_frame(image)
                await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        await websocket.close()

def run_camera_detection():
    """Run height detection directly with a camera window."""
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    print("Camera opened successfully! Press 'q' to quit, 'r' to reset calibration.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to read frame from camera.")
            break
        
        # Central processing logic
        holistic_results = detector.holistic.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # Draw all detected landmarks on the frame
        frame_with_landmarks = detector.draw_landmarks(frame.copy(), holistic_results)

        display_message = "No full body pose detected."
        
        if holistic_results.pose_landmarks:
            head_visible, feet_visible, hands_visible, status_message = detector.get_body_landmarks_status(holistic_results)

            if not (head_visible and feet_visible):
                display_message = status_message
            elif not detector._is_calibrated:
                progress, message = detector.auto_calibrate(holistic_results, frame.shape[0])
                display_message = f"Calibrating: {round(progress * 100)}% - {message}"
            else:
                height_data, head_top_coords, head_marker_radius, height_message = detector.calculate_height(holistic_results, frame.shape)
                if height_data:
                    display_message = f"Height: {height_data['height_cm']} cm ({height_data['height_feet_inches']})"
                    confidence_text = f"Confidence: {height_data['confidence']}%"
                    cv2.putText(frame_with_landmarks, confidence_text, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
                    
                    # Draw visual indicator for the estimated head top
                    if head_top_coords:
                        cv2.circle(frame_with_landmarks, head_top_coords, max(5, int(head_marker_radius)), (0, 255, 0), -1)
                        # Draw a vertical line from head top to bottom for visual debugging
                        # Ensure lowest_foot_y is calculated carefully to avoid errors if no feet landmarks are visible
                        lowest_foot_y = frame.shape[0] # Default to bottom of image
                        if holistic_results.pose_landmarks:
                            visible_feet_lms = [lm for lm in holistic_results.pose_landmarks.landmark if lm.visibility > detector.vis_threshold and (lm.y > 0.5 and (lm.x < 1 and lm.x > 0))] # Basic bounds check
                            if visible_feet_lms:
                                lowest_foot_y = max([lm.y for lm in visible_feet_lms]) * frame.shape[0]
                        
                        cv2.line(frame_with_landmarks, (head_top_coords[0], head_top_coords[1]), (head_top_coords[0], int(lowest_foot_y)), (0, 255, 255), 2)
                else:
                    display_message = height_message

        # Flip the frame for display (mirror effect)
        frame_with_landmarks = cv2.flip(frame_with_landmarks, 1)
        
        # Display information on the frame
        cv2.rectangle(frame_with_landmarks, (0, 0), (frame_with_landmarks.shape[1], 40), (0, 0, 0), -1)
        cv2.putText(frame_with_landmarks, display_message, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        cv2.putText(frame_with_landmarks, "Press 'q' to quit, 'r' to reset", (10, frame_with_landmarks.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        cv2.imshow('Advanced Height & Full Body Detection System', frame_with_landmarks)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            detector.reset()
            print("Calibration reset!")
    
    cap.release()
    cv2.destroyAllWindows()
    detector.holistic.close() # Release Holistic resources
    print("Camera detection stopped.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--camera":
        run_camera_detection()
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000, ws="websockets")