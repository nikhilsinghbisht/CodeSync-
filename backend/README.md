Real‑Time Collaborative Code Editor
A powerful real‑time collaborative code editor where multiple users can code together in shared rooms.
Supports JavaScript, Python, Java, and C++ with live synchronization using WebSockets and on‑demand code execution powered by Judge0 API.

Perfect for pair programming, coding interviews, and online collaboration.

Features
Live Collaboration – Real‑time code sync using Socket.IO

Multi‑Language Execution – Supports JavaScript, Python, Java, and C++

Fast & Lightweight – Built with Vite + React for speed

VS Code‑like Editor – Powered by Monaco Editor

Room‑Based Sharing – Easily shareable room IDs for collaboration

Typing Indicators – See who’s actively editing in real‑time

Tech Stack
Frontend: React + Vite + Monaco Editor

Backend: Node.js + Express + Socket.IO

API: Judge0 (via RapidAPI)

Installation & Setup
1. Clone the repository
bash
Copy
Edit
git clone https://github.com/your-username/realtime-code-editor.git
cd realtime-code-editor
2. Setup Backend
bash
Copy
Edit
cd backend
npm install
npm start
3. Setup Frontend
bash
Copy
Edit
cd ../frontend
npm install
npm run build
4. Serve the App
The backend is configured to serve the built frontend.
Once both are running, open:

arduino
Copy
Edit
http://localhost:5000
Running in Development Mode
If you want live reload during development:

bash
Copy
Edit
# In /backend
npm start

# In /frontend
npm run dev
Frontend will run on Vite's default port:

arduino
Copy
Edit
http://localhost:5173
Future Enhancements
More programming languages

File uploads & multi‑file project support

Persistent rooms with user authentication

