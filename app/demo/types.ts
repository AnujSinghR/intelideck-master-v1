export interface Slide {
  title: string;
  content: string[];
  style: 'title' | 'section' | 'content' | 'quote' | 'data';
  dataType?: 'chart' | 'comparison' | 'statistics';
  bgColor: string;
  textColor: string;
}

export interface Message {
  role: string;
  content: string;
}

export interface ChatResponse {
  text: string;
  error?: string;
}

export interface Prompt {
  category: string;
  description: string;
  prompt: string;
  gradient: string;
  isLoading?: boolean;
}

export const slideStyles = {
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

export const defaultPrompts: Prompt[] = [
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
