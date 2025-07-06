import { Ollama } from 'ollama';
import { LLMConfig, GeneratedCode } from '../types/AITypes';

export class OllamaClient {
    private client: Ollama;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.client = new Ollama({
            host: process.env.OLLAMA_HOST || 'http://localhost:11434'
        });
        this.config = config;
    }

    async generate(prompt: string, options?: Partial<LLMConfig>): Promise<GeneratedCode> {
        const startTime = Date.now();
        const generationConfig = { ...this.config, ...options };

        try {
            const response = await this.client.generate({
                model: generationConfig.model,
                prompt: prompt,
                options: {
                    temperature: generationConfig.temperature,
                    top_p: generationConfig.topP,
                    top_k: generationConfig.topK,
                    repeat_penalty: generationConfig.repeatPenalty,
                    num_predict: generationConfig.maxTokens
                }
            });

            const generationTime = Date.now() - startTime;

            return {
                code: response.response,
                explanation: 'Generated using Ollama LLM',
                metadata: {
                    model: generationConfig.model,
                    generationTime,
                    tokensUsed: response.eval_count || 0,
                    confidence: 0.8 // Default confidence for Ollama
                }
            };
        } catch (error) {
            throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async streamGenerate(prompt: string, options?: Partial<LLMConfig>): Promise<GeneratedCode> {
        const startTime = Date.now();
        const generationConfig = { ...this.config, ...options };

        try {
            const stream = await this.client.generate({
                model: generationConfig.model,
                prompt: prompt,
                stream: true,
                options: {
                    temperature: generationConfig.temperature,
                    top_p: generationConfig.topP,
                    top_k: generationConfig.topK,
                    repeat_penalty: generationConfig.repeatPenalty,
                    num_predict: generationConfig.maxTokens
                }
            });

            let fullResponse = '';
            let tokenCount = 0;

            for await (const chunk of stream) {
                fullResponse += chunk.response;
                tokenCount += chunk.eval_count || 0;
            }

            const generationTime = Date.now() - startTime;

            return {
                code: fullResponse,
                explanation: 'Generated using Ollama LLM (streaming)',
                metadata: {
                    model: generationConfig.model,
                    generationTime,
                    tokensUsed: tokenCount,
                    confidence: 0.8
                }
            };
        } catch (error) {
            throw new Error(`Ollama streaming generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const models = await this.client.list();
            return models.models.map(model => model.name);
        } catch (error) {
            throw new Error(`Failed to list Ollama models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async isModelAvailable(modelName: string): Promise<boolean> {
        try {
            const models = await this.listModels();
            return models.includes(modelName);
        } catch (error) {
            return false;
        }
    }

    async pullModel(modelName: string): Promise<void> {
        try {
            await this.client.pull({ model: modelName });
        } catch (error) {
            throw new Error(`Failed to pull Ollama model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getModelInfo(modelName: string): Promise<any> {
        try {
            const models = await this.client.list();
            const model = models.models.find(m => m.name === modelName);
            return model || null;
        } catch (error) {
            throw new Error(`Failed to get model info for ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.client.list();
            return true;
        } catch (error) {
            return false;
        }
    }
} 