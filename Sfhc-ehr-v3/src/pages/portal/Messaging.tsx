import { useMemo, useState } from "react";
import { MessageSquare, Send, Paperclip, Check, CheckCheck, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDate, relativeTime } from "@/lib/format";
import type { MessageChannel } from "@/lib/types";

const CHANNELS: MessageChannel[] = ["Patient", "Physician", "Laboratory", "Pharmacy", "Reception"];

export default function Messaging() {
  const { messages, patients, users, currentUser, sendMessage, markMessageRead } = useApp();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeToChannel, setComposeToChannel] = useState<MessageChannel>("Patient");

  const threads = useMemo(() => {
    const threadMap = new Map<string, { id: string; name: string; channel: MessageChannel; lastMessage: typeof messages[0]; unread: number }>();
    for (const m of messages) {
      const otherParty = m.fromChannel === "Physician" || m.fromChannel === "Reception" || m.fromChannel === "Laboratory" || m.fromChannel === "Pharmacy" ? { name: m.toName, channel: m.toChannel, id: m.toId } : { name: m.fromName, channel: m.fromChannel, id: m.fromId };
      const threadId = m.threadId;
      const existing = threadMap.get(threadId);
      if (!existing || new Date(m.sentAt) > new Date(existing.lastMessage.sentAt)) {
        threadMap.set(threadId, { id: threadId, name: otherParty.name, channel: otherParty.channel, lastMessage: m, unread: messages.filter((msg) => msg.threadId === threadId && !msg.read).length });
      }
    }
    return Array.from(threadMap.values()).filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  }, [messages, search]);

  const threadMessages = selectedThread ? messages.filter((m) => m.threadId === selectedThread).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()) : [];

  const handleSend = () => {
    if (!composeBody.trim() || !composeTo.trim()) return;
    const thread = threads.find((t) => t.id === selectedThread);
    sendMessage({
      threadId: selectedThread ?? `thread-${Date.now()}`,
      fromChannel: "Physician",
      fromName: currentUser?.name ?? "System",
      fromId: currentUser?.id ?? "system",
      toChannel: composeToChannel,
      toName: composeTo,
      toId: composeTo,
      subject: composeSubject || "(No subject)",
      body: composeBody,
    });
    setComposeBody("");
    setComposeSubject("");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Secure Messaging" subtitle="Communicate with patients and departments" icon={<MessageSquare size={20} />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Thread list */}
        <div className="card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {threads.length === 0 ? <EmptyState title="No messages" /> : (
              threads.map((t) => (
                <button key={t.id} onClick={() => { setSelectedThread(t.id); messages.filter((m) => m.threadId === t.id && !m.read).forEach((m) => markMessageRead(m.id)); }}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${selectedThread === t.id ? "bg-teal-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 truncate">{t.name}</span>
                    {t.unread > 0 && <span className="badge-teal text-xs">{t.unread}</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{relativeTime(t.lastMessage.sentAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message view */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center"><EmptyState title="Select a conversation" description="Choose a thread to view messages" /></div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{threads.find((t) => t.id === selectedThread)?.name}</p>
                    <p className="text-xs text-slate-500">{threads.find((t) => t.id === selectedThread)?.channel}</p>
                  </div>
                  <span className="text-xs text-slate-400">{threadMessages.length} messages</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromChannel === "Physician" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${m.fromChannel === "Physician" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-900"} rounded-2xl px-4 py-2.5`}>
                      <p className="text-xs opacity-70 mb-1">{m.fromName} · {m.fromChannel}</p>
                      <p className="text-sm font-medium mb-1">{m.subject}</p>
                      <p className="text-sm">{m.body}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-xs opacity-60">{formatDate(m.sentAt)}</span>
                        {m.read ? <CheckCheck size={12} className="opacity-60" /> : <Check size={12} className="opacity-60" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 space-y-2">
                <div className="flex gap-2">
                  <input className="input flex-1" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject..." />
                  <select className="input w-32" value={composeToChannel} onChange={(e) => setComposeToChannel(e.target.value as MessageChannel)}>
                    {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="Recipient name..." />
                  <button className="btn-ghost btn-sm" title="Attach file"><Paperclip size={16} /></button>
                </div>
                <div className="flex gap-2">
                  <textarea className="input flex-1" rows={2} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Type your message..." onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                  <button className="btn-primary" onClick={handleSend}><Send size={16} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
