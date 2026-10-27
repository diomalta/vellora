import json,sys
fx=sys.argv[1]
base='/Users/diomalta/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/layout-diff/%s/run-all/diff.json'%fx
x=json.load(open(base))
bs=sorted(x['boxes'],key=lambda b:(b['chrome']['y'],len(b['path'])))
thr=float(sys.argv[2]) if len(sys.argv)>2 else -1
for b in bs:
  L=b['layers'].get('N0u') or b['layers'].get('N0')
  if not L: continue
  c=b['chrome']
  p=b['path'].replace('html>body:nth-child(2)>','')
  if abs(L['dh'])<thr: continue
  print('%7.2f h%6.2f  dy%7.2f dh%6.2f  %s'%(c['y'],c['h'],L['dy'],L['dh'],p[-110:]))
