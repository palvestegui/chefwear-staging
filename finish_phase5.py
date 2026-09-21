import sys

def reduce_empty_lines(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Remove consecutive empty lines and trailing empty lines
    new_lines = []
    prev_empty = False
    for line in lines:
        is_empty = line.strip() == ''
        if is_empty and prev_empty:
            continue
        new_lines.append(line)
        prev_empty = is_empty
        
    with open(filepath, 'w') as f:
        f.writelines(new_lines)

reduce_empty_lines('src/hooks/useOrderSubmission.ts')
reduce_empty_lines('src/components/views/CRMView.tsx')

