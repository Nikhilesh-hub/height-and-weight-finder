import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, CameraOffIcon, UserIcon } from './icons';

interface CameraInputProps {
  onAnalyze: (base64Image: string) => void;
  onBack: () => void;
}

export const CameraInput: React.FC<CameraInputProps> = ({ onAnalyze, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Camera access denied. To use this feature, please grant camera permissions for this site in your browser settings and refresh the page.");
        console.error('Camera access error:', err);
      }
    };
    if (!capturedImage) {
        startCamera();
    }

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [capturedImage, stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64 = dataUrl.split(',')[1];
      setCapturedImage(base64);
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
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
       
       <div className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden relative">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <CameraOffIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-red-400 font-semibold">Camera Error</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        ) : (
            <>
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}></video>
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
             <button onClick={handleCapture} disabled={!!error} className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">Capture</button>
        )}
       </div>
    </div>
  )
}
