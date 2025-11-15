🧭 Project Overview
🎯 Goal

Build an offline-first mobile app that enables users to quickly log daily expenses with an intuitive, clean, and distraction-free design.

🛠️ Tech Stack

React Native (TypeScript)

Expo

React Navigation

Zustand (state management)

AsyncStorage / SQLite (offline local storage)

Vector Icons (Ionicons / Feather)

Minimal white-based UI theme

⭐ Core Features (MVP)
Feature	Description	Offline Ready	Priority
Add Expense	Add expense with amount, category, date, note	✅	⭐⭐⭐⭐
Edit/Delete Expense	Modify or remove existing records	✅	⭐⭐⭐
Expense List	View expenses grouped by date or category	✅	⭐⭐⭐⭐
Category CRUD	Create, rename & delete expense categories	✅	⭐⭐⭐⭐
Summary View	Total spending + category breakdown	✅	⭐⭐⭐
Local Storage	Persistent offline data storage via AsyncStorage/SQLite	✅	⭐⭐⭐⭐
🚀 Future Features (Phase 2)

Dark mode

Monthly budget tracking

Search & filter

Export data to CSV

Cloud backup (Firebase)

Multi-currency support

Passcode / biometric lock

📂 Project Structure
PocketTrack/
│── src/
│   ├── components/
│   ├── constants/
│   ├── naivgation/
│   ├── screens/
│   ├── store/
│   ├── types/
│   ├── utils/
│── assets/
│── App.tsx
│── package.json
│── tsconfig.json
│── README.md

🧑‍💻 Development Setup
1️⃣ Install dependencies
npm install

2️⃣ Start Expo development server
npx expo start

3️⃣ Run on mobile

Scan the QR code using the Expo Go app
(Recommended for quick device testing)

🎨 Design Philosophy

Clean & minimal (white-first design)

Easy one-handed operation

Fast add-expense flow (center FAB)

Simple and lightweight architecture

Offline-first UX

📜 License

MIT License – free to use, modify, and distribute.

🙌 Author

Created by Zhi Lin Chan — Solo developer building practical, user-friendly mobile apps.

Built with the support of Claude AI and ChatGPT for planning and development guidance.
