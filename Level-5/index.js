import express from 'express';
import dotenv from 'dotenv';
import aiAgentChatController from './Controllers/aiAgentChat.controller.js';


dotenv.config();

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());


//using langchain
app.post('/agent-chat',aiAgentChatController);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});