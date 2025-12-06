const fs = require("fs");
const { createClient } = require("@deepgram/sdk");
const Sentiment = require("sentiment");

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const sentiment = new Sentiment();

async function transcribeAudio(filePath) {
  // Read file from disk into buffer
  const audio = fs.readFileSync(filePath);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audio,
    {
      model: "nova",
      smart_format: true,
      // mimetype is optional; Deepgram can guess if needed
      mimetype: "audio/webm",
    }
  );

  if (error) {
    console.error("Deepgram error:", error);
    return "Transcription failed";
  }

  return result.results.channels[0].alternatives[0].transcript;
}

async function analyzeSentiment(text) {
  const r = sentiment.analyze(text || "");
  return {
    label: r.score > 0 ? "positive" : r.score < 0 ? "negative" : "neutral",
    score: r.score,
  };
}

module.exports = { transcribeAudio, analyzeSentiment };
