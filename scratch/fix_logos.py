import os
import glob

def fix_logos():
    files = glob.glob('src/**/*.jsx', recursive=True) + ['index.html']
    for f in files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = content.replace('/RaShoyi_logo_circle.png', '/assets/RaShoyi_logo.png')
        new_content = new_content.replace('/favicon.png', '/assets/RaShoyi_logo.png')
        new_content = new_content.replace('/icons/icon-192x192.png', '/assets/RaShoyi_logo.png')
        new_content = new_content.replace('/vite.svg', '/assets/RaShoyi_logo.png')
        new_content = new_content.replace('/assets/QRDine_logo.png', '/assets/RaShoyi_logo.png')
        new_content = new_content.replace('/QRDine_logo.png', '/assets/RaShoyi_logo.png')
        new_content = new_content.replace('RaShoyi_logo_circle.png', 'RaShoyi_logo.png')
        
        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")

if __name__ == "__main__":
    fix_logos()
