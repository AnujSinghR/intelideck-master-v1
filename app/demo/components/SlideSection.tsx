import { Button } from '../../../components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Slide } from '../types';

interface SlideSectionProps {
  slides: Slide[];
  currentSlide: number;
  isAnimating: boolean;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onSlideSelect: (index: number) => void;
  onDownload: () => void;
}

export function SlideSection({
  slides,
  currentSlide,
  isAnimating,
  onPrevSlide,
  onNextSlide,
  onSlideSelect,
  onDownload
}: SlideSectionProps) {
  return (
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
          onClick={onDownload}
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
            onClick={onPrevSlide}
            disabled={currentSlide === 0 || isAnimating}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentSlide 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-slate-200 hover:bg-blue-200'
                  }
                `}
                onClick={() => !isAnimating && onSlideSelect(index)}
                disabled={isAnimating}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-blue-50"
            onClick={onNextSlide}
            disabled={currentSlide === slides.length - 1 || isAnimating}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
