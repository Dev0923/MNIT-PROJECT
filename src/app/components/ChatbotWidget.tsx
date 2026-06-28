import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Languages, Bot, Sparkles, AlertCircle, ShieldAlert, Maximize2, Minimize2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  showButtons?: boolean;
}

export function ChatbotWidget() {
  const { i18n } = useTranslation();
  const lang = i18n.language === "hi" ? "hi" : "en";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID and set welcome message on mount
  useEffect(() => {
    let sId = sessionStorage.getItem("chatbot_session_id");
    if (!sId) {
      sId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      sessionStorage.setItem("chatbot_session_id", sId);
    }
    setSessionId(sId);

    // Initial welcome message
    const welcomeText =
      lang === "hi"
        ? "नमस्कार! मैं श्याम सेवक हूँ, आपका आधिकारिक एआई सहायक। मैं आपकी दर्शन बुकिंग, आवास खोजना, दान पोर्टल या भीड़ की जानकारी के बारे में सहायता कर सकता हूँ। मैं आपकी क्या मदद कर सकता हूँ?"
        : "Hello! I am Shyam Sevak, your official AI helper for the Khatu Shyam Ji Temple. I can help you check Darshan slots, find accommodations, guide you on donations, trace lost items, or share live crowd density. How can I help you today?";

    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: welcomeText,
      },
    ]);
  }, [lang]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    i18n.changeLanguage(nextLang);
  };

  const handleSendMessage = async (textToSend: string, quickAction: string | null = null) => {
    if (!textToSend.trim() && !quickAction) return;

    const userMsgText = textToSend;
    setInputText("");
    setShowButtons(false);

    // Add user message to screen
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev.map(m => ({ ...m, showButtons: false })), // Hide old buttons on new message
      { id: userMsgId, sender: "user", text: userMsgText },
    ]);

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/api/chatbot/message`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMsgText,
          quick_action: quickAction,
          session_id: sessionId,
          language: lang,
        }),
      });

      if (!response.ok) {
        throw new Error("Chatbot API response error");
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_bot",
          sender: "bot",
          text: data.reply,
          showButtons: data.show_ticket_buttons,
        },
      ]);
      setShowButtons(data.show_ticket_buttons);

    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          sender: "bot",
          text:
            lang === "hi"
              ? "क्षमा करें, मैं सर्वर से संपर्क नहीं कर पा रहा हूँ। कृपया पुनः प्रयास करें।"
              : "I'm sorry, I encountered an issue connecting to the server. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionKey: string, buttonLabel: string) => {
    handleSendMessage(buttonLabel, actionKey);
  };

  const formatMessageText = (text: string) => {
    // Format bold strings **text** to <strong>text</strong>
    const formatted = text.split("\n").map((line, idx) => {
      // Bold formatting replacement
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      const renderedLine = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-bold text-gray-900">{part}</strong>;
        }
        return part;
      });

      return (
        <span key={idx}>
          {renderedLine}
          {idx < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
    return formatted;
  };

  const quickActionChips = [
    { key: "check_slots", label: lang === "hi" ? "🗓️ दर्शन स्लॉट" : "🗓️ Slots" },
    { key: "find_accommodation", label: lang === "hi" ? "🏨 आवास खोजें" : "🏨 Accommodations" },
    { key: "check_crowd", label: lang === "hi" ? "👥 लाइव भीड़" : "👥 Live Crowd" },
    { key: "check_permissions", label: lang === "hi" ? "📋 परमिट स्थिति" : "📋 Permits" },
    { key: "track_lost", label: lang === "hi" ? "🔍 खोया-पाया" : "🔍 Lost Items" },
    { key: "donation_help", label: lang === "hi" ? "💳 दान सहायता" : "💳 Donations" },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1F2F8C] hover:bg-[#152060] text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-all duration-300 z-[9999] border-2 border-[#F7941D]"
        title={lang === "hi" ? "श्याम सेवक से चैट करें" : "Chat with Shyam Sevak"}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {/* Soft pulse ring for visibility */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>

      {/* Expanded Chat Popover Panel */}
      {isOpen && (
        <div 
          className={`fixed right-6 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[9999] border border-gray-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            isMaximized 
              ? "bottom-6 w-[800px] max-w-[calc(100vw-3rem)] h-[calc(100vh-6rem)] max-h-[800px]" 
              : "bottom-24 w-96 max-w-[calc(100vw-2rem)] h-[560px]"
          }`}
        >
          
          {/* Header */}
          <div className="bg-[#1F2F8C] bg-gradient-to-r from-[#1F2F8C] to-[#0f1d5e] p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Bot size={20} className="text-[#F7941D]" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  {lang === "hi" ? "श्याम सेवक" : "Shyam Sevak"}
                  <Sparkles size={12} className="text-[#F7941D] animate-bounce" />
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-green-300 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                  <span>{lang === "hi" ? "ऑनलाइन" : "Online"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title={lang === "hi" ? "Switch to English" : "हिन्दी में बदलें"}
              >
                <Languages size={14} />
                <span>{lang === "hi" ? "ENG" : "हिन्दी"}</span>
              </button>
              {/* Maximize/Minimize Button */}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                type="button"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center text-white"
                title={isMaximized ? (lang === "hi" ? "छोटा करें" : "Minimize") : (lang === "hi" ? "बड़ा करें" : "Maximize")}
              >
                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* SOS Sticky Warning */}
          <div className="bg-red-50 border-b border-red-100 px-3 py-2 flex items-start gap-2 text-[11px] text-red-800">
            <ShieldAlert size={14} className="text-red-600 mt-0.5 flex-shrink-0 animate-pulse" />
            <p className="leading-relaxed">
              {lang === "hi"
                ? "आपातकालीन स्थिति में, लाइव स्थान दर्ज करने के लिए ऊपर लाल SOS बटन पर क्लिक करें।"
                : "For emergencies, please click the red SOS Alert button to instantly log location."}
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDF5E6]/20">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#1F2F8C] text-white self-end rounded-tr-none ml-auto"
                      : "bg-white text-gray-700 border border-gray-100 self-start rounded-tl-none mr-auto"
                  }`}
                >
                  {formatMessageText(msg.text)}
                </div>

                {/* Inline Confirmation Buttons for Tickets */}
                {msg.sender === "bot" && msg.showButtons && showButtons && (
                  <div className="flex gap-2 mt-2 ml-1">
                    <button
                      onClick={() => handleSendMessage(lang === "hi" ? "हाँ" : "Yes")}
                      className="px-4 py-1.5 bg-[#1F2F8C] text-white rounded-lg text-xs font-semibold hover:bg-[#152060] transition-colors cursor-pointer shadow-sm"
                    >
                      {lang === "hi" ? "हाँ (Yes)" : "Yes"}
                    </button>
                    <button
                      onClick={() => handleSendMessage(lang === "hi" ? "नहीं" : "No")}
                      className="px-4 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer shadow-sm"
                    >
                      {lang === "hi" ? "नहीं (No)" : "No"}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* AI is thinking loader */}
            {isLoading && (
              <div className="flex items-center gap-1 bg-white text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 self-start mr-auto shadow-sm w-16">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Scroll Bar */}
          <div className="py-2 bg-gray-50 border-t border-gray-100">
            <div className="flex gap-1.5 overflow-x-auto px-3 scrollbar-none">
              {quickActionChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => handleQuickAction(chip.key, chip.label)}
                  className="px-3 py-1 bg-white border border-gray-200 hover:border-[#1F2F8C] text-[11px] font-medium text-gray-700 rounded-full whitespace-nowrap cursor-pointer transition-colors hover:text-[#1F2F8C]"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={lang === "hi" ? "संदेश लिखें या प्रश्न पूछें..." : "Type your query here..."}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1F2F8C] text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="w-9 h-9 bg-[#F7941D] hover:bg-[#d67e15] text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
