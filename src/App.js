import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const runCoco = async () => {
    const net = await cocossd.load();
    console.log("COCO-SSD model loaded.");
    setInterval(() => {
      detect(net);
    }, 100);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const detections = await net.detect(video);
      setObjects(detections);

      const ctx = canvasRef.current.getContext("2d");
      drawRect(detections, ctx);
    }
  };

  const handleStartStopRecording = () => {
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      const stream = webcamRef.current.stream;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        setRecordedChunks((prev) => [...prev, event.data]);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "recording.webm";
        link.click();
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    }
  };

  useEffect(() => {
    runCoco();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Object Detection System</h1>
        <div className="video-container">
          <Webcam
            ref={webcamRef}
            muted={true}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
          />
        </div>

        <h2>Detected Objects</h2>
        <div id="detected-objects">
          {objects.length > 0 ? (
            <ul>
              {objects.map((obj, index) => (
                <li key={index}>
                  {obj.class} - {Math.round(obj.score * 100)}%
                </li>
              ))}
            </ul>
          ) : (
            <p>No objects detected.</p>
          )}
        </div>

        <button onClick={handleStartStopRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </header>
    </div>
  );
}

export default App;
