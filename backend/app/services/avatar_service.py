def dicebear_url(seed: str, style: str = "avataaars") -> str:
    """Generate DiceBear avatar URL from username seed."""
    return f"https://api.dicebear.com/7.x/{style}/svg?seed={seed}"
