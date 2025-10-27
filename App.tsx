import React, { useState, useCallback } from 'react';
import { ImageInput } from './components/ImageInput';
import { ResultDisplay } from './components/ResultDisplay';
import { CameraInput } from './components/CameraInput';
import { analyzeImageForMetrics } from './services/geminiService';
import { calculateBMI, getBmiCategory } from './utils/bmi';
import type { AnalysisResult } from './types';
import { LogoIcon, CameraIcon, UploadIcon, SpinnerIcon, PaperIcon, SparklesIcon, ArrowLeftIcon } from './components/icons';

type AppMode = 'select' | 'upload' | 'camera' | 'loading' | 'result';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('select');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceChoice, setReferenceChoice] = useState<'yes' | 'no' | null>(null);
  
  const handleStart = (selectedMode: 'upload' | 'camera') => {
    setMode(selectedMode);
  };

  const handleReferenceChoice = (choice: 'yes' | 'no') => {
    setReferenceChoice(choice);
  };

  const handleAnalysis = useCallback(async (base64Image: string) => {
    if (!referenceChoice) return;
    setMode('loading');
    setError(null);
    try {
      const hasReference = referenceChoice === 'yes';
      const { heightCm, weightKg, accuracy } = await analyzeImageForMetrics(base64Image, hasReference);
      const bmi = calculateBMI(heightCm, weightKg);
      const categoryInfo = getBmiCategory(bmi);
      setResult({ heightCm, weightKg, bmi, accuracy, ...categoryInfo });
      setMode('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setMode('select');
    }
  }, [referenceChoice]);
  
  const handleReset = () => {
    setResult(null);
    setError(null);
    setReferenceChoice(null);
    setMode('select');
  };

  const renderContent = () => {
    switch (mode) {
      case 'select':
        if (referenceChoice === null) {
          return (
            <div className="w-full p-4 flex flex-col items-center justify-center animate-fade-in text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Want higher accuracy?</h2>
              <p className="text-gray-400 mb-6 max-w-xs">Using a standard A4 or Letter paper as a reference object gives the best results.</p>
              <div className="w-full flex flex-col sm:flex-row gap-6 items-center justify-center">
                <button onClick={() => handleReferenceChoice('yes')} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 p-4">
                    <PaperIcon className="w-16 h-16 text-gray-400 mb-2"/>
                    <p className="text-xl font-semibold text-white">Yes, I'll use paper</p>
                    <p className="text-sm font-normal text-green-400">(High Accuracy)</p>
                </button>
                <button onClick={() => handleReferenceChoice('no')} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 p-4">
                    <SparklesIcon className="w-16 h-16 text-gray-400 mb-2"/>
                    <p className="text-xl font-semibold text-white">No, just estimate</p>
                    <p className="text-sm font-normal text-yellow-400">(Medium Accuracy)</p>
                </button>
              </div>
            </div>
          );
        } else {
            return (
              <div className="w-full p-4 flex flex-col gap-6 items-center justify-center animate-fade-in">
                <button onClick={() => setReferenceChoice(null)} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon />
                </button>
                <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                    <button onClick={() => handleStart('upload')} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400">
                        <UploadIcon className="w-16 h-16 text-gray-400 mb-2"/>
                        <p className="text-xl font-semibold text-white">Upload Image</p>
                    </button>
                    <button onClick={() => handleStart('camera')} className="w-full sm:w-60 h-60 bg-gray-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-cyan-500 border-2 border-transparent transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400">
                        <CameraIcon className="w-16 h-16 text-gray-400 mb-2"/>
                        <p className="text-xl font-semibold text-white">Use Camera</p>
                    </button>
                </div>
              </div>
            );
        }
      case 'upload':
        return <ImageInput onAnalyze={handleAnalysis} onBack={() => setMode('select')} />;
      case 'camera':
        return <CameraInput onAnalyze={handleAnalysis} onBack={() => setMode('select')} />;
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
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
            <LogoIcon />
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Body Metrics Vision</h1>
        </div>
        <p className="text-lg text-gray-400">Get AI-powered height & weight estimates from a single image.</p>
        <p className="text-sm text-amber-400/80 mt-2 max-w-2xl mx-auto">
            The AI can estimate metrics from just your photo. For the <strong>highest accuracy</strong>, you can place a standard A4 or Letter paper on the floor for scale.
        </p>
      </header>

      <main className="w-full max-w-xl flex-grow flex flex-col justify-center">
        {error && mode === 'select' && (
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
        <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 backdrop-blur-sm border border-gray-700 min-h-[450px] flex items-center justify-center relative">
          {renderContent()}
        </div>
      </main>

      <footer className="w-full max-w-4xl text-center mt-8 text-gray-500 text-sm">
         <p>Disclaimer: The AI analysis provides an estimate for both height and weight and should not be considered medical advice. Accuracy depends heavily on image quality and the presence of a reference object. Consult a healthcare professional for health concerns.</p>
      </footer>
    </div>
  );
};

export default App;
