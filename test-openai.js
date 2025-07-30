require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
  try {
    console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 'NOT SET');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API is working!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.log('❌ OpenAI API error:');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Error status:', error.status);
  }
}

testOpenAI();
