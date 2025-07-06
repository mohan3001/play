import { AIWorkflowService } from '../core/AIWorkflowService';
import { LLMConfig } from '../types/AITypes';

async function demoWorkflow() {
    console.log('🎬 AI Workflow Demonstration\n');
    
    const config: LLMConfig = {
        model: 'mistral',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 4096,
        batchSize: 1
    };
    
    const workflowService = new AIWorkflowService(config);
    
    // Your specific request
    const userRequest = "Create new branch 'AddCart' and create a new feature file and implementation for login and add to cart. commit the code for review";
    
    console.log('📝 User Request:');
    console.log(`"${userRequest}"\n`);
    
    try {
        console.log('🔍 Step 1: Parsing Natural Language Request...');
        const parsedRequest = await workflowService.parseWorkflowRequest(userRequest);
        
        console.log('📋 Parsed Request:');
        console.log(JSON.stringify(parsedRequest, null, 2));
        
        console.log('\n💻 Step 2: Demonstrating Code Generation...');
        console.log('Generating sample code for each file type:\n');
        
        // Generate sample code for each file type
        for (const filePath of parsedRequest.filesToGenerate) {
            console.log(`📄 Generating: ${filePath}`);
            const code = await workflowService.generateCodeForFile(filePath, parsedRequest.featureDescription);
            console.log('Generated Code:');
            console.log('='.repeat(50));
            console.log(code.substring(0, 300) + (code.length > 300 ? '...' : ''));
            console.log('='.repeat(50));
            console.log();
        }
        
        console.log('✅ Demonstration Complete!');
        console.log('\n🎯 What the AI Workflow Would Do:');
        console.log('1. ✅ Parse your natural language request');
        console.log('2. ✅ Extract branch name: ' + parsedRequest.branchName);
        console.log('3. ✅ Identify feature: ' + parsedRequest.featureDescription);
        console.log('4. ✅ Generate appropriate code files');
        console.log('5. 🔄 Create Git branch (when executed)');
        console.log('6. 🔄 Commit changes (when executed)');
        console.log('7. 🔄 Push to remote (when executed)');
        
        console.log('\n💡 To execute the full workflow:');
        console.log('   npm run chat');
        console.log('   Then type: "ai workflow" or your natural language request');
        
    } catch (error) {
        console.error('❌ Demo failed:', error instanceof Error ? error.message : 'Unknown error');
    }
}

demoWorkflow().catch(console.error); 