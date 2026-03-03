import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://abdulkafi88.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Known user-facing errors that are safe to show
const USER_FACING_ERRORS = [
  'Missing required fields',
  'Input is too long',
  'Please fill in both',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, resume } = await req.json();

    if (!jobDescription || !resume) {
      throw new Error('Missing required fields');
    }

    // Prevent oversized payloads (DoS protection)
    if (jobDescription.length > 15000 || resume.length > 20000) {
      throw new Error('Input is too long. Please shorten your text and try again.');
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    console.log('Analyzing resume with Groq AI...');

    const prompt = `You are an expert resume coach and career advisor. Carefully analyze the job description and the candidate's resume below, then return a detailed JSON response.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Instructions:
- matchScore: Score STRICTLY based on how many job requirements the resume actually meets. Use this scale:
  0-10 = Resume has almost nothing relevant to the job
  11-25 = Resume has 1-2 keywords but is clearly unqualified
  26-40 = Resume has some related experience but missing most key requirements
  41-55 = Resume meets roughly half the requirements
  56-70 = Resume is a decent match but missing important skills
  71-85 = Resume meets most requirements with minor gaps
  86-100 = Resume is an excellent match for the role
  Be STRICT. Do not be generous. A resume with only 1-2 matching skills out of 10 required should score below 20.
- keySkills: List specific skills and qualifications from the resume that match the job description.
- missingKeywords: List important skills, tools, technologies, or qualifications mentioned in the job description that are missing or not clearly shown in the resume.
- improvements: Give 5-8 specific, actionable tips the candidate should use to improve their resume for this exact job. Be specific — mention actual skills, keywords, or sections they should add or change. Do NOT give generic advice.

You MUST respond with ONLY a valid JSON object in this exact format, no extra text:
{
  "matchScore": <number 0-100>,
  "keySkills": ["skill1", "skill2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "improvements": ["tip1", "tip2"]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error('AI service error. Please try again.');
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
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Try to extract JSON if it's embedded in other text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Parse the JSON response
    let analysisResults;
    try {
      analysisResults = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', cleanedResponse);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate the response structure
    if (!analysisResults || typeof analysisResults !== 'object') {
      throw new Error('Invalid response from AI. Please try again.');
    }

    // Ensure all required fields exist with proper defaults
    const validatedResults = {
      matchScore: typeof analysisResults.matchScore === 'number' ? analysisResults.matchScore : 0,
      keySkills: Array.isArray(analysisResults.keySkills) ? analysisResults.keySkills : [],
      improvements: Array.isArray(analysisResults.improvements) ? analysisResults.improvements : [],
      missingKeywords: Array.isArray(analysisResults.missingKeywords) ? analysisResults.missingKeywords : []
    };

    console.log('Analysis complete:', validatedResults);

    return new Response(
      JSON.stringify(validatedResults),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-resume function:', message);

    // Only show safe user-facing messages — hide internal system errors
    const isUserFacing = USER_FACING_ERRORS.some(e => message.includes(e));
    const clientMessage = isUserFacing ? message : 'Analysis failed. Please try again.';

    return new Response(
      JSON.stringify({ error: clientMessage }),
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
