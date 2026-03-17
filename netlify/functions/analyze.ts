import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const handler: Handler = async (event) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. 从环境变量获取 Key (这是安全的，浏览器看不到)
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing API Key' }) };
  }

  // 2. 初始化客户端
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.siliconflow.cn/v1',
  });

  try {
    const { messages } = JSON.parse(event.body || '{}');

    // 3. 调用 AI
    const response = await client.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: response.choices[0].message.content,
      }),
    };
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};

export { handler };
