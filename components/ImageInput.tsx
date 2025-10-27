import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, ArrowLeftIcon } from './icons';

interface ImageInputProps {
    onAnalyze: (base64Image: string) => void;
    onBack: () => void;
}

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error("Couldn't read file"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const ImageInput: React.FC<ImageInputProps> = ({ onAnalyze, onBack }) => {
    const [image, setImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File | null) => {
        setError(null);
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            try {
                const dataUri = await fileToDataUri(file);
                const base64 = dataUri.split(',')[1];
                setImage(base64);
            } catch (err) {
                setError('Failed to read the image file.');
            }
        }
    }, []);

    const handlePaste = useCallback((event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    handleFileSelect(file);
                    break;
                }
            }
        }
    }, [handleFileSelect]);

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    const handleDragEvent = (e: React.DragEvent<HTMLDivElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(enter);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvent(e, false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };
    
    const handleAnalyzeClick = () => {
        if (image) {
            onAnalyze(image);
        }
    };

    return (
        <div className="w-full p-4 flex flex-col gap-6 items-center animate-fade-in">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-white">Upload an Image</h2>
            <p className="text-gray-400 text-center text-sm">Drag & drop, paste an image, or click to select a file.</p>

            {image ? (
                <div className="w-full max-w-sm flex flex-col items-center gap-4">
                    <img src={`data:image/jpeg;base64,${image}`} alt="Preview" className="rounded-lg max-h-96 w-auto" />
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setImage(null)} className="flex-1 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                            Change
                        </button>
                        <button onClick={handleAnalyzeClick} className="flex-1 bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors">
                            Analyze
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    className={`w-full max-w-sm h-72 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-cyan-500 bg-gray-700/50' : 'border-gray-600 hover:border-cyan-600'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => handleDragEvent(e, true)}
                    onDragLeave={(e) => handleDragEvent(e, false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <UploadIcon className="w-12 h-12 text-gray-500 mb-2" />
                    <p className="text-gray-400">Click to upload or drag & drop</p>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} className="hidden" />
                </div>
            )}
             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
    );
};