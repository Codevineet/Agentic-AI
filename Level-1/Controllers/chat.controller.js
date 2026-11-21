import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const ai = new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
});

const chatController = async (req, res) =>{
    const {prompt} = req.body;

    const response = await ai.models.generateContent({
        model:"gemini-3.5-flash-lite",
        contents:prompt
    })

    return res.status(200).json({message:response.text});
}

export default chatController;