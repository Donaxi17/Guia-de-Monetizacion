import re

with open(r'c:\Users\Donaxi Jimenez\Desktop\EDIT\monetization-page\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Regular expression to find tags, ignoring those starting with <!
# This also captures the content of the tag to identify classes/ids for better debugging
tags = re.findall(r'<(/?[a-zA-Z0-9]+)(\s[^>]*)?>', content)

stack = []
self_closing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'col', 'source', 'embed', 'param', 'track', 'wbr']

for i, (tag, attrs) in enumerate(tags):
    tag_name = tag.lower()
    
    if tag_name.startswith('/'):
        tag_name = tag_name[1:]
        if not stack:
            print(f"[{i}] ERROR: Closing </{tag_name}> but stack is empty. Context: {tag}{attrs}")
        else:
            last_idx, last_name, last_attrs = stack.pop()
            if last_name != tag_name:
                print(f"[{i}] ERROR: Closing </{tag_name}> but expected </{last_name}> (opened at [{last_idx}]).")
                print(f"    Opened at [{last_idx}]: <{last_name}{last_attrs}>")
                print(f"    Closing at [{i}]: </{tag_name}>")
                # Put it back to try to continue? No, let's just push the wrong one back or something.
                # stack.append((last_idx, last_name, last_attrs))
    else:
        if tag_name in self_closing:
            continue
        stack.append((i, tag_name, attrs))

if stack:
    print("\nUNCLOSED TAGS:")
    for idx, name, attrs in stack:
        print(f"[{idx}] <{name}{attrs}>")
else:
    print("\nAll tags matched!")
