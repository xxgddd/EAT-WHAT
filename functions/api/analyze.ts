interface Env {
  SILICONFLOW_API_KEY: string;
}

export const onRequestPost = async (context: any) => {
  try {
    const body = await context.request.json() as { messages: any[] };
    
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.SILICONFLOW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: body.messages,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
        return new Response(JSON.stringify({ error: `SiliconFlow API error: ${response.status}` }), { status: response.status });
    }

    const data = await response.json();
    
    // Cloudflare Pages Function returns this cleanly to the frontend
    return new Response(JSON.stringify(data), {
      headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
