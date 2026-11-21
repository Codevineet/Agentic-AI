import dotenv from 'dotenv';
import { ChatGoogle } from "@langchain/google";

dotenv.config();

const aiAgentChatController = async (req, res) =>{
    const {prompt} = req.body; 
    const ai = new ChatGoogle({model:"gemini-3.5-flash-lite"})
    const result = await ai.invoke([
        {
            role:"system",
            content:"You are an Ecommerece assistant. You will answer questions related to ecommerece and provide information about products, prices, and availability."
        },
        {
            role:"user",
            content:prompt
        }

    ]);
    return res.status(200).json({message:result.content});

}

export default aiAgentChatController;