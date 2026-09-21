from PIL import Image
import sys

try:
    im = Image.open('public/favicon.png').convert('RGBA')
    datas = im.getdata()
    newData = []
    for item in datas:
        # If pixel is near-white (background), set alpha to 0
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    im.putdata(newData)
    im.save('public/favicon.png', 'PNG')
    print("Background made transparent successfully")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
