# 🏆 DBS Tetris AI Grand Prix - Winning Toolkit

This repository contains the ultimate optimization script to win the Tetris AI Grand Prix.

## 🚀 How to use
1. Open the competition page in **Chrome**.
2. Press **F12** or **Ctrl+Shift+J** to open the Console.
3. Open `optimizer.js` from this repo, copy all the code, and paste it into the console.
4. Run the optimizer by typing:
   ```javascript
   runTetrisOptimizer({ level: 3, seed: YOUR_SEED, timeMinutes: 5 });
   ```
5. Wait for the results, then copy the weights, formulas, and custom scorer code into the game UI.
6. Click **Simulate** and win!

## 📄 Contents
- `optimizer.js`: The "Monte Carlo" random search engine.
- `STRATEGY.md`: The detailed theory and optimization plan.
