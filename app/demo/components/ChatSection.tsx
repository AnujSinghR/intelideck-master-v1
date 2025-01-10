import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { AlertCircle, Loader2, Send, Presentation } from 'lucide-react';
import { Message } from '../types';

interface ChatSectionProps {
  messages: Message[];
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  input: string;
  setInput: (input: string) => void;
  onGeneratePresentation: () => void;
}

export function ChatSection({
  messages,
  isLoading,
  onSubmit,
  input,
  setInput,
  onGeneratePresentation
}: ChatSectionProps) {
  return (
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
        <form onSubmit={onSubmit} className="relative group">
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
            onClick={onGeneratePresentation}
            className="w-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 hover:text-blue-300 py-6 text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 rounded-xl border border-blue-500/30 hover:border-blue-500/50"
          >
            <Presentation className="h-6 w-6 mr-3" />
            Generate Presentation from Chat
          </Button>
        )}
      </div>
    </Card>
  );
}
