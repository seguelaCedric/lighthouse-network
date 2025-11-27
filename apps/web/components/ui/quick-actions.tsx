"use client";

import * as React from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Send,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  entityType: "candidate" | "client";
  entityId: string;
  entityName: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  onNoteSaved?: (note: string) => void;
  onEmailSent?: () => void;
  onWhatsAppSent?: () => void;
  className?: string;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
  entityName: string;
}

function NoteModal({ isOpen, onClose, onSave, entityName }: NoteModalProps) {
  const [note, setNote] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setIsSaving(true);
    try {
      await onSave(note);
      setSaved(true);
      setTimeout(() => {
        setNote("");
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Add Note for {entityName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter your note..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          autoFocus
        />

        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!note.trim() || isSaving || saved}
            leftIcon={
              saved ? (
                <Check className="size-4" />
              ) : isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )
            }
          >
            {saved ? "Saved!" : isSaving ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
  entityName: string;
  email: string;
}

function EmailModal({ isOpen, onClose, onSend, entityName, email }: EmailModalProps) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setIsSending(true);
    try {
      await onSend(subject, body);
      setSent(true);
      setTimeout(() => {
        setSubject("");
        setBody("");
        setSent(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to send email:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Send Email to {entityName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || isSending || sent}
            leftIcon={
              sent ? (
                <Check className="size-4" />
              ) : isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )
            }
          >
            {sent ? "Sent!" : isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  entityName: string;
  phone: string;
}

function WhatsAppModal({
  isOpen,
  onClose,
  onSend,
  entityName,
  phone,
}: WhatsAppModalProps) {
  const [message, setMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await onSend(message);
      setSent(true);
      setTimeout(() => {
        setMessage("");
        setSent(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to send WhatsApp:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Send WhatsApp to {entityName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              value={phone}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!message.trim() || isSending || sent}
            leftIcon={
              sent ? (
                <Check className="size-4" />
              ) : isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageSquare className="size-4" />
              )
            }
          >
            {sent ? "Sent!" : isSending ? "Sending..." : "Send WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QuickActions({
  entityType,
  entityId,
  entityName,
  phone,
  email,
  whatsapp,
  onNoteSaved,
  onEmailSent,
  onWhatsAppSent,
  className,
}: QuickActionsProps) {
  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = React.useState(false);

  const handleCall = () => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleSaveNote = async (note: string) => {
    // Save note via API
    const response = await fetch(`/api/${entityType}s/${entityId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });

    if (!response.ok) {
      throw new Error("Failed to save note");
    }

    onNoteSaved?.(note);
  };

  const handleSendEmail = async (subject: string, body: string) => {
    if (!email) return;

    // Send email via API
    const response = await fetch("/api/messages/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject,
        body,
        entityType,
        entityId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    onEmailSent?.();
  };

  const handleSendWhatsApp = async (message: string) => {
    const whatsappNumber = whatsapp || phone;
    if (!whatsappNumber) return;

    // Send WhatsApp via API
    const response = await fetch("/api/messages/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: whatsappNumber,
        body: message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send WhatsApp");
    }

    onWhatsAppSent?.();
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Call */}
        {phone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCall}
            title={`Call ${phone}`}
          >
            <Phone className="size-4 mr-1.5" />
            Call
          </Button>
        )}

        {/* Email */}
        {email && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmailModal(true)}
            title={`Email ${email}`}
          >
            <Mail className="size-4 mr-1.5" />
            Email
          </Button>
        )}

        {/* WhatsApp */}
        {(whatsapp || phone) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWhatsAppModal(true)}
            title="Send WhatsApp"
          >
            <MessageSquare className="size-4 mr-1.5" />
            WhatsApp
          </Button>
        )}

        {/* Notes */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNoteModal(true)}
          title="Add note"
        >
          <FileText className="size-4 mr-1.5" />
          Note
        </Button>
      </div>

      {/* Modals */}
      <NoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
        entityName={entityName}
      />

      {email && (
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendEmail}
          entityName={entityName}
          email={email}
        />
      )}

      {(whatsapp || phone) && (
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          onSend={handleSendWhatsApp}
          entityName={entityName}
          phone={whatsapp || phone || ""}
        />
      )}
    </>
  );
}
