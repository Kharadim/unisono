from datetime import date, timedelta, datetime
from backend.database import PHOTOS_DIR
from PIL import Image, ImageDraw, ImageFont
import requests
import time


def d(offset):
    """Future date: today + offset days."""
    return (date.today() + timedelta(days=offset)).isoformat()


def past(offset):
    """Past date: today - offset days."""
    return (date.today() - timedelta(days=offset)).isoformat()


def now_iso():
    """Current datetime as ISO string."""
    return datetime.now().isoformat(timespec="seconds")


def past_datetime(days, hours=0):
    """Past datetime as ISO string."""
    return (datetime.now() - timedelta(days=days, hours=hours)).isoformat(timespec="seconds")


def generate_demo_photos(sources):
    """Download demo photos or generate Pillow avatars as fallback.

    sources: list of (employee_id, name, url, fallback_color)
    """
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    ts = int(time.time())
    photos = {}
    for emp_id, name, url, fallback_color in sources:
        filename = f"{emp_id}_demo_{ts}.jpg"
        filepath = PHOTOS_DIR / filename
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                photos[emp_id] = filename
                continue
        except Exception:
            pass
        # Fallback: Pillow avatar
        photos[emp_id] = generate_avatar(emp_id, name, fallback_color)
    return photos


def generate_avatar(employee_id, name, bg_color):
    """Generate a simple avatar image with initials using Pillow."""
    size = 256
    img = Image.new("RGB", (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    initials = "".join(word[0].upper() for word in name.split()[:2])
    font_size = 96
    font = None
    for font_name in ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initials, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), initials, fill="white", font=font)
    filename = f"{employee_id}_demo_{int(time.time())}.jpg"
    filepath = PHOTOS_DIR / filename
    img.save(filepath, "JPEG", quality=90)
    return filename


def delete_demo_photos():
    """Remove demo photo files from disk."""
    for f in PHOTOS_DIR.glob("*_demo*.*"):
        f.unlink(missing_ok=True)
