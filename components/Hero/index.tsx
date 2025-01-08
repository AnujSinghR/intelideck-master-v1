import React from "react";
import MaxWidthWrapper from "../common/MaxWidthWrapper";
import { buttonVariants } from "../ui/button";
import { Card } from "../ui/card";
import Image from "next/image";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

const Hero = () => {
  return (
    <div className="relative min-h-screen bg-[#0A0A0F] overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-600/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <MaxWidthWrapper>
        <div className="relative flex min-h-screen flex-col items-center justify-center py-20">
          {/* Main content */}
          <div className="text-center space-y-12">
            <div className="space-y-6 animate-fade-up">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-full backdrop-blur-sm border border-violet-500/10">
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text font-medium">
                  AI-Powered Presentation Tool
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                Create Stunning
                <span className="block mt-2 bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text">
                  Presentations Instantly
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-zinc-400">
                Transform your ideas into captivating presentations with our AI-powered platform. 
                Create professional slides in minutes, not hours.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animation-delay-200">
              <RegisterLink
                href="/"
                className={buttonVariants({
                  size: "lg",
                  className: "relative group px-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
                })}
              >
                Get Started Free
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-400/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></div>
              </RegisterLink>
              <LoginLink
                href="/"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "px-8 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600",
                })}
              >
                View Demo
              </LoginLink>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-20 animate-fade-up animation-delay-500">
              {[
                {
                  title: "AI-Powered",
                  description: "Smart content generation and organization",
                  gradient: "from-violet-600/20 to-violet-600/5"
                },
                {
                  title: "Professional Design",
                  description: "Beautiful templates and modern layouts",
                  gradient: "from-indigo-600/20 to-indigo-600/5"
                },
                {
                  title: "Time Saving",
                  description: "Create presentations in minutes",
                  gradient: "from-blue-600/20 to-blue-600/5"
                }
              ].map((feature, i) => (
                <Card 
                  key={i}
                  className="group relative p-6 bg-gradient-to-br border-0 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-900/80 transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg`} />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-zinc-400">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Visual Preview Section */}
            <div className="mt-20 w-full max-w-6xl mx-auto animate-fade-up animation-delay-700">
              <div className="relative h-[500px] w-full">
                {/* Floating Cards */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                  {/* Grid Background */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent animate-pulse" 
                         style={{ backgroundSize: '30px 30px', backgroundImage: 'linear-gradient(to right, rgb(99 102 241 / 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgb(99 102 241 / 0.1) 1px, transparent 1px)' }}>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-10 left-20 w-72 h-48 bg-gradient-to-br from-violet-600/20 to-transparent rounded-lg transform -rotate-12 animate-float-slow"></div>
                  <div className="absolute bottom-20 right-20 w-64 h-40 bg-gradient-to-br from-blue-600/20 to-transparent rounded-lg transform rotate-12 animate-float-slow animation-delay-500"></div>

                  {/* Main Presentation Cards */}
                  <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-64 bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 border-0 backdrop-blur-sm overflow-hidden group hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="p-6 relative">
                      <div className="h-2 w-20 bg-violet-500/30 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-zinc-700/50 rounded"></div>
                        <div className="h-4 w-1/2 bg-zinc-700/50 rounded"></div>
                      </div>
                    </div>
                  </Card>

                  {/* Side Cards */}
                  <Card className="absolute top-1/3 left-1/4 w-72 h-48 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-0 backdrop-blur-sm transform -rotate-12 hover:rotate-0 transition-all duration-500 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="p-4 relative">
                      <div className="h-2 w-16 bg-indigo-500/30 rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 bg-zinc-700/50 rounded"></div>
                        <div className="h-3 w-1/2 bg-zinc-700/50 rounded"></div>
                      </div>
                    </div>
                  </Card>

                  <Card className="absolute bottom-1/3 right-1/4 w-72 h-48 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-0 backdrop-blur-sm transform rotate-12 hover:rotate-0 transition-all duration-500 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="p-4 relative">
                      <div className="h-2 w-16 bg-blue-500/30 rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 bg-zinc-700/50 rounded"></div>
                        <div className="h-3 w-1/2 bg-zinc-700/50 rounded"></div>
                      </div>
                    </div>
                  </Card>

                  {/* Floating Elements */}
                  <div className="absolute top-20 right-32 w-20 h-20 rounded-full bg-violet-600/10 animate-float-slow"></div>
                  <div className="absolute bottom-20 left-40 w-16 h-16 rounded-full bg-blue-600/10 animate-float-slow animation-delay-300"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default Hero;
