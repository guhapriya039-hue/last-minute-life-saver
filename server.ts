import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for lazy loading of GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is missing. Please add it via the Secrets panel in AI Studio Settings.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// 1. Triage Endpoint - AI schedules and breaks down complex tasks
app.post("/api/triage", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { title, category, deadline, anxietyLevel, excuse } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    try {
      const ai = getAiClient();
      
      const prompt = `Analyze this urgent/intimidating task and structure a micro-milestone rescue plan:
Task: "${title}"
Category: "${category || 'General'}"
Deadline: "${deadline}" (Current system time is ${new Date().toISOString()})
Anxiety/Overwhelm Level (1-10): ${anxietyLevel || 5}
User's current excuse/mental block: "${excuse || 'I am just too tired / overwhelmed to start.'}"

Instructions:
1. Propose a calibrated priority ('Critical', 'High', 'Medium', 'Low').
2. Calculate a Panic Index (0 to 100) combining deadline proximity (closer = higher), anxiety level, and excuse severity.
3. Formulate a personalized psychological "copingMechanism" - a direct, empathetic, mind-hack tailored to their excuse.
4. Provide a list of exactly 3 to 4 sequential "microMilestones". For each, specify a short 'title' and a realistic 'duration' (in minutes).
5. Most importantly, each milestone must feature a 'startingAction' - an ultra-tactile, 1-minute brain-dead easy initial step to bypass friction (e.g., "Just sit at the desk, open Google Docs, and type a single headline").

Return the result strictly conforming to the requested JSON schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              panicIndex: { type: "integer" },
              priority: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
              copingMechanism: { type: "string" },
              microMilestones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    duration: { type: "integer" },
                    startingAction: { type: "string" }
                  },
                  required: ["title", "duration", "startingAction"]
                }
              }
            },
            required: ["panicIndex", "priority", "copingMechanism", "microMilestones"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }
      
      res.json(JSON.parse(responseText));

    } catch (aiError: any) {
      console.warn("Gemini API not available or failed. Using fallback calculations.", aiError.message);
      
      // Local robust simulation so the app is 100% functional even if API key is not configured yet!
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const hoursLeft = Math.max(0.1, (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      let panicIndex = Math.round(Math.min(100, Math.max(10, (10 / hoursLeft) * 15 + (anxietyLevel * 6))));
      if (isNaN(panicIndex)) panicIndex = 50;

      let priority: "Critical" | "High" | "Medium" | "Low" = "Medium";
      if (hoursLeft < 3 || panicIndex > 80) priority = "Critical";
      else if (hoursLeft < 12 || panicIndex > 60) priority = "High";
      else if (hoursLeft < 36) priority = "Medium";
      else priority = "Low";

      const staticMilestones = [
        {
          title: "Setup and Initiate the Workspace",
          duration: 5,
          startingAction: `Clear your physical desk, close unrelated browser tabs, and open your main working file.`
        },
        {
          title: "Draft Outline or Quick Framework",
          duration: 15,
          startingAction: `Write down 3 main bullet points or skeleton headings on paper. Do not aim for perfection.`
        },
        {
          title: "Deep Dive: Core Execution Block",
          duration: 25,
          startingAction: `Set a timer for 20 minutes, put your phone on do-not-disturb, and focus on drafting the first section.`
        },
        {
          title: "Review and Final Polish",
          duration: 10,
          startingAction: `Read through your work once, check alignment against the criteria, and hit submit.`
        }
      ];

      res.json({
        panicIndex,
        priority,
        copingMechanism: `[Demo Fallback Mode] Starting is the absolute hardest part. Let's conquer the initial friction. Use the 5-second rule: count backwards 5-4-3-2-1 and take the first physical step immediately.`,
        microMilestones: staticMilestones,
        apiKeyMissing: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY"
      });
    }
  } catch (error: any) {
    console.error("Server error in triage endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to analyze task" });
  }
});

