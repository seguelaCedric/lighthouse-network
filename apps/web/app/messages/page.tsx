"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  ChevronDown,
  Check,
  CheckCheck,
  Image,
  FileText,
  Smile,
  ArrowLeft,
  Star,
  Archive,
  Trash2,
  Pin,
  X,
  Clock,
  Sparkles,
  MessageSquare,
} from "lucide-react";

// Types
interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  attachments?: { type: "image" | "file"; name: string; url: string }[];
}

interface Conversation {
  id: string;
  participantName: string;
  participantPhoto: string | null;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  messages: Message[];
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    participantName: "Captain Williams",
    participantPhoto: null,
    participantRole: "M/Y Serenity",
    lastMessage: "Thanks for sending over the crew profiles. I've reviewed them and would like to proceed with interviews.",
    lastMessageTime: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    isPinned: true,
    messages: [
      {
        id: "msg-1",
        senderId: "other",
        content: "Hi, I wanted to follow up on the Chief Stewardess candidates we discussed.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-2",
        senderId: "me",
        content: "Of course! I've put together a shortlist of 4 excellent candidates that match your requirements.",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-3",
        senderId: "me",
        content: "I'll send over their profiles now. All have extensive experience on 50m+ motor yachts.",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        status: "read",
        attachments: [{ type: "file", name: "Shortlist_Chief_Stew.pdf", url: "#" }],
      },
      {
        id: "msg-4",
        senderId: "other",
        content: "Thanks for sending over the crew profiles. I've reviewed them and would like to proceed with interviews.",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-5",
        senderId: "other",
        content: "Sarah M. and Elena R. stood out to me. Can we arrange calls for later this week?",
        timestamp: new Date(Date.now() - 14 * 60 * 1000),
        status: "read",
      },
    ],
  },
  {
    id: "conv-2",
    participantName: "Sarah Mitchell",
    participantPhoto: null,
    participantRole: "Candidate - Chief Stewardess",
    lastMessage: "That sounds perfect! I'm very interested in the position.",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    messages: [
      {
        id: "msg-1",
        senderId: "me",
        content: "Hi Sarah, I have an exciting opportunity that matches your profile perfectly.",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-2",
        senderId: "other",
        content: "Hi! Thank you for reaching out. I'd love to hear more about it.",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-3",
        senderId: "me",
        content: "It's a Chief Stewardess position on a 65m motor yacht based in Monaco. The owner is looking for someone with your exact experience level.",
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-4",
        senderId: "other",
        content: "That sounds perfect! I'm very interested in the position.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "read",
      },
    ],
  },
  {
    id: "conv-3",
    participantName: "Lighthouse Support",
    participantPhoto: null,
    participantRole: "Support Team",
    lastMessage: "Your subscription has been upgraded to Premium. Enjoy your new features!",
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: true,
    isPinned: false,
    messages: [
      {
        id: "msg-1",
        senderId: "other",
        content: "Welcome to Lighthouse Network! We're here to help you find the perfect crew or position.",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-2",
        senderId: "other",
        content: "Your subscription has been upgraded to Premium. Enjoy your new features!",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: "delivered",
      },
    ],
  },
  {
    id: "conv-4",
    participantName: "Maria Costa",
    participantPhoto: null,
    participantRole: "Candidate - 2nd Stewardess",
    lastMessage: "I've attached my updated CV with the new certifications.",
    lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    messages: [
      {
        id: "msg-1",
        senderId: "other",
        content: "Hi, I wanted to update you on my recent STCW refresher course.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "read",
      },
      {
        id: "msg-2",
        senderId: "other",
        content: "I've attached my updated CV with the new certifications.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "read",
        attachments: [{ type: "file", name: "Maria_Costa_CV_2024.pdf", url: "#" }],
      },
    ],
  },
];

// Template responses for recruiters
const templateResponses = [
  {
    id: "template-1",
    title: "Initial Contact",
    content: "Hi [Name], I came across your profile and have an exciting opportunity that matches your experience. Would you be open to a quick chat?",
  },
  {
    id: "template-2",
    title: "Interview Invite",
    content: "Great news! The client would like to schedule an interview with you. Are you available this week for a video call?",
  },
  {
    id: "template-3",
    title: "Document Request",
    content: "Thank you for your interest! To proceed, could you please send over your updated CV, certificates, and references?",
  },
  {
    id: "template-4",
    title: "Position Update",
    content: "I wanted to update you on the position. The client is currently reviewing candidates and we should have news within the next few days.",
  },
  {
    id: "template-5",
    title: "Follow Up",
    content: "Hi [Name], I hope you're doing well! I wanted to follow up on our previous conversation. Do you have any questions I can help with?",
  },
];

