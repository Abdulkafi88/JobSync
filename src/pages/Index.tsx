import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Briefcase, Sparkles, TrendingUp, Upload } from "lucide-react";
import { AnalysisResults } from "@/components/AnalysisResults";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from 'pdfjs-dist';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

interface AnalysisData {
  matchScore: number;
  keySkills: string[];
  improvements: string[];
  missingKeywords: string[];
}

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisData | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Set up PDF.js worker using the package directly
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsProcessingFile(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      setResume(fullText);
      toast.success("Resume uploaded successfully!");
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Failed to process PDF file");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resume.trim()) {
      toast.error("Please fill in both job description and resume");
      return;
    }

    if (!GROQ_API_KEY) {
      toast.error("Groq API key is not configured.");
      return;
    }

    if (jobDescription.length > 15000 || resume.length > 20000) {
      toast.error("Input is too long. Please shorten your text and try again.");
      return;
    }

    setIsAnalyzing(true);

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

    try {
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
        toast.error("AI service error. Please try again.");
        return;
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        toast.error("No response from AI. Please try again.");
        return;
      }

      let cleaned = aiResponse.trim()
        .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];

      let analysisResults: AnalysisData;
      try {
        const parsed = JSON.parse(cleaned);
        analysisResults = {
          matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : 0,
          keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
          missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        };
      } catch {
        toast.error("Failed to parse AI response. Please try again.");
        return;
      }

      setAnalysisResults(analysisResults);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Career Tool</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Job Description Analyzer
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Optimize your resume with AI. Get instant insights on skills, keywords, and match scores.
          </p>
        </div>

        {/* Input Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-card shadow-lg border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Job Description</h2>
            </div>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[300px] resize-none bg-background/50"
            />
          </Card>

          <Card className="p-6 bg-gradient-card shadow-lg border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold">Your Resume/Skills</h2>
            </div>
            
            <div className="mb-4">
              <label htmlFor="resume-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background/50 hover:bg-background transition-colors w-fit">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Upload Resume (PDF)</span>
                </div>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {isProcessingFile && (
                <p className="text-sm text-muted-foreground mt-2">Processing PDF...</p>
              )}
            </div>

            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Or paste your resume or list your skills..."
              className="min-h-[300px] resize-none bg-background/50"
            />
          </Card>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow text-lg px-8 py-6"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {analysisResults && (
          <div className="animate-fade-in">
            <AnalysisResults data={analysisResults} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

