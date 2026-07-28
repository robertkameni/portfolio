import type { ChatMessage, CompletionMessage } from '../../../ai/deepseek.helpers';
import { runDeepSeekCompletion } from '../../../ai/deepseek.client';
import { executeSchedulingTool } from './tool-executor';
import { canInvokeTool } from './conversation-state';
import { SCHEDULING_TOOLS, type SchedulingToolName } from './tools';

const MAX_TOOL_LOOP_ITERATIONS = 5;

type RunSchedulingToolLoopOptions = {
  model: string;
  maxOutputTokens?: number;
  sessionId?: string;
};

function isSchedulingToolName(name: string): name is SchedulingToolName {
  return name === 'get_availability' || name === 'book_meeting';
}

export async function runSchedulingToolLoop(messages: ChatMessage[], options: RunSchedulingToolLoopOptions): Promise<CompletionMessage> {
  const workingMessages = [...messages];

  for (let iteration = 0; iteration < MAX_TOOL_LOOP_ITERATIONS; iteration += 1) {
    const completion = await runDeepSeekCompletion(workingMessages, {
      model: options.model,
      maxOutputTokens: options.maxOutputTokens,
      tools: SCHEDULING_TOOLS,
    });

    const assistantMessage = completion.response.message();

    if (assistantMessage.tool_calls.length === 0) {
      return assistantMessage;
    }

    if (!canInvokeTool(options.sessionId)) {
      return {
        content:
          'I cannot run more calendar actions in this chat session. Please use the contact form at /contact or email robertkameni83@gmail.com to arrange a meeting.',
        tool_calls: [],
      };
    }

    workingMessages.push({
      role: 'assistant',
      content: assistantMessage.content || null,
      tool_calls: assistantMessage.tool_calls,
    });

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      if (!isSchedulingToolName(toolName)) {
        workingMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: `Unknown tool: ${toolName}` }),
        });
        continue;
      }

      const execution = await executeSchedulingTool(toolName, toolCall.function.arguments, {
        sessionId: options.sessionId,
      });

      workingMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: execution.result,
      });
    }
  }

  return {
    content: 'I could not complete the scheduling request. Please use the contact form at /contact.',
    tool_calls: [],
  };
}
