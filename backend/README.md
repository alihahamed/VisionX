# Backend (FastAPI) - Proof of Thinking

Run:

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Test:

```bash
cd backend
pytest -q
```

Main APIs:
- `POST /api/analysis`
- `GET /api/analysis/{job_id}`
- `GET /api/analysis/{job_id}/result`
- `GET /api/analysis/{job_id}/timeline`
- `GET /api/analysis/{job_id}/graph`
- `GET /api/analysis/{job_id}/contributors/{contributor_id}`
