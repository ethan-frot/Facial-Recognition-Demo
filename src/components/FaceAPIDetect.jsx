// import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const FaceAPIDetect = () => {
  const videoRef = useRef(null);
  const [descriptionUser, setDescriptionUser] = useState("");
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
    console.log("startVideo");
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

    console.log("handlePlay");
    if (videoRef.current) {
      console.log("handlePlay2");
      const video = videoRef.current;

      const canvas = faceapi.createCanvasFromMedia(video);
      canvasContainerRef.current.append(canvas);
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const interval = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        setDescriptionUser({
          age: Math.floor(detections[0].age),
          gender: detections[0].gender,
        });

        console.log("detections : ", detections);
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }, 100);

      setIntervalState(interval);
    }
  };

  return (
    <div>
      <div className="user-description">
        <p>age : {descriptionUser?.age}</p>
        <p>gender : {descriptionUser?.gender}</p>
      </div>
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
  );
};

export default FaceAPIDetect;
