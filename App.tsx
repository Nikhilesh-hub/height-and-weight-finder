import React, { useState, useCallback } from 'react';
import { ImageInput } from './components/ImageInput';
import { ResultDisplay } from './components/ResultDisplay';
import { CameraInput } from './components/CameraInput';
import { InstructionsDisplay } from './components/InstructionsDisplay';
import { analyzeImageForMetrics } from './services/geminiService';
import { calculateBMI, getBmiCategory } from './utils/bmi';
import type { AnalysisResult } from './types';
import { LogoIcon, CameraIcon, UploadIcon, SpinnerIcon, PaperIcon, SparklesIcon, ArrowLeftIcon, PoseIcon } from './components/icons';

type Step = 'reference' | 'estimation' | 'instructions' | 'source' | 'capture' | 'loading' | 'result';
type CaptureMode = 'upload' | 'camera';
type EstimationMethod = 'pose' | 'environment';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('reference');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // User choices
  const [hasReference, setHasReference] = useState<boolean | null>(null);
  const [estimationMethod, setEstimationMethod] = useState<EstimationMethod | null>(null);

  const handleAnalysis = useCallback(async (base64Image: string) => {
    if (hasReference === null || (hasReference === false && estimationMethod === null)) return;
    setStep('loading');
    setError(null);
    try {
      const { heightCm, weightKg, accuracy } = await analyzeImageForMetrics(base64Image, hasReference, estimationMethod);
      const bmi = calculateBMI(heightCm, weightKg);
      const categoryInfo = getBmiCategory(bmi);
      setResult({ heightCm, weightKg, bmi, accuracy, ...categoryInfo });
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setStep('reference'); // Reset to start on error
    }
  }, [hasReference, estimationMethod]);
  
  const handleReset = () => {
    setResult(null);
    setError(null);
    setHasReference(null);
    setEstimationMethod(null);
    setStep('reference');
  };
  
  const handleBack = () => {
    setError(null);
    switch(step) {
      case 'estimation':
        setHasReference(null);
        setStep('reference');
        break;
      case 'instructions':
        if (hasReference) {
            setHasReference(null);
            setStep('reference');
        } else {
            setEstimationMethod(null);
            setStep('estimation');
        }
        break;
      case 'source':
        setStep('instructions');
        break;
      case 'capture':
        setStep('source');
        break;
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'reference':
        return (
          <div className="w-full p-4 flex flex-col items-center justify-center animate-fade-in text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Want higher accuracy?</h2>
            <p className="text-gray-400 mb-6 max-w-xs">Using a standard A4 or Letter paper as a reference object gives the best results.</p>
            <div className="w-full flex flex-col sm:flex-row gap-6 items-center justify-center">
              <button onClick={() => { setHasReference(true); setStep('instructions'); }} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 p-4">
                  <PaperIcon className="w-16 h-16 text-gray-400 mb-2"/>
                  <p className="text-xl font-semibold text-white">Use Paper</p>
                  <p className="text-sm font-normal text-green-400">(High Accuracy)</p>
              </button>
              <button onClick={() => { setHasReference(false); setStep('estimation'); }} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 p-4">
                  <SparklesIcon className="w-16 h-16 text-gray-400 mb-2"/>
                  <p className="text-xl font-semibold text-white">Just Estimate</p>
                  <p className="text-sm font-normal text-yellow-400">(Medium Accuracy)</p>
              </button>
            </div>
          </div>
        );
      case 'estimation':
        return (
             <div className="w-full p-4 flex flex-col items-center justify-center animate-fade-in text-center">
                <button onClick={handleBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon />
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">Choose Estimation Method</h2>
                <p className="text-gray-400 mb-6 max-w-xs">The "Guided Pose" is more accurate as it uses your arm span as a reference.</p>
                <div className="w-full flex flex-col sm:flex-row gap-6 items-center justify-center">
                    <button onClick={() => { setEstimationMethod('pose'); setStep('instructions'); }} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 p-4">
                        <PoseIcon className="w-16 h-16 text-gray-400 mb-2"/>
                        <p className="text-xl font-semibold text-white">Guided Pose</p>
                        <p className="text-sm font-normal text-cyan-400">(Recommended)</p>
                    </button>
                    <button onClick={() => { setEstimationMethod('environment'); setStep('instructions'); }} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 p-4">
                        <CameraIcon className="w-16 h-16 text-gray-400 mb-2"/>
                        <p className="text-xl font-semibold text-white">Quick Snap</p>
                        <p className="text-sm font-normal text-yellow-400">(Faster)</p>
                    </button>
                </div>
            </div>
        );
      case 'instructions':
        const method = hasReference ? 'paper' : estimationMethod;
        if (!method) return null; // Should not happen
        return <InstructionsDisplay method={method} onBack={handleBack} onContinue={() => setStep('source')} />
      case 'source':
         return (
            <div className="w-full p-4 flex flex-col gap-6 items-center justify-center animate-fade-in">
                <button onClick={handleBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon />
                </button>
                <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                    <button onClick={() => { setCaptureMode('upload'); setStep('capture'); }} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400">
                        <UploadIcon className="w-16 h-16 text-gray-400 mb-2"/>
                        <p className="text-xl font-semibold text-white">Upload Image</p>
                    </button>
                    <button onClick={() => { setCaptureMode('camera'); setStep('capture'); }} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400">
                        <CameraIcon className="w-16 h-16 text-gray-400 mb-2"/>
                        <p className="text-xl font-semibold text-white">Use Camera</p>
                    </button>
                </div>
            </div>
        );
      case 'capture':
        if (captureMode === 'upload') {
            return <ImageInput onAnalyze={handleAnalysis} onBack={handleBack} />;
        }
        return <CameraInput onAnalyze={handleAnalysis} onBack={handleBack} />;
      case 'loading':
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-white animate-fade-in">
                <SpinnerIcon />
                <p className="text-lg">AI is analyzing the image...</p>
                <p className="text-sm text-gray-400">This may take a moment.</p>
            </div>
        );
      case 'result':
        return result ? <ResultDisplay result={result} onReset={handleReset} /> : null;
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-transparent text-gray-200 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
            <LogoIcon />
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Body Metrics Vision</h1>
        </div>
        <p className="text-lg text-gray-400">Get AI-powered height & weight estimates from a single image.</p>
        <p className="text-sm text-amber-400/80 mt-2 max-w-3xl mx-auto">
            For <strong>high accuracy</strong>, use a standard A4/Letter paper. For <strong>good accuracy</strong> without paper, try our "Guided Pose" method.
        </p>
      </header>

      <main className="w-full max-w-xl flex flex-col justify-center my-4">
        {error && (step === 'reference' || step === 'estimation') && (
             <div className="w-full max-w-lg mx-auto mb-4 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-center animate-fade-in">
                <p className="font-bold mb-2">Analysis Failed</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs text-red-400 mt-3">
                    If this issue persists, you can
                    <a href="mailto:support@bodymetricsvision.com?subject=Image%20Analysis%20Error%20Report" className="font-semibold underline hover:text-white ml-1">
                        report the error
                    </a>.
                </p>
             </div>
          )}
        <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 backdrop-blur-sm border border-gray-700 min-h-[50vh] sm:min-h-[450px] flex items-center justify-center relative">
          {renderContent()}
        </div>
      </main>

      <footer className="w-full max-w-4xl text-center mt-auto text-gray-500 text-xs sm:text-sm">
         <p>Disclaimer: The AI analysis provides an estimate for both height and weight and should not be considered medical advice. Accuracy depends heavily on image quality and the presence of a reference object. Consult a healthcare professional for health concerns.</p>
      </footer>
    </div>
  );
};

export default App;