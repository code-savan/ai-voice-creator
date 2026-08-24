import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

/**
 * Encodes 16-bit mono 24kHz PCM buffer into a standard RIFF/WAV Buffer
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitDepth: number = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // file length minus 8
  header.writeUInt32LE(36 + dataSize, 4);
  // RIFF type
  header.write("WAVE", 8);
  // format chunk identifier
  header.write("fmt ", 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (1 is PCM)
  header.writeUInt16LE(1, 20);
  // channel count
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate (sample rate * block align)
  header.writeUInt32LE(byteRate, 28);
  // block align (channel count * bytes per sample)
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitDepth, 34);
  // data chunk identifier
  header.write("data", 36);
  // data chunk length
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Shared Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Voice presets metadata endpoint (20 Voices)
  app.get("/api/voices", (_req, res) => {
    res.json({
      voices: [
        { id: "Kore", name: "Kore", gender: "Female", character: "Warm, empathetic & expressive", accent: "Natural American", tags: ["Storytelling", "Friendly", "Warm"], baseVoice: "Kore" },
        { id: "Puck", name: "Puck", gender: "Male / Neutral", character: "Energetic, dynamic & conversational", accent: "American Conversational", tags: ["Podcast", "Upbeat", "Youthful"], baseVoice: "Puck" },
        { id: "Charon", name: "Charon", gender: "Male", character: "Deep, resonant & authoritative", accent: "Deep American", tags: ["Documentary", "Trailer", "Commanding"], baseVoice: "Charon" },
        { id: "Fenrir", name: "Fenrir", gender: "Male", character: "Rich, textured & dramatic", accent: "Nordic / Baritone", tags: ["Cinematic", "Epic", "Character"], baseVoice: "Fenrir" },
        { id: "Zephyr", name: "Zephyr", gender: "Female / Neutral", character: "Soft, gentle & soothing", accent: "Calm American", tags: ["Meditation", "Wellness", "Gentle"], baseVoice: "Zephyr" },
        { id: "Aoede", name: "Aoede", gender: "Female", character: "Crisp, melodic & articulate", accent: "Clear Broadcast", tags: ["News", "Professional", "Melodic"], baseVoice: "Aoede" },
        { id: "Leda", name: "Leda", gender: "Female", character: "Sophisticated, smooth & elegant", accent: "British RP", tags: ["Luxury", "Audiobook", "Elegant"], baseVoice: "Aoede", promptPrefix: "Speak in a refined, elegant, articulate British RP cadence: " },
        { id: "Orpheus", name: "Orpheus", gender: "Male", character: "Poetic, lyrical & resonant", accent: "Classical", tags: ["Poetry", "Storyteller", "Lyrical"], baseVoice: "Puck", promptPrefix: "Narrate with poetic rhythm and lyrical resonance: " },
        { id: "Jupiter", name: "Jupiter", gender: "Male", character: "Grand, booming & cinematic", accent: "Cinematic Deep", tags: ["Trailer", "Movie", "Booming"], baseVoice: "Charon", promptPrefix: "Deliver with a booming, grand cinematic trailer presence: " },
        { id: "Callisto", name: "Callisto", gender: "Female", character: "Mystical, breathy & intimate", accent: "Intimate American", tags: ["Mystery", "Sci-Fi", "Breathy"], baseVoice: "Zephyr", promptPrefix: "Speak with a soft, mystical, breathy intonation: " },
        { id: "Io", name: "Io", gender: "Female", character: "Vibrant, quick-witted & upbeat", accent: "Youthful Tech", tags: ["Tech", "Gaming", "Fast-Paced"], baseVoice: "Kore", promptPrefix: "Speak vibrantly, brightly and enthusiastically: " },
        { id: "Europa", name: "Europa", gender: "Female", character: "Polished, corporate & clear", accent: "Executive Broadcast", tags: ["Business", "Keynote", "Crisp"], baseVoice: "Aoede", promptPrefix: "Deliver as a polished executive keynote speaker: " },
        { id: "Ganymede", name: "Ganymede", gender: "Male", character: "Warm, trustworthy & friendly", accent: "Warm Commercial", tags: ["Explainer", "Commercial", "Trustworthy"], baseVoice: "Puck", promptPrefix: "Speak warmly, helpfully, and with authentic friendliness: " },
        { id: "Titan", name: "Titan", gender: "Male", character: "Heavy, commanding & grounded", accent: "Heavy Baritone", tags: ["Epic", "Historical", "Grounded"], baseVoice: "Fenrir", promptPrefix: "Deliver in a heavy, commanding, grounded baritone: " },
        { id: "Atlas", name: "Atlas", gender: "Male", character: "Inspiring, motivational & steady", accent: "Motivational", tags: ["Fitness", "Inspirational", "Steady"], baseVoice: "Charon", promptPrefix: "Speak with inspiring strength and motivational conviction: " },
        { id: "Hyperion", name: "Hyperion", gender: "Male", character: "Electric, punchy & enthusiastic", accent: "High Energy", tags: ["Promo", "Hype", "Sports"], baseVoice: "Puck", promptPrefix: "Read with energetic excitement and punchy enthusiasm: " },
        { id: "Aura", name: "Aura", gender: "Female", character: "Ethereal, tranquil & meditative", accent: "Mindful Ambient", tags: ["Yoga", "Sleep", "Zen"], baseVoice: "Zephyr", promptPrefix: "Speak in a tranquil, whispered mindfulness meditation cadence: " },
        { id: "Helios", name: "Helios", gender: "Male", character: "Bright, warm & sunlit", accent: "Friendly Educator", tags: ["Education", "Tutorial", "Friendly"], baseVoice: "Puck", promptPrefix: "Explain clearly and warmly like a patient, engaging teacher: " },
        { id: "Vesta", name: "Vesta", gender: "Female", character: "Reassuring, maternal & comforting", accent: "Comforting American", tags: ["Bedtime", "Reassuring", "Gentle"], baseVoice: "Kore", promptPrefix: "Speak in a comforting, gentle and reassuring tone: " },
        { id: "Minerva", name: "Minerva", gender: "Female", character: "Sharp, intellectual & analytical", accent: "Academic", tags: ["Science", "Documentary", "Analytical"], baseVoice: "Aoede", promptPrefix: "Narrate with sharp academic precision and insightful clarity: " },
      ],
      styles: [
        { id: "natural", label: "Natural & Clear", promptPrefix: "" },
        { id: "cheerful", label: "Cheerful & Upbeat", promptPrefix: "Say cheerfully with bright enthusiasm: " },
        { id: "calm", label: "Calm & Meditative", promptPrefix: "Speak in a calm, soothing, relaxed mindfulness tone: " },
        { id: "professional", label: "Professional & Formal", promptPrefix: "Speak in a clear, polished corporate presentation tone: " },
        { id: "dramatic", label: "Dramatic & Cinematic", promptPrefix: "Narrate with deep dramatic emphasis and cinematic suspense: " },
        { id: "storyteller", label: "Storyteller & Whimsical", promptPrefix: "Narrate like an engaging fairy tale storyteller: " },
        { id: "whisper", label: "Intimate & Soft Whisper", promptPrefix: "Speak in a gentle, warm whisper: " },
        { id: "news", label: "News Broadcaster", promptPrefix: "Read this in the authoritative style of a live broadcast journalist: " },
      ],
    });
  });

  // Voice lookup helper for mapping to underlying Gemini base voices
  const voiceMapping: Record<string, { baseVoice: string; personaPrefix?: string }> = {
    Kore: { baseVoice: "Kore" },
    Puck: { baseVoice: "Puck" },
    Charon: { baseVoice: "Charon" },
    Fenrir: { baseVoice: "Fenrir" },
    Zephyr: { baseVoice: "Zephyr" },
    Aoede: { baseVoice: "Aoede" },
    Leda: { baseVoice: "Aoede", personaPrefix: "In an elegant, refined British cadence: " },
    Orpheus: { baseVoice: "Puck", personaPrefix: "In a poetic, lyrical cadence: " },
    Jupiter: { baseVoice: "Charon", personaPrefix: "With a grand, booming cinematic trailer voice: " },
    Callisto: { baseVoice: "Zephyr", personaPrefix: "With a soft, breathy mystical whisper: " },
    Io: { baseVoice: "Kore", personaPrefix: "In a fast-paced, vibrant, tech-enthusiastic tone: " },
    Europa: { baseVoice: "Aoede", personaPrefix: "As a clear, polished executive keynote speaker: " },
    Ganymede: { baseVoice: "Puck", personaPrefix: "In an approachable, trustworthy, warm commercial tone: " },
    Titan: { baseVoice: "Fenrir", personaPrefix: "With a heavy, commanding, grounded baritone voice: " },
    Atlas: { baseVoice: "Charon", personaPrefix: "With inspiring energy and motivational power: " },
    Hyperion: { baseVoice: "Puck", personaPrefix: "With high energy, punchy and exciting delivery: " },
    Aura: { baseVoice: "Zephyr", personaPrefix: "In a tranquil, ethereal, slow meditative voice: " },
    Helios: { baseVoice: "Puck", personaPrefix: "In a bright, warm, educational storytelling voice: " },
    Vesta: { baseVoice: "Kore", personaPrefix: "In a gentle, comforting bedtime story voice: " },
    Minerva: { baseVoice: "Aoede", personaPrefix: "In an insightful, intellectual documentary voice: " },
  };

  // TTS generation endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const {
        text,
        voice = "Kore",
        style = "natural",
        customStyleInstruction = "",
        multiSpeaker = false,
        dialogueSpeakers = [],
      } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        res.status(400).json({ error: "Text is required to generate speech." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(400).json({
          error: "GEMINI_API_KEY is not configured. Please ensure your Gemini API key is set.",
          fallbackAvailable: true,
        });
        return;
      }

      // Single speaker or multi-speaker configuration
      if (multiSpeaker && Array.isArray(dialogueSpeakers) && dialogueSpeakers.length === 2) {
        const speaker1 = dialogueSpeakers[0];
        const speaker2 = dialogueSpeakers[1];

        const s1Config = voiceMapping[speaker1.voice] || { baseVoice: "Kore" };
        const s2Config = voiceMapping[speaker2.voice] || { baseVoice: "Puck" };

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: text.trim() }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: speaker1.name || "Speaker 1",
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: s1Config.baseVoice },
                    },
                  },
                  {
                    speaker: speaker2.name || "Speaker 2",
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: s2Config.baseVoice },
                    },
                  },
                ],
              },
            },
          },
        });

        const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!rawBase64) {
          res.status(500).json({ error: "No audio generated from the model." });
          return;
        }

        const pcmBuffer = Buffer.from(rawBase64, "base64");
        const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
        const wavBase64 = wavBuffer.toString("base64");

        res.json({
          audioBase64: wavBase64,
          mimeType: "audio/wav",
          sampleRate: 24000,
          voice: `${speaker1.name} (${speaker1.voice}) & ${speaker2.name} (${speaker2.voice})`,
          textLength: text.length,
          approxDurationSeconds: Number((pcmBuffer.length / (24000 * 2)).toFixed(2)),
        });
        return;
      }

      // Single speaker flow with style phrasing
      let promptText = text.trim();
      const styleMap: Record<string, string> = {
        cheerful: "Say cheerfully with bright enthusiasm: ",
        calm: "Speak in a calm, soothing, relaxed mindfulness tone: ",
        professional: "Speak in a clear, polished, authoritative corporate tone: ",
        dramatic: "Narrate with deep dramatic tension and cinematic expression: ",
        storyteller: "Narrate like an engaging fairytale storyteller: ",
        whisper: "Speak in an intimate, gentle soft whisper: ",
        news: "Deliver this clearly and authoritatively like a live news anchor: ",
      };

      const selectedVoiceMeta = voiceMapping[voice] || { baseVoice: "Kore" };
      const baseVoiceName = selectedVoiceMeta.baseVoice;

      if (customStyleInstruction && customStyleInstruction.trim()) {
        promptText = `${customStyleInstruction.trim()}: ${promptText}`;
      } else if (selectedVoiceMeta.personaPrefix) {
        if (style && styleMap[style]) {
          promptText = `${selectedVoiceMeta.personaPrefix}${styleMap[style]}${promptText}`;
        } else {
          promptText = `${selectedVoiceMeta.personaPrefix}${promptText}`;
        }
      } else if (style && styleMap[style]) {
        promptText = `${styleMap[style]}${promptText}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: baseVoiceName },
            },
          },
        },
      });

      const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!rawBase64) {
        res.status(500).json({ error: "The voice model did not return audio data." });
        return;
      }

      const pcmBuffer = Buffer.from(rawBase64, "base64");
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");

      res.json({
        audioBase64: wavBase64,
        mimeType: "audio/wav",
        sampleRate: 24000,
        voice: voice,
        style: style || "natural",
        textLength: text.length,
        approxDurationSeconds: Number((pcmBuffer.length / (24000 * 2)).toFixed(2)),
      });
    } catch (error: any) {
      console.error("TTS generation error:", error);
      res.status(500).json({
        error: error?.message || "Failed to generate speech audio.",
        details: String(error),
      });
    }
  });

  // Enhance text / Script helper using Gemini 3.7 Flash
  app.post("/api/enhance-text", async (req, res) => {
    try {
      const { text, action } = req.body;
      if (!text) {
        res.status(400).json({ error: "Text is required." });
        return;
      }

      let systemInstruction = "You are a professional voiceover script editor. Improve or rephrase the given text for spoken speech delivery.";
      let userPrompt = "";

      if (action === "make-engaging") {
        userPrompt = `Make the following text more engaging, natural, and expressive for a voiceover reading:\n\n"${text}"\n\nReturn ONLY the revised text with no quotation marks or meta commentary.`;
      } else if (action === "add-pauses") {
        userPrompt = `Add natural speech cadence, breathing punctuation (ellipses, commas, dashes) to make this text sound ultra-natural when read aloud by a text-to-speech engine:\n\n"${text}"\n\nReturn ONLY the revised text.`;
      } else if (action === "simplify") {
        userPrompt = `Simplify and clarify this text for crystal-clear auditory comprehension:\n\n"${text}"\n\nReturn ONLY the simplified text.`;
      } else if (action === "story-dialogue") {
        userPrompt = `Format the following concept into a dynamic 2-speaker dialogue between "Alex" and "Jordan":\n\n"${text}"\n\nFormat as:\nAlex: [line]\nJordan: [line]`;
      } else {
        userPrompt = `Polish this text for spoken voiceover:\n\n"${text}"\n\nReturn ONLY the polished script.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const refinedText = response.text?.trim() || text;
      res.json({ refinedText });
    } catch (error: any) {
      console.error("Enhance text error:", error);
      res.status(500).json({ error: error?.message || "Failed to enhance script." });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
});
