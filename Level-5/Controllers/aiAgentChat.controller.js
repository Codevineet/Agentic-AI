import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import Fs from "fs";
import { PDFParse } from "pdf-parse";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

dotenv.config();

const model = new ChatGoogle({
    model: "gemini-3.5-flash-lite"
})


//embedding model
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001", // 768 dimensions
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "Document title",
});

//vector database
const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: "internship-report",
    apikey: process.env.QDRANT_API_KEY

});

//extracting text from a pdf file
const upload = async () => {

    const path = "./PS-3  Report.pdf"
    const buffer = Fs.readFileSync(path);
    const pdfResult = new PDFParse({ data: buffer });
    const result = await pdfResult.getText();
    const text = result.text;

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 0 })
    const docs = await splitter.createDocuments([text]);

    const testVector = await embeddings.embedQuery("Hello world");
    console.log("Embedding dimensions:", testVector.length);

    await vectorStore.addDocuments(docs);
}


const aiAgentChatController = async (req, res) => {
    try {
        const { prompt } = req.body;
        const docs=await vectorStore.similaritySearch(prompt, 5);
        const context = docs.map(doc=>doc.pageContent).join("/n");

        const result = await model.invoke([{
            role: "system",
            content: `you are a rag assist and use this ${context} to answer the human questions`
        },{
            role: "human", 
            content: prompt
        }])

        console.log(result.content);
        return res.status(200).json({
            message: result.content
        })
        

    } catch (error) {
        console.error("Agent Error:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};

export default aiAgentChatController;