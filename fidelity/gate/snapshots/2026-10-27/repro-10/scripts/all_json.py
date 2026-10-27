"""Deep-diff every differing JSON in cmp.json with an env ignore set; print remaining diff shapes per file."""
import json, os, sys, subprocess
r = json.load(open(sys.argv[1])); O = sys.argv[2]; N = sys.argv[3]
IGN = 'environment,env,command,commands,date,dateIso,runId,generated,vellora,velloraCommit,velloraSourceHash,timing,rawMode,rawOutcomes,raw,rawOutcome,durationMs,durationS,rasterMs,renderMs,seconds,git,executablePath,route,preflight,provenance,config,executablePath,version,browserVersion,path'
for k in sorted(r['different']):
    if not (k.endswith('.json') or k.endswith('.json.gz')): continue
    if k.startswith('wpt/results.json'): continue
    p = subprocess.run(['python3', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deep_json.py'), O + '/' + k, N + '/' + k, IGN, '6'], capture_output=True, text=True)
    first = p.stdout.splitlines()[0] if p.stdout else p.stderr[-300:]
    if first != 'diffs 0':
        print('==', k); print(p.stdout[:1800])
    else:
        print('ok', k)
