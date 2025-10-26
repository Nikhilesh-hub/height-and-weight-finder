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
            description: "Set to true if analysis was successful (even with low accuracy), false otherwise."
        },
        heightCm: {
            type: Type.NUMBER,
            description: "The estimated height of the person in centimeters. Example: 175.5. Return 0 if analysis fails."
        },
        weightKg: {
            type: Type.NUMBER,
            description: "The estimated weight of the person in kilograms. Example: 72.3. Return 0 if analysis fails."
        },
        accuracy: {
            type: Type.STRING,
            description: "The accuracy level of the estimation. One of: 'high', 'medium', or 'low'."
        },
        reason: {
            type: Type.STRING,
            description: "If analysisSuccess is false, provide a reason. One of: 'no_person_detected', 'child_detected', 'image_unclear'. This is optional if successful."
        }
    },
    required: ["analysisSuccess", "heightCm", "weightKg", "accuracy"]
};


export async function analyzeImageForMetrics(base64Image: string): Promise<{ heightCm: number; weightKg: number; accuracy: 'high' | 'medium' | 'low' }> {
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `Your task is to perform an anthropometric analysis to estimate the person's height and weight from the provided image.

**ACCURACY HIERARCHY:**
Your primary goal is to achieve the highest accuracy possible by following these steps in order:

1.  **HIGH ACCURACY (Primary Method):**
    *   Search for a standard A4 (21.0cm x 29.7cm) or US Letter (21.6cm x 27.9cm) paper on the floor near the person.
    *   If found, use its known dimensions as a precise scale reference to estimate height and weight. The accuracy for this method is 'high'.

2.  **MEDIUM ACCURACY (Fallback Method):**
    *   If no A4/Letter paper is found, look for other common objects with relatively standard sizes that can be used for scale (e.g., a standard interior door height ~203cm, a soda can height ~12.2cm).
    *   If you use a fallback object, your estimation will have 'medium' accuracy.

3.  **LOW ACCURACY (Last Resort):**
    *   If no reliable reference object can be identified, perform a rough estimation based on visual cues, the environment, and general human proportions.
    *   Acknowledge that this is a very rough estimate. The accuracy for this method is 'low'.

**RESPONSE FORMAT:**
-   **analysisSuccess:** Set to \`true\` if you can provide any estimation (high, medium, or low accuracy). Set to \`false\` only if no person is detected, the person is a child, or the image is completely unusable.
-   **heightCm:** Your estimated height in centimeters.
-   **weightKg:** Your estimated weight in kilograms.
-   **accuracy:** A string: 'high', 'medium', or 'low'.
-   **reason:** If \`analysisSuccess\` is \`false\`, provide a reason ('no_person_detected', 'child_detected', 'image_unclear'). This field is optional if successful.

**CRITICAL:** Do not fail the analysis just because the A4/Letter paper is missing. Use the fallback methods. Only fail if the image is fundamentally unusable for any level of estimation.`
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

        if (typeof data.analysisSuccess !== 'boolean' || typeof data.heightCm !== 'number' || typeof data.weightKg !== 'number' || typeof data.accuracy !== 'string') {
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
                default:
                    throw new Error("The AI was unable to analyze this image. Please try a different one.");
            }
        }
        
        if (data.heightCm <= 0 || data.weightKg <= 0) {
             throw new Error("The AI returned invalid metric values. Please try a different image.");
        }

        return {
            heightCm: data.heightCm,
            weightKg: data.weightKg,
            accuracy: data.accuracy,
        };

    } catch (error) {
        console.error("Error in Gemini service:", error);
        if (error instanceof Error && (error.message.startsWith("The AI") || error.message.startsWith("This analysis"))) {
            throw error;
        }
        throw new Error("Failed to get a valid response from the AI model. Please check your connection and try again.");
    }
}