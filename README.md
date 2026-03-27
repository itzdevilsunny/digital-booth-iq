# BoothIQ: AI-Driven Knowledge Graph for Hyper-Local Governance 🇮🇳

BoothIQ transforms raw electoral data into a high-precision **Knowledge Graph**, enabling political analysts and administrators to identify influencers, track sentiment, and target outreach with surgical precision.

## 🚀 3-Layer Hybrid Intelligence
1.  **Rule-Based Core**: Instant, deterministic tagging of 80%+ of grievances (Water, Roads, etc.) with zero latency and zero cost.
2.  **Light AI Layer (GPT-4o-mini)**: On-demand classification for complex text nuances, using "Intelligence on Demand" to protect API credits.
3.  **Multilingual Communication**: Multilingual support via Sarvam AI for inclusive outreach.

## 🛠️ Tech Stack
-   **Frontend**: React (Tailwind CSS, ForceGraph2D) - Deployed on **Vercel**.
-   **Backend**: FastAPI (Python 3.10+) - Deployed on **Render**.
-   **Database**: MongoDB Atlas (Knowledge Graph) + Supabase (Electoral Core).
-   **AI**: OpenAI GPT-4o-mini.

## 📦 Setting Up for Production

**Developer Recommendation**: For a better development experience, we recommend installing the [React Developer Tools](https://reactjs.org/link/react-devtools) browser extension.

### Backend (Render)
1.  **Environment Variables**:
    - `MONGO_URL`: Your MongoDB Atlas connection string.
    - `DB_NAME`: Database name.
    - `OPENAI_API_KEY`: Your OpenAI key.
    - `SUPABASE_URL` & `SUPABASE_ANON_KEY`: From your Supabase project.
2.  **Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1.  **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: URL of your deployed Render backend.
2.  **Build Command**: `npm run build`

## 📊 Demo Mode
To populate the system with 1000 high-precision synthetic records (including Household Relationships, Influence Scores, and Risk Levels):
```bash
curl -X POST https://your-backend.render.com/api/seed
```

## 🧠 Key Features
-   **Sector Knowledge Graph**: Visualize the social fabric and thematic clusters.
-   **Influence & Risk Mapping**: Identify key opinion leaders and dissatisfied voters.
-   **High-Priority Area Detection**: Automatic flagging of areas with recurring infrastructure issues.
-   **Segmented Outreach**: Targeted messaging hooks for effective grievance redressal.

---
*Built for the high-stakes environment of Indian elections.*
