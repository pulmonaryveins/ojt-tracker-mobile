# 📱 OJT Tracker Mobile

A mobile application for tracking On-the-Job Training (OJT) hours built with React Native and Expo.

## 🚀 Features

- ✅ User authentication (Sign up / Sign in)
- ✅ Track daily OJT hours with break management
- ✅ View progress and statistics
- ✅ Manage profile and OJT setup
- ✅ Export reports (PDF/CSV)
- ✅ Dark/Light theme support with customizable accent colors
- ✅ Offline mode with auto-sync
- ✅ Modern, optimized navigation bar

## 🛠️ Tech Stack

- **Framework:** React Native + Expo
- **Language:** TypeScript
- **Backend:** Supabase
- **State Management:** Zustand
- **UI:** Custom themed components
- **Navigation:** Expo Router

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/pulmonaryveins/ojt-tracker-mobile.git
cd ojt-tracker-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npx expo start
```

## 📱 Running the App

- **iOS Simulator:** Press `i` in the terminal
- **Android Emulator:** Press `a` in the terminal
- **Physical Device:** Scan the QR code with Expo Go app

## 📂 Project Structure

```
ojt-tracker-mobile/
├── app/                    # App screens and navigation
│   ├── (app)/             # Main app screens
│   ├── (auth)/            # Authentication screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── themed/            # Themed components
│   └── ui/                # UI components
├── stores/                # Zustand stores
├── services/              # API services
│   ├── pdf-export.service.ts
│   ├── session.service.ts
│   └── ...
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
├── lib/                   # Libraries and utilities
└── assets/                # Images, fonts, etc.
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Vince Bryant Cabunilas**
- GitHub: [@pulmonaryveins](https://github.com/pulmonaryveins)

## 🙏 Acknowledgments

- Built with Expo and React Native
- Backend powered by Supabase