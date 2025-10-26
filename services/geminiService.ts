import { GoogleGenAI, Type } from "@google/genai";
import type { GeminiAnalysisResponse } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        analysisSuccess: {
            type: Type.BOOLEAN,
            description: "Set to true if analysis was successful, false otherwise."
        },
        heightCm: {
            type: Type.NUMBER,
            description: "The estimated height of the person in centimeters. Example: 175.5. Return 0 if analysis fails."
        },
        weightKg: {
            type: Type.NUMBER,
            description: "The estimated weight of the person in kilograms. Example: 72.3. Return 0 if analysis fails."
        },
        reason: {
            type: Type.STRING,
            description: "If analysisSuccess is false, provide a reason. One of: 'no_person_detected', 'child_detected', 'image_unclear', 'no_reference_object'."
        }
    },
    required: ["analysisSuccess", "heightCm", "weightKg"]
};


export async function analyzeImageForMetrics(base64Image: string): Promise<{ heightCm: number; weightKg: number; }> {
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `Your task is to perform a highly accurate anthropometric analysis to estimate the person's height and weight from the provided image.

**CRITICAL INSTRUCTIONS:**
1.  **SCALE DETERMINATION (MANDATORY):** You MUST locate a standard A4 (21.0cm x 29.7cm) or US Letter (21.6cm x 27.9cm) paper on the floor in the image. This object is your ONLY reference for scale. Use its known dimensions to accurately determine the person's height in centimeters. If you cannot find this reference paper, the analysis MUST fail.
2.  **HEIGHT ESTIMATION:** Based on the scale determined from the reference paper, provide a precise height estimation in centimeters.
3.  **WEIGHT ESTIMATION:** Using the height you just estimated and your analysis of the person's body volume, muscle mass, and body fat percentage from the image, provide a precise weight estimation in kilograms.

**RESPONSE FORMAT:**
-   If analysis is successful: set analysisSuccess to true and provide the precise heightCm and weightKg.
-   If analysis fails: set analysisSuccess to false, return 0 for both heightCm and weightKg, and provide a 'reason'.
-   Reasons for failure: 'no_person_detected', 'child_detected', 'image_unclear', 'no_reference_object'.`
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const data: GeminiAnalysisResponse = JSON.parse(jsonText);

        if (typeof data.analysisSuccess !== 'boolean' || typeof data.heightCm !== 'number' || typeof data.weightKg !== 'number') {
            throw new Error('Invalid data types in API response.');
        }

        if (!data.analysisSuccess) {
            switch (data.reason) {
                case 'no_person_detected':
                    throw new Error("The AI couldn't find a person in the image. Please try a photo with a clear view of one adult.");
                case 'child_detected':
                    throw new Error("This analysis is for adults only. The person in the image appears to be a child.");
                case 'image_unclear':
                    throw new Error("The image is too blurry or unclear for an accurate analysis. Please try a higher-quality photo.");
                case 'no_reference_object':
                    throw new Error("The AI couldn't find a reference object (A4/Letter paper). Please include one for accurate measurement.");
                default:
                    throw new Error("The AI was unable to analyze this image. Please try a different one.");
            }
        }
        
        if (data.heightCm <= 0 || data.weightKg <= 0) {
             throw new Error("The AI was unable to analyze this image. Please try a different one.");
        }

        return {
            heightCm: data.heightCm,
            weightKg: data.weightKg
        };

    } catch (error) {
        console.error("Error in Gemini service:", error);
        if (error instanceof Error && (error.message.startsWith("The AI") || error.message.startsWith("This analysis"))) {
            throw error;
        }
        throw new Error("Failed to get a valid response from the AI model. Please check your connection and try again.");
    }
}