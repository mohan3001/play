const { AIWorkflowService } = require('./dist/core/AIWorkflowService');
const { LLMConfig } = require('./dist/types/AITypes');

async function testWorkflow() {
    console.log('🧪 Testing AI Workflow Service...\n');
    
    const config = {
        model: 'mistral',
        baseUrl: 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 2000
    };
    
    const workflowService = new AIWorkflowService(config);
    
    // Test the user's specific request
    const userRequest = "Create new branch 'AddCart' and create a new feature file and implementation for login and add to cart. commit the code for review";
    
    console.log('📝 User Request:');
    console.log(`"${userRequest}"\n`);
    
    try {
        console.log('🔍 Parsing request...');
        const parsedRequest = await workflowService.parseWorkflowRequest(userRequest);
        
        console.log('📋 Parsed Request:');
        console.log(JSON.stringify(parsedRequest, null, 2));
        
        console.log('\n🚀 Executing workflow...');
        const result = await workflowService.executeWorkflow(userRequest);
        
        console.log('\n📊 Workflow Result:');
        console.log(result.message);
        
        if (!result.success) {
            console.error(`❌ Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWorkflow().catch(console.error); 