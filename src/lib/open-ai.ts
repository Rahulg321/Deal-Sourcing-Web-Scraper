import OpenAI from "openai";
const dotenv = require("dotenv");
dotenv.config();

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openAi;

async function scraper(html: string) {
  const response = await openAi.chat.completions.create({
    model: "gpt-4o-mini", // Specify the model
    messages: [
      {
        role: "user",
        content: `here is the html of a sample website -> ${html}. Extract all the valuable information you can in a json format and return it.`,
      },
    ],
  });

  return response.choices[0].message.content;
}
