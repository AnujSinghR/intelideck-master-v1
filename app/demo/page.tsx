"use client";

import MaxWidthWrapper from "../../components/common/MaxWidthWrapper";
import { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import { ChatSection } from "./components/ChatSection";
import { PromptSection } from "./components/PromptSection";
import { SlideSection } from "./components/SlideSection";
import { generatePPTX } from "./utils/pptx";
import { Message, Slide, defaultPrompts, Prompt, slideStyles } from "./types";

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

      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Invalid response format');
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      parseAndSetSlides(data.text);
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
        { role: "user", content: prompt.prompt },
        { role: "assistant", content: data.text }
      ]);

      parseAndSetSlides(data.text);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const parseAndSetSlides = (text: string) => {
    const slideTexts = text.split('\n\n').filter((text: string) => 
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

    const parsedSlides = slideTexts.map((slideText: string) => {
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

    setSlides(parsedSlides);
    setCurrentSlide(0);
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
                onDownload={() => generatePPTX(slides)}
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
