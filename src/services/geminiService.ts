import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function askFollowUpQuestion(imageUrl: string, analysisContext: any, question: string, lang: string = 'en') {
  const [header, base64Data] = imageUrl.split(',');
  const mimeType = header.split(':')[1].split(';')[0];

  const languageInstruction = lang === 'pt' ? 'Responda em Português.' : 'Answer in English.';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      {
        text: `You are an AI dermatology assistant. The user previously analyzed this skin image and got this result: ${JSON.stringify(analysisContext)}. 
        The user is now asking a follow-up question: "${question}".
        Answer the question helpfully, concisely, and professionally. Remind them to consult a doctor if they ask for a definitive medical diagnosis. ${languageInstruction}`,
      },
    ],
  });
  return response.text;
}

export async function analyzeSkinImage(base64Image: string, mimeType: string, userSkinType: string = 'Unknown', lang: string = 'en') {
  const skinTypePrompt = userSkinType !== 'Unknown'
    ? `The user indicated their skin type is: ${userSkinType}. Please tailor the skincare routine specifically for this skin type.`
    : `Based on the identified conditions, infer the likely skin type (e.g., Oily, Dry, Combination, Sensitive) and create a tailored skincare routine.`;

  const languageInstruction = lang === 'pt' ? 'Responda em Português (exceto o riskLevel).' : 'Answer in English.';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: `You are an AI dermatology assistant. Analyze this image of a skin spot, mole, or lesion.
Provide a preliminary risk assessment based on the ABCDE rule (Asymmetry, Border, Color, Diameter, Evolution).
Classify the risk level as "Low", "Medium", or "High". (Keep these exact words in English for the risk level).
List possible conditions (e.g., acne, dermatitis, sun spot, eczema, possible signs of skin cancer).
Provide general treatment recommendations.
Indicate if a specialist consultation is required.
${skinTypePrompt}
Include morning, evening, and weekly steps with specific product types (cleansers, moisturizers, serums, sunscreens).
IMPORTANT: This is not a medical diagnosis, but a preliminary assessment. ${languageInstruction}`,
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: {
            type: Type.STRING,
            description: 'Risk level: "Low", "Medium", or "High"',
          },
          conditions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Possible conditions identified',
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              asymmetry: { type: Type.STRING, description: 'Analysis of asymmetry' },
              border: { type: Type.STRING, description: 'Analysis of borders' },
              color: { type: Type.STRING, description: 'Analysis of color' },
              size: { type: Type.STRING, description: 'Analysis of size/diameter' },
              evolution: { type: Type.STRING, description: 'Analysis of evolution/changes (if apparent)' },
            },
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Treatment recommendations or next steps',
          },
          skincareRoutine: {
            type: Type.OBJECT,
            description: 'Personalized skincare routine based on analysis',
            properties: {
              skinType: { type: Type.STRING, description: 'Inferred skin type (e.g., Oily, Dry, Combination, Sensitive)' },
              morning: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING, description: 'Step name (e.g., Cleanse)' },
                    productType: { type: Type.STRING, description: 'Product type (e.g., Gentle Cleanser)' },
                    description: { type: Type.STRING, description: 'How and why to use it' },
                  },
                },
              },
              evening: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING, description: 'Step name' },
                    productType: { type: Type.STRING, description: 'Product type' },
                    description: { type: Type.STRING, description: 'How and why to use it' },
                  },
                },
              },
              weekly: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING, description: 'Step name' },
                    productType: { type: Type.STRING, description: 'Product type' },
                    description: { type: Type.STRING, description: 'How and why to use it' },
                  },
                },
              },
            },
          },
          requiresSpecialist: {
            type: Type.BOOLEAN,
            description: 'True if high risk or specialist consultation is recommended',
          },
        },
        required: ['riskLevel', 'conditions', 'analysis', 'recommendations', 'requiresSpecialist'],
      },
    },
  });

  let jsonStr = response.text?.trim() || '{}';
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    // Ensure required arrays exist to prevent React map() crashes
    if (!Array.isArray(parsed.conditions)) parsed.conditions = [lang === 'pt' ? "A condição não pôde ser determinada" : "Condition could not be determined"];
    if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [lang === 'pt' ? "Por favor, consulte um profissional de saúde." : "Please consult a healthcare professional."];
    if (!parsed.analysis) parsed.analysis = { asymmetry: 'N/A', border: 'N/A', color: 'N/A', size: 'N/A', evolution: 'N/A' };
    if (!parsed.riskLevel) parsed.riskLevel = 'Unknown';
    
    return parsed;
  } catch (e) {
    console.error("Failed to parse Gemini response:", jsonStr);
    throw new Error(lang === 'pt' ? "Recebeu dados inválidos da IA. Por favor, tente novamente." : "Received invalid data from AI. Please try again.");
  }
}
