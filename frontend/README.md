# Frontend (React with Create React App)

This folder is prepared to use Create React App (CRA) so you have a standard React setup (not Vite).

Quick start (Windows PowerShell):

Option A — initialize new CRA project (recommended if you want the full scaffold):

```powershell
cd d:/fpt
# WARNING: this will create/overwrite files in the `frontend` folder. Back up if needed.
npx create-react-app frontend
cd frontend
npm start
```

Option B — use the current files and install dependencies for CRA (if you've kept `src/` and `public/`):

```powershell
cd d:/fpt/frontend
npm install
npm start
```

Notes:
- The `package.json` has been updated to use `react-scripts` (CRA) rather than Vite/webpack custom setup.
- If you choose Option A, the `npx create-react-app` command will fully scaffold a standard CRA app (recommended).
- `src/` contains components, pages and an `api/` folder for Axios helpers to call backend APIs.
- Implement an Auth context and route guards for admin vs. customer views.
