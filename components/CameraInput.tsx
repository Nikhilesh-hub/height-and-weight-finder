import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, CameraOffIcon, UserIcon } from './icons';

interface CameraInputProps {
  onAnalyze: (base64Image: string) => void;
  onBack: () => void;
}

export const CameraInput: React.FC<CameraInputProps> = ({ onAnalyze, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);

  // Effect to manage camera stream based on capture state
  useEffect(() => {
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    const startCamera = async () => {
        stopStream();
        setError(null);
        setIsCameraInitializing(true);

        const setStream = (mediaStream: MediaStream) => {
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadeddata = () => {
                    setIsCameraInitializing(false);
                };
            } else {
                setIsCameraInitializing(false);
            }
        };

        const handleError = (err: unknown) => {
            let errorMessage = "An unknown camera error occurred. Please ensure your camera is not in use by another application and try again.";
            if (err instanceof DOMException) {
                switch (err.name) {
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        errorMessage = "No camera found on your device. Please ensure a camera is connected and enabled.";
                        break;
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        errorMessage = "Camera access was denied. To use this feature, please grant camera permissions in your browser settings.";
                        break;
                    case 'OverconstrainedError':
                    case 'ConstraintNotSatisfiedError':
                        errorMessage = "Your device's camera does not support the required settings.";
                        break;
                    case 'NotReadableError':
                    case 'TrackStartError':
                        errorMessage = "Your camera might be in use by another application. Please close it and try again.";
                        break;
                    default:
                        console.error('Unhandled Camera DOMException:', err.name, err.message);
                        break;
                }
            } else {
                console.error('Generic camera error:', err);
            }
            setError(errorMessage);
            setIsCameraInitializing(false);
        };

        const idealConstraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' } } };
        const fallbackConstraints: MediaStreamConstraints = { video: true };

        try {
            // 1. Try ideal constraints (rear camera)
            const mediaStream = await navigator.mediaDevices.getUserMedia(idealConstraints);
            setStream(mediaStream);
        } catch (err) {
            // 2. If it fails with a constraint error, try the fallback
            if (err instanceof DOMException && (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError')) {
                console.warn("Could not get environment camera, falling back to default.");
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                    setStream(mediaStream);
                } catch (fallbackErr) {
                    // 3. If fallback also fails, handle the error
                    handleError(fallbackErr);
                }
            } else {
                // 4. If it's a different error (e.g., permissions), handle it directly
                handleError(err);
            }
        }
    };

    if (!capturedImage) {
      startCamera();
    } else {
      stopStream();
    }

    // Cleanup function to stop the stream when the component unmounts
    return stopStream;
  }, [capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && streamRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        const settings = streamRef.current.getVideoTracks()[0].getSettings();
        // Flip the image horizontally if it's a user-facing camera to match the preview
        if (settings.facingMode === 'user') {
            context.translate(video.videoWidth, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95); // Explicitly set high quality
      const base64 = dataUrl.split(',')[1];
      setCapturedImage(base64);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsCameraInitializing(true);
  };
  
  const handleAnalyze = () => {
    if (capturedImage) {
        onAnalyze(capturedImage);
    }
  };

  return (
    <div className="w-full p-4 flex flex-col gap-4 items-center animate-fade-in">
       <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
          <ArrowLeftIcon />
       </button>
       <h2 className="text-2xl font-bold text-white">{capturedImage ? "Preview" : "Live Camera"}</h2>
       
       <div className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <CameraOffIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-red-400 font-semibold">Camera Error</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        ) : (
            <>
                {isCameraInitializing && !capturedImage && (
                    <div className="text-gray-400">Initializing Camera...</div>
                )}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    // Mirror the video preview if it's a front-facing camera
                    style={{ transform: streamRef.current?.getVideoTracks()[0]?.getSettings()?.facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
                    className={`w-full h-full object-cover ${capturedImage || isCameraInitializing ? 'hidden' : 'block'}`}
                />
                {!capturedImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                        <UserIcon className="w-full h-full text-white/10" />
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
                {capturedImage && <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Captured" className="w-full h-full object-cover"/>}
            </>
        )}
       </div>

       <div className="flex gap-2 w-full max-w-sm">
        {capturedImage ? (
            <>
                <button onClick={handleRetake} className="flex-1 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-colors">Retake</button>
                <button onClick={handleAnalyze} className="flex-1 bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors">Analyze</button>
            </>
        ) : (
             <button onClick={handleCapture} disabled={!!error || isCameraInitializing} className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isCameraInitializing ? 'Starting...' : 'Capture'}
             </button>
        )}
       </div>
    </div>
  )
}