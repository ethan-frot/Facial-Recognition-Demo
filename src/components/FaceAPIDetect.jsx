import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const FaceAPIDetect = () => {
  const videoRef = useRef(null);
  const [descriptionUser, setDescriptionUser] = useState({
    age: 0,
    gender: "",
  });
  const [ageHistory, setAgeHistory] = useState([]);
  const navigate = useNavigate();
  const canvasContainerRef = useRef(null);
  const [faceDetectActive, setFaceDetectActive] = useState(true);
  const [intervalState, setIntervalState] = useState(null);

  useEffect(() => {
    if (!faceDetectActive) return;

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      faceapi.nets.ageGenderNet.loadFromUri("/models"),
    ]).then(startVideo);
  }, [faceDetectActive]);

  useEffect(() => {
    if (videoRef) {
      startVideo();
    }
  }, [videoRef, faceDetectActive]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("err", err));
  };

  const handlePlay = () => {
    if (!faceDetectActive) return;

    if (videoRef.current) {
      const video = videoRef.current;

      const canvas = faceapi.createCanvasFromMedia(video);
      canvasContainerRef.current.append(canvas);
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const captureDuration = 3000; // Capture duration in milliseconds
      let startTime = new Date().getTime(); // Capture start time
      let currentWindowStartTime = startTime; // Track the start time of the current window

      const interval = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        if (detections && detections.length > 0) {
          const currentAge = Math.floor(detections[0].age);
          const currentGender = detections[0].gender;

          setAgeHistory((prevAgeHistory) => [...prevAgeHistory, currentAge]);

          const currentTime = new Date().getTime();

          // Check if 3 seconds have passed since the start of the current window
          if (currentTime - currentWindowStartTime >= captureDuration) {
            const averageAge =
              ageHistory.length > 0
                ? ageHistory.reduce((sum, age) => sum + age, 0) /
                  ageHistory.length
                : currentAge;

            setDescriptionUser({
              age: averageAge,
              gender: currentGender,
            });

            // Reset ageHistory and start a new 3-second window
            setAgeHistory([]);
            currentWindowStartTime = currentTime;
          }

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        } else {
          // Handle the case when no face is detected
          setDescriptionUser({
            age: "Attente de détection...",
            gender: "Attente de détection...",
          });

          // Reset ageHistory and start a new 3-second window
          setAgeHistory([]);
          currentWindowStartTime = new Date().getTime();
        }
      }, 100);

      setIntervalState(interval);
    }
  };

  return (
    <>
      <div className="age-test">
        <h1>Venez testez votre age !</h1>
        <h2>(Mettez vous seul devant la caméra et attendez ✨) </h2>
        <h3>Age : {descriptionUser?.age}</h3>
        <h3>Gender : {descriptionUser?.gender}</h3>
      </div>
      <div className="video">
        {<div className="canvas-container" ref={canvasContainerRef}></div>}
        <video
          ref={videoRef}
          width="720"
          height="560"
          autoPlay
          muted
          onPlay={handlePlay}
        ></video>
      </div>
    </>
  );
};

export default FaceAPIDetect;
