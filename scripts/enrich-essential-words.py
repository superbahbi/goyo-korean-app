import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from openai import OpenAI

SOURCE = Path('/home/ubuntu/goyo-korean-app/client/src/lib/essentialVocabulary.ts')
OUTPUT = Path('/home/ubuntu/goyo-korean-app/.tmp/essential-enriched.json')
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

records = []
for line in SOURCE.read_text(encoding='utf-8').splitlines():
    m = re.search(r'id: "([^"]+)", front: "([^"]+)", back: "([^"]+)", romanization: "([^"]+)".*?partOfSpeech: "([^"]+)"', line)
    if m:
        records.append({'id': m.group(1), 'korean': m.group(2), 'meaning': m.group(3), 'romanization': m.group(4), 'part_of_speech': m.group(5)})

schema = {
    'type': 'json_schema',
    'json_schema': {
        'name': 'korean_word_enrichment',
        'strict': True,
        'schema': {
            'type': 'object',
            'properties': {
                'example_korean': {'type': 'string'},
                'example_english': {'type': 'string'},
                'usage_note': {'type': 'string'},
                'confidence': {'type': 'string', 'enum': ['high', 'review']},
            },
            'required': ['example_korean', 'example_english', 'usage_note', 'confidence'],
            'additionalProperties': False,
        },
    },
}

client = OpenAI()

def enrich(item):
    prompt = f'''You are a careful Korean language curriculum editor. Enrich exactly one learner vocabulary record.

Korean: {item['korean']}
English meaning(s): {item['meaning']}
Part of speech: {item['part_of_speech']}

Return JSON only. Write one short, natural Korean example sentence that clearly demonstrates the supplied meaning. Use polite everyday Korean (해요체) unless the word itself is a fixed expression or grammar requires another form. Include an accurate English translation. Add one concise usage note in English (maximum 25 words), especially if the word is formal, context-sensitive, a counter, a homonym, or has multiple senses. Never invent a meaning that is not supplied. If the source meaning or example needs human review, set confidence to review; still provide your best safe example.'''
    for attempt in range(3):
        try:
            r = client.chat.completions.create(
                model='gpt-5-mini',
                messages=[
                    {'role': 'system', 'content': 'You produce accurate Korean learning content. Output only the requested JSON.'},
                    {'role': 'user', 'content': prompt},
                ],
                max_completion_tokens=800,
                extra_body={'reasoning': {'effort': 'minimal'}},
                response_format=schema,
            )
            content = r.choices[0].message.content
            if not content:
                raise ValueError(f'empty model content; finish_reason={r.choices[0].finish_reason}')
            data = json.loads(content)
            data.update({'id': item['id'], 'korean': item['korean'], 'meaning': item['meaning'], 'romanization': item['romanization'], 'part_of_speech': item['part_of_speech']})
            if not re.search(r'[가-힣]', data['example_korean']): raise ValueError('example lacks Hangul')
            if not data['example_english'].strip(): raise ValueError('missing English')
            return data
        except Exception as exc:
            if attempt == 2:
                return {'id': item['id'], 'korean': item['korean'], 'meaning': item['meaning'], 'romanization': item['romanization'], 'part_of_speech': item['part_of_speech'], 'example_korean': '', 'example_english': '', 'usage_note': f'Enrichment failed: {exc}', 'confidence': 'review'}

existing = {}
if OUTPUT.exists():
    try:
        existing = {x['id']: x for x in json.loads(OUTPUT.read_text(encoding='utf-8'))}
    except Exception:
        existing = {}

results = dict(existing)
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = {pool.submit(enrich, item): item for item in records if item['id'] not in results or not results[item['id']].get('example_korean')}
    for i, future in enumerate(as_completed(futures), 1):
        item = futures[future]
        results[item['id']] = future.result()
        if i % 20 == 0:
            OUTPUT.write_text(json.dumps(list(results.values()), ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'enriched {i}/{len(futures)}', flush=True)

ordered = [results[item['id']] for item in records]
OUTPUT.write_text(json.dumps(ordered, ensure_ascii=False, indent=2), encoding='utf-8')
review = sum(x.get('confidence') == 'review' or not x.get('example_korean') for x in ordered)
print(f'completed {len(ordered)} records; review flagged {review}; output {OUTPUT}')
