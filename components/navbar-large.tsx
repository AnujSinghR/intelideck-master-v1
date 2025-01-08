import React from "react";
import MaxWidthWrapper from "./common/MaxWidthWrapper";
import Link from "next/link";
import { Presentation } from "lucide-react";
import { Button } from "./ui/button";

const NavbarLarge = () => {
  return (
    <MaxWidthWrapper className="flex items-center justify-between px-8 py-4 w-full text-gray-900 border-b border-gray-300">
      <div className="flex items-center space-x-8">
        <Link
          href="/"
          className="text-xl font-semibold flex gap-2 items-center"
        >
          <Presentation />
          <span>SlideGen</span>
        </Link>

        <div className="space-x-8 hidden md:flex text-sm">
          <Link href="/generate" className="hover:text-violet-600 transition-colors">Generate</Link>
          <Link href="/demo" className="hover:text-violet-600 transition-colors">Demo</Link>
          <Link href="/ai-chat" className="hover:text-violet-600 transition-colors">AI Chat</Link>
          <Link href="/pptx" className="hover:text-violet-600 transition-colors">PPT X Tractor</Link>
          <Link href="/pdf-viewer" className="hover:text-violet-600 transition-colors">PDF REskin</Link>
        </div>
      </div>
      <div className="hidden md:flex space-x-4 items-center">
        <Link href="/generate">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            Try Now
          </Button>
        </Link>
      </div>
    </MaxWidthWrapper>
  );
};

export default NavbarLarge;
