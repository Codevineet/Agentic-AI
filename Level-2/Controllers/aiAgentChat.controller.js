import dotenv from 'dotenv';
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent, tool } from "langchain";
import { z } from "zod";


dotenv.config();

//agent = model + tools

//Intergrating tool with the LLM using Langchain - built in tool   
const tool1 = new TavilySearch({
    maxResults: 5,
    topic: "General",
})

//Custom tool building with langchain
const tool2 = tool(({a, b}) => {
    return `Addtion of ${a} and ${b} is ${a + b}`;
},
    {
        name: "addition_tool",
        description: "use this tool for addition of two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number()
        })
    }

)


//Model 
const ai_model = new ChatGoogle({ model: "gemini-3.5-flash-lite" })



const aiAgentChatController = async (req, res) => {
    const { prompt } = req.body;
    const agent = createAgent({
        model: ai_model,
        tools: [tool1, tool2],
    })

    const result = await agent.invoke({
        messages: [
            {
                role: "human",
                content: prompt
            }
        ]
    });
    return res.status(200).json({ message: result.messages[result.messages.length - 1].content });

}

export default aiAgentChatController;