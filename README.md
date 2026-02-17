🤖 AssistGPT – AI Voice Assistant (MERN + Gemini)

A browser-based AI Voice Assistant built with the MERN stack and Google Gemini API.

The assistant listens for a wake word, understands voice commands, responds using AI-generated speech, and performs smart browser actions — completely hands-free.

🎤 Features
🔊 Voice System

Wake-word based voice activation

Continuous speech recognition (Web Speech API)

AI responses powered by Google Gemini API

Text-to-Speech replies

Bengali voice supported (bn-IN)

🌐 Smart Browser Commands

The assistant can:

🌍 Google Search

▶️ YouTube Search / Play

📸 Instagram

📘 Facebook

📰 News

🌦 Weather

🧮 Online Calculator

💼 LinkedIn Search

🎨 UI & User Features

Animated UI showing listening & speaking states

Real-time typing animation

Daily usage limit system

12-hour auto reset

Persistent chat history (MongoDB)

Manual clear history option

Customizable assistant name and avatar

🛠 Tech Stack
Frontend

React.js (Context API)

Web Speech API (SpeechRecognition + SpeechSynthesis)

Tailwind CSS

React Toastify

Axios

Backend

Node.js

Express.js

MongoDB + Mongoose

JWT Authentication (HttpOnly cookies)

bcrypt (Password hashing)

Google Gemini API (AI NLP processing)

⚙️ How It Works

The assistant continuously listens for the user's assistant name (wake word).

When detected:

Speech recognition stops.

Voice input is sent to the Gemini API.

Gemini returns:

A spoken response.

A command type (search, open app, etc.).

The assistant:

Speaks the response.

Performs the requested browser action.

Automatically resumes listening.

🔒 Security Features

JWT authentication with HttpOnly cookies

Password hashing with bcrypt

Protected routes via middleware

Server-side reply limit enforcement

MongoDB-based data persistence

🚀 Installation
Clone the repository
git clone https://github.com/suvojitmanna/assistgpt.git

Backend Setup
cd server
npm install
npm run dev

Frontend Setup
cd client
npm install
npm run dev

🌱 Environment Variables

Create a .env file in your server folder:

PORT=8000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_url
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

👨‍💻 Author

Suvojit Manna

⭐ Support

If you like this project, consider giving it a ⭐ on GitHub.

💎 Why This Version Is Better

Clean markdown formatting

Proper section hierarchy

Professional tone

Clear feature breakdown

Installation instructions

Security explanation
