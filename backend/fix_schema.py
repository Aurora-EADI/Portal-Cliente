import sys
import re

path = r'c:\Users\lucas.silva\Documents\portal\Portal-Aurora\backend\prisma\postgres\schema.prisma'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Back-relation in Customer
if 'operationalContainers OperationalContainer[]' not in content:
    content = re.sub(
        r'(model Customer \{[\s\S]*?simulations\s+Simulation\[\])',
        r'\1\n  operationalContainers OperationalContainer[]',
        content
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated schema.prisma")
