const fs = require("fs");
const { createClient } = require("@deepgram/sdk");
const Sentiment = require("sentiment");

const sentiment = new Sentiment();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

async function transcribeAudio(filePath) {
  const audio = fs.readFileSync(filePath);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audio,
    {
      model: "nova",
      smart_format: true
    }
  );

  if (error) {
    console.error("Deepgram Error:", error);
    return "Transcription failed";
  }

  return result.results.channels[0].alternatives[0].transcript;
}

async function analyzeSentiment(text) {
  const result = sentiment.analyze(text);
  return {
    label: result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral",
    score: result.score
  };
}

module.exports = { transcribeAudio, analyzeSentiment };
