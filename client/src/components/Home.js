import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room Id is generated");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Both fields are required");
      return;
    }

    navigate(`/editor/${roomId}`, {
      state: { username },
    });

    toast.success("Joining room...");
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #0f172a, #020617 60%, #000000)",
        fontFamily: "Arial",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "30px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <img
          src="/images/DevCode.png"
          alt="Logo"
          style={{
            width: "110px",
            marginBottom: "10px",
          }}
        />

        {/* Title */}
        <h2 style={{ color: "white", marginBottom: "5px" }}>
          Join a Coding Room
        </h2>

        <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
          Collaborate in real-time with your friends 🚀
        </p>

        {/* ROOM ID */}
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          onKeyUp={handleInputEnter}
          style={inputStyle}
        />

        {/* USERNAME */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Username"
          onKeyUp={handleInputEnter}
          style={inputStyle}
        />

        {/* JOIN BUTTON */}
        <button onClick={joinRoom} style={joinBtn}>
          🚀 Join Room
        </button>

        {/* CREATE ROOM */}
        <div style={{ marginTop: "15px", fontSize: "13px", color: "#94a3b8" }}>
          Don’t have a room?
          <span
            onClick={generateRoomId}
            style={{
              color: "#38bdf8",
              cursor: "pointer",
              marginLeft: "5px",
              fontWeight: "bold",
            }}
          >
            Create new room
          </span>
        </div>
      </div>
    </div>
  );
}

export default Home;

/* ---------- STYLES ---------- */

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  outline: "none",
  background: "rgba(0,0,0,0.3)",
  color: "white",
  fontSize: "14px",
};

const joinBtn = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px",
  color: "white",
  background: "linear-gradient(90deg, #22c55e, #16a34a)",
  boxShadow: "0 10px 25px rgba(34,197,94,0.3)",
};