import re
p = r'C:\Users\User\Desktop\Rovor\Chatbot\src\routes\dashboard.create.tsx'
s = open(p, encoding='utf-8').read().split('\n')

print('== step6 simple Training block interior: knowledge/flow nav buttons (prev|next|disabled) ==')
for i in range(3402, 3426):
    t = s[i-1].strip()
    if re.search(r'prev\(\)|next\(\)|flowMode|onlyKnowledge|disabled=', t):
        print(i, t[:70])

print()
print('== flowMode draft references — all (incl render compare + set) ==')
for i, ln in enumerate(s, 1):
    t = ln.strip()
    if 'flowMode' in t and (re.search(r'draft\.set\(\{|draft\.flowMode|=== "web"|=== "custom"|&& \(', t)):
        print(i, t[:78])
