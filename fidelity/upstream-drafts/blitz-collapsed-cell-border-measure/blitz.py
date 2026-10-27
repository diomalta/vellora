# python3 blitz.py <layout_dump binary> <html dir> <out json> <label>: Blitz (N0) rects by id attr.
import json,subprocess,sys,os
binp,hdir,out,label=sys.argv[1:5]
ids=['t','after']+['r%d'%i for i in range(10)]+['c%d%s'%(i,s) for i in range(10) for s in 'ab']
os.makedirs('/tmp/c01',exist_ok=True)
res={'engine':label,'variants':{}}
for f in sorted(os.listdir(hdir)):
  if not f.endswith('.html'): continue
  k=f[:-5]; dj='/tmp/c01/dump-%s-%s.json'%(label,k)
  subprocess.run([binp,'--html',os.path.join(hdir,f),'--out',dj,'--no-html-normalize'],check=True,capture_output=True)
  d=json.load(open(dj))
  byid={n['id']:n.get('id_attr') for n in d['nodes']}
  v=[]
  runs={}
  for r in d.get('blitz_runs',[]):
    runs.setdefault(r['owner'],r)
  for b in d['blitz_tree']:
    i=byid.get(b['id'])
    if i:
      e={'id':i,'y':b.get('uy',b['y']),'h':b.get('uh',b['h']),'ry':b['y'],'rh':b['h'],'border':b['border'],'padding':b['padding']}
      r=runs.get(b['id'])
      if r: e['textTop']=r['y']-r['baseline']
      v.append(e)
  res['variants'][k]=v
json.dump(res,open(out,'w'),indent=1)
