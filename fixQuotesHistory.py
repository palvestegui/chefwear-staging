import re

with open('src/components/views/sales/QuotesHistoryList.tsx', 'r') as f:
    content = f.read()

# Replace the inner block which is now `{order.paymentHistory...}` inside `{setViewingReceiptId && ( ... )}`
# actually let's just do a clean replacement.

bad_pattern_1 = r"\{setViewingReceiptId && \(\s*\{order\.paymentHistory && order\.paymentHistory\.some\(\(p: any\) => p\.receipt\) && \(\s*(<button.*?<\/button>)\s*\)\}\s*\)\}"
replacement_1 = r"{setViewingReceiptId && order.paymentHistory && order.paymentHistory.some((p: any) => p.receipt) && (\n                      \1\n                    )}"

content = re.sub(bad_pattern_1, replacement_1, content, flags=re.DOTALL)

with open('src/components/views/sales/QuotesHistoryList.tsx', 'w') as f:
    f.write(content)
