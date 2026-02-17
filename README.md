A browser-based AI Voice Assistant built with the MERN stack and Google Gemini API.
The assistant listens for a wake word, understands voice commands, responds using AI-generated speech, and performs smart browser actions — completely hands-free.

🎙️ Features:
Wake-word based voice activation
Continuous speech recognition in the browser
AI responses powered by Google Gemini API
Text-to-Speech replies (Bengali voice supported 🇧🇩🇮🇳)
Smart command handling:

🌍 Google Search
▶️ YouTube Search / Play
📸 Instagram
📘 Facebook
📰 News
🌦 Weather
🧮 Online Calculator

Animated UI showing listening & speaking states
User authentication system (Signup / Login / Logout)
Customizable assistant name and avatar

🛠 Tech Stack
Frontend
React.js
Context API
Web Speech API (SpeechRecognition + SpeechSynthesis)
Tailwind CSS
React Toastify
Backend
Node.js
Express.js
MongoDB
JWT Authentication
AI
Google Gemini API for natural language understanding & responses

⚙️ How It Works:
The assistant continuously listens for the user’s assistant name (wake word)
When detected:
Speech recognition stops
Voice input is sent to the Gemini API

Gemini returns:
A spoken response
A command type (search, open app, etc.)

The assistant:
Speaks the response
Performs the requested browser action
After speaking, listening resumes automatically

🚀 Future Improvements:
Custom wake-word training
More system control commands
Multilingual support
Mobile browser optimization

👨‍💻 Author:
Built with ❤️ using AI + Voice + MERN Stack

⚙️ Installation & Setup:
Follow these steps to run the project locally.
1️⃣ Clone the Repository:
git clone https://github.com/suvojitmanna/assistgpt.git
cd your-repo-name

2️⃣ Backend Setup
cd backend
npm install

Create a .env file inside /backend

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173

Start Backend Server
npm run dev

3️⃣ Frontend Setup

Open a new terminal:

cd frontend
npm install

Create a .env file inside /frontend:
VITE_SERVER_URL=http://localhost:5000

Start Frontend:
npm run dev

🌐 Browser Requirements
This project uses the Web Speech API, so use:
✅ Google Chrome (Recommended)
✅ Microsoft Edge

⚠️ Make sure Microphone Permission is allowed

🧑‍💻 How to Use:
Sign up or log in
Customize your assistant name & avatar
Say your assistant’s name to activate
Give a voice command like:
“Search cats on Google”
“Play Arijit Singh on YouTube”
“Open Instagram”
The assistant will respond with voice and perform the action 🎙️

<br/>
File Strcture <br/>
server/
├── controllers/
├── models/
├── routes/
├── middlewares/
├── config/

client/
├── src/
├── components/
├── pages/
├── context/

<br/>

## ⚙️ Environment Variables
Create `.env` file in server:

<br/>

PORT=8000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_url
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

<br/>

## 🚀 Installation

### 1️⃣ Clone Repo
git clone https://github.com/suvojitmanna/assistgpt.git

### 2️⃣ Backend Setup

<br/>
cd server
npm install
npm run dev


---

### 3️⃣ Frontend Setup



cd client
npm install
npm run dev


---

## 🔒 Security Features

- HttpOnly JWT Cookies
- Password Hashing (bcrypt)
- Protected API Routes
- Server-Side Limit Enforcement
- MongoDB Data Persistence

---

## 📈 Future Improvements

- Stripe Premium Plan
- Multi-Chat Threads
- Admin Dashboard
- Analytics Tracking
- Google OAuth Login

---

## 🧑‍💻 Author

**Suvojit Manna**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

