# 🚀 Replicus - Real-Time Collaborative Coding Platform

Replicus is a real-time collaborative coding platform that allows multiple users to join a shared room, write code together, communicate via chat, and execute code instantly.

It is designed to simulate a live coding interview / pair programming environment with seamless synchronization.

---

## 🌐 Live Demo

- 🔗 Frontend: https://replicus-collaborative-tool.vercel.app  

---

## ✨ Features

### 👨‍💻 Real-Time Code Collaboration
- Multiple users can join a room using a Room ID
- Live code synchronization using Socket.IO
- Displays username of the user making changes

### 💬 Real-Time Chat
- Built-in chat system for communication
- Timestamped messages
- Username-based messaging

### ⚡ Code Execution (JDoodle Integration)
- Supports multiple languages:
  - JavaScript, Python, Java, C++, C, PHP
- Input & Output synchronization across users
- Real-time execution results

### 🔄 Live Synchronization
- Code sync for new users joining
- Language sync across all users
- Input/output sync
- Run state sync

### 🎯 Cursor Tracking
- Shows cursor position of other users
- Improves collaboration experience

### 🔐 Username Validation
- Prevents duplicate usernames in the same room

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO

### APIs & Services
- JDoodle API (Code Execution)
- Render (Backend Deployment)
- Vercel (Frontend Deployment)

---

## 📁 Project Structure
Replicus/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ └── socket.js
│
├── backend/
│ ├── server.js
│ ├── Actions.js
│ └── .env


---

## 🌍 Deployment

- Frontend deployed on **Vercel**
- Backend deployed on **Render**

---

## ⚠️ Challenges Faced

- CORS issues during deployment
- Real-time synchronization handling
- Socket connection issues in production
- Environment variable configuration
- Handling multiple users in same room

---

## 🧠 Learnings

- Deep understanding of WebSockets & Socket.IO
- Handling real-time data synchronization
- Backend deployment and CORS configuration
- API integration (JDoodle)
- Scalable room-based architecture

---

## 🚀 Future Enhancements

- 🧑‍🎨 Collaborative Whiteboard (planned)
- 🎥 Video/Audio Calling
- 📁 File Sharing
- 🧠 AI Code Suggestions
- 🏆 Code Interview Mode
- 💾 Code Saving & History

---

## 👨‍💻 Author

**Neel H. Prajapati**

- GitHub: https://github.com/PRAJAPATI-NEEL-2005  
- Email: workspace10072005@gmail.com  

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---