// Format time
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 24) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Conversation list item
function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const initials = conversation.participantName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 p-4 text-left transition-colors",
        isActive ? "bg-gold-50" : "hover:bg-gray-50"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {conversation.participantPhoto ? (
          <img
            src={conversation.participantPhoto}
            alt={conversation.participantName}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-600">
            {initials}
          </div>
        )}
        {conversation.isOnline && (
          <div className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-success-500" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {conversation.isPinned && <Pin className="size-3 text-gold-500" />}
            <span className="font-medium text-navy-900">{conversation.participantName}</span>
          </div>
          <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
        </div>
        <p className="mb-0.5 text-xs text-gray-500">{conversation.participantRole}</p>
        <p className="truncate text-sm text-gray-600">{conversation.lastMessage}</p>
      </div>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <span className="shrink-0 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-white">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
}

// Message bubble
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn ? "bg-navy-900 text-white" : "bg-gray-100 text-navy-900"
        )}
      >
        <p className="text-sm">{message.content}</p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, i) => (
              <a
                key={i}
                href={attachment.url}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-2 text-xs",
                  isOwn ? "bg-navy-800 hover:bg-navy-700" : "bg-white hover:bg-gray-50"
                )}
              >
                {attachment.type === "image" ? (
                  <Image className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
                <span className="truncate">{attachment.name}</span>
              </a>
            ))}
          </div>
        )}

        {/* Timestamp and status */}
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-xs",
            isOwn ? "text-gray-300" : "text-gray-500"
          )}
        >
          <span>
            {message.timestamp.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {isOwn && (
            <span>
              {message.status === "read" ? (
                <CheckCheck className="size-3.5 text-gold-400" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Template selector dropdown
function TemplateSelector({
  onSelect,
  onClose,
}: {
  onSelect: (content: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-gold-500" />
          <span className="font-medium text-navy-900">Quick Responses</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="size-4" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {templateResponses.map((template) => (
          <button
            key={template.id}
            onClick={() => {
              onSelect(template.content);
              onClose();
            }}
            className="w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
          >
            <p className="mb-1 text-sm font-medium text-navy-900">{template.title}</p>
            <p className="line-clamp-2 text-xs text-gray-500">{template.content}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Main messages page
export default function MessagesPage() {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState(mockConversations[0].id);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const filteredConversations = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first, then by last message time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      content: newMessage,
      timestamp: new Date(),
      status: "sent",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, message],
              lastMessage: newMessage,
              lastMessageTime: new Date(),
            }
          : c
      )
    );

    setNewMessage("");
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowMobileThread(true);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const initials = activeConversation?.participantName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation List */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-gray-200 bg-white md:w-96",
          showMobileThread ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="border-b border-gray-100 p-4">
          <h1 className="mb-3 text-4xl font-serif font-semibold text-navy-800">Messages</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {sortedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => handleSelectConversation(conversation.id)}
            />
          ))}

          {sortedConversations.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div
        className={cn(
          "flex flex-1 flex-col bg-white",
          !showMobileThread ? "hidden md:flex" : "flex"
        )}
      >
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileThread(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                >
                  <ArrowLeft className="size-5" />
                </button>

                <div className="relative">
                  {activeConversation.participantPhoto ? (
                    <img
                      src={activeConversation.participantPhoto}
                      alt={activeConversation.participantName}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-600">
                      {initials}
                    </div>
                  )}
                  {activeConversation.isOnline && (
                    <div className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-success-500" />
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-navy-900">
                    {activeConversation.participantName}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {activeConversation.isOnline ? (
                      <span className="text-success-600">Online</span>
                    ) : (
                      activeConversation.participantRole
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                  <Phone className="size-5" />
                </button>
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                  <Video className="size-5" />
                </button>
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                  <MoreVertical className="size-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {activeConversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === "me"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-100 p-4">
              <div className="relative flex items-end gap-2">
                {/* Template Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={cn(
                      "rounded-lg p-2 transition-colors",
                      showTemplates
                        ? "bg-gold-100 text-gold-600"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    )}
                    title="Quick responses"
                  >
                    <Sparkles className="size-5" />
                  </button>
                  {showTemplates && (
                    <TemplateSelector
                      onSelect={(content) => setNewMessage(content)}
                      onClose={() => setShowTemplates(false)}
                    />
                  )}
                </div>

                {/* Attachment Button */}
                <button
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Attach file"
                >
                  <Paperclip className="size-5" />
                </button>

                {/* Input */}
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-32 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                {/* Send Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="shrink-0"
                >
                  <Send className="size-4" />
                </Button>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare className="size-8 text-gray-400" />
              </div>
              <h3 className="mb-2 font-semibold text-navy-900">Select a conversation</h3>
              <p className="text-sm text-gray-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

