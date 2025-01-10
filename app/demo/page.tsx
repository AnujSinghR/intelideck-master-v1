"use client";

import MaxWidthWrapper from "../../components/common/MaxWidthWrapper";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { ChevronLeft, ChevronRight, Download, Loader2, AlertCircle, Send, Presentation, Sparkles } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import pptxgen from "pptxgenjs";

// Previous interfaces remain the same
interface Slide {
  title: string;
  content: string[];
  style: 'title' | 'section' | 'content' | 'quote' | 'data';
  dataType?: 'chart' | 'comparison' | 'statistics';
  bgColor: string;
  textColor: string;
}

// Define color schemes to match PPT output
const slideStyles = {
  title: {
    bg: "from-blue-600 to-blue-700",
    text: "text-white"
  },
  section: {
    bg: "from-slate-800 to-slate-900",
    text: "text-white"
  },
  content: {
    bg: "from-white to-slate-50",
    text: "text-slate-800"
  },
  quote: {
    bg: "from-slate-100 to-slate-200",
    text: "text-slate-800"
  },
  data: {
    bg: "from-slate-50 to-white",
    text: "text-slate-800"
  }
};

interface Message {
  role: string;
  content: string;
}

interface ChatResponse {
  text: string;
  error?: string;
}

interface Prompt {
  category: string;
  description: string;
  prompt: string;
  gradient: string;
  isLoading?: boolean;
}

const defaultPrompts: Prompt[] = [
  {
    category: "Digital Marketing",
    description: "Trends & Campaigns",
    prompt: "Create a comprehensive presentation about current digital marketing trends, campaign insights, and action plans. Include key statistics, emerging technologies, and strategic recommendations.",
    gradient: "from-blue-500 to-violet-600",
    isLoading: false
  },
  {
    category: "SEO Strategy",
    description: "Website Optimization",
    prompt: "Create a detailed SEO strategy presentation covering current performance analysis, technical improvements, content strategy, and implementation plans for better search rankings.",
    gradient: "from-emerald-500 to-teal-600",
    isLoading: false
  },
  {
    category: "Market Analysis",
    description: "Competitive Research",
    prompt: "Create a market analysis presentation including industry overview, competitor analysis, SWOT analysis, and strategic recommendations for market positioning.",
    gradient: "from-orange-500 to-red-600",
    isLoading: false
  },
  {
    category: "Social Media",
    description: "Platform Strategy",
    prompt: "Create a social media strategy presentation covering platform analysis, content planning, engagement tactics, and growth strategies across different social networks.",
    gradient: "from-pink-500 to-rose-600",
    isLoading: false
  },
  {
    category: "E-commerce",
    description: "Growth & Retention",
    prompt: "Create an e-commerce strategy presentation focusing on customer analysis, retention strategies, growth opportunities, and implementation plans for increasing sales.",
    gradient: "from-purple-500 to-indigo-600",
    isLoading: false
  },
  {
    category: "Product Launch",
    description: "Go-to-Market Strategy",
    prompt: "Create a product launch strategy presentation including product overview, marketing approach, launch timeline, and success metrics for a successful market entry.",
    gradient: "from-cyan-500 to-blue-600",
    isLoading: false
  }
];

const colorCombos = [
  { bg: "from-blue-100 to-blue-200", text: "text-slate-700" },
  { bg: "from-emerald-100 to-teal-200", text: "text-slate-700" },
  { bg: "from-violet-100 to-purple-200", text: "text-slate-700" },
  { bg: "from-rose-100 to-pink-200", text: "text-slate-700" },
  { bg: "from-amber-100 to-orange-200", text: "text-slate-700" },
  { bg: "from-cyan-100 to-sky-200", text: "text-slate-700" },
  { bg: "from-slate-100 to-blue-200", text: "text-slate-700" },
  { bg: "from-teal-100 to-emerald-200", text: "text-slate-700" },
];

