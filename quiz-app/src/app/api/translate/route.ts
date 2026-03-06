import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { words } = await request.json();

        if (!words || !Array.isArray(words) || words.length === 0) {
            return NextResponse.json({ error: 'No words provided' }, { status: 400 });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
        }

        const prompt = `Translate the following English words used as descriptive attributes for a person into Hungarian, Ukrainian, and Russian. 
Return ONLY a JSON object in this format:
{
  "hu": ["word1", "word2", ...],
  "ua": ["word1", "word2", ...],
  "ru": ["word1", "word2", ...]
}
Ensure each array has the exact same number of items as the input.

English words: ${words.join(', ')}`;

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a translation assistant. You MUST return ONLY a valid JSON object. Do not include any markdown backticks or extra text.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('DeepSeek API error:', error);
            return NextResponse.json({ error: 'Failed to fetch from DeepSeek' }, { status: response.status });
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Clean up markdown if present
        if (content.includes('```')) {
            content = content.replace(/```json\n?|```/g, '').trim();
        }

        try {
            const result = JSON.parse(content);
            return NextResponse.json(result);
        } catch (parseError) {
            console.error('Failed to parse DeepSeek JSON:', content);
            return NextResponse.json({
                error: 'Failed to parse translation result',
                details: content
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
