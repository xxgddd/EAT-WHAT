import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. 检查 Key 是否存在 (不打印全量以防泄露，只打印前几位)
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    console.error('[Netlify Function] Error: SILICONFLOW_API_KEY is missing!');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Environment variable SILICONFLOW_API_KEY not found' }) 
    };
  }
  console.log('[Netlify Function] Key found, length:', apiKey.length);

  try {
    const { messages } = JSON.parse(event.body || '{}');
    console.log('[Netlify Function] Sending request to SiliconFlow...');

    // 使用 .com 域名以获得更好的国际连通性
    const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: messages,
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      }),
    });

    console.log('[Netlify Function] SiliconFlow status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Netlify Function] SiliconFlow Error Body:', errorText);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: 'Upstream API error', details: errorText }) 
      };
    }

    const data = await response.json();
    console.log('[Netlify Function] Success! Returning response.');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: data.choices[0]?.message?.content || '无结论',
      }),
    };
  } catch (error: any) {
    console.error('[Netlify Function] Exception:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal logic error', message: error.message }),
    };
  }
};

export { handler };
