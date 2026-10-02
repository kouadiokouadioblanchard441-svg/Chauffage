from pathlib import Path

import fitz

source = Path("attached_assets/0_Galaxy_System_Api_Document_3.0.5_英_1790924481034.pdf")
output = Path(".agents/outputs/cloudpay-api-pages")
output.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
for page_number in (3, 4, 5, 6):
    page = document[page_number]
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    pixmap.save(output / f"page-{page_number + 1}.png")