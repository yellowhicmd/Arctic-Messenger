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
  Moon,
  Sun,
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

const initialChats: Chat[] = [];

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Record<string, string[]>>({});

  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState(
    () => window.localStorage.getItem("arctic.nickname") || "Your nickname",
  );
  const [accountId] = useState(
    () => window.localStorage.getItem("arctic.accountId") || "Not available",
  );
  const [bio, setBio] = useState(
    () => window.localStorage.getItem("arctic.bio") || "Keeping in touch, privately.",
  );
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const activeChat = chats.find((chat) => chat.id === activeId);

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
    const recipientId = window.prompt("Enter the recipient's 8-digit Arctic ID:");
    if (!recipientId) return;
    const cleanedId = recipientId.trim();
    if (!/^[0-9]{8}$/.test(cleanedId)) {
      window.alert("Please enter an 8-digit Arctic ID.");
      return;
    }
    if (cleanedId === accountId) {
      window.alert("You cannot start a conversation with your own account.");
      return;
    }
    const existing = chats.find((chat) => chat.id === cleanedId);
    if (existing) {
      openChat(existing.id);
      return;
    }
    const newChat: Chat = {
      id: cleanedId,
      name: `Arctic user ${cleanedId}`,
      initials: "AU",
      color: "blue",
      message: "New conversation · not connected yet",
      time: "New",
    };
    setChats((current) => [newChat, ...current]);
    setMessages((current) => ({ ...current, [cleanedId]: [] }));
    setActiveId(cleanedId);
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
    <main className={`app-shell ${darkMode ? "dark-theme" : ""}`}>
      <aside
        className={`sidebar ${
          showMobileChat ? "mobile-hidden" : ""
        }`}
      >
        <header className="brand-row">
          <div className="brand-mark">
            <MessageCircle size={22} strokeWidth={2.4} />
          </div>

          <div className="brand-copy">
            <strong>Arctic</strong>
            <span>private by design</span>
          </div>

          <button
            className="icon-button subtle"
            aria-label="More options"
            title="More options"
          >
            <MoreHorizontal size={20} />
          </button>
        </header>

        <button
          className="identity-card"
          onClick={() => setShowProfile(true)}
        >
          <div className="avatar avatar-large avatar-blue">
            {displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A"}
          </div>

          <div className="identity-copy">
            <strong>{displayName}</strong>
            <span>
              <LockKeyhole size={12} />
              ID · {accountId}
            </span>
          </div>

          <ChevronDown size={17} className="muted-icon" />
        </button>

        <div className="sidebar-actions">
          <button
            className="primary-button"
            onClick={createDemoChat}
          >
            <Plus size={18} />
            New message
          </button>

          <button
            className="icon-button"
            aria-label="Settings"
            title="Settings"
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

        <nav className="chat-list" aria-label="Conversations">
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
            title="Help"
          >
            <CircleHelp size={17} />
          </button>
        </footer>
      </aside>

      {activeChat ? (
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
          <ShieldCheck size={16} />

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
              title="Add attachment"
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
              title="Add emoji"
            >
              <Smile size={20} />
            </button>

            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!message.trim()}
              aria-label="Send message"
              title="Send message"
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
      ) : (
        <section className={`conversation ${showMobileChat ? "mobile-active" : ""}`}>
          <div className="message-area" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div className="brand-mark" style={{ width: 58, height: 58, borderRadius: 20 }}>
              <MessageCircle size={28} />
            </div>
            <h1 style={{ margin: "20px 0 8px", fontSize: 25 }}>Your conversations start here</h1>
            <p style={{ maxWidth: 360, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              There are no conversations yet. Start a new conversation with someone's Arctic ID when you're ready.
            </p>
            <button className="primary-button" style={{ marginTop: 22 }} onClick={createDemoChat}>
              <Plus size={18} /> New conversation
            </button>
            <p style={{ maxWidth: 380, color: "var(--text-secondary)", fontSize: 12, marginTop: 18 }}>
              Messaging and end-to-end encryption are not connected yet. This screen is ready for the next implementation step.
            </p>
          </div>
        </section>
      )}

      <button
        className="theme-toggle"
        onClick={() => setDarkMode((current) => !current)}
        aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      >
        {darkMode ? <Sun size={19} /> : <Moon size={19} />}
      </button>

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
              <div className="avatar avatar-large avatar-blue">
                {displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A"}
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
                {accountId}
                <span>Your Arctic account ID</span>
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
                  Nickname saved on this device
                </span>
              )}

              <button
                className="primary-button"
                onClick={() => {
                const nickname = displayName.trim().slice(0, 32);
                if (!nickname) return;
                setDisplayName(nickname);
                window.localStorage.setItem("arctic.nickname", nickname);
                window.localStorage.setItem("arctic.bio", bio);
                setSaved(true);
              }}
              >
                <Check size={16} />
                Save profile
              </button>
            </div>

            <p className="modal-disclaimer">
              Your nickname and bio are saved in this browser on this device. Account-wide nickname sync is not implemented yet.
            </p>
          </section>
        </div>
      )}
    </main>
  );
                      }
