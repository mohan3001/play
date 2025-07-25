import { LLMConfig } from '../types/AITypes';

export const LLM_CONFIGS = {
    // For code generation - more deterministic
    codeGeneration: {
        model: 'deepseek-coder:6.7b',
        temperature: 0.1,        // Low for consistent code
        maxTokens: 4096,         // Increased for larger responses
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 32768,    // Large context window for RAG
        batchSize: 1
    } as LLMConfig,

    // For chat/conversation - more creative
    chat: {
        model: 'deepseek-coder:6.7b',
        temperature: 0.7,        // Higher for more creative responses
        maxTokens: 2048,         // Increased for longer conversations
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 32768,    // Large context window for RAG
        batchSize: 1
    } as LLMConfig,

    // For analysis and review - balanced
    analysis: {
        model: 'deepseek-coder:6.7b',
        temperature: 0.3,        // Balanced for analysis
        maxTokens: 3072,         // Good for detailed analysis
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 32768,    // Large context window for RAG
        batchSize: 1
    } as LLMConfig,

    // For RAG queries - focused
    rag: {
        model: 'deepseek-coder:6.7b',
        temperature: 0.2,        // Low for consistent RAG responses
        maxTokens: 2048,         // Good for RAG responses
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 32768,    // Large context window for RAG
        batchSize: 1
    } as LLMConfig
};

export const getLLMConfig = (type: keyof typeof LLM_CONFIGS): LLMConfig => {
    return LLM_CONFIGS[type];
};

export const getDefaultConfig = (): LLMConfig => {
    return LLM_CONFIGS.codeGeneration;
}; 