import sys
try:
    from PIL import Image, ImageDraw, ImageFont
    
    # Create 64x64 transparent background
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw amber circle
    draw.ellipse((2, 2, 62, 62), fill=(245, 158, 11)) # Amber 500
    
    # Draw some text (AZ)
    # Using default font since we don't have others installed
    draw.text((22, 26), "AZ", fill=(255, 255, 255), align="center")
    
    import os
    os.makedirs('public', exist_ok=True)
    img.save('public/favicon.png', optimize=True)
    print("Created public/favicon.png")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
