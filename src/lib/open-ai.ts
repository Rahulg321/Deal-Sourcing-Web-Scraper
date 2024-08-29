import OpenAI from "openai";
const dotenv = require("dotenv");
dotenv.config();

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openAi;
