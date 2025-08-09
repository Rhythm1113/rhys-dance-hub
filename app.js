const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    videoElement.srcObject = stream;
    await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            resolve(videoElement);
        };
    });
    videoElement.play();
}

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});

// Function to draw pose landmarks on the canvas
function drawLandmarks(landmarks, ctx) {
    for (let i = 0; i < landmarks.length; i++) {
        const { x, y } = landmarks[i];
        ctx.beginPath();
        ctx.arc(x * canvasElement.width, y * canvasElement.height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}

// Send pose data to the backend
async function sendPoseData(poseLandmarks) {
    try {
        const response = await fetch('http://localhost:3019/savePoseData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poseLandmarks })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Pose data saved successfully:', data);
    } catch (error) {
        console.error('Error saving pose data:', error);
    }
}

// Define the onResults callback once
pose.onResults((results) => {
    // Clear canvas and draw the video
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0);

    // If pose landmarks are detected, draw them and send data
    if (results.poseLandmarks) {
        drawLandmarks(results.poseLandmarks, canvasCtx);
        sendPoseData(results.poseLandmarks); // Send pose data to the backend
    }

    canvasCtx.restore();
});

// Set up camera and start the pose detection
async function detectPose() {
    try {
        await setupCamera();
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        camera.start();
    } catch (error) {
        console.error('Error setting up pose detection:', error);
    }
}

// Start the pose detection
detectPose();
