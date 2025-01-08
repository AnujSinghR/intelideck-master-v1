import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Wand2, 
  PlayCircle, 
  MessageSquare, 
  FileSpreadsheet,
  FileText,
  Menu
} from "lucide-react";

const NavbarLarge = () => {
  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 shadow-xl">
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-3 mb-8 hover:bg-gray-700/50 rounded-lg transition-all"
      >
        <Image
          src="/logo-emb.jpg"
          width={30}
          height={30}
          alt="logo"
          className="rounded-full"
        />
        <span className="text-lg font-semibold">Intelideck</span>
      </Link>

      <div className="space-y-2">
        <Link 
          href="/generate" 
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 rounded-lg transition-all group"
        >
          <Wand2 className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
          <span className="text-gray-300 group-hover:text-white transition-colors">Generate</span>
        </Link>

        <Link 
          href="/demo" 
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 rounded-lg transition-all group"
        >
          <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
          <span className="text-gray-300 group-hover:text-white transition-colors">AI PPT Generate</span>
        </Link>

        <Link 
          href="/pptx" 
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 rounded-lg transition-all group"
        >
          <FileSpreadsheet className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
          <span className="text-gray-300 group-hover:text-white transition-colors">PPT Reskine</span>
        </Link>

        <Link 
          href="/pdf-viewer" 
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 rounded-lg transition-all group"
        >
          <FileText className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
          <span className="text-gray-300 group-hover:text-white transition-colors">PDF Reskine</span>
        </Link>
      </div>
    </nav>
  );
};

export default NavbarLarge;
