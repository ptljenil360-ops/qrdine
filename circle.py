import os
from PIL import Image, ImageDraw

def make_circle(image_path, output_path):
    print(f"Opening {image_path}...")
    try:
        img = Image.open(image_path).convert("RGBA")
        
        # Make the image a square first
        width, height = img.size
        min_dim = min(width, height)
        
        # Calculate cropping box
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        
        # Crop to square
        img_square = img.crop((left, top, right, bottom))
        
        # Create mask
        mask = Image.new("L", img_square.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, min_dim, min_dim), fill=255)
        
        # Apply mask
        result = Image.new("RGBA", img_square.size)
        result.paste(img_square, (0, 0), mask=mask)
        
        # Save result
        result.save(output_path)
        print(f"Successfully saved circular logo to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_file = os.path.join("public", "assets", "RaShoyi_logo.png")
    output_file = os.path.join("public", "assets", "RaShoyi_logo_circle.png")
    
    make_circle(input_file, output_file)
