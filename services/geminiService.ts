
import { GoogleGenAI, Chat, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { getDoctors, bookAppointment } from "./supabaseService";

const API_KEY = process.env.API_KEY || "";

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
  private chatInstance: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  public async startNewChat(language: string = 'en') {
    const systemInstruction = `
      You are HealthGuide AI, a helpful medical assistant.
      
      BEHAVIOR:
      1. Always state you are an AI.
      2. To see doctors, you MUST call 'get_doctors'.
      3. To book, you MUST collect: Name, Age, Reason, Address, Zipcode, and a chosen Doctor.
      4. Call 'book_appointment' only when ALL data is present.
      
      Language: ${language}.
    `;

    this.chatInstance = this.ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction,
        temperature: 0.1,
        tools: [{ functionDeclarations: [getDoctorsTool, bookAppointmentTool] }]
      },
    });
  }

  public async sendMessage(
    message: string, 
    onChunk: (text: string) => void,
    onBookingSuccess?: (details: any) => void
  ) {
    if (!this.chatInstance) {
      await this.startNewChat();
    }

    try {
      let response = await this.chatInstance!.sendMessage({ message });
      
      let iterations = 0;
      const MAX_ITERATIONS = 4;

      while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        const results = [];
        
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
          results.push({ tool: fc.name, data: result });
        }

        response = await this.chatInstance!.sendMessage({
          message: `The database returned: ${JSON.stringify(results)}. Summarize the outcome briefly.`
        });
      }

      const finalText = response.text || "I've processed your request.";
      onChunk(finalText);
      return finalText;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = "System connection issue. Please try again.";
      onChunk(errorMsg);
      return errorMsg;
    }
  }
}

export const geminiService = new GeminiService();
