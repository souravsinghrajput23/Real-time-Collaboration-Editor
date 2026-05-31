import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

// List of supported languages
const LANGUAGES = [
  "python3",
  "java",
  "cpp",
  "nodejs",
  "c",
  "ruby",
  "go",
  "scala",
  "bash",
  "sql",
  "pascal",
  "csharp",
  "php",
  "swift",
  "rust",
  "r",
];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");
  const codeRef = useRef(null);

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, Try again later", {
          id: 'socket-error',
        });
        navigate("/");
      };

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: Location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== Location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current || "",
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();

    return () => {
      socketRef.current && socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, []);

  if (!Location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success(`Room ID has been copied to clipboard`);
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const runCode = async () => {
    setIsCompiling(true);
    setIsCompileWindowOpen(true); 
    try {
      const response = await axios.post("http://localhost:5000/compile", {
        code: codeRef.current,
        language: selectedLanguage,
      });
      console.log("Backend response:", response.data);
      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (error) {
      console.error("Error compiling code:", error);
      setOutput(error.response?.data?.error || "An error occurred during compilation");
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen(!isCompileWindowOpen);
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        
        {/* SIDEBAR PANEL */}
        <div style={styles.sidebar}>
          <div style={styles.logoSection}>
            <img
              src="/images/DevCode.png"
              alt="Logo"
              style={styles.logoImg}
            />
          </div>
          
          <div style={styles.roomCard}>
            <span style={styles.cardLabel}>WORKSPACE ROOM ID</span>
            <div style={styles.roomIdText}>{roomId}</div>
          </div>

          <div style={styles.membersHeaderSection}>
            <h3 style={styles.membersHeader}>Online Members</h3>
            <span style={styles.badge}>{clients.length}</span>
          </div>

          {/* Scrollable Client Container */}
          <div style={styles.clientListWrapper} className="custom-scrollbar">
            {clients.map((client) => (
              <div key={client.socketId} style={styles.clientItem}>
                <Client username={client.username} />
              </div>
            ))}
          </div>

          {/* Action Footer Buttons */}
          <div style={styles.sidebarFooter}>
            <button 
              style={styles.copyBtn} 
              onClick={copyRoomId}
              onMouseEnter={(e) => e.target.style.background = "#22d3ee"}
              onMouseLeave={(e) => e.target.style.background = "#38bdf8"}
            >
              📋 Copy Room ID
            </button>
            <button 
              style={styles.leaveBtn} 
              onClick={leaveRoom}
              onMouseEnter={(e) => {
                e.target.style.background = "#ef4444";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#ef4444";
              }}
            >
              🚪 Leave Workspace
            </button>
          </div>
        </div>

        {/* WORKSPACE EDITOR PANEL */}
        <div style={styles.editorPanel}>
          {/* Top Control Bar Header */}
          <div style={styles.topControlBar}>
            <div style={styles.editorTitle}>
              <span style={styles.statusDot}></span> live_workspace.js
            </div>
            
            <div style={styles.actionControls}>
              <select
                style={styles.langSelector}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>

              <button 
                style={{
                  ...styles.runBtn,
                  background: isCompiling ? "#166534" : "#22c55e"
                }} 
                onClick={runCode}
                disabled={isCompiling}
                onMouseEnter={(e) => !isCompiling && (e.target.style.background = "#16a34a")}
                onMouseLeave={(e) => !isCompiling && (e.target.style.background = "#22c55e")}
              >
                {isCompiling ? "⚙️ Compiling..." : "▶ Run Code"}
              </button>
            </div>
          </div>

          {/* Core Text Editor Component Surface Container */}
          <div style={styles.editorContentContainer}>
            <Editor
              socketRef={socketRef}
              roomId={roomId}
              onCodeChange={(code) => {
                codeRef.current = code;
              }}
            />
          </div>

          {/* Bottom Dock Status Bar Header Toggle */}
          <div style={styles.bottomBar}>
            <button 
              style={styles.terminalToggle} 
              onClick={toggleCompileWindow}
              onMouseEnter={(e) => e.target.style.color = "#f3f4f6"}
              onMouseLeave={(e) => e.target.style.color = "#9ca3af"}
            >
              {isCompileWindowOpen ? "🔽 Hide Console Output" : "🔼 Open Console Output"}
            </button>
          </div>
        </div>
      </div>

      {/* DOCKED CONSOLE TERMINAL ENGINE WINDOW */}
      <div
        style={{
          ...styles.terminalDock,
          height: isCompileWindowOpen ? "30vh" : "0px",
          opacity: isCompileWindowOpen ? 1 : 0,
          borderTop: isCompileWindowOpen ? "1px solid #1d2937" : "none",
        }}
      >
        <div style={styles.terminalHeader}>
          <div style={styles.terminalTitleBlock}>
            <span style={styles.terminalIcon}>⚡</span>
            <span>Console Execution Engine — Output ({selectedLanguage})</span>
          </div>
          <button 
            style={styles.terminalCloseBtn} 
            onClick={toggleCompileWindow}
            onMouseEnter={(e) => e.target.style.color = "#ef4444"}
            onMouseLeave={(e) => e.target.style.color = "#6b7280"}
          >
            ✕
          </button>
        </div>
        <div style={styles.terminalBody}>
          <pre style={styles.terminalPre}>
            {output || "$ Execution output stack trace will stream here after hitting 'Run Code'..."}
          </pre>
        </div>
      </div>

      {/* Embedded Global Styles Rule for UI Customizations */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f111a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}

// Styling Declarations Map Config Object
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#1c1e24",
    color: "#fff",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    overflow: "hidden",
  },
  mainLayout: {
    display: "flex",
    flexDirection: "row",
    flex: 1,
    height: "100%",
    width: "100%",
  },
  sidebar: {
    width: "240px",              // Slightly balanced sidebar footprint
    background: "#0f111a",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1d2937",
    zIndex: 10,
  },
  logoSection: {
    display: "flex",
    justifyContent: "flex-start", // Left aligned logo configuration
    alignItems: "center",
    marginBottom: "18px",
    paddingBottom: "10px",
    borderBottom: "1px solid #1e293b",
  },
  logoImg: {
    maxWidth: "105px",           // Scaled down the DevCode brand dimensions
    height: "auto",
    objectFit: "contain",
    mixBlendMode: "multiply",    // Eliminates white image canvas backgrounds dynamically
    filter: "brightness(0.95) contrast(1.1)",
  },
  roomCard: {
    background: "#111827",
    padding: "12px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    marginBottom: "22px",
    border: "1px solid #1d2937",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
  },
  cardLabel: {
    fontSize: "9px",
    color: "#6b7280",
    fontWeight: "700",
    letterSpacing: "0.7px",
    marginBottom: "5px",
  },
  roomIdText: {
    fontSize: "11px",
    color: "#38bdf8",
    wordBreak: "break-all",
    fontFamily: "'Fira Code', monospace",
    fontWeight: "600",
  },
  membersHeaderSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    padding: "0 2px",
  },
  membersHeader: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  badge: {
    background: "#1e293b",
    color: "#38bdf8",
    fontSize: "10px",
    padding: "1px 6px",
    borderRadius: "20px",
    fontWeight: "700",
    border: "1px solid #334155",
  },
  clientListWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",                  // Closer stacking distance for standard members list
    flex: 1,
    overflowY: "auto",
    paddingRight: "4px",
    marginBottom: "20px",
  },
  clientItem: {
    background: "#111827",
    padding: "2px 6px",          // Tighter vertical structure footprint
    borderRadius: "5px",
    border: "1px solid #1d2937",
    transition: "transform 0.15s ease",
    transform: "scale(0.97)",    // Compact visual scaling setup for user items
    transformOrigin: "left center",
  },
  sidebarFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",
  },
  copyBtn: {
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#38bdf8",
    color: "#0f111a",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "background 0.2s ease",
  },
  leaveBtn: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ef4444",
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },
  editorPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#1c1e24",
    height: "100%",
  },
  topControlBar: {
    height: "55px",
    background: "#0f111a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid #1d2937",
  },
  editorTitle: {
    fontSize: "13px",
    color: "#9ca3af",
    fontFamily: "monospace",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    background: "#22c55e",
    borderRadius: "50%",
    display: "inline-block",
    boxShadow: "0 0 8px #22c55e",
  },
  actionControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  langSelector: {
    background: "#111827",
    color: "#e5e7eb",
    border: "1px solid #1d2937",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    outline: "none",
    fontFamily: "monospace",
    transition: "border-color 0.2s ease",
  },
  runBtn: {
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
  },
  editorContentContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: "#1c1e24",
  },
  bottomBar: {
    height: "35px",
    background: "#0f111a",
    borderTop: "1px solid #1d2937",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    justifyContent: "flex-end",
  },
  terminalToggle: {
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "color 0.2s ease",
    letterSpacing: "0.3px",
  },
  terminalDock: {
    background: "#090b10",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 100,
  },
  terminalHeader: {
    background: "#0f111a",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1d2937",
  },
  terminalTitleBlock: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  terminalIcon: {
    color: "#eab308",
  },
  terminalCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
    transition: "color 0.2s ease",
  },
  terminalBody: {
    flex: 1,
    padding: "15px 20px",
    overflowY: "auto",
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
  },
  terminalPre: {
    margin: 0,
    color: "#34d399",
    fontSize: "13px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
};

export default EditorPage;