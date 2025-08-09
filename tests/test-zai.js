const fetch = require('node-fetch');

// Test Z.AI API connection
async function testZaiAPI() {
    const apiKey = "5bb6d9567c6a40568f61bcd8e76483a7.BLqz1y96gXl5dPBx";
    
    try {
        console.log("Testing Z.AI API connection...");
        
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "glm-4-32b-0414-128k",
                messages: [
                    {
                        role: "user",
                        content: "Hello! Please respond with 'Z.AI is working correctly' to confirm the connection."
                    }
                ],
                max_tokens: 50,
                temperature: 0.1
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("✅ Z.AI API connection successful!");
            console.log("Response:", data.choices[0].message.content);
        } else {
            console.log("❌ Z.AI API error:", data);
        }
    } catch (error) {
        console.log("❌ Z.AI API connection failed:", error.message);
    }
}

testZaiAPI();
