import { LLMConfig } from '../types/AITypes';

export const LLM_CONFIGS = {
    // For code generation - more deterministic
    codeGeneration: {
        model: 'mistral:7b-instruct',
        temperature: 0.1,        // Low for consistent code
        maxTokens: 2048,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 4096,
        batchSize: 1
    } as LLMConfig,

    // For chat/conversation - more creative
    chat: {
        model: 'mistral:7b-instruct',
        temperature: 0.7,        // Higher for more creative responses
        maxTokens: 1024,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 4096,
        batchSize: 1
    } as LLMConfig,

    // For analysis - balanced
    analysis: {
        model: 'mistral:7b-instruct',
        temperature: 0.3,
        maxTokens: 1536,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 4096,
        batchSize: 1
    } as LLMConfig
};

export const getLLMConfig = (type: keyof typeof LLM_CONFIGS): LLMConfig => {
    return LLM_CONFIGS[type];
};

export const getDefaultConfig = (): LLMConfig => {
    return LLM_CONFIGS.codeGeneration;
}; 