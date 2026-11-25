import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";

import {
    StateGraph,
    START,
    END, MemorySaver, StateSchema, Command, interrupt
} from "@langchain/langgraph";
import { z } from "zod";

dotenv.config();


const checkpointer = new MemorySaver();

const model = new ChatGoogle({
    model: "gemini-3.5-flash-lite"
})

const customState = new StateSchema({
    prompt: z.string(),
    approval_required: z.boolean().default(false),
    ai_response: z.string(),
    approval_status: z.boolean().default(false),
    result: z.string()
})

const agent = async (state) => {
    const result = await model.invoke([
        {
            role: "system",
            content: `You are an AI agent that can perform actions based on user input.

            Determine whether the requested action requires human approval.

            Return ONLY valid JSON in this format:
            {
                "response": "Your response here",
                "approval_required": true
            }

            approval_required must be a boolean, not a string.`
        },
        {
            role: "user",
            content: state.prompt
        }
    ]);

    // Extract text from all content blocks
    const responseText = Array.isArray(result.content)
        ? result.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join("")
        : result.content;

    const parsed = JSON.parse(responseText);

    return {
        ai_response: parsed.response,
        approval_required: parsed.approval_required
    };
};

const approvalNode = async (state) => {

    const userAnswer = interrupt({
        message: "Do you want to perform this action?",
        prompt: state.prompt,
        ai_response: state.ai_response
    });

    return {
        approval_status: String(userAnswer).trim().toLowerCase() === "yes"
    }
}

const actionNode = async (state) => {

    if (state.approval_status) {
        return {
            result: `approved ${state.ai_response}`
        }
    }

    return {
        result: `Action rejected by human ${state.ai_response}`
    };
};

const shouldContinue = (state) => {
    if (state.approval_required) {
        return "approval"
    }
    return END;

}

const graph = new StateGraph(customState).
    addNode("agent", agent).
    addNode("approval", approvalNode).
    addNode("action", actionNode).
    addEdge(START, "agent").
    addConditionalEdges("agent", shouldContinue)
    .addEdge("approval", "action").
    addEdge("action", END).
    compile({ checkpointer })

const aiAgentChatController = async (req, res) => {
    try {
        const { prompt } = req.body;
        const threadId = randomUUID();

        const result = await graph.invoke({
            prompt
        },
            {
                configurable: { thread_id: threadId }

            })


        return res.status(200).json({
            threadId,
            ai_response: result.ai_response,
            approval_required: result.approval_required
        });



    } catch (error) {
        console.error("Agent Error:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};
const resumeAiAgentChatController = async (req, res) => {
    try {
        const { threadId, answer } = req.body;

        const config = {
            configurable: {
                thread_id: threadId
            }
        };


        const result = await graph.invoke(
            new Command({
                resume: String(answer)
            }),
            config
        );

        return res.status(200).json({
            threadId,
            ai_response: result.ai_response,
            approval_status: result.approval_status,
            result: result.result
        });

    } catch (error) {
        console.error("Resume Error:", error);
        return res.status(500).json({
            error: error.message
        });
    }
};

export { aiAgentChatController, resumeAiAgentChatController };

