import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Loader2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getServices } from "../utils/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for a Local Services Marketplace app. Your role is to help customers find and book local services.

IMPORTANT GUIDELINES:
1. You ONLY answer questions related to the marketplace and available services
2. Available service categories: Cleaning, Repair, Tutoring, Plumbing, Photography, Events
3. Help customers with:
   - Finding services in their area
   - Understanding how to book services
   - Service pricing and availability
   - Provider information
   - Booking process and payment
   - Account management
   - Service reviews and ratings

4. DO NOT provide information about:
   - Topics unrelated to the marketplace
   - General knowledge questions
   - Services not available in the marketplace
   - Personal advice outside the app scope

5. When customers ask about services, guide them to:
   - Browse the service categories
   - Search by location
   - View provider profiles
   - Check availability and pricing
   - Read customer reviews

6. Be friendly, professional, and concise
7. If a question is outside your scope, politely redirect to marketplace features
8. Always encourage users to explore the app for more details`;

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm your Local Services Marketplace assistant. I can help you find services, answer questions about booking, and guide you through our platform. What service are you looking for today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to chat
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API key not configured");
      }

      // Fetch available services from the marketplace
      let servicesContext = "";
      try {
        const servicesResponse = await getServices();
        if (servicesResponse.success && servicesResponse.services) {
          const services = servicesResponse.services;
          servicesContext = `\n\nAvailable Services in the Marketplace:\n${services
            .map(
              (s: any) =>
                `- ${s.title} (${s.category}): $${s.price}/${s.priceUnit} - ${s.description}`
            )
            .join("\n")}`;
        }
      } catch (err) {
        console.log("Could not fetch services, continuing without service data");
      }

      // Convert conversation history to Google Gemini format
      // Add system prompt as the first message with services context
      const contents = [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + servicesContext }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I will act as a Local Services Marketplace assistant and help customers find and book services based on their needs." }],
        },
        ...newMessages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ];

      console.log("Sending request with contents:", contents);

      // Call Google Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.5,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        }
      );

      console.log("AI API response status:", response.status);
      
      const data = await response.json();
      console.log("AI API response data:", data);

      if (!response.ok) {
        console.error("AI API error:", data);
        const errorMsg = data.error?.message || JSON.stringify(data);
        throw new Error(`API Error: ${errorMsg}`);
      }

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const assistantMessage = data.candidates[0].content.parts[0].text;
        setMessages([
          ...newMessages,
          { role: "assistant", content: assistantMessage },
        ]);
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid response format from AI service");
      }
    } catch (error: any) {
      console.error("AI chat error:", error);
      
      let errorMessage = "I'm sorry, I encountered an error. ";
      
      if (error.message?.includes("API key") || error.message?.includes("not configured")) {
        errorMessage += "The AI service is currently unavailable. Please ensure your Google Gemini API key is configured in the .env.local file.";
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("network")) {
        errorMessage += "I couldn't connect to the AI service. Please check your internet connection and try again.";
      } else if (error.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMessage += "API quota exceeded. Please try again later.";
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! 👋 I'm your Local Services Marketplace assistant. I can help you find services, answer questions about booking, and guide you through our platform. What service are you looking for today?",
      },
    ]);
    setInputValue("");
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 md:bottom-6 md:right-6"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col w-[calc(100vw-2rem)] h-[calc(100vh-8rem)] max-w-sm max-h-[90vh] sm:w-96 sm:h-[600px] sm:max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 md:bottom-6 md:right-6 md:w-96 md:h-[600px] lg:w-96 lg:h-[650px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">AI Assistant</h3>
                <p className="text-xs text-white/80 truncate">Always here to help</p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Reset conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs font-semibold">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 text-sm sm:text-base"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by Google Gemini AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}