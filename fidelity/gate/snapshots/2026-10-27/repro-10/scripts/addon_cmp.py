import sys
def n(p):
    return open(p,'rb').read().replace(b'wf_419cd5d5-4b5-4',b'X'*17).replace(b'wf_d4c5e26a-90e-2',b'X'*17)
a=n(sys.argv[1]);b=n(sys.argv[2])
d=[i for i in range(len(a)) if a[i]!=b[i]]
uuid=[i for i in d if 2160<=i<2176]
sig=[i for i in d if 19910944<=i<19910944+155728]
other=[i for i in d if i not in uuid and i not in sig]
print('total',len(d),'uuid',len(uuid),'codesig',len(sig),'other',len(other),other[:10])
