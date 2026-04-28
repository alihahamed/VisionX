import fetch from 'node-fetch'
import Groq from 'groq-sdk/index.mjs';
import 'dotenv/config'

export async function getAiResponse(userTranscript, sysInstructions, history = []) {
  
  const groq = new Groq({apiKey:process.env.GROQ_API_KEY})

  //  map the array to ensure every item has ONLY 'role' and 'content'
  const formattedHistory = history.map(msg => {
    // Determine the raw content from either property
    const rawContent = msg.content || msg.text || "";

    // ⚠️ KEY FIX: If content is an Object (the JSON response), stringify it!
    // Groq will crash if you send a raw JS Object as 'content'.
    const stringifiedContent = typeof rawContent === 'object' 
      ? JSON.stringify(rawContent) 
      : rawContent;

    return {
      role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
      content: stringifiedContent 
    };
  });

  // Add the system instructions (rules)
  const allMessages = [{role:"system", content:sysInstructions}, ...formattedHistory,{ role: "user", content: userTranscript } ]
  
  
  

  try {
    const completion = await groq.chat.completions.create({
      messages: allMessages,
      model: "llama-3.3-70b-versatile", 
      temperature: 0.6,
      response_format : {type:"json_object"}
    });

   return completion.choices[0]?.message?.content || "No response generated.";
   
  } catch (error) {
    console.log("Error while fetching the ai response", error)
    return JSON.stringify({
      grade:0,
      feedback:"No response generated.",
      nextQuestion:""
    })
  }
}

