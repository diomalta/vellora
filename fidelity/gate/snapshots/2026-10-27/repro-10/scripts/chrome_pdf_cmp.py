"""Chrome-side PDFs: compare after zeroing /CreationDate and /ModDate (and worktree ids); else compare page text+bboxes via PyMuPDF."""
import json, sys, re, hashlib
r = json.load(open(sys.argv[1])); O = sys.argv[2]; N = sys.argv[3]
def norm(b):
    b = re.sub(rb'/(CreationDate|ModDate) \(D:[^)]*\)', rb'/\1 (D:X)', b)
    for a in (b'wf_419cd5d5-4b5-4', b'wf_d4c5e26a-90e-2'): b = b.replace(a, b'WT')
    return b
same = []; diff = []
for k in sorted(r['different']):
    if not k.endswith('.pdf'): continue
    a = open(O + '/' + k, 'rb').read(); b = open(N + '/' + k, 'rb').read()
    if norm(a) == norm(b): same.append(k)
    else:
        diff.append(k)
print('chrome-side pdfs differing raw', len(same) + len(diff), 'identical after date-normalization', len(same), 'still different', len(diff))
try:
    import fitz
except Exception:
    fitz = None
for k in diff:
    a = open(O + '/' + k, 'rb').read(); b = open(N + '/' + k, 'rb').read()
    info = ''
    if fitz:
        da = fitz.open(stream=a, filetype='pdf'); db = fitz.open(stream=b, filetype='pdf')
        wa = [[tuple(round(v, 3) for v in w[:4]) + (w[4],) for w in p.get_text('words')] for p in da]
        wb = [[tuple(round(v, 3) for v in w[:4]) + (w[4],) for w in p.get_text('words')] for p in db]
        info = 'pages %d/%d words-identical=%s' % (len(da), len(db), wa == wb)
    print('  ', k, len(a), len(b), info)
