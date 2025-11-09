#!/usr/bin/env python3
"""
Script pour créer des subsets de Playfair avec fonttools
Usage: python3 scripts/subset-playfair.py
"""

import sys
import os

# Ajouter les chemins possibles de fonttools
possible_paths = [
    '/opt/homebrew/lib/python3.14/site-packages',
    '/opt/homebrew/lib/python3.9/site-packages',
    '/Users/reda/Library/Python/3.9/lib/python3.9/site-packages',
]

for path in possible_paths:
    if os.path.exists(path):
        sys.path.insert(0, path)

try:
    from fonttools import subset
except ImportError:
    print("❌ fonttools n'est pas installé.")
    print("💡 Installez-le avec: pip3 install --break-system-packages fonttools")
    print(f"   Chemins Python vérifiés: {sys.path[:3]}")
    sys.exit(1)

# Unicode ranges : Latin de base + accents français + caractères européens
UNICODE_RANGES = "U+0020-007F,U+00A0-00FF,U+0100-017F,U+0180-024F,U+1E00-1EFF"

# Chemins des fichiers
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(BASE_DIR, "public", "fonts", "Playfair")

REGULAR_SRC = os.path.join(FONTS_DIR, "Playfair.woff2")
REGULAR_DST = os.path.join(FONTS_DIR, "Playfair-subset.woff2")
ITALIC_SRC = os.path.join(FONTS_DIR, "Playfair-Italic.woff2")
ITALIC_DST = os.path.join(FONTS_DIR, "Playfair-Italic-subset.woff2")

def create_subset(input_file, output_file, unicode_ranges):
    """Crée un subset de font"""
    print(f"📝 Création du subset: {os.path.basename(input_file)}")
    
    options = subset.Options()
    options.flavor = "woff2"
    
    # Parser les ranges Unicode
    unicodes = []
    for range_str in unicode_ranges.split(','):
        if '-' in range_str:
            start, end = range_str.split('-')
            start = int(start.replace('U+', ''), 16)
            end = int(end.replace('U+', ''), 16)
            unicodes.extend(range(start, end + 1))
        else:
            unicodes.append(int(range_str.replace('U+', ''), 16))
    
    # Charger la font
    font = subset.load_font(input_file, options)
    
    # Créer le subset
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    
    # Sauvegarder
    subset.save_font(font, output_file, options)
    print(f"✅ Subset créé: {os.path.basename(output_file)}")

def main():
    print("🎨 Création des subsets de Playfair...")
    
    # Créer backups
    print("💾 Création des backups...")
    import shutil
    shutil.copy(REGULAR_SRC, REGULAR_SRC + ".backup")
    shutil.copy(ITALIC_SRC, ITALIC_SRC + ".backup")
    
    # Créer subsets
    create_subset(REGULAR_SRC, REGULAR_DST, UNICODE_RANGES)
    create_subset(ITALIC_SRC, ITALIC_DST, UNICODE_RANGES)
    
    # Afficher les tailles
    print("\n📊 Tailles des fichiers:")
    import subprocess
    result = subprocess.run(
        ["ls", "-lh", os.path.join(FONTS_DIR, "*.woff2")],
        shell=True,
        capture_output=True,
        text=True
    )
    print(result.stdout)
    
    # Remplacer les fichiers
    print("🔄 Remplacement des fichiers...")
    os.rename(REGULAR_DST, REGULAR_SRC)
    os.rename(ITALIC_DST, ITALIC_SRC)
    
    print("\n✅ Subsets créés avec succès !")
    print("💾 Backups conservés: *.backup")

if __name__ == "__main__":
    main()

