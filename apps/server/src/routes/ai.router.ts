import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import { FsService } from '../services/fs.service';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const formatTree = (treeData: any[]): string => {
  if (!treeData || !Array.isArray(treeData)) return 'N/A';
  return treeData.map(node => `- ${node.path} (${node.type})`).join('\n');
};

// ─── POST /api/ai/chat ───────────────────────────────────────────────
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body;

    // Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!process.env.GEMINI_API_KEY) {
      res.write(`data: ${JSON.stringify({ error: 'SYSTEM_ERROR: The backend is missing GEMINI_API_KEY.' })}\n\n`);
      res.end();
      return;
    }

    const { activeFile, fileContent, tree, projectId } = context || {};

    const systemInstruction = `You are SYNQ AI, a world-class pair-programming assistant built directly into the user's browser IDE.

Current Project ID: ${projectId || 'Unknown'}
Currently Active File: ${activeFile || 'None open'}

Active File Content:
\`\`\`
${fileContent || 'None'}
\`\`\`

Workspace Directory Tree:
${formatTree(tree)}

INSTRUCTIONS:
1. Provide highly accurate, concise, and professional answers.
2. If asked to write code, provide fully complete code blocks (do not leave 'todo' or placeholders if reasonably avoidable).
3. Keep conversational filler to an absolute minimum. Help the user win their hackathon.
4. You support Markdown formatting. Provide syntax highlighting for code blocks.`;

    // Tool definition for Gemini function calling
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'write_file',
            description: "Overwrite a file in the workspace with new content. Use this to explicitly fulfill the user's coding requests.",
            parameters: {
              type: 'OBJECT' as const,
              properties: {
                file_path: {
                  type: 'STRING' as const,
                  description: 'Relative path to the file (e.g. src/App.tsx)',
                },
                content: {
                  type: 'STRING' as const,
                  description: 'The complete new file content',
                },
              },
              required: ['file_path', 'content'],
            },
          },
        ],
      },
    ];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
      tools,
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    });

    // Convert SYNQ message format to Gemini format
    const history = (messages || []).slice(0, -1).map((m: any) => ({
      role: m.role === 'ai' || m.sender === 'SYNQ AI' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    // Ensure history starts with user for Gemini
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    const lastMessage = (messages || []).at(-1);
    const userPrompt = lastMessage?.content || '';

    const chat = model.startChat({ history });
    const streamResult = await chat.sendMessageStream(userPrompt);

    // Stream text chunks back to the frontend
    let fullText = '';
    let functionCallFound: { name: string; args: any } | null = null;

    for await (const chunk of streamResult.stream) {
      const candidate = chunk.candidates?.[0];
      if (!candidate) continue;

      // Accumulate text content
      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          fullText += part.text;
          res.write(`data: ${JSON.stringify({ text: part.text })}\n\n`);
        }
        // Capture function call (Gemini sends it in parts too)
        if (part.functionCall) {
          functionCallFound = {
            name: part.functionCall.name,
            args: part.functionCall.args,
          };
        }
      }
    }

    // If no function call found in stream, check the final aggregated response
    if (!functionCallFound) {
      const finalResponse = await streamResult.response;
      const parts = finalResponse.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.functionCall) {
          functionCallFound = {
            name: part.functionCall.name,
            args: part.functionCall.args,
          };
        }
      }
    }

    // Execute the write_file tool if Gemini called it
    if (functionCallFound?.name === 'write_file' && projectId) {
      try {
        const { file_path, content } = functionCallFound.args as { file_path: string; content: string };
        if (file_path && content) {
          res.write(`data: ${JSON.stringify({ action: 'EXEC_START', tool: 'write_file', path: file_path })}\n\n`);
          await FsService.writeFile(projectId, file_path, content);
          res.write(`data: ${JSON.stringify({ action: 'RELOAD_FILE', path: file_path })}\n\n`);
        }
      } catch (toolErr: any) {
        console.error('[Gemini Tool Execution Error]', toolErr);
        res.write(`data: ${JSON.stringify({ error: `Tool failed: ${toolErr.message}` })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[Gemini Stream Error]', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'AI stream failed' })}\n\n`);
    res.end();
  }
});

export default router;
