import sys

def check_function_balances(filepath):
    content = open(filepath, 'r').read()
    lines = content.split('\n')
    
    in_string = False
    string_char = ''
    in_comment = False
    in_multiline_comment = False
    
    current_func = None
    balance_b = 0
    
    for i, line in enumerate(lines):
        # Very crude function detection
        if line.strip().startswith('async function') or line.strip().startswith('function'):
            if balance_b == 0:
                current_func = line.strip()
            
        j = 0
        while j < len(line):
            char = line[j]
            if in_multiline_comment:
                if char == '*' and j + 1 < len(line) and line[j+1] == '/':
                    in_multiline_comment = False
                    j += 1
            elif in_comment:
                break
            elif in_string:
                if char == string_char:
                    backslashes = 0
                    k = j - 1
                    while k >= 0 and line[k] == '\\':
                        backslashes += 1
                        k -= 1
                    if backslashes % 2 == 0:
                        in_string = False
            else:
                if char == '/' and j + 1 < len(line):
                    if line[j+1] == '/':
                        in_comment = True
                        j += 1
                    elif line[j+1] == '*':
                        in_multiline_comment = True
                        j += 1
                elif char in ["'", '"', '`']:
                    in_string = True
                    string_char = char
                elif char == '{':
                    balance_b += 1
                elif char == '}':
                    balance_b -= 1
                    if balance_b == 0 and current_func:
                        # Function ended?
                        current_func = None
                    elif balance_b < 0:
                        print(f"Negative brace balance at line {i+1}")
            j += 1
        in_comment = False # reset for next line
    
    if balance_b != 0:
        print(f"Unclosed braces! Final balance: {balance_b}")

check_function_balances('scraper-service/scraper.js')
