import {
  createAnthropicMock,
  createLangchainMock,
  createOpenAIMock,
  createVercelAiMock,
  type OpenAiChatCompletionsResponse,
  type OpenAiStreamChunk,
} from '@kiwa-lab/ai-llm';
import { describe, expect, it } from 'vitest';

describe('library documentation AI LLM recipes', () => {
  it('returns an OpenAI-shaped completion for a registered fixture', async () => {
    const client = createOpenAIMock({ responses: { ping: { content: 'pong' } } });
    const response = (await client.chat.completions.create({
      messages: [{ role: 'user', content: 'ping' }],
    })) as OpenAiChatCompletionsResponse;

    expect(response.choices[0]?.message.content).toBe('pong');
  });

  it('keeps OpenAI stream chunks in their delivery order', async () => {
    const client = createOpenAIMock({
      responses: { greeting: { content: 'hello world', chunks: ['hello ', 'world'] } },
    });
    const stream = client.chat.completions.create({
      stream: true,
      messages: [{ role: 'user', content: 'greeting' }],
    }) as AsyncIterable<OpenAiStreamChunk>;
    const received: string[] = [];
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta.content;
      if (content) {
        received.push(content);
      }
    }

    expect(received).toEqual(['hello ', 'world']);
    expect(received.join('')).toBe('hello world');
  });

  it('makes an Anthropic tool use block available to the application', async () => {
    const client = createAnthropicMock({
      responses: {
        weather: {
          content: '',
          toolCalls: [{ id: 'toolu_1', name: 'get_weather', arguments: '{"city":"tokyo"}' }],
        },
      },
    });
    const response = await client.messages.create({
      tools: [
        {
          name: 'get_weather',
          description: 'weather',
          input_schema: { type: 'object', properties: { city: { type: 'string' } } },
        },
      ],
      messages: [{ role: 'user', content: 'weather' }],
    });
    const tool = response.content.find((block) => block.type === 'tool_use');

    expect(response.stop_reason).toBe('tool_use');
    expect(tool).toMatchObject({ name: 'get_weather', input: { city: 'tokyo' } });
  });

  it('keeps Vercel AI and LangChain response shapes separate', async () => {
    const vercel = createVercelAiMock({ responses: { hi: { content: 'hello' } } });
    const langchain = createLangchainMock({ responses: { hi: { content: 'hello' } } });

    const generated = await vercel.generateText({ messages: [{ role: 'user', content: 'hi' }] });
    const message = await langchain.invoke([{ role: 'human', content: 'hi' }]);

    expect(generated).toMatchObject({ text: 'hello', finishReason: 'stop' });
    expect(message).toMatchObject({ _type: 'AIMessage', content: 'hello' });
  });
});
