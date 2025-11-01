import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, TrendingUp, Target } from "lucide-react";

interface AnalysisData {
  matchScore: number;
  keySkills: string[];
  improvements: string[];
  missingKeywords: string[];
}

interface AnalysisResultsProps {
  data: AnalysisData;
}

export const AnalysisResults = ({ data }: AnalysisResultsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Match Score */}
      <Card className="p-8 bg-gradient-card shadow-lg border-border/50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Match Score</span>
          </div>
          
          <div className={`text-6xl font-bold ${getScoreColor(data.matchScore)}`}>
            {data.matchScore}%
          </div>
          
          <Progress 
            value={data.matchScore} 
            className="h-3 bg-secondary"
          />
          
          <p className="text-muted-foreground">
            {data.matchScore >= 75 && "Excellent match! Your profile aligns well with this role."}
            {data.matchScore >= 50 && data.matchScore < 75 && "Good match! Consider the improvements below."}
            {data.matchScore < 50 && "There's room for improvement. Check the suggestions below."}
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Skills */}
        <Card className="p-6 bg-gradient-card shadow-md border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="text-xl font-semibold">Key Skills Found</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.keySkills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-success/10 text-success border-success/20">
                {skill}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Missing Keywords */}
        <Card className="p-6 bg-gradient-card shadow-md border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-warning" />
            <h3 className="text-xl font-semibold">Missing Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.missingKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                {keyword}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Improvements */}
      <Card className="p-6 bg-gradient-card shadow-md border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Personalized Improvement Tips</h3>
        </div>
        <ul className="space-y-3">
          {data.improvements.map((improvement, index) => (
            <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-medium">{index + 1}</span>
              </div>
              <p className="text-foreground leading-relaxed">{improvement}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
