import React from 'react';
import { ArrowLeftIcon, CheckIcon, PaperInstructionIcon, PoseInstructionIcon, QuickSnapInstructionIcon } from './icons';

type Method = 'paper' | 'pose' | 'environment';

interface InstructionsDisplayProps {
    method: Method;
    onBack: () => void;
    onContinue: () => void;
}

const instructionData = {
    paper: {
        title: "How to Use a Reference Paper",
        Icon: PaperInstructionIcon,
        points: [
            "Use a standard A4 or US Letter paper.",
            "Place the paper flat on the floor by your feet.",
            "Ensure the entire paper is visible in the photo.",
            "Capture your full body, from head to toe.",
            "Take the photo in a well-lit area."
        ]
    },
    pose: {
        title: "How to Do the Guided Pose",
        Icon: PoseInstructionIcon,
        points: [
            "Stand straight with your feet together.",
            "Extend your arms fully out to your sides (like a 'T').",
            "Make sure your whole body fits in the frame (fingertip to fingertip).",
            "Use a clear, uncluttered background.",
            "Take the photo in a bright, evenly lit space."
        ]
    },
    environment: {
        title: "Tips for a Quick Snap",
        Icon: QuickSnapInstructionIcon,
        points: [
            "Capture your entire body from head to toe.",
            "Stand in a well-lit room with even lighting.",
            "Include common background objects (like a door) for scale.",
            "Hold the camera straight and steady.",
            "Avoid blurry photos and obstructions."
        ]
    }
};

const InstructionItem: React.FC<{ text: string }> = ({ text }) => (
    <li className="flex items-start gap-3">
        <CheckIcon className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
        <span>{text}</span>
    </li>
);

export const InstructionsDisplay: React.FC<InstructionsDisplayProps> = ({ method, onBack, onContinue }) => {
    const { title, Icon, points } = instructionData[method];

    return (
        <div className="w-full p-4 flex flex-col items-center animate-fade-in text-center">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                <ArrowLeftIcon />
            </button>

            <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
            
            <Icon className="w-28 h-28 text-gray-500 my-4" />

            <div className="text-left max-w-md w-full bg-gray-900/50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-300">
                    {points.map((point, index) => (
                        <InstructionItem key={index} text={point} />
                    ))}
                </ul>
            </div>
            
            <button
                onClick={onContinue}
                className="w-full sm:max-w-xs mt-6 bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors"
            >
                Continue
            </button>
        </div>
    );
};