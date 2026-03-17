import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    console.error('Missing SILICONFLOW_API_KEY in environment');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: '服务器密钥未配置' }) 
    };
  }

  try {
    const { messages } = JSON.parse(event.body || '{}');

    // 使用原生 fetch 减少库加载开销
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: messages,
        temperature: 0.7,
        max_tokens: 400, // 稍微限制长度以加速回复
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('SiliconFlow API Error:', errorData);
      return { statusCode: response.status, body: errorData };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: data.choices[0]?.message?.content || '分析完成，但未返回具体结论。',
      }),
    };
  } catch (error: any) {
    console.error('Netlify Function Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '分析服务暂时不可用' }),
    };
  }
};

export { handler };
