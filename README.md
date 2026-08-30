# 🎓 IIT Voice FAQ Bot

# Project Information

Project Name: IIT Voice FAQ Bot

Project Track: GenAI Internship Training — LLMs Meet Speech

Project: Project 2 — Voice FAQ Bot



> A voice-powered AI assistant that answers questions about IIT Madras and IIT Roorkee using PDF-based RAG, Google Gemini, Supabase Vector Search, Speech-to-Text, and Text-to-Speech.

## ✨ Features

- 🎤 Voice-based question input
- 📝 Speech-to-Text using browser Speech Recognition
- 📚 PDF-based IIT knowledge base
- 🔎 Semantic vector search
- 🧠 Google Gemini-powered answers
- 🎯 IIT-specific document retrieval
- 💬 Text-based answers
- 🔊 Automatic Text-to-Speech responses
- 📖 Source document references
- ⚡ Next.js + TypeScript application

## 🧠 How It Works

```text
🎤 User speaks
      ↓
📝 Speech-to-Text
      ↓
❓ User question
      ↓
🧠 Gemini Embedding
      ↓
🔎 Supabase Vector Search
      ↓
📚 Relevant PDF chunks
      ↓
🤖 Gemini 2.5 Flash
      ↓
💬 Generated answer
      ↓
🔊 Text-to-Speech
      ↓
👂 User hears the answer


 How to Use
Voice Mode
Open the application.
Click 🎤 Voice.
Speak your question.
The browser converts your speech into text.
Click Ask →.
The system creates an embedding for your question.
Supabase retrieves the most relevant document chunks.
Gemini generates the answer.
The answer appears on the screen.
The answer is automatically spoken aloud.



You can also type a question directly into the text box and click Ask →.

Replay Answer

Click 🔊 Listen to hear the generated answer again.

ID
Document Name
Chunk Text
Chunk Index
Embedding




PDF
 ↓
Chunking
 ↓
Embedding
 ↓
Supabase


#For a new questions 
Question
 ↓
Question Embedding
 ↓
Vector Search
 ↓
Relevant Chunks
 ↓
Gemini
 ↓
Answer

#screenshots:
<img width="1770" height="1079" alt="{F9D712FC-447D-4012-9D3C-7B1EF3806687}" src="https://github.com/user-attachments/assets/264c02ed-f0f0-4447-93c3-349bea31531b" />
<img width="1866" height="790" alt="{87D4BFA4-B360-4FBF-8EFD-12DDD8DEA884}" src="https://github.com/user-attachments/assets/b6855a43-3e9e-43b2-b494-d5c9ead50378" />




