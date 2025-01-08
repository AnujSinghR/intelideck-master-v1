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
  bgColor: string;
  textColor: string;
}

interface Message {
  role: string;
  content: string;
}

interface ChatResponse {
  text: string;
  error?: string;
}

const prompts = [
  {
    category: "Digital Marketing",
    description: "Trends & Campaigns",
    prompt: "Create a comprehensive presentation about current digital marketing trends, campaign insights, and action plans. Include key statistics, emerging technologies, and strategic recommendations.",
    gradient: "from-blue-500 to-violet-600",
  },
  {
    category: "SEO Strategy",
    description: "Website Optimization",
    prompt: "Create a detailed SEO strategy presentation covering current performance analysis, technical improvements, content strategy, and implementation plans for better search rankings.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    category: "Market Analysis",
    description: "Competitive Research",
    prompt: "Create a market analysis presentation including industry overview, competitor analysis, SWOT analysis, and strategic recommendations for market positioning.",
    gradient: "from-orange-500 to-red-600",
  },
  {
    category: "Social Media",
    description: "Platform Strategy",
    prompt: "Create a social media strategy presentation covering platform analysis, content planning, engagement tactics, and growth strategies across different social networks.",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    category: "E-commerce",
    description: "Growth & Retention",
    prompt: "Create an e-commerce strategy presentation focusing on customer analysis, retention strategies, growth opportunities, and implementation plans for increasing sales.",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    category: "Product Launch",
    description: "Go-to-Market Strategy",
    prompt: "Create a product launch strategy presentation including product overview, marketing approach, launch timeline, and success metrics for a successful market entry.",
    gradient: "from-cyan-500 to-blue-600",
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

  // Previous functions remain the same
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
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
      
      // Parse presentation content if it contains slides
      if (data.text.includes('Title Slide') || data.text.includes('Slide')) {
        const slideTexts: string[] = data.text.split('\n\n').filter((text: string) => text.trim());
        const parsedSlides = slideTexts.map((slideText: string, index: number) => {
          const lines: string[] = slideText.split('\n').filter((line: string) => line.trim());
          const title = lines[0]
            .replace(/^[IVX]+\.\s*/, '')
            .replace(/^Title:?\s*/i, '')
            .replace(/^Slide\s*\d*:?\s*/i, '')
            .trim();
          const content = lines.slice(1)
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

          const colorIndex = index % colorCombos.length;

          return {
            title,
            content,
            bgColor: colorCombos[colorIndex].bg,
            textColor: colorCombos[colorIndex].text
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
    if (!text.includes('Title Slide') && !text.includes('Slide')) {
      toast({
        title: "No presentation format detected",
        description: "Please ask the AI to generate a presentation outline first.",
        variant: "destructive",
      });
      return;
    }

    // Parse presentation content
    const slideTexts: string[] = text.split('\n\n').filter((text: string) => text.trim());
    const parsedSlides = slideTexts.map((slideText: string, index: number) => {
      const lines: string[] = slideText.split('\n').filter((line: string) => line.trim());
      const title = lines[0]
        .replace(/^[IVX]+\.\s*/, '')
        .replace(/^Title:?\s*/i, '')
        .replace(/^Slide\s*\d*:?\s*/i, '')
        .trim();
      const content = lines.slice(1)
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

      const colorIndex = index % colorCombos.length;

      return {
        title,
        content,
        bgColor: colorCombos[colorIndex].bg,
        textColor: colorCombos[colorIndex].text
      };
    });

    setSlides(parsedSlides);
    setCurrentSlide(0);
    
    // Scroll to the top where the presentation is displayed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadPPT = async () => {
    const pres = new pptxgen();

    pres.author = 'SlideGen AI';
    pres.company = 'SlideGen';
    pres.revision = '1';
    pres.subject = 'AI Generated Presentation';

    slides.forEach((slide) => {
      const pptSlide = pres.addSlide();

      // Set light theme background
      const bgColor = slide.bgColor.split(' ')[1].replace('to-', '');
      pptSlide.background = { color: bgColor.replace('-200', '') };

      // Add title with dynamic font size based on length
      const titleFontSize = slide.title.length > 50 ? 32 : slide.title.length > 30 ? 36 : 40;
      pptSlide.addText(slide.title, {
        x: '5%',
        y: '5%',
        w: '90%',
        h: '20%',
        fontSize: titleFontSize,
        color: '334155', // slate-700
        bold: true,
        align: 'center',
        valign: 'middle',
        wrap: true,
      });

      // Calculate content height and spacing
      const contentStartY = 30;
      const availableHeight = 100 - contentStartY;
      const pointHeight = Math.min(10, availableHeight / Math.max(slide.content.length, 1));
      
      // Calculate font size based on content length
      const maxPointLength = Math.max(...slide.content.map(p => p.length), 1);
      const fontSize = Math.max(16, Math.min(20, 400 / maxPointLength));

      // Add points with calculated spacing
      slide.content.forEach((point, idx) => {
        pptSlide.addText(point, {
          x: '10%',
          y: `${contentStartY + (idx * pointHeight)}%`,
          w: '80%',
          h: `${pointHeight}%`,
          fontSize: fontSize,
          color: '334155', // slate-700
          bullet: true,
          valign: 'middle',
          wrap: true,
          breakLine: true,
        });
      });
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
              `}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-transparent via-transparent to-blue-200/30"></div>
                <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-16 w-16 rounded-full bg-white/80 hover:bg-blue-50 backdrop-blur-md pointer-events-auto transition-all duration-300 text-slate-600 border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="h-10 w-10" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-16 w-16 rounded-full bg-white/80 hover:bg-blue-50 backdrop-blur-md pointer-events-auto transition-all duration-300 text-slate-600 border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
                    onClick={nextSlide}
                    disabled={currentSlide === slides.length - 1}
                  >
                    <ChevronRight className="h-10 w-10" />
                  </Button>
                </div>
                
                <div className={`
                  h-full flex flex-col justify-start pt-8 relative z-10
                  transform transition-transform duration-500 ease-out
                  ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
                  overflow-hidden
                `}>
                  <h2 className={`text-5xl md:text-6xl font-bold text-center mb-8 ${slides[currentSlide].textColor} drop-shadow-lg line-clamp-2`}>
                    {slides[currentSlide].title}
                  </h2>
                  <div className="space-y-6 overflow-y-auto max-h-[55vh] scrollbar-hide pr-4 pb-12">
                    {slides[currentSlide].content.map((point: string, index: number) => (
                      <div
                        key={index}
                        className={`
                          flex items-start space-x-6 text-lg md:text-xl ${slides[currentSlide].textColor}
                          transform transition-all duration-500 delay-${index * 100}
                          ${isAnimating ? 'translate-x-10 opacity-0' : 'translate-x-0 opacity-100'}
                        `}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-700/80 flex-shrink-0 shadow-lg mt-3" />
                        <p className="text-slate-700 drop-shadow-none leading-relaxed font-medium">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-4 bg-white/90 px-6 py-3 rounded-full backdrop-blur-sm border border-slate-200">
                  {slides.map((_: any, index: number) => (
                    <button
                      key={index}
                      className={`
                        w-3 h-3 rounded-full transition-all duration-300
                        ${index === currentSlide ? 'bg-blue-500 w-10' : 'bg-slate-200 hover:bg-blue-200'}
                      `}
                      onClick={() => {
                        if (!isAnimating) {
                          setIsAnimating(true);
                          setCurrentSlide(index);
                        }
                      }}
                    />
                  ))}
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
                          
                          setIsLoading(true);
                          const userMessage = { role: "user", content: `${prompt.prompt} Format the presentation with the following structure:
1. Each slide should have a clear, concise title
2. Content should be in bullet points
3. Each point should be a complete thought
4. Keep points focused and impactful
5. Use consistent formatting throughout
6. Limit to 4-6 points per slide for better readability
Format as "Title: [title]" followed by bullet points using • symbol.` };
                          
                          try {
                            const response = await fetch('/api/chat', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                messages: [userMessage]
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to generate response');
                            }

                            const data = await response.json();
                            if (!data.text) {
                              throw new Error('Invalid response format');
                            }

                            // Update messages
                            setMessages([
                              userMessage,
                              { role: "assistant", content: data.text }
                            ]);

                            // Generate presentation
                            const slideTexts = data.text.split('\n\n').filter((text: string) => text.trim());
                            const parsedSlides = slideTexts.map((slideText: string, index: number) => {
                              const lines = slideText.split('\n').filter((line: string) => line.trim());
                              const title = lines[0]
                                .replace(/^[IVX]+\.\s*/, '')
                                .replace(/^Title:?\s*/i, '')
                                .replace(/^Slide\s*\d*:?\s*/i, '')
                                .trim();
                              const content = lines.slice(1)
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

                              const colorIndex = index % colorCombos.length;
                              return {
                                title,
                                content,
                                bgColor: colorCombos[colorIndex].bg,
                                textColor: colorCombos[colorIndex].text
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
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
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
