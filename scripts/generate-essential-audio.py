import json, os, re, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'public/audio'
AUDIO.mkdir(parents=True, exist_ok=True)
INDEX_PATH = AUDIO / 'index.json'
SOURCE = ROOT / 'client/src/lib/essentialVocabulary.ts'
API_KEY = os.environ.get('ELEVENLABS_API_KEY', '')
MODELS = {'male': 'eleven_v4', 'female': 'eleven_v4'}
VOICES = {'male': ('h5eZa8VFAq0EQ8E81dfL', 'elevenlabs_'), 'female': ('0oqpliV6dVSr9XomngOW', 'elevenlabs_female_')}
VOICE_NAMES = {'male': 'Yong Gyu - Calm Korean Male Narrator', 'female': 'Jini - Warm & Intelligent Korean Female'}

def write_manifest_atomically(manifest_data, target_path: Path):
    tmp_path = target_path.parent / f"{target_path.name}.tmp"
    tmp_path.write_text(json.dumps(manifest_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp_path.replace(target_path)

records=[]
for line in SOURCE.read_text(encoding='utf-8').splitlines():
    m=re.search(r'id: "([^"]+)", front: "([^"]+)"',line)
    if m: records.append({'id':m.group(1),'text':m.group(2)})

index=json.loads(INDEX_PATH.read_text(encoding='utf-8')) if INDEX_PATH.exists() else {'vocabulary':{},'alphabet':{'consonants':{},'vowels':{}},'female':{'vocabulary':{},'alphabet':{'consonants':{},'vowels':{}}},'metadata':{}}
index.setdefault('vocabulary',{})
index.setdefault('female',{}).setdefault('vocabulary',{})

session=requests.Session()
def generate(item, voice_key):
    voice_id,prefix=VOICES[voice_key]
    filename=f'{prefix}{item["id"]}.mp3'
    path=AUDIO/filename
    mapping=index['vocabulary'] if voice_key=='male' else index['female']['vocabulary']
    if path.exists() and path.stat().st_size > 1000:
        mapping[item['id']]=filename
        return True,item['id'],voice_key,'existing'
    for attempt in range(4):
        try:
            r=session.post(f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',headers={'xi-api-key':API_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},json={'text':item['text'],'model_id':MODELS[voice_key],'output_format':'mp3_44100_32','voice_settings':{'stability':0.65,'similarity_boost':0.8,'style':0,'use_speaker_boost':True}},timeout=90)
            if r.ok and len(r.content)>1000:
                path.write_bytes(r.content); mapping[item['id']]=filename
                return True,item['id'],voice_key,'generated'
            err=f'HTTP {r.status_code}: {r.text[:120]}'
        except Exception as exc: err=str(exc)
        time.sleep(2**attempt)
    return False,item['id'],voice_key,err

tasks=[(item,voice) for item in records for voice in VOICES]
completed=0; failures=[]
with ThreadPoolExecutor(max_workers=4) as pool:
    futures=[pool.submit(generate,item,voice) for item,voice in tasks]
    for future in as_completed(futures):
        ok,card,voice,status=future.result(); completed+=1
        if not ok: failures.append((card,voice,status))
        if completed%20==0:
            index['metadata']={'provider':'ElevenLabs','model':MODELS['female'],'models':MODELS,'voices':VOICE_NAMES,'voiceIds':{'male':VOICES['male'][0],'female':VOICES['female'][0]}}
            write_manifest_atomically(index, INDEX_PATH)
            print(f'completed {completed}/{len(tasks)} failures={len(failures)}',flush=True)
index['metadata']={'provider':'ElevenLabs','model':MODELS['female'],'models':MODELS,'voices':VOICE_NAMES,'voiceIds':{'male':VOICES['male'][0],'female':VOICES['female'][0]}}
write_manifest_atomically(index, INDEX_PATH)
(ROOT / '.tmp').mkdir(parents=True, exist_ok=True)
Path(ROOT/'.tmp/essential-audio-failures.json').write_text(json.dumps(failures,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'finished {completed}/{len(tasks)} failures={len(failures)}')
