import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import axios from "axios";

const app = express();
const server = http.createServer(app);

const url = `http://localhost:5000`;
const interval = 30000;

function reloadWebsite() {
  axios
    .get(url)
    .then(() => console.log("Website reloaded"))
    .catch((error) => console.error(`Error : ${error.message}`));
}

setInterval(reloadWebsite, interval);

const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  // JOIN ROOM
  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom) || []));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userName);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  // CODE UPDATE
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  // LEAVE ROOM
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom) || []));
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  // TYPING INDICATOR
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  // LANGUAGE CHANGE
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  // JUDGE0 API CONFIG
  const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";
  const RAPID_API_KEY = "92f575d894msh278e580e8a07e64p13037fjsn13d73d2e9b55";

  // COMPILATION HANDLER
  socket.on("compileCode", async ({ code, roomId, language, input }) => {
    if (!rooms.has(roomId)) return;

    try {
      const room = rooms.get(roomId);

      // Map language name → Judge0 ID
      const languageMap = {
  javascript: 63, // JavaScript (Node.js 12.14.0)
  python: 71,     // Python (3.8.1)
  java: 62,       // Java (OpenJDK 13.0.1)
  cpp: 54         // C++ (GCC 9.2.0)
};

      const language_id = languageMap[language];
 console.log(`Compiling with language: ${language}, ID: ${languageMap[language]}`);

      if (!language_id) {
        io.to(roomId).emit("codeResponse", { output: "Unsupported language" });
        return;
      }

      // Encode code & input
      const encodedCode = Buffer.from(code).toString("base64");
      const encodedInput = input ? Buffer.from(input).toString("base64") : "";

      // Step 1: Submit code
      const submission = await axios.post(
        `${JUDGE0_API}?base64_encoded=true&wait=false&fields=*`,
        {
          source_code: encodedCode,
          language_id,
          stdin: encodedInput
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": RAPID_API_KEY
          }
        }
      );

      const token = submission.data.token;

      // Step 2: Poll for result
      console.log("Judge0 Request Data:", {
  language,
  language_id: languageMap[language],
  code: code.slice(0, 50) + "...",
});

      const getResult = async () => {
        const result = await axios.get(`${JUDGE0_API}/${token}?base64_encoded=true&fields=*`, {
          headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": RAPID_API_KEY
          }
        });
        return result.data;
      };

      let output;
      while (true) {
        const res = await getResult();
        if (res.status && res.status.id >= 3) { // 1=queued, 2=processing, 3=done
          // Decode Base64 outputs
          output =
            (res.stdout ? Buffer.from(res.stdout, "base64").toString() : "") ||
            (res.stderr ? Buffer.from(res.stderr, "base64").toString() : "") ||
            (res.compile_output ? Buffer.from(res.compile_output, "base64").toString() : "") ||
            "No output";
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s
      }

      // Send output to all in room
      room.output = output;
      io.to(roomId).emit("codeResponse", { output });

    } catch (error) {
      console.error("Judge0 Error:", error.response?.data || error.message);
      io.to(roomId).emit("codeResponse", { output: "Compilation failed" });
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom)?.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom) || []));
    }
    console.log("User Disconnected");
  });
});

// SERVER CONFIG
const port = process.env.PORT || 5000;
const __dirname = path.resolve();

// app.use(express.static(path.join(__dirname, "../frontend/dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
// });
app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});
server.listen(port, () => {
  console.log("Server is working on port 5000");
});
