import time
from app.services.git_ingest import clone_and_extract_with_limits

url = "https://github.com/facebook/react"
print("Cloning...")
t0 = time.time()
facts, path = clone_and_extract_with_limits(url, max_commits=200, clone_depth=200, max_repo_size_mb=120)
t1 = time.time()
print(f"Done in {t1-t0:.2f}s. Facts: {len(facts)}")
