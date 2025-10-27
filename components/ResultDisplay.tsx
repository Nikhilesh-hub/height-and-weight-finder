import React from 'react';
import type { AnalysisResult } from '../types';
import { InfoIcon } from './icons';
import { Suggestions } from './Suggestions';

interface ResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

const MetricCard: React.FC<{ label: string; value: string; subValue: string;}> = ({ label, value, subValue }) => (
    <div className="bg-gray-800 rounded-lg p-4 text-center sm:text-left">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-gray-400">{subValue}</p>
    </div>
);

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  const { heightCm, weightKg, bmi, category, color, accuracy } = result;
  
  const heightFeet = Math.floor(heightCm / 30.48);
  const heightInches = Math.round((heightCm / 2.54) % 12);
  const weightLbs = (weightKg * 2.20462).toFixed(1);

  const accuracyInfo = {
      high: { text: "High Accuracy", detail: "Reference object detected", color: "text-green-400", iconColor: "text-green-500" },
      medium: { text: "Medium Accuracy", detail: "Estimated from environment", color: "text-yellow-400", iconColor: "text-yellow-500" },
      low: { text: "Low Accuracy", detail: "This is a rough estimate", color: "text-orange-400", iconColor: "text-orange-500" }
  };
  const currentAccuracy = accuracyInfo[accuracy];

  const bmiMarkerPosition = () => {
      let position = 0;
      if (bmi < 18.5) {
          position = (bmi / 18.5) * 25;
      } else if (bmi < 25) {
          position = 25 + ((bmi - 18.5) / 6.5) * 25;
      } else if (bmi < 30) {
          position = 50 + ((bmi - 25) / 5) * 25;
      } else {
          // Cap visualization at a BMI of 40 for a reasonable scale
          position = 75 + Math.min(((bmi - 30) / 10), 1) * 25;
      }
      // Clamp between 2% and 98% to keep marker visually within the bar
      return Math.max(2, Math.min(position, 98));
  };


  return (
    <div className="p-4 animate-fade-in flex flex-col items-center w-full max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Your Results</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 w-full">
            <MetricCard label="Height" value={`${heightCm.toFixed(1)} cm`} subValue={`${heightFeet}' ${heightInches}"`} />
            <MetricCard label="Weight" value={`${weightKg.toFixed(1)} kg`} subValue={`${weightLbs} lbs`} />
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-4 text-center w-full">
            <p className="text-gray-400 text-sm font-medium">Body Mass Index (BMI)</p>
            <p className="text-5xl font-bold text-white my-2">{bmi.toFixed(1)}</p>
            <p className="text-xl font-semibold" style={{ color: color }}>
               {category}
            </p>
            
            <div className="w-full mt-4 pt-4 relative">
                <div className="h-3 w-full flex rounded-full overflow-hidden">
                    <div className="w-1/4 bg-[#3b82f6]"></div>
                    <div className="w-1/4 bg-[#22c55e]"></div>
                    <div className="w-1/4 bg-[#f97316]"></div>
                    <div className="w-1/4 bg-[#ef4444]"></div>
                </div>
                <div 
                    className="absolute top-0 h-full flex flex-col items-center transition-all duration-500 -translate-x-1/2"
                    style={{ left: `${bmiMarkerPosition()}%` }}
                    title={`Your BMI: ${bmi.toFixed(1)}`}
                >
                    <div style={{
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '8px solid white',
                    }}></div>
                </div>
                 <div className="w-full flex justify-between text-xs text-gray-400 mt-1 px-[12.5%]">
                    <span>18.5</span>
                    <span>25</span>
                    <span>30</span>
                </div>
            </div>
        </div>
        
        {currentAccuracy && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center justify-center gap-3 text-center mb-6 w-full">
                <InfoIcon className={`w-6 h-6 shrink-0 ${currentAccuracy.iconColor}`} />
                <div>
                    <p className={`font-semibold ${currentAccuracy.color}`}>
                        {currentAccuracy.text}
                    </p>
                    <p className="text-xs text-gray-400">{currentAccuracy.detail}</p>
                </div>
            </div>
        )}
        
        <Suggestions category={category} />

        <button
            onClick={onReset}
            className="w-full sm:w-auto bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 transition-colors mt-6"
        >
            Analyze Another Image
        </button>
    </div>
  );
};