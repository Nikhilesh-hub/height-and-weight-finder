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


export async function analyzeImageForMetrics(base64Image: string, hasReference: boolean): Promise<{ heightCm: number; weightKg: number; accuracy: 'high' | 'medium' | 'low' }> {
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const highAccuracyInstruction = `A standard A4 or Letter size paper IS present on the floor near the person's feet. You MUST use it as a precise scale to determine the person's height. Set 'accuracy' to 'high'.`;

    const mediumLowAccuracyInstruction = `You must estimate the person's height and weight without a dedicated reference object. Act as a photogrammetry expert. Analyze the scene for common objects to establish scale. For example: a standard interior door is ~203 cm tall, a light switch is typically ~122 cm from the floor, and a standard chair seat is ~45 cm high. Use these environmental cues to create a plausible scale. If usable cues are present, set 'accuracy' to 'medium'. If no reference objects are found, make a rough estimate based on visual cues and general human proportions. In this case, set 'accuracy' to 'low'.`;

    const textPart = {
        text: `Your task is to estimate the height and weight of the person in the image. You MUST provide an estimate.

Follow this process:
1.  **Identify the person:** Find the adult person in the image. If no person is found, the image is unclear, or the person is a child, set 'analysisSuccess' to false and provide a reason.
2.  **Estimate with scale:**
    *   ${hasReference ? highAccuracyInstruction : mediumLowAccuracyInstruction}
3.  **Provide the result:** Respond with the JSON object containing your estimates.

**RULES:**
- You MUST ALWAYS return a valid JSON object matching the schema.
- 'analysisSuccess' should be 'true' as long as you can provide any estimate (high, medium, or low accuracy).
- Only set 'analysisSuccess' to 'false' for the specific failure reasons: 'no_person_detected', 'child_detected', 'image_unclear'.
- The absence of a reference object is NOT a failure condition if the user did not state one would be present.`
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