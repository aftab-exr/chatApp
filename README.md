# 📟 Terminal Chat System

A secure, real-time, CLI-themed chat application built from scratch using the MERN stack (Node.js, Express, Socket.io).

![Project Demo](https://placehold.co/600x400/000000/00ff41?text=Terminal+Chat+System)

## ✨ Features

- **Real-Time Communication:** Sub-100ms messaging using WebSockets.
- **Security:** User authentication with Bcrypt password hashing.
- **Persistance:** Custom JSON database engine (NoSQL architecture).
- **Interactive UI:**
  - 🕵️ **Matrix Mode:** `/theme matrix`
  - 🎨 **Custom Themes:** Green, Amber, White, Custom Hex.
  - 🔠 **Font Engine:** 8 selectable developer fonts.
  - 📱 **Responsive:** Fully functional on Mobile & Desktop.
- **Admin Tools:** `/nuke` command for server-side data sanitization.

## 🚀 Commands List

Type `/commands` in the chat to see this list:

| Command | Usage | Description |
| :--- | :--- | :--- |
| **Theme** | `/theme [name]` | Switch themes (green, amber, white, matrix) |
| **Font** | `/font [0-7]` | Change terminal font style |
| **Background** | `/bg [url]` | Set a custom image background |
| **Color** | `/color [text] [bg]` | Set custom Hex colors (e.g. #fff #000) |
| **Reset** | `/reset` | Reset UI to default settings |
| **Nuke** | `/nuke [pass]` | **WARNING:** Delete all users & messages |

## 🛠️ Installation

1. **Clone the repo**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/terminal-chat.git](https://github.com/YOUR_USERNAME/terminal-chat.git)
   cd terminal-chat