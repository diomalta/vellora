import json,sys
d=json.load(open(sys.argv[1])); print(d.get('chrome') or d.get('engine'))
ids=sys.argv[2].split(',') if len(sys.argv)>2 else ['t','r0','r1','r2','c0a','c1a','c2a','after']
for k,v in d['variants'].items():
  m={e['id']:e for e in v}
  print('%-20s'%k, ' '.join('%s:%.2f/%.2f'%(i,m[i]['y'],m[i]['h']) for i in ids if i in m))
