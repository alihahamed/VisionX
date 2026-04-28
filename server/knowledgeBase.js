import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { TaskType } from "@google/generative-ai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenAI, Type } from "@google/genai";

import dotenv from "dotenv";

dotenv.config();

// knowledge base

async function knowledge() {
  const client = createClient(
    process.env.SUPABASE_PROJECT_URL,
    process.env.SUPABASE_API_KEY
  );
  const apiKey = process.env.GOOGLE_API_KEY;

  const ai = new GoogleGenAI({apiKey:apiKey});

  const TARGETS = [
    { role: "Frontend Developer", stack: "React", count: 25 },
    { role: "Frontend Developer", stack: "Vue", count: 25 },
    { role: "Backend Developer", stack: "Node.js", count: 25 },
    { role: "Backend Developer", stack: "Django", count: 25 },
    { role: "Devops Engineer", stack: "Docker", count: 25 },
    { role: "UI/UX", stack: "Figma", count: 25},
    { role:"Fullstack Developer", stack:"MERN", count:25}
  ];

  for (const target of TARGETS) { // the reason we're running a for each loop here is because we wanna run this function for each of the target in the targets list
   const prompt = `
      Generate ${target.count} interview questions and answers for a ${target.role} developer specializing in ${target.stack}.

      CRITICAL DISTRIBUTION INSTRUCTIONS:
      1. **No Experience (at least 3 questions)**: Focus on general aptitude, logic puzzles, or very basic CS fundamentals (e.g. "How does the internet work?", "Explain a variable to a 5-year-old").
      2. **Junior (approx 30%)**: Standard "textbook" questions are allowed here (e.g., "What is React?", "Explain the difference between let and var").
      3. **Mid-Level (approx 40%)**: Focus on practical implementation, debugging scenarios, and deeper "How does it work under the hood" questions.
      4. **Senior (approx 20%)**: Focus on System Design, Architecture, Security, and Optimization at scale.

      CONTENT GUIDELINES:
      - **Generic Questions are OK:** It is acceptable to include standard interview questions (e.g. "Define the Virtual DOM"), as these are common in real interviews.
      - **Scenario Questions:** Mix in questions like "How would you handle X situation?" alongside the generic ones.
      - Answers must be detailed and technically accurate.

      Format the output strictly as a JSON Array of objects with this structure:
      [
        {
          "content": "Q: [Question here]\\nA: [Detailed Answer here]",
          "topic": "[Specific concept, e.g. Event Loop]",
          "difficulty": "No Experience" | "Junior" | "Mid" | "Senior"
        }
      ]
      Do not add markdown formatting like \`\`\`json. Just raw JSON.
    `;

      

    try {
      const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config:{
        responseMimeType:"application/json",
        responseSchema:{
          type:Type.ARRAY,
          items: {
            type:Type.OBJECT,
            properties:{
              content: {
                type:Type.STRING,
                description:"Format as 'Q: [Question]\nA: [Answer]"
              },
              topic: {
                type:Type.STRING,
              },
              difficulty: {
                type:Type.STRING,
                enum:["No Experience","Junior", "Mid", "Senior"]
              }
            },
            propertyOrdering:["content", "topic", "difficulty"]
          }
        }
      }
    }); 

    const data = response.text.replace(/```json\n?|\n?```/g, '') 
    const cleanData = JSON.parse(data)

    const documents = cleanData.map((c) => ({
      pageContent:c.content,
      metadata: {
        topic:c.topic,
        stack:target.stack,
        role:target.role,
        difficulty:c.difficulty
      }
    }))
    
    

    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
      taskType: TaskType.RETRIEVAL_DOCUMENT, // 'retrieval_document' because we tell the vector ai to store the document in the database. It organizes the vector to be findable
      apiKey: apiKey,
    });

    // this function handles all the work to convert the text into the vector embeddings and store it into supabase (commenting so i dont get confused in the future)
    await SupabaseVectorStore.fromDocuments(
      documents, // our q/a cheat-sheet
      embeddings, // The Worker (The Google tool that turns Words -> Numbers)
      {
        client, // supabase database
        tableName: "documents", // database name
      }
    );

    
    console.log(
      "succesfully populated the database with the vector embeddings"
    );
 
    // console.log("data", cleanData)
    } catch (error) {
      console.log(error)
    }
  }
}

knowledge();