// 2. Chat Coach Endpoint - Conversational anti-procrastination coach with selectable personalities
app.post("/api/coach", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { messages, currentTask, persona, settings } = req.body;

    let personaPrompt = "";
    if (persona === "sergeant") {
      personaPrompt = `You are a tough-love, direct, highly disciplined, and energetic "Procrastination Drill Sergeant". 
      You use humor, military metaphors, and strict deadlines. You call out excuses immediately. You do not tolerate laziness.
      Keep your answers short (2-3 sentences max), highly motivating, and punchy. Demand action. Use capitalized commands occasionally.`;
    } else if (persona === "zen") {
      personaPrompt = `You are a warm, serene, deeply compassionate "Mindful Zen Master". 
      You help the user calm their nervous system, practice brief deep breathing, and accept their anxiety without judgment.
      Speak softly, beautifully, and use calming phrases. Emphasize that starting with one single breath is enough. Max 3 sentences.`;
    } else if (persona === "strategist") {
      personaPrompt = `You are a hyper-logical, tactical, data-driven "Executive Strategist". 
      You treat productivity as an optimization algorithm. You break down tasks into precise metrics, ratios, and clear action-vectors.
      Analyze the user's situation objectively, provide the exact game-theoretic strategy to beat procrastination, and keep it extremely practical. Max 3 sentences.`;
    } else {
      personaPrompt = `You are a super supportive, warm, cheerleading "Empathetic Best Friend". 
      You validate the user's feelings, tell them it's okay to feel overwhelmed, celebrate their past small wins, and encourage them gently with warm praise. Max 3 sentences.`;
    }

    const taskContext = currentTask 
      ? `\n[Context: The user is currently dealing with the task "${currentTask.title}" with a Panic Index of ${currentTask.panicIndex}%. They are feeling overwhelmed by: "${currentTask.excuse || 'None'}"].`
      : "";

    const systemPrompt = `${personaPrompt}${taskContext}
    Respond directly to the user's chat input. Speak directly as this persona. Do not prefix with your name or any system headers. Never break character. Keep your reply highly engaging, relevant, and short so it fits the conversational workspace perfectly.`;

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }]
    }));

    // Inject system prompt at the beginning or as instructions
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${systemPrompt}` }] },
          ...formattedMessages
        ]
      });

      res.json({ reply: response.text || "I am right here with you. Let's keep moving forward!" });
    } catch (aiError) {
      // Demo fallback responses
      let reply = "Hey there! Let's stay focused. Tell me what's holding you back right now, and let's break that barrier!";
      if (persona === "sergeant") {
        reply = "ATTENTION! Procrastination is the enemy! Drop that phone, sit up straight, and give me 5 minutes of solid focus. YES YOU CAN!";
      } else if (persona === "zen") {
        reply = "Let us pause for a brief moment. Close your eyes, inhale deeply... and let the tension float away. You are fully capable of this small step.";
      } else if (persona === "strategist") {
        reply = "Analyzing current throughput. The optimal strategy here is an immediate 10-minute focus burst. Statistically, starting increases completion rate by 80%. Let's initiate.";
      }
      res.json({ reply, apiKeyMissing: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" });
    }
  } catch (error: any) {
    console.error("Server error in coach endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to process coach guidance" });
  }
});

// 3. Stuck Emergency Action Endpoint - generates physical reset or immediate cognitive hack
app.post("/api/stuck", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { milestoneTitle, blockType, persona } = req.body;

    try {
      const ai = getAiClient();
      const prompt = `The user is currently stuck on this sub-task: "${milestoneTitle || 'General Focus Block'}"
Their reported mental roadblock or distraction: "${blockType || 'General distraction'}"
The chosen coach personality is: "${persona || 'friendly'}"

Provide a 2-part Emergency Rescue plan:
1. Physical Reset: A 15-second immediate physical action (e.g. roll shoulders, physical stretch, splash water on face) to break the cognitive loop.
2. Cognitive Micro-Hack: A 1-sentence mental trigger or tactical shortcut to restart the work immediately.

Conform strictly to the JSON schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              physicalReset: { type: "string" },
              cognitiveHack: { type: "string" }
            },
            required: ["physicalReset", "cognitiveHack"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (aiError) {
      // Simulation Fallback
      res.json({
        physicalReset: "Stand up, stretch your arms high above your head, take a deep breath, exhale, and sit back down.",
        cognitiveHack: "Set a timer on your phone for exactly 2 minutes and tell yourself you can stop when the timer rings if you want. (You usually won't want to!)",
        apiKeyMissing: !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY"
      });
    }
  } catch (error: any) {
    console.error("Server error in stuck endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to process stuck request" });
  }
});

// Serve static assets and handle routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Serve index.html for any other requests in development
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import("fs");
        let template = fs.readFileSync(
          path.resolve(process.cwd(), "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zenith Server running on port ${PORT}`);
  });
}

startServer();
