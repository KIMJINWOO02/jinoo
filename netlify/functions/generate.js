const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '프롬프트가 필요합니다.' }),
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageUrl: response.data[0].url,
      }),
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: '이미지 생성 중 오류가 발생했습니다.',
        details: error.message 
      }),
    };
  }
};
