
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
    StateGraph,
    MessagesAnnotation,
    START,
    END, MemorySaver
} from "@langchain/langgraph";
import { z } from "zod";

dotenv.config();

// 1. Built-in Tavily Search Tool
const tool1 = new TavilySearch({
    maxResults: 5,
    topic: "general",
});

// 2. Custom Addition Tool
const tool2 = tool(
    ({ a, b }) => {
        return `Addition of ${a} and ${b} is ${a + b}`;
    },
    {
        name: "addition_tool",
        description: "Use this tool to add two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
    }
);

// 3. Initialize Gemini Model and bind tools
const ai_model = new ChatGoogle({
    model: "gemini-3.5-flash-lite",
}).bindTools([tool1, tool2]);

// 4. Create ToolNode
const toolNode = new ToolNode([tool1, tool2]);

// 5. Agent Node
const agent = async (state) => {
    const result = await ai_model.invoke(state.messages);

    return {
        messages: [result],
    };
};

// 6. Conditional Edge
const shouldContinue = (state) => {
    const lastMessage = state.messages[state.messages.length - 1];

    if (lastMessage.tool_calls?.length > 0) {
        return "toolNode";
    }

    return END;
};

//Creating the memory saver checkpoint for short term memory 
const checkpointer = new MemorySaver();

// 7. Build StateGraph
const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agent)
    .addNode("toolNode", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("toolNode", "agent")
    .compile({checkpointer});

// 8. Controller
const aiAgentChatController = async (req, res) => {
    try {
        const { prompt } = req.body;

        const result = await graph.invoke({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ]},
            {
            configurable: { thread_id: "1" }
            
        })

        return res.status(200).json({
            message: result.messages[result.messages.length - 1].content,
        });

    } catch (error) {
        console.error("Agent Error:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};

export default aiAgentChatController;
