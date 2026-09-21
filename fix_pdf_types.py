import sys

with open('src/types/index.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "id?: string;\n  docType?: string;",
    "id?: string;\n  docType?: string;\n  cancellationId?: string;\n  canceledAt?: number;\n  canceledBy?: string;\n  cancellationType?: string;\n  refundAmount?: number;\n  retainedAmount?: number;\n  cancellationReason?: string;"
)

with open('src/types/index.ts', 'w') as f:
    f.write(content)
