"use client";

import MaxWidthWrapper from "../../components/common/MaxWidthWrapper";
import { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import { ChatSection } from "./components/ChatSection";
import { PromptSection } from "./components/PromptSection";
import { SlideSection } from "./components/SlideSection";
import { generatePPTX } from "./utils/pptx";
import { parseSlides } from "./utils/slideParser";
import { generatePresentation, sanitizePrompt } from "./utils/api";
import { Message, Slide, defaultPrompts, Prompt } from "./types";

const PRESENTATION_FORMAT = `Format the presentation with the following structure:
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
etc.`;

export default function DemoPage() {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>(defaultPrompts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const sanitizedInput = sanitizePrompt(input);
    
    // Display message shows only user input
    const displayMessage = { role: "user", content: input };
    // API message includes formatting instructions
    const apiMessage = { role: "user", content: `${sanitizedInput}\n\n${PRESENTATION_FORMAT}` };
    
    setMessages((prev) => [...prev, displayMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const generatedText = await generatePresentation([
        ...messages.map(msg => 
          msg.role === "user" 
            ? { role: "user", content: msg.content.split('\n\n')[0] } 
            : msg
        ), 
        apiMessage
      ]);

      setMessages((prev) => [...prev, { role: "assistant", content: generatedText }]);
      
      try {
        const parsedSlides = parseSlides(generatedText);
        setSlides(parsedSlides);
        setCurrentSlide(0);
      } catch (parseError: any) {
        console.error("Slide parsing error:", parseError);
        toast({
          title: "Format Error",
          description: "The AI generated an invalid presentation format. Please try rephrasing your request.",
          variant: "destructive",
        });
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

  const handlePromptSelect = async (prompt: Prompt) => {
    const sanitizedPrompt = sanitizePrompt(prompt.prompt);
    const apiMessage = { role: "user", content: `${sanitizedPrompt}\n\n${PRESENTATION_FORMAT}` };

    try {
      const generatedText = await generatePresentation([apiMessage]);

      // Update messages with display version
      setMessages([
        { role: "user", content: prompt.prompt },
        { role: "assistant", content: generatedText }
      ]);

      try {
        const parsedSlides = parseSlides(generatedText);
        setSlides(parsedSlides);
        setCurrentSlide(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (parseError: any) {
        console.error("Slide parsing error:", parseError);
        toast({
          title: "Format Error",
          description: "The AI generated an invalid presentation format. Please try a different template.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate presentation. Please try again.",
        variant: "destructive",
      });
      setMessages([]);
    }
  };

  const nextSlide = () => {
    if (isAnimating || currentSlide >= slides.length - 1) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (isAnimating || currentSlide <= 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => prev - 1);
  };

  const handleDownload = async () => {
    try {
      await generatePPTX(slides);
      toast({
        title: "Success",
        description: "Presentation downloaded successfully!",
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download presentation. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-slate-50 py-12">
      <MaxWidthWrapper className="max-w-[100%] xl:max-w-[1600px]">
        <div className="mx-auto flex gap-8">
          {/* Left Side: Chat Section */}
          <div className="w-[35%] space-y-8 sticky top-6 self-start">
            <ChatSection
              messages={messages}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              input={input}
              setInput={setInput}
              onGeneratePresentation={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>

          {/* Right Side: Prompts/Presentation */}
          <div className="w-[65%] space-y-8">
            {slides.length > 0 ? (
              <SlideSection
                slides={slides}
                currentSlide={currentSlide}
                isAnimating={isAnimating}
                onPrevSlide={prevSlide}
                onNextSlide={nextSlide}
                onSlideSelect={setCurrentSlide}
                onDownload={handleDownload}
              />
            ) : (
              <PromptSection
                prompts={prompts}
                setPrompts={setPrompts}
                onPromptSelect={handlePromptSelect}
              />
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
