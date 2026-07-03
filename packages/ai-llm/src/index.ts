export type {
  AiLlmMock,
  ChatCompletion,
  ChatInput,
  ChatMessage,
  MessageRole,
  MockConfig,
  MockResponse,
  StreamEvent,
  ToolCall,
  ToolDefinition,
  Usage,
} from './types.js';

export { MockEngine } from './engine.js';

export {
  createAnthropicMock,
  type AnthropicContentBlock,
  type AnthropicMessagesRequest,
  type AnthropicMessagesResponse,
  type AnthropicMock,
  type AnthropicStreamEvent,
} from './anthropic.js';

export {
  createOpenAIMock,
  type OpenAiChatCompletionsRequest,
  type OpenAiChatCompletionsResponse,
  type OpenAiContentPart,
  type OpenAiMock,
  type OpenAiStreamChunk,
  type OpenAiTranscriptionJson,
  type OpenAiTranscriptionRequest,
  type OpenAiTranscriptionVerboseJson,
} from './openai.js';

export {
  createVercelAiMock,
  type VercelAiMock,
  type VercelAiRequest,
  type VercelContentPart,
  type VercelGenerateTextResult,
  type VercelStreamTextResult,
} from './vercel-ai.js';

export {
  createLangchainMock,
  type LangchainAIMessage,
  type LangchainAIMessageChunk,
  type LangchainContentBlock,
  type LangchainInputMessage,
  type LangchainMock,
} from './langchain.js';

export {
  estimateMultimodalTokens,
  extractTextFromParts,
  hasAudioPart,
  hasImagePart,
  hasMultimodalParts,
  toTranscriptionKey,
  type AudioPart,
  type Base64Data,
  type ImagePart,
  type MediaSource,
  type MessagePart,
  type MockTranscription,
  type TextPart,
  type TranscriptionResult,
  type UrlData,
} from './multimodal.js';

export {
  jaccardSimilarity,
  runFidelityCheck,
  type FidelityInput,
  type FidelityRecord,
  type FidelityReport,
} from './fidelity.js';

export {
  buildAiLlmReport,
  buildAiLlmReportFromMock,
  type BuildAiLlmReportInput,
} from './report.js';

export {
  PRICE_ALIASES,
  PRICE_TABLE,
  costForTokens,
  lookupModelPrice,
  type ModelPrice,
  type PriceLookupResult,
} from './pricing.js';

export {
  makeSeededRandom,
  samplePoisson,
  sampleZipf,
} from './sampling.js';
