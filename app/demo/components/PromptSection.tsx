import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { Prompt } from '../types';
import { Dispatch, SetStateAction } from 'react';

interface PromptSectionProps {
  prompts: Prompt[];
  setPrompts: Dispatch<SetStateAction<Prompt[]>>;
  onPromptSelect: (prompt: Prompt) => Promise<void>;
}

export function PromptSection({ prompts, setPrompts, onPromptSelect }: PromptSectionProps) {
  const handlePromptClick = async (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    if (prompt.isLoading) return;

    // Create a local loading state for this button
    setPrompts(prevPrompts => 
      prevPrompts.map(p => 
        p === prompt ? {...p, isLoading: true} : {...p, isLoading: false}
      )
    );

    try {
      await onPromptSelect(prompt);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Prompt selection error:', error);
    } finally {
      // Clear loading state for all buttons
      setPrompts(prevPrompts => 
        prevPrompts.map(p => ({...p, isLoading: false}))
      );
    }
  };

  return (
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
            className={`
              group relative overflow-hidden rounded-xl backdrop-blur-sm border border-slate-200 
              hover:border-blue-200 transition-all duration-500
              ${prompt.isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
            `}
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
                className={`
                  mt-6 w-full bg-blue-50 text-slate-600 border border-slate-200 
                  transition-all duration-300 backdrop-blur-sm
                  ${prompt.isLoading 
                    ? 'opacity-75 cursor-not-allowed' 
                    : 'hover:bg-blue-100 hover:text-slate-700 hover:border-blue-200'}
                `}
                onClick={(e) => handlePromptClick(e, prompt)}
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
  );
}
