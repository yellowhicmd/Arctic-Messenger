import { useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Image,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Users,
  Video,
  X,
} from "lucide-react";

type Chat = {
  id: string;
  name: string;
  initials: string;
  color: string;
  message: string;
  time: string;
  unread?: number;
  group?: boolean;
};

const initialChats: Chat[] = [
  {
    id: "1",
    name: "Mira Rahman",
    initials: "MR",
    color: "lavender",
    message: "That sounds good to me.",
    time: "10:42",
    unread: 2,
  },
  {
    id: "2",
    name: "Weekend plans",
    initials: "WP",
    color: "peach",
    message: "Sam: sent the photos",
    time: "09:18",
    group: true,
  },
  {
    id: "3",
    name: "Arman",
    initials: "A",
    color: "mint",
    message: "Thanks! Talk later.",
    time: "Yesterday",
  },
  {
    id: "4",
    name: "Design circle",
    initials: "DC",
    color: "blue",
    message: "Nadia: new mockups are up",
    time: "Yesterday",
    group: true,
  },
];

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState("1");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Record<string, string[]>>({
    "1": [
      "Hey! How is your day going?",
      "Pretty well, thanks. Just finishing a few things.",
      "That sounds good to me.",
    ],
    "2": [
      "Should we make a group for the weekend?",
      "Sam: sent the photos",
    ],
    "3": ["Are we still on for tomorrow?", "Thanks! Talk later."],
    "4": ["Welcome everyone 👋", "Nadia: new mockups are up"],
  });

  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState("Alex Morgan");
  const [bio, setBio] = useState("Keeping in touch, privately.");
  const [saved, setSaved] = useState(false);

  const activeChat = chats.find((chat) => chat.id === activeId) ?? chats[0];

  const visibleChats = useMemo(
    () =>
      chats.filter((chat) =>
        chat.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [chats, query],
  );

  function sendMessage() {
    const trimmed = message.trim();

    if (!trimmed || !activeChat) return;

    setMessages((current) => ({
      ...current,
      [activeId]: [...(current[activeId] ?? []), trimmed],
    }));

    setChats((current) =>
      current.map((chat) =>
        chat.id === activeId
          ? {
              ...chat,
              message: trimmed,
              time: "Now",
              unread: 0,
            }
          : chat,
      ),
    );

    setMessage("");
  }

  function createDemoChat() {
    const id = String(Date.now());

    const newChat: Chat = {
      id,
      name: "New conversation",
      initials: "NC",
      color: "blue",
      message: "Start a conversation",
      time: "Now",
    };

    setChats((current) => [newChat, ...current]);
    setMessages((current) => ({ ...current, [id]: [] }));
    setActiveId(id);
    setShowMobileChat(true);
  }

  function openChat(chatId: string) {
    setActiveId(chatId);
    setShowMobileChat(true);
  }

  function returnToContacts() {
    setShowMobileChat(false);
  }

  return (
    <main className="app-shell">
      <aside
        className={`sidebar ${
          showMobileChat ? "mobile-hidden" : ""
        }`}
      >
        <header className="brand-row">
          <div className="brand-mark">
            <MessageCircle size={21} strokeWidth={2.4} />
          </div>

          <div className="brand-copy">
            <strong>Arctic</strong>
            <span>private by design</span>
          </div>

          <button
            className="icon-button subtle"
            aria-label="More options"
          >
            <MoreHorizontal size={20} />
          </button>
        </header>

        <button
          className="identity-card"
          onClick={() => setShowProfile(true)}
        >
          <div className="avatar avatar-large avatar-lavender">
            AM
          </div>

          <div className="identity-copy">
            <strong>{displayName}</strong>
            <span>
              <LockKeyhole size={12} />
              ID · 847 291 635 204
            </span>
          </div>

          <ChevronDown size={17} className="muted-icon" />
        </button>

        <div className="sidebar-actions">
          <button
            className="primary-button"
            onClick={createDemoChat}
          >
            <Plus size={17} />
            New message
          </button>

          <button
            className="icon-button"
            aria-label="Settings"
          >
            <Settings size={19} />
          </button>
        </div>

        <label className="search-box">
          <Search size={17} />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
          />

          {query && (
            <button
              className="clear-search"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="section-label">
          <span>MESSAGES</span>

          <button className="text-icon-button">
            <Archive size={14} />
            Archived
          </button>
        </div>

        <nav
          className="chat-list"
          aria-label="Conversations"
        >
          {visibleChats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-row ${
                activeId === chat.id ? "selected" : ""
              }`}
              onClick={() => openChat(chat.id)}
            >
              <div className={`avatar avatar-${chat.color}`}>
                {chat.group ? (
                  <Users size={20} />
                ) : (
                  chat.initials
                )}
              </div>

              <div className="chat-row-copy">
                <div className="chat-row-top">
                  <strong>{chat.name}</strong>
                  <time>{chat.time}</time>
                </div>

                <div className="chat-row-bottom">
                  <span>{chat.message}</span>

                  {chat.unread ? (
                    <b className="unread">{chat.unread}</b>
                  ) : null}
                </div>
              </div>
            </button>
          ))}

          {visibleChats.length === 0 && (
            <p className="empty-search">
              No conversations found.
            </p>
          )}
        </nav>

        <footer className="sidebar-footer">
          <div className="online-dot" />
          <span>Peer-to-peer prototype</span>

          <button
            className="icon-button tiny"
            aria-label="Help"
          >
            <CircleHelp size={17} />
          </button>
        </footer>
      </aside>

      <section
        className={`conversation ${
          showMobileChat ? "mobile-active" : ""
        }`}
      >
        <header className="conversation-header">
          <button
            className="icon-button mobile-back-button"
            onClick={returnToContacts}
            aria-label="Back to contacts"
            title="Back to contacts"
          >
            <ArrowLeft size={21} />
          </button>

          <div className={`avatar avatar-${activeChat.color}`}>
            {activeChat.group ? (
              <Users size={20} />
            ) : (
              activeChat.initials
            )}
          </div>

          <div className="conversation-title">
            <strong>{activeChat.name}</strong>

            <span>
              {activeChat.group
                ? "Group conversation · demo"
                : "Messenger ID not connected"}
            </span>
          </div>

          <div className="header-actions">
            <button
              className="icon-button"
              title="Voice call"
              aria-label="Voice call"
            >
              <Phone size={19} />
            </button>

            <button
              className="icon-button"
              title="Video call"
              aria-label="Video call"
            >
              <Video size={20} />
            </button>

            <div className="header-divider" />

            <button
              className="icon-button"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

            <button
              className="icon-button"
              title="Conversation options"
              aria-label="Conversation options"
            >
              <MoreHorizontal size={21} />
            </button>
          </div>
        </header>

        <div className="encryption-banner">
          <ShieldCheck size={15} />

          <span>
            This is a UI prototype. Messages are not yet end-to-end
            encrypted or sent to another device.
          </span>
        </div>

        <div className="message-area">
          <div className="day-divider">
            <span>TODAY</span>
          </div>

          {(messages[activeId] ?? []).map((text, index) => {
            const outgoing = index % 2 === 1;

            return (
              <div
                key={`${activeId}-${index}`}
                className={`message-line ${
                  outgoing ? "outgoing" : "incoming"
                }`}
              >
                <div className="message-bubble">
                  <p>{text}</p>

                  <div className="message-meta">
                    <time>
                      {outgoing ? "10:42" : "10:41"}
                    </time>

                    {outgoing && <Check size={13} />}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="demo-note">
            <LockKeyhole size={14} />

            <span>
              Your future conversations will be encrypted between
              your devices.
            </span>
          </div>
        </div>

        <div className="composer-wrap">
          <div className="composer">
            <button
              className="icon-button composer-tool"
              aria-label="Add attachment"
            >
              <Paperclip size={20} />
            </button>

            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Write a message"
              aria-label="Write a message"
            />

            <button
              className="icon-button composer-tool"
              aria-label="Add emoji"
            >
              <Smile size={20} />
            </button>

            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!message.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="composer-footnote">
            <LockKeyhole size={12} />

            <span>
              Private messaging is the goal. Encryption is not
              implemented in this prototype.
            </span>
          </div>
        </div>
      </section>

      {showProfile && (
        <div
          className="modal-backdrop"
          onClick={() => setShowProfile(false)}
        >
          <section
            className="profile-modal"
            onClick={(event) => event.stopPropagation()}
            aria-labelledby="profile-heading"
          >
            <header className="modal-header">
              <div>
                <span className="eyebrow">YOUR ACCOUNT</span>
                <h2 id="profile-heading">Edit profile</h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowProfile(false)}
                aria-label="Close profile"
              >
                <X size={20} />
              </button>
            </header>

            <div className="profile-avatar-wrap">
              <div className="avatar avatar-large avatar-lavender">
                AM
              </div>

              <button
                className="photo-button"
                disabled
                title="Avatar upload will be implemented later"
              >
                <Image size={15} />
                Add photo
                <span>soon</span>
              </button>
            </div>

            <label className="field-label">
              Display name

              <input
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setSaved(false);
                }}
                maxLength={48}
              />
            </label>

            <label className="field-label">
              Messenger ID

              <div className="readonly-field">
                847 291 635 204
                <span>Generated ID demo</span>
              </div>
            </label>

            <label className="field-label">
              Bio

              <textarea
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  setSaved(false);
                }}
                maxLength={160}
                rows={3}
              />

              <span className="field-hint">
                {bio.length}/160 characters
              </span>
            </label>

            <div className="modal-actions">
              {saved && (
                <span className="saved-state">
                  <Check size={15} />
                  Saved locally for this session
                </span>
              )}

              <button
                className="primary-button"
                onClick={() => setSaved(true)}
              >
                <Check size={16} />
                Save profile
              </button>
            </div>

            <p className="modal-disclaimer">
              Prototype only: profile changes are held in memory and
              disappear on refresh. No account or network sync exists
              yet.
            </p>
          </section>
        </div>
      )}
    </main>
  );
          }
