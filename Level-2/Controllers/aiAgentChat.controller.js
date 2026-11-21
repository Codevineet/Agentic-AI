import dotenv from 'dotenv';
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent } from "langchain";

dotenv.config();

//agent = model + tools

//Intergrating tool with the LLM using Langchain - built in tool   
const tool = new TavilySearch({
    maxResults: 5,
    topic: "General",
})

//Custom tool building



//Model 
const ai_model = new ChatGoogle({model:"gemini-3.5-flash-lite"})



const aiAgentChatController = async (req, res) =>{
    const {prompt} = req.body; 
    const agent = createAgent({
        model: ai_model,
        tools: [tool],
    })

    const result = await agent.invoke({
        messages:[
            {
                role: "human",
                content: prompt
            }
        ]
    });
    return res.status(200).json({ message: result.messages[result.messages.length - 1].content});

}

export default aiAgentChatController;