import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, resume } = await req.json();
    
    if (!jobDescription || !resume) {
      throw new Error('Missing required fields');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing resume with AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyzer and career coach. Analyze job descriptions and resumes to provide actionable insights.

Your task:
1. Calculate a match score (0-100) based on how well the resume matches the job description
2. Extract key skills from the job description that the candidate has
3. Provide 3-5 specific, actionable improvement suggestions
4. Identify missing keywords/skills from the job description

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "matchScore": <number 0-100>,
  "keySkills": ["skill1", "skill2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...]
}`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nResume/Skills:\n${resume}`
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // Parse the JSON response
    const analysisResults = JSON.parse(cleanedResponse);
    
    console.log('Analysis complete:', analysisResults);

    return new Response(
      JSON.stringify(analysisResults),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
