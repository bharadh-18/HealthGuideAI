
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getDoctors, bookAppointment } from "./supabaseService";

// For Netlify/Vite, use VITE_ prefix. Fallback to process.env for other environments.
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY || "";

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
  private ai: GoogleGenAI;
  private history: any[] = [];
  private systemInstruction: string = "";

  constructor() {
    if (!API_KEY) {
      console.warn("Gemini API Key is missing. Ensure VITE_GEMINI_API_KEY is set in your environment.");
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
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
      2. MEAL SUGGESTIONS: Provide balanced meals for:
         - Veg (Vegetarian), Non-Veg, and Vegan dietary preferences.
         - Ensure each suggestion includes a protein source, healthy fats, and complex carbs.
      3. JUNK FOOD ALTERNATIVES: When asked about junk food (e.g., pizza, burgers, chips), provide a "Healthy Swap" table.
      4. PORTION CONTROL: Teach the "Hand Method" (Palm = Protein, Fist = Veggies, Cupped Hand = Carbs, Thumb = Fats).
      5. NUTRITION FACTS: Use your knowledge and the Search Tool to provide accurate caloric and macro information for specific foods.
      
      SYMPTOM CHECKING LOGIC:
      1. PROBE FIRST: For symptoms like fever, ask temperature, duration, and "red flags".
      2. SEVERITY: If fever > 103°F or red flags present, prioritize doctor referral via 'get_doctors'.
      3. HOME CARE: Suggest mild treatments only for low-severity cases.
      
      FILE HANDLING:
      - Summarize prescriptions or medical reports clearly.
      
      CORE BEHAVIOR:
      1. Always state you are an AI assistant.
      2. Use 'get_doctors' for medical professional referrals.
      3. Use 'googleSearch' for the most up-to-date nutrition facts or medical research.
      
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
        return await this.ai.models.generateContent({
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

      finalResponseText = response.text || "I'm here to support your health and nutrition journey.";
      groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      this.history.push({ role: 'model', parts: [{ text: finalResponseText }] });
      
      onChunk(finalResponseText, groundingSources);
      return finalResponseText;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = "I'm sorry, I'm having trouble with my nutrition database right now. Please try again.";
      onChunk(errorMsg);
      return errorMsg;
    }
  }
}

export const geminiService = new GeminiService();
