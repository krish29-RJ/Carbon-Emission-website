# CarbonWise — Gamified Carbon Footprint Platform

![CarbonWise Banner](./app/public/assets/banner.png)

> **"Prompt War" Hackathon Submission by Hack2Skill & Google**
> Understand ➔ Track ➔ Reduce your personal carbon footprint using science-backed metrics and an interactive AI Coach powered by Google Gemini.

CarbonWise is a highly engaging, gamified, and production-ready web application. Unlike static carbon calculators, CarbonWise features a vibrant 3D "Living World" that reacts to your emissions, an interactive conversational AI Coach, and a robust social leaderboard.

## ✨ Core Features

1. **AI Coach (Gemini 1.5 Integration)**: A context-aware chat interface that provides deeply personalized, quantifiable, and realistic carbon reduction strategies based on your exact lifestyle footprint.
2. **The Living Eco World**: A stunning 3D visualization using `framer-motion` and dynamic styling. Your virtual world turns greener and healthier as you lower your footprint, providing immediate visual feedback.
3. **Science-Backed Calculation**: Advanced multi-factor tracking across Transport, Energy, Diet, and Consumption, benchmarked against real-world data.
4. **Gamification & Social Hub**: Earn achievement badges, track your streak, and climb the real-time social leaderboard to foster community-driven climate action.

## 🏗️ Architecture & Tech Stack

CarbonWise is built as an integrated, high-performance web application designed for scalability and seamless UX.

- **Frontend Environment**: React 18, TypeScript (Strict), Vite
- **State Management**: React Context & Hooks
- **Routing**: React Router (Multi-page SPA architecture)
- **Styling & Animation**: Tailwind CSS, Framer Motion, Lucide React
- **Data Visualization**: Recharts
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **AI Integration**: Google Firebase AI Logic (Gemini API)

## 🧠 Prompt Engineering Highlights
To ensure our AI provides production-grade, reliable insights without hallucinations:
* **Context Preservation**: The AI Coach maintains memory of your specific footprint breakdown and previous conversation turns.
* **Quantified Constraints**: The prompt strictly enforces that Gemini provides exact kg CO₂e savings tailored to the user's input, rather than generic advice.
* **Streaming Responses**: Real-time response generation creates an engaging, instant-feedback coaching experience.

## 🛡️ Production Standards

We didn't just build an MVP; we built a production-grade application optimized for security, performance, and accessibility.

* **[Testing Strategy (96.9% Coverage)](TESTING_STRATEGY.md)**: Comprehensive Vitest suite with React Testing Library verifying state, component lifecycle, and edge cases.
* **[Security Architecture](SECURITY_ARCHITECTURE.md)**: 100% mitigation of XSS vulnerabilities, strict dependency auditing, and secure authentication via Supabase.
* **[Accessibility Compliance](ACCESSIBILITY_COMPLIANCE_REPORT.md)**: Full WCAG 2.1 AA compliance with semantic HTML, ARIA labels, and keyboard navigation support.

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/krish29-RJ/Carbon-Emission-website.git
cd "Carbon-Emission-website/app"

# Install dependencies
npm install

# Setup environment variables (add your Supabase and Gemini keys)
cp .env.example .env

# Run the development server
npm run dev
```

## 🤝 Acknowledgements
Built with ❤️ for the Hack2Skill & Google "Prompt War" Hackathon.
