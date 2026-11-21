import express from 'express';
import dotenv from 'dotenv';
import chatController from './Controllers/chat.controller.js';
import aiAgentChatController from './Controllers/aiAgentChat.controller.js';


dotenv.config();

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());


//-------------Streaming output from the model-----------

// const generateResponse = async () =>{
//     console.log("Generating response...");
//     const response = await ai.models.generateContentStream({
//         model:"gemini-3.5-flash-lite",
//         contents:"what is javascript?",
//     })
//     for await (const chunk of response) {
//         console.log(chunk.text);
//     }
// }

//---------------Non Streaming output from the model-----------------

// const generateResponse = async () =>{
//     const response = await ai.models.generateContent({
//         model:"gemini-3.5-flash-lite",
//         contents:"my name is vineet"
//     })

//     console.log(response.text);
// }



//without google SDK
app.post('/chat', chatController)

//using langchain
app.post('/agent-chat', aiAgentChatController)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});