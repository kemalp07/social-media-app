from pathlib import Path
from uuid import UUID

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"


def save_image(user_id: UUID, filename: str, content: bytes) -> str:
    safe_name = filename.replace("..", "").replace("/", "_") or "photo.jpg"
    dest_dir = UPLOAD_DIR / str(user_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / safe_name
    dest.write_bytes(content)
    return f"/uploads/{user_id}/{safe_name}"
