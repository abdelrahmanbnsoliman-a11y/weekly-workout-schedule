# Weekly Workout Schedule

A small Windows desktop app for following a weekly gym plan, tracking workouts, and eating to a calorie target.

**Download:** [`Weekly Workout Schedule.exe`](Weekly%20Workout%20Schedule.exe) (1.6 MB, Windows 10/11, no install). A browser version is in [`weekly-workout-schedule.html`](weekly-workout-schedule.html).

## Features

- **Training**: 3, 4, 5 or 6-day plans, each exercise with a picture, target muscle and sets × reps.
  - **Gym / Home** switch. Home swaps machines for a 150 cm bar, 100 cm EZ bar, dumbbells and a bench, and adds extra exercises.
  - **How to do it** steps in Arabic for every exercise (offline) and a YouTube video link.
  - **kg box** on each exercise to record the weight used, with last-time and personal-best hints.
- **Nutrition**: calorie calculator (BMR × activity ± goal). It picks the meal plan and snacks closest to your target and resizes gram portions so the day hits it.
- **Progress**: 1–3 month goal, commitment %, streak, calendar, weekly and pace charts, body weight chart, strength progress per exercise, and a weekly record.
- **Your data** is saved to `Documents\Weekly Workout Schedule\my-data.json` (with a `.bak` copy). Updating the app never touches it.
- Works fully offline: pictures, steps, charts and fonts are all inside the app.

## How it's built

- C# Windows Forms window compiled with the .NET Framework 4 compiler that ships with Windows (`csc.exe`), so no Visual Studio or .NET SDK is needed.
- Microsoft Edge **WebView2** renders the page. The WebView2 DLLs and the page are embedded in the .exe.
- The page is plain HTML/CSS/JavaScript with hand-drawn SVG charts and no libraries.

| File | Purpose |
|---|---|
| `build/GymPlan.cs` | Desktop window, WebView2 setup, saving data to the JSON file |
| `build/index.original.html` | The original schedule page |
| `build/home.js` | Home-equipment exercise swaps and extras |
| `build/how.js` | How-to steps and video links |
| `build/lifts.js` | Weight-per-exercise tracking and strength chart |
| `build/progress.*` | Progress tab: goal, calendar, charts, weekly record |
| `build/patch.py` | Combines the pieces above into the final page |
| `build/get_fonts.py` | Downloads the fonts once into `fonts.css` for offline use |
| `build/build.ps1` | Builds everything into the .exe |

## Build

Needs Windows and Python 3.

```powershell
powershell -ExecutionPolicy Bypass -File build\build.ps1
```

This downloads the WebView2 SDK from NuGet the first time, then writes `Weekly Workout Schedule.exe` and `weekly-workout-schedule.html` to the repo root.
