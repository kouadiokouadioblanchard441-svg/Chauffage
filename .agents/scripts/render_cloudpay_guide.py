from pathlib import Path
import pymupdf

source = Path("attached_assets/商戶後台下發教學_1790702049087.pdf")
output_dir = Path(".agents/outputs")
output_dir.mkdir(parents=True, exist_ok=True)

document = pymupdf.open(source)
print(f"pages={len(document)}")
for index, page in enumerate(document, start=1):
    image = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
    output = output_dir / f"cloudpay-guide-page-{index}.png"
    image.save(output)
    print(f"rendered page {index}: {output}")