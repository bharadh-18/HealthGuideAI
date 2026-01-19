
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
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
  private history: any[] = [];
  private systemInstruction: string = "";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  public async startNewChat(language: string = 'en') {
    this.history = [];
    this.systemInstruction = `
      You are HealthGuide AI, a warm, friendly, and professional medical assistant.
      
      PERSONALITY:
      - Be empathetic, caring, and human-like in your tone. 
      - If a user is in pain or worried, acknowledge their feelings first.
      - Respond warmly to greetings and casual conversation.
      
      FILE HANDLING:
      - If the user provides a file (like a prescription or report), summarize the key points clearly.
      - Explain medications, dosages, and instructions mentioned in the document.
      - Remind the user to follow their doctor's advice exactly.
      
      CORE BEHAVIOR:
      1. Always state you are an AI, not a doctor.
      2. To see doctors, call 'get_doctors'.
      3. To book, collect: Name, Age, Reason, Address, Zipcode, and a chosen Doctor.
      4. Call 'book_appointment' only when ALL data is present.
      
      Language: ${language}.
    `;
  }

  public async sendMessage(
    message: string, 
    onChunk: (text: string) => void,
    onBookingSuccess?: (details: any) => void,
    attachment?: { data: string, mimeType: string }
  ) {
    try {
      // Build user parts
      const userParts: any[] = [{ text: message }];
      if (attachment) {
        userParts.unshift({
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        });
      }

      // Add user turn to local history
      this.history.push({ role: 'user', parts: userParts });

      let iterations = 0;
      const MAX_ITERATIONS = 4;
      let finalResponseText = "";

      const generate = async () => {
        const result = await this.ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: this.history,
          config: {
            systemInstruction: this.systemInstruction,
            temperature: 0.7,
            tools: [{ functionDeclarations: [getDoctorsTool, bookAppointmentTool] }]
          },
        });
        return result;
      };

      let response = await generate();

      while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        
        // Add model turn (with tool calls) to history
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

        // Add tool responses turn to history
        this.history.push({ role: 'user', parts: toolResponses });
        response = await generate();
      }

      finalResponseText = response.text || "I've analyzed that for you. How else can I help?";
      
      // Save model turn to history
      this.history.push({ role: 'model', parts: [{ text: finalResponseText }] });
      
      onChunk(finalResponseText);
      return finalResponseText;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = "I'm sorry, I hit a snag while processing your request. Please try again.";
      onChunk(errorMsg);
      return errorMsg;
    }
  }
}

export const geminiService = new GeminiService();
