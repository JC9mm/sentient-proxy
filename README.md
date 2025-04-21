# SentientProxy – React + Vite Flag Drift Showcase

This project is a fully frontend, logic-driven animation engine built with **React + Vite**. It dynamically displays animated flag icons drifting across the screen with natural movement, fade-in/fade-out transitions, and randomized behavior — all without any backend.

---

## 🧠 Placeholder for Future Backend Integration

This frontend project is also intended as a **visual and interactive placeholder** for future integration with:

- 🧩 [`jc-web-api`](https://github.com/JC9mm/jc-web-api) – a secure, locally hosted backend in development
- 🤖 `Sentient-AI-Systems-Lab` – a custom, self-hosted AI logic engine for intelligent behavior, response generation, and dynamic content control

These systems will enable this interface to support real-time data, AI-driven behavior, and API-connected actions through a fully private and scalable setup.

---

## 🚀 Features

- 🌍 Loads 25 animated flag icons at a time from a pool of 250 assets
- 🎯 Each flag spawns from a random screen border and drifts toward the center
- 🌀 Flags bounce in random directions and fade out over time
- ⚙️ Performance-tuned with requestAnimationFrame and custom logic (no animation libraries)
- ✨ Fully customizable UI and animation logic

---

## 🧑‍💻 Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

This will launch the app at `http://localhost:5173/` by default.

---

## 🧩 Customizing the Loading Page

The main animation logic is located in:

```
/src/SentientProxy.jsx
```

To modify behavior:
- 🔄 **Change asset pool** by replacing images in `/assets/flags-png/stack*/`
- 🛠️ **Adjust spawn/fade behavior** inside `getRandomFlag()` and the animation loop
- 🌈 **Add UI elements or overlays** inside the main return JSX

You can also:
- Replace flags with emojis or icons
- Modify size, speed, and lifespan (`ttl`) per asset
- Add tooltips, interaction, or sound effects

---

## 📦 Build for Production

```bash
npm run build
```

Then deploy from the `/dist` directory.

---

## 📃 License

MIT – free to use and modify.

---

Built with ❤️ using [React](https://reactjs.org) + [Vite](https://vitejs.dev)
