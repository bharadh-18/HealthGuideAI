
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getDoctors, bookAppointment } from "./supabaseService";

/**
 * The API Key is injected by Vite at build-time.
 */
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
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async startNewChat(language: string = 'en') {
    this.history = [];
    this.systemInstruction = `
      You are Medly, a warm, empathetic, and professional health companion. 
      Your goal is to make the user feel safe, heard, and supported while gathering health information.

      TONE & PERSONA:
      - Use a kind, gentle, and encouraging tone. 
      - Acknowledge feelings. If a user says they are in pain, say "I'm so sorry to hear you're in pain" before asking questions.
      - Use "we" and "us" to create a partnership (e.g., "Let's see if we can figure this out together").
      - Avoid overly clinical or "robotic" phrasing. 

      CORE SYMPTOM PROTOCOL (TIMELINE BUILDING):
      - When gathering info, do it conversationally. 
      - Instead of "When was onset?", say "I'd like to understand a bit more about how this started. Do you remember when you first noticed it?"
      - Systematically (but gently) cover:
        1. ONSET: When it started.
        2. MODIFIERS: What makes it better or worse.
        3. PREVIOUS ACTIONS: What has been tried.

      HABIT PROJECTION PROTOCOL (FUTURE QUERIES):
      - If a user asks "what will happen if I continue this habit?" or similar future-looking questions:
        1. Provide an evidence-based outlook on the potential long-term impacts (both positive and negative).
        2. Use a "Future Outlook" structure.
        3. Clearly state: "Based on general health research, here is what typically happens over time..."
        4. Focus on areas like cardiovascular health, mental wellbeing, sleep quality, or physical mobility depending on the habit.
        5. Always balance the projection with a disclaimer that individual biological factors vary.
        6. Encourage small, sustainable changes if the habit is harmful.

      CLINICAL SUMMARIES:
      - When generating the "CLINICAL SUMMARY", maintain the professional structure but keep the conversation leading up to it very friendly.

      EMERGENCY PROTOCOL:
      - If symptoms seem life-threatening, stay calm but firm: "I'm concerned about what you're describing. Your safety is the priority—please call emergency services (911) right now."

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
      if (!process.env.API_KEY) throw new Error("API Key Missing");

      const userParts: any[] = [{ text: message }];
      if (attachment) {
        userParts.unshift({
          inlineData: { data: attachment.data, mimeType: attachment.mimeType }
        });
      }

      this.history.push({ role: 'user', parts: userParts });

      let iterations = 0;
      const MAX_ITERATIONS = 4;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const generate = async () => {
        return await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: this.history,
          config: {
            systemInstruction: this.systemInstruction,
            temperature: 0.7, 
            tools: [{ functionDeclarations: [getDoctorsTool, bookAppointmentTool] }]
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
            if (result.success && onBookingSuccess) onBookingSuccess(result.bookingDetails);
          }
          toolResponses.push({
            functionResponse: { name: fc.name, id: fc.id, response: { result } }
          });
        }
        this.history.push({ role: 'user', parts: toolResponses });
        response = await generate();
      }

      const finalResponseText = response.text || "I'm listening and thinking about how to best help you.";
      const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      this.history.push({ role: 'model', parts: [{ text: finalResponseText }] });
      
      onChunk(finalResponseText, groundingSources);
      return finalResponseText;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      onChunk("I'm so sorry, I hit a little snag. Could you try saying that again?");
      return "";
    }
  }
}

export const geminiService = new GeminiService();
