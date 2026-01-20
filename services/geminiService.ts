import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getDoctors, bookAppointment } from "./supabaseService";

const getDoctorsTool: FunctionDeclaration = {
  name: 'get_doctors',
  parameters: {
    type: Type.OBJECT,
    description: 'Fetch the list of available doctors from the database.',
    properties: {}
  }
};

const bookAppointmentTool: FunctionDeclaration = {
  name: 'book_appointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Save patient details to the database and confirm an appointment.',
    properties: {
      doctorId: { type: Type.STRING, description: 'The UUID of the doctor (preferred) or their full name.' },
      patientName: { type: Type.STRING, description: 'Patient name.' },
      patientAge: { type: Type.NUMBER, description: 'Patient age.' },
      reason: { type: Type.STRING, description: 'Reason for visit.' },
      address: { type: Type.STRING, description: 'Street address.' },
      zipcode: { type: Type.STRING, description: 'Zipcode.' }
    },
    required: ['doctorId', 'patientName', 'patientAge', 'reason', 'address', 'zipcode']
  }
};

export class GeminiService {
  private history: any[] = [];
  private systemInstruction: string = "";

  constructor() {
    // We check availability in constructor, but instantiate in sendMessage 
    // to ensure the latest key from define/env is used.
    if (!process.env.API_KEY) {
      console.error("Gemini API Key is missing. Check VITE_GEMINI_API_KEY in Netlify settings.");
    }
  }

  public async startNewChat(language: string = 'en') {
    this.history = [];
    this.systemInstruction = `
      You are HealthGuide AI, a warm, friendly, and professional medical and nutrition assistant.
      
      EMPATHY & TONE:
      - Always start with empathy and a warm greeting.
      - Be encouraging about healthy lifestyle changes.
      
      NUTRITION & DIETETICS (NEW MODULE):
      1. CALORIE CALCULATION: If a user asks for daily calorie needs, you MUST ask for: 
         - Age, Sex, Weight (kg/lbs), Height (cm/ft), and Activity Level (Sedentary to Highly Active).
         - Use the Mifflin-St Jeor Equation to estimate BMR and TDEE.
      2. MEAL SUGGESTIONS: Provide balanced meals for Veg, Non-Veg, and Vegan dietary preferences.
      3. JUNK FOOD ALTERNATIVES: Provide "Healthy Swap" suggestions.
      
      SYMPTOM CHECKING LOGIC:
      1. PROBE FIRST: Ask follow-up questions for better context.
      2. SEVERITY: Use 'get_doctors' for medical professional referrals if symptoms seem severe.
      
      CORE BEHAVIOR:
      1. Always state you are an AI assistant.
      2. Use 'googleSearch' for the most up-to-date nutrition facts or medical research.
      
      Language: ${language}.
    `;
  }

  public async sendMessage(
    message: string, 
    onChunk: (text: string, groundingSources?: any[]) => void,
    onBookingSuccess?: (details: any) => void,
    attachment?: { data: string, mimeType: string }
  ) {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("Configuration Error: API Key is missing. Please set VITE_GEMINI_API_KEY in Netlify.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const userParts: any[] = [{ text: message }];
      
      if (attachment) {
        userParts.unshift({
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        });
      }

      this.history.push({ role: 'user', parts: userParts });

      let iterations = 0;
      const MAX_ITERATIONS = 4;
      let finalResponseText = "";
      let groundingSources: any[] = [];

      const generate = async () => {
        return await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: this.history,
          config: {
            systemInstruction: this.systemInstruction,
            temperature: 0.7,
            tools: [{ functionDeclarations: [getDoctorsTool, bookAppointmentTool] }, { googleSearch: {} }]
          },
        });
      };

      let response = await generate();

      while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        this.history.push(response.candidates?.[0]?.content);

        const toolResponses = [];
        for (const fc of response.functionCalls) {
          let result;
          if (fc.name === 'get_doctors') {
            result = await getDoctors();
          } else if (fc.name === 'book_appointment') {
            const { doctorId, patientName, patientAge, reason, address, zipcode } = fc.args as any;
            result = await bookAppointment(doctorId, patientName, patientAge, reason, address, zipcode);
            if (result.success && onBookingSuccess) {
              onBookingSuccess(result.bookingDetails);
            }
          }
          toolResponses.push({
            functionResponse: {
              name: fc.name,
              id: fc.id,
              response: { result }
            }
          });
        }

        this.history.push({ role: 'user', parts: toolResponses });
        response = await generate();
      }

      finalResponseText = response.text || "I'm ready to assist you with your health and nutrition queries.";
      groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      this.history.push({ role: 'model', parts: [{ text: finalResponseText }] });
      
      onChunk(finalResponseText, groundingSources);
      return finalResponseText;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      let errorMsg = "I encountered an error connecting to the AI service. ";
      
      if (error.message?.includes("API Key")) {
        errorMsg += "Please ensure your Gemini API Key is correctly configured in Netlify environment variables (VITE_GEMINI_API_KEY) and that you have redeployed your site.";
      } else {
        errorMsg += "Please check your network connection or try again later. Error: " + (error.message || "Unknown error");
      }
      
      onChunk(errorMsg);
      return errorMsg;
    }
  }
}

export const geminiService = new GeminiService();