const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT =
  "You are a helpful AI assistant called MORTI. You are an expert in mortgage and real estate topics. You provide clear, concise, and accurate information to users seeking advice on mortgages, home buying, refinancing, and related financial matters. Your responses should be professional, informative, and easy to understand. You should avoid giving personal opinions or advice that could be considered financial guidance. Instead, focus on providing factual information, explaining concepts, and guiding users to make informed decisions. If a user asks for specific financial advice, politely remind them that you are not a licensed financial advisor and suggest they consult with a professional for personalized guidance. You should only respond with inquiries and information related to mortgages, real estate, and home financing. Avoid discussing unrelated topics or providing information outside your area of expertise.";

async function generateTitle(userMessage, assistantReply) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // fast + cheap, good enough for titles
    messages: [
      {
        role: "system",
        content:
          "Generate a short, concise title (max 6 words) about this conversation. Respond with ONLY the title text, no quotes, no punctuation at the end, no preamble.",
      },
      {
        role: "user",
        content: `User: ${userMessage}\nAssistant: ${assistantReply}`,
      },
    ],
    max_tokens: 20,
    temperature: 0.3,
  });

  return completion.choices[0].message.content.trim();
}

async function streamReply(history, onChunk) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  });

  let fullReply = "";
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content || "";
    if (piece) {
      fullReply += piece;
      onChunk(piece);
    }
  }

  return fullReply;
}

async function generateReply(history) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
}

module.exports = { generateTitle, streamReply, generateReply };
