const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = {};
for (const raw of fs.readFileSync('.env.local','utf8').split(/\r?\n/)) {
  const line = raw.replace(/^\uFEFF/, '').trim();
  if (!line || !line.includes('=')) continue;
  const i = line.indexOf('=');
  env[line.slice(0,i)] = line.slice(i+1);
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false }});
(async () => {
  const profiles = await admin.from('profiles').select('*').limit(1);
  const contents = await admin.from('course_contents').select('*').limit(1);
  console.log('profiles', profiles.error?.message || profiles.data?.length);
  console.log('contents', contents.error?.message || contents.data?.length);
  if (!profiles.data?.[0] || !contents.data?.[0]) return;
  const p = profiles.data[0];
  const c = contents.data[0];
  const r = await anon.rpc('add_content_comment_with_code', {
    p_profile_id: p.id,
    p_edit_code: p.edit_code,
    p_content_id: c.id,
    p_body: 'debug comment'
  });
  console.log('rpc error', r.error && { message: r.error.message, code: r.error.code, details: r.error.details });
  console.log('rpc ok', !r.error);
})();
