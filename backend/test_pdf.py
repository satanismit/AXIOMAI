import os
import sys

# Configure mock paths if needed
pdf_path = "uploads/attention.pdf"
if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    sys.exit(1)

from pypdf import PdfReader
import re

reader = PdfReader(pdf_path)
raw_text = ""
for page in reader.pages:
    text = page.extract_text()
    if text:
        raw_text += text + "\n"

print(f"RAW TEXT LENGTH: {len(raw_text)}")
print("First 500 chars raw:", repr(raw_text[:500]))

text = raw_text
text = re.sub(r'\d+\s+\d+\s+obj.*?endobj', '', text, flags=re.DOTALL)
text = re.sub(r'<<.*?>>', '', text, flags=re.DOTALL)
text = re.sub(r'xref\r?\n.*?trailer\r?\n', '', text, flags=re.DOTALL)
text = re.sub(r'startxref\r?\n\d+\r?\n%%EOF', '', text, flags=re.DOTALL)
text = re.sub(r'trailer\s*<<.*?>>', '', text, flags=re.DOTALL)
text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
text = re.sub(r'\s+', ' ', text).strip()

print(f"\nCLEANED TEXT LENGTH: {len(text)}")
print("First 500 chars cleaned:", repr(text[:500]))

pattern = r"\b(abstract|introduction|related work|method|model|approach|architecture|experiments|results|evaluation|conclusion)\b"
splits = re.split(pattern, text, flags=re.IGNORECASE)

print(f"\nSPLITS LENGTH: {len(splits)}")

sections = []
if splits[0].strip():
    sections.append({"section": "preface", "text": splits[0].strip()})
    
for i in range(1, len(splits) - 1, 2):
    title = splits[i]
    content = splits[i+1]
    sections.append({
        "section": title.lower(),
        "text": content.strip()
    })

print(f"SECTIONS COUNT: {len(sections)}")
valid = 0
for sec in sections:
    if len(sec["text"].strip()) >= 50:
        valid += 1
    else:
        print(f"Dropped section ({sec['section']}) due to length: {len(sec['text'].strip())}")

print(f"VALID SECTIONS: {valid}")
