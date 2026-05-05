import sys

def check_balance(filepath):
    content = open(filepath, 'r').read()
    balance_p = 0
    balance_b = 0
    in_string = False
    string_char = ''
    in_comment = False
    in_multiline_comment = False
    i = 0
    while i < len(content):
        char = content[i]
        if in_multiline_comment:
            if char == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_multiline_comment = False
                i += 1
        elif in_comment:
            if char == '\n':
                in_comment = False
        elif in_string:
            if char == string_char:
                backslashes = 0
                j = i - 1
                while j >= 0 and content[j] == '\\':
                    backslashes += 1
                    j -= 1
                if backslashes % 2 == 0:
                    in_string = False
        else:
            if char == '/' and i + 1 < len(content):
                if content[i+1] == '/':
                    in_comment = True
                    i += 1
                elif content[i+1] == '*':
                    in_multiline_comment = True
                    i += 1
            elif char in ["'", '"', '`']:
                in_string = True
                string_char = char
            elif char == '(':
                balance_p += 1
            elif char == ')':
                balance_p -= 1
            elif char == '{':
                balance_b += 1
            elif char == '}':
                balance_b -= 1
        i += 1
    return balance_p, balance_b

p, b = check_balance('scraper-service/scraper.js')
print(f"Parentheses Balance: {p}")
print(f"Braces Balance: {b}")
