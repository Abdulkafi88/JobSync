import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Briefcase, Sparkles, TrendingUp, Upload } from "lucide-react";
import { AnalysisResults } from "@/components/AnalysisResults";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from 'pdfjs-dist';

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

    setIsAnalyzing(true);

    try {
      // Get Supabase URL and key from the client
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        toast.error("Supabase is not configured. Please check your environment variables.");
        return;
      }

      // Call the Edge Function directly using fetch for better error handling
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          jobDescription,
          resume
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Extract error message from response
        const errorMessage = responseData?.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error("Edge Function error:", errorMessage);
        console.error("Full response:", responseData);

        // Provide specific error messages
        if (errorMessage.includes('GOOGLE_GEMINI_API_KEY not configured')) {
          toast.error("API key not configured. Please set GOOGLE_GEMINI_API_KEY in Supabase Edge Function secrets.");
        } else if (errorMessage.includes('Missing required fields')) {
          toast.error("Please fill in both job description and resume.");
        } else if (errorMessage.includes('Google Gemini API error')) {
          toast.error(`AI service error: ${errorMessage}`);
        } else if (errorMessage.includes('Failed to parse AI response')) {
          toast.error("The AI returned an invalid response. Please try again.");
        } else {
          toast.error(`Analysis failed: ${errorMessage}`);
        }
        return;
      }

      // Check if response contains an error field
      if (responseData && typeof responseData === 'object' && 'error' in responseData) {
        toast.error(`Analysis failed: ${responseData.error}`);
        return;
      }

      if (!responseData) {
        toast.error("No analysis results received. Please try again.");
        return;
      }

      setAnalysisResults(responseData);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);

      // Provide user-friendly error messages based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Network error: Unable to reach the analysis service. Please check your connection and try again.");
      } else if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
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