export default function DemoPage() {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>(defaultPrompts);

  // Previous functions remain the same
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Display message shows only user input
    const displayMessage = { role: "user", content: input };
    // API message includes formatting instructions
    const apiMessage = { role: "user", content: `${input}\n\nFormat the presentation with the following structure:
1. Each slide should have a clear, concise title
2. Content should be in bullet points
3. Each point should be a complete thought
4. Keep points focused and impactful
5. Use consistent formatting throughout
6. Limit to 4-6 points per slide for better readability

Use the following slide styles:
- Title slides (Style: title): For introduction and main section starts
- Section slides (Style: section): For major topic transitions
- Content slides (Style: content): For regular content
- Quote slides (Style: quote): For important quotes or key takeaways
- Data slides (Style: data): For statistics and data-heavy content

Format each slide as:
Title: [Slide Title]
Style: [slide style]
Data: [type] (only for data slides - chart/comparison/statistics)
• Point 1
• Point 2
etc.` };
    
    setMessages((prev) => [...prev, displayMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages.map(msg => 
            msg.role === "user" ? { role: "user", content: msg.content.split('\n\n')[0] } : msg
          ), apiMessage]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate response');
      }

      const data: ChatResponse = await response.json();
      
      if (!data.text) {
        throw new Error('Invalid response format');
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      
      // Parse presentation content
      const slideTexts: string[] = data.text.split('\n\n').filter((text: string) => 
        text.trim() && (text.toLowerCase().includes('title:') || text.includes('•'))
      );
      
      if (slideTexts.length > 0) {
        const parsedSlides = slideTexts.map((slideText: string, index: number) => {
          const lines: string[] = slideText.split('\n').filter((line: string) => line.trim());
          
          // Extract title and style
          const titleLine = lines[0].replace(/^[IVX]+\.\s*/, '').replace(/^Title:?\s*/i, '').replace(/^Slide\s*\d*:?\s*/i, '').trim();
          const styleLine = lines.find(line => line.toLowerCase().includes('style:'))?.replace(/^Style:\s*/i, '').toLowerCase() || 'content';
          const dataTypeLine = lines.find(line => line.toLowerCase().includes('data:'))?.replace(/^Data:\s*/i, '').toLowerCase();
          
          const title = titleLine;
          const style = styleLine as Slide['style'];
          const dataType = dataTypeLine as Slide['dataType'];
          
          // Extract content, skipping style and data type lines
          const content = lines.slice(1)
            .filter(line => !line.toLowerCase().includes('style:') && !line.toLowerCase().includes('data:'))
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line
              .replace(/^[-•*]\s*/, '')
              .replace(/^\d+\.\s*/, '')
              .replace(/^[A-Z]\)\s*/, '')
              .replace(/^[a-z]\)\s*/, '')
              .trim()
            )
            .filter(line => line.length > 0);

          return {
            title,
            content,
            style,
            dataType,
            bgColor: slideStyles[style].bg,
            textColor: slideStyles[style].text
          };
        });

        setSlides(parsedSlides);
      }
    } catch (error: any) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate response. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const generatePresentation = () => {
    const lastAssistantMessage = messages.findLast(msg => msg.role === "assistant");
    if (!lastAssistantMessage) {
      toast({
        title: "No content available",
        description: "Please chat with the AI first to generate presentation content.",
        variant: "destructive",
      });
      return;
    }

    const text = lastAssistantMessage.content;

    // Parse presentation content and ensure there's content to parse
    const slideTexts: string[] = text.split('\n\n').filter((text: string) => 
      text.trim() && (text.toLowerCase().includes('title:') || text.includes('•'))
    );
    
    if (slideTexts.length === 0) {
      toast({
        title: "No presentation content found",
        description: "The AI response doesn't contain properly formatted slides. Try asking a question about creating a presentation.",
        variant: "destructive",
      });
      return;
    }
      const parsedSlides = slideTexts.map((slideText: string, index: number) => {
        const lines: string[] = slideText.split('\n').filter((line: string) => line.trim());
        
        // Extract title and style
        const titleLine = lines[0].replace(/^[IVX]+\.\s*/, '').replace(/^Title:?\s*/i, '').replace(/^Slide\s*\d*:?\s*/i, '').trim();
        const styleLine = lines.find(line => line.toLowerCase().includes('style:'))?.replace(/^Style:\s*/i, '').toLowerCase() || 'content';
        const dataTypeLine = lines.find(line => line.toLowerCase().includes('data:'))?.replace(/^Data:\s*/i, '').toLowerCase();
        
        const title = titleLine;
        const style = styleLine as Slide['style'];
        const dataType = dataTypeLine as Slide['dataType'];
        
        // Extract content, skipping style and data type lines
        const content = lines.slice(1)
          .filter(line => !line.toLowerCase().includes('style:') && !line.toLowerCase().includes('data:'))
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line
            .replace(/^[-•*]\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^[A-Z]\)\s*/, '')
            .replace(/^[a-z]\)\s*/, '')
            .trim()
          )
          .filter(line => line.length > 0);

        return {
          title,
          content,
          style,
          dataType,
          bgColor: slideStyles[style].bg,
          textColor: slideStyles[style].text
        };
    });

    setSlides(parsedSlides);
    setCurrentSlide(0);
    
    // Scroll to the top where the presentation is displayed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    const downloadPPT = async () => {
      const pres = new pptxgen();

      // Set presentation properties
      pres.author = 'SlideGen AI';
      pres.company = 'SlideGen';
      pres.revision = '1';
      pres.subject = 'AI Generated Presentation';

      // Define modern color schemes
      const colorSchemes = {
        title: {
          background: { color: '2563EB' }, // blue-600
          title: { color: 'FFFFFF' },
          text: { color: 'FFFFFF' }
        },
        section: {
          background: { color: '1E293B' }, // slate-800
          title: { color: 'FFFFFF' },
          text: { color: 'FFFFFF' }
        },
        content: {
          background: { color: 'FFFFFF' },
          title: { color: '1E293B' }, // slate-800
          text: { color: '334155' } // slate-700
        },
        quote: {
          background: { color: 'F1F5F9' }, // slate-100
          title: { color: '1E293B' }, // slate-800
          text: { color: '334155' } // slate-700
        },
        data: {
          background: { color: 'F8FAFC' }, // slate-50
          title: { color: '1E293B' }, // slate-800
          text: { color: '334155' } // slate-700
        }
      };

      // Define slide layouts
      const layouts = {
        title: (slide: any, content: any) => {
          const scheme = colorSchemes.title;
          slide.background = scheme.background;
          
          // Large centered title
          slide.addText(content.title, {
            x: '10%',
            y: '35%',
            w: '80%',
            h: '30%',
            fontSize: 60,
            color: scheme.title.color,
            bold: true,
            align: 'center',
            valign: 'middle',
            wrap: true
          });

          // Subtitle points with animation
          content.content.forEach((point: string, idx: number) => {
            slide.addText(point, {
              x: '20%',
              y: `${65 + (idx * 8)}%`,
              w: '60%',
              h: '8%',
              fontSize: 24,
              color: scheme.text.color,
              align: 'center',
              valign: 'middle',
              transparency: 50,
              isTextBox: true
            });
          });
        },
        section: (slide: any, content: any) => {
          const scheme = colorSchemes.section;
          slide.background = scheme.background;
          
          // Large section title with accent bar
          slide.addShape(pres.ShapeType.rect, {
            x: '10%',
            y: '48%',
            w: '80%',
            h: '4%',
            fill: { color: '3B82F6' } // blue-500
          });

          slide.addText(content.title, {
            x: '10%',
            y: '30%',
            w: '80%',
            h: '15%',
            fontSize: 44,
            color: scheme.title.color,
            bold: true,
            align: 'center',
            valign: 'bottom'
          });

          content.content.forEach((point: string, idx: number) => {
            slide.addText(point, {
              x: '20%',
              y: `${55 + (idx * 8)}%`,
              w: '60%',
              h: '8%',
              fontSize: 24,
              color: scheme.text.color,
              align: 'center',
              valign: 'middle'
            });
          });
        },
        content: (slide: any, content: any) => {
          const scheme = colorSchemes.content;
          slide.background = scheme.background;

          // Title with bottom border
          slide.addShape(pres.ShapeType.rect, {
            x: '10%',
            y: '20%',
            w: '80%',
            h: '0.3%',
            fill: { color: '3B82F6' } // blue-500
          });

          slide.addText(content.title, {
            x: '10%',
            y: '5%',
            w: '80%',
            h: '15%',
            fontSize: 36,
            color: scheme.title.color,
            bold: true,
            align: 'left',
            valign: 'middle'
          });

          // Content with bullets and progressive animation
          content.content.forEach((point: string, idx: number) => {
            slide.addText(point, {
              x: '12%',
              y: `${25 + (idx * 12)}%`,
              w: '76%',
              h: '10%',
              fontSize: Math.max(18, Math.min(24, 600 / point.length)),
              color: scheme.text.color,
              bullet: { type: 'number', color: '3B82F6' },
              align: 'left',
              valign: 'middle',
              isTextBox: true
            });
          });
        },
        quote: (slide: any, content: any) => {
          const scheme = colorSchemes.quote;
          slide.background = scheme.background;

          // Large quote marks
          slide.addText('"', {
            x: '10%',
            y: '20%',
            w: '15%',
            h: '20%',
            fontSize: 120,
            color: '3B82F6',
            bold: true,
            align: 'left',
            valign: 'top'
          });

          // Main quote text
          slide.addText(content.title, {
            x: '15%',
            y: '30%',
            w: '70%',
            h: '40%',
            fontSize: 32,
            color: scheme.title.color,
            fontFace: 'Georgia',
            align: 'center',
            valign: 'middle',
            italic: true
          });

          // Supporting points
          content.content.forEach((point: string, idx: number) => {
            slide.addText(point, {
              x: '20%',
              y: `${70 + (idx * 8)}%`,
              w: '60%',
              h: '8%',
              fontSize: 20,
              color: scheme.text.color,
              align: 'center',
              valign: 'middle'
            });
          });
        },
        data: (slide: any, content: any) => {
          const scheme = colorSchemes.data;
          slide.background = scheme.background;

          // Title with accent background
          slide.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 0,
            w: '100%',
            h: '20%',
            fill: { color: '3B82F6' }
          });

          slide.addText(content.title, {
            x: '10%',
            y: '5%',
            w: '80%',
            h: '10%',
            fontSize: 32,
            color: 'FFFFFF',
            bold: true,
            align: 'left',
            valign: 'middle'
          });

          // Two-column layout for data points
          const leftPoints = content.content.slice(0, Math.ceil(content.content.length / 2));
          const rightPoints = content.content.slice(Math.ceil(content.content.length / 2));

          leftPoints.forEach((point: string, idx: number) => {
            slide.addText(point, {
              x: '10%',
              y: `${25 + (idx * 15)}%`,
              w: '35%',
              h: '12%',
              fontSize: 20,
              color: scheme.text.color,
              bullet: { type: 'bullet', color: '3B82F6' },
              align: 'left',
              valign: 'middle'
            });
          });

          rightPoints.forEach((point: string, idx: number) => {
            slide.addText(point, {
              x: '55%',
              y: `${25 + (idx * 15)}%`,
              w: '35%',
              h: '12%',
              fontSize: 20,
              color: scheme.text.color,
              bullet: { type: 'bullet', color: '3B82F6' },
              align: 'left',
              valign: 'middle'
            });
          });
        }
      };

      // Process each slide with appropriate layout
      slides.forEach((slide: any) => {
        const pptSlide = pres.addSlide();
        const style = slide.style?.toLowerCase() || 'content';
        const layout = layouts[style as keyof typeof layouts] || layouts.content;
        layout(pptSlide, slide);
      });

      pres.writeFile({ fileName: 'SlideGen-Presentation.pptx' });
    };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-slate-50 py-12">
      <MaxWidthWrapper className="max-w-[100%] xl:max-w-[1600px]">
        <div className="mx-auto flex gap-8">
          {/* Left Side: Chat Section */}
          <div className="w-[35%] space-y-8 sticky top-6 self-start">
              <Card className="p-8 shadow-xl bg-slate-900 backdrop-blur-sm border-slate-800 rounded-xl h-[calc(100vh-8rem)] flex flex-col">
              <div className="space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-700">
                {messages.length === 0 && (
                  <div className="text-center py-16 relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
                    <AlertCircle className="h-20 w-20 mx-auto mb-8 text-blue-400/80 animate-pulse" />
                    <p className="text-xl font-light text-slate-400">Choose a template or start your own conversation!</p>
                  </div>
                )}
                {messages.map((message: Message, index: number) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl ${
                      message.role === "user"
                        ? "bg-blue-500/10 ml-12 border border-blue-500/20"
                        : "bg-slate-800/80 mr-12 border border-slate-700"
                    } transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        message.role === "user" 
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-700 text-slate-300"
                      }`}>
                        {message.role === "user" ? "👤" : "🤖"}
                      </div>
                      <div className={`font-medium text-sm ${
                        message.role === "user"
                          ? "text-blue-400"
                          : "text-slate-400"
                      }`}>
                        {message.role === "user" ? "You" : "Assistant"}
                      </div>
                    </div>
                    <div className="text-slate-300 whitespace-pre-wrap text-lg leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center items-center py-6">
                      <div className="flex items-center space-x-3 text-blue-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-lg">Generating response...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <form onSubmit={handleSubmit} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50"></div>
                  <div className="relative flex gap-2 bg-slate-800/50 backdrop-blur-xl p-2 rounded-2xl border border-slate-700/50 group-hover:border-blue-500/30 transition-all duration-300">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your presentation..."
                      className="flex-1 text-base px-4 py-3 bg-slate-900/50 border-slate-700/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/30 focus:ring-blue-500/20 rounded-xl"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transition-all duration-300 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 border-0 min-w-[56px]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </form>

                {messages.length > 0 && (
                  <Button
                    onClick={generatePresentation}
                    className="w-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 hover:text-blue-300 py-6 text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 rounded-xl border border-blue-500/30 hover:border-blue-500/50"
                  >
                    <Presentation className="h-6 w-6 mr-3" />
                    Generate Presentation from Chat
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Side: Prompts/Presentation */}
          <div className="w-[65%] space-y-8">
            {slides.length > 0 ? (
              <>
                <div className="flex justify-between items-center bg-white/80 p-4 rounded-xl backdrop-blur-sm border border-slate-200 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-slate-600">
                      Slide {currentSlide + 1} of {slides.length}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={downloadPPT}
                  className="bg-blue-500 hover:bg-blue-600 text-white border border-blue-400 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PowerPoint
                </Button>
              </div>

              <div className={`
                rounded-xl shadow-2xl p-16 aspect-[16/9] relative overflow-hidden
                bg-gradient-to-br ${slides[currentSlide].bgColor}
                transition-all duration-500 border border-indigo-500/10
                ${slides[currentSlide].style === 'title' || slides[currentSlide].style === 'section' ? 'border-white/20' : 'border-slate-200/20'}
              `}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-transparent via-transparent to-blue-200/30"></div>
                
                <div 
                  className={`
                    absolute inset-0 flex flex-col justify-start p-12
                    transform transition-all duration-500 ease-out
                    ${isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                  `}
                  style={{
                    transform: isAnimating 
                      ? `translate${currentSlide > slides.length - 1 ? 'X(100%)' : 'X(-100%)'}`
                      : 'translateX(0)',
                    opacity: isAnimating ? 0 : 1
                  }}
                >
                  <div className="relative w-full h-full flex flex-col">
                    <h2 
                      className={`
                        text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 
                        ${slides[currentSlide].textColor} drop-shadow-lg
                        transition-all duration-300
                        ${slides[currentSlide].style === 'content' ? 'text-left border-b-2 border-blue-500 pb-4' : 'text-center'}
                        ${slides[currentSlide].style === 'quote' ? 'italic font-serif' : 'font-sans'}
                      `}
                      style={{
                        fontSize: 
                          slides[currentSlide].style === 'title' ? '4rem' :
                          slides[currentSlide].style === 'section' ? '3.5rem' :
                          slides[currentSlide].title.length > 50 ? '2.5rem' :
                          slides[currentSlide].title.length > 30 ? '3rem' : '3.5rem'
                      }}
                    >
                      {slides[currentSlide].style === 'quote' && (
                        <span className="absolute -left-8 top-0 text-8xl text-blue-500 opacity-50">"</span>
                      )}
                      {slides[currentSlide].title}
                    </h2>
                    
                    <div className="flex-1 overflow-hidden relative">
                      <div 
                        className="absolute inset-0 overflow-y-auto pr-4 space-y-4 sm:space-y-6 hide-scrollbar"
                        style={{
                          paddingRight: '20px',
                          marginRight: '-20px'
                        }}
                      >
                        {slides[currentSlide].content.map((point: string, index: number) => {
                          const fontSize = point.length > 100 ? 'text-base' : point.length > 50 ? 'text-lg' : 'text-xl';
                          const delay = index * 150;
                          
                          return (
                            <div
                              key={index}
                              className={`
                                flex items-start gap-4 ${slides[currentSlide].textColor}
                                transform transition-all duration-500
                                ${isAnimating ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}
                              `}
                              style={{
                                transitionDelay: `${delay}ms`
                              }}
                            >
                              <div className="w-3 h-3 rounded-full bg-slate-700/80 flex-shrink-0 mt-2.5" />
                              <p className={`${fontSize} text-slate-700 font-medium leading-relaxed`}>
                                {point}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-200 shadow-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-blue-50"
                    onClick={prevSlide}
                    disabled={currentSlide === 0 || isAnimating}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-2">
                    {slides.map((_: any, index: number) => (
                      <button
                        key={index}
                        className={`
                          w-2 h-2 rounded-full transition-all duration-300
                          ${index === currentSlide 
                            ? 'bg-blue-500 w-6' 
                            : 'bg-slate-200 hover:bg-blue-200'
                          }
                        `}
                        onClick={() => {
                          if (!isAnimating) {
                            setIsAnimating(true);
                            setCurrentSlide(index);
                          }
                        }}
                        disabled={isAnimating}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-blue-50"
                    onClick={nextSlide}
                    disabled={currentSlide === slides.length - 1 || isAnimating}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </>
            ) : (
              <div className="space-y-8">
              <div className="text-center space-y-6 mb-12">
                <div className="relative">
                  <div className="absolute -inset-x-20 -top-20 h-44 bg-blue-100/50 blur-3xl rounded-full"></div>
                  <h2 className="relative text-5xl font-bold bg-gradient-to-br from-slate-700 via-blue-600 to-slate-700 text-transparent bg-clip-text">
                    Choose Your Presentation Style
                  </h2>
                  <p className="relative mt-6 text-xl text-slate-600">Select from our expertly crafted templates or create your own</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map((prompt, index) => (
                  <Card
                    key={index}
                    className="group relative overflow-hidden rounded-xl backdrop-blur-sm border border-slate-200 hover:border-blue-200 transition-all duration-500"
                    onClick={() => {}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-slate-50/90"></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${prompt.gradient} opacity-0 group-hover:opacity-60 transition-all duration-500`} />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-transparent via-transparent to-indigo-500/10"></div>
                    
                    <div className="relative z-10 p-6 backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 text-transparent bg-clip-text group-hover:from-blue-600 group-hover:to-slate-700 transition-all duration-300">
                            {prompt.category}
                          </h3>
                          <p className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors duration-300">
                            {prompt.description}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-100 blur-xl rounded-full group-hover:bg-blue-200 transition-all duration-300"></div>
                          <Sparkles className="relative h-6 w-6 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
                        </div>
                      </div>
                      <p className="text-slate-500 group-hover:text-slate-700 transition-colors duration-300 line-clamp-3 leading-relaxed text-sm">
                        {prompt.prompt}
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-6 w-full bg-blue-50 hover:bg-blue-100 text-slate-600 hover:text-slate-700 border border-slate-200 hover:border-blue-200 transition-all duration-300 backdrop-blur-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isLoading) return;
                          
                          // Create a local loading state for this button
                          const thisPrompt = prompt;
                          setPrompts(prevPrompts => 
                            prevPrompts.map(p => 
                              p === thisPrompt ? {...p, isLoading: true} : p
                            )
                          );
                          // Display message shows only the prompt
                          const displayMessage = { role: "user", content: prompt.prompt };
                          // API message includes formatting instructions
                          const apiMessage = { role: "user", content: `${prompt.prompt}\n\nFormat the presentation with the following structure:
1. Each slide should have a clear, concise title
2. Content should be in bullet points
3. Each point should be a complete thought
4. Keep points focused and impactful
5. Use consistent formatting throughout
6. Limit to 4-6 points per slide for better readability

Use the following slide styles:
- Title slides (Style: title): For introduction and main section starts
- Section slides (Style: section): For major topic transitions
- Content slides (Style: content): For regular content
- Quote slides (Style: quote): For important quotes or key takeaways
- Data slides (Style: data): For statistics and data-heavy content

Format each slide as:
Title: [Slide Title]
Style: [slide style]
Data: [type] (only for data slides - chart/comparison/statistics)
• Point 1
• Point 2
etc.` };
                          
                          try {
                            const response = await fetch('/api/chat', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                messages: [apiMessage]
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to generate response');
                            }

                            const data = await response.json();
                            if (!data.text) {
                              throw new Error('Invalid response format');
                            }

                            // Update messages with display version
                            setMessages([
                              displayMessage,
                              { role: "assistant", content: data.text }
                            ]);

                            // Generate presentation
                            const slideTexts = data.text.split('\n\n').filter((text: string) => 
                              text.trim() && (text.toLowerCase().includes('title:') || text.includes('•'))
                            );
                            const parsedSlides = slideTexts.map((slideText: string, index: number) => {
                              const lines = slideText.split('\n').filter((line: string) => line.trim());
                              
                              // Extract title and style
                              const titleLine = lines[0].replace(/^[IVX]+\.\s*/, '').replace(/^Title:?\s*/i, '').replace(/^Slide\s*\d*:?\s*/i, '').trim();
                              const styleLine = lines.find(line => line.toLowerCase().includes('style:'))?.replace(/^Style:\s*/i, '').toLowerCase() || 'content';
                              const dataTypeLine = lines.find(line => line.toLowerCase().includes('data:'))?.replace(/^Data:\s*/i, '').toLowerCase();
                              
                              const title = titleLine;
                              const style = styleLine as Slide['style'];
                              const dataType = dataTypeLine as Slide['dataType'];
                              
                              // Extract content, skipping style and data type lines
                              const content = lines.slice(1)
                                .filter(line => !line.toLowerCase().includes('style:') && !line.toLowerCase().includes('data:'))
                                .map(line => line.trim())
                                .filter(line => line.length > 0)
                                .map(line => line
                                  .replace(/^[-•*]\s*/, '')
                                  .replace(/^\d+\.\s*/, '')
                                  .replace(/^[A-Z]\)\s*/, '')
                                  .replace(/^[a-z]\)\s*/, '')
                                  .trim()
                                )
                                .filter(line => line.length > 0);

                              return {
                                title,
                                content,
                                style,
                                dataType,
                                bgColor: slideStyles[style].bg,
                                textColor: slideStyles[style].text
                              };
                            });

                            if (parsedSlides.length > 0) {
                              setSlides(parsedSlides);
                              setCurrentSlide(0);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                              throw new Error('Could not generate presentation slides');
                            }
                          } catch (error: any) {
                            console.error("Error:", error);
                            toast({
                              title: "Error",
                              description: error.message || "Failed to generate presentation. Please try again.",
                              variant: "destructive",
                            });
                            setMessages([]);
                          } finally {
                            // Clear loading state for this button
                            setPrompts(prevPrompts => 
                              prevPrompts.map(p => 
                                p === thisPrompt ? {...p, isLoading: false} : p
                              )
                            );
                          }
                        }}
                        disabled={prompt.isLoading}
                      >
                        {prompt.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>Generate Presentation</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
