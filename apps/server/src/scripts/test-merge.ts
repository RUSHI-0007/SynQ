import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Resolve from apps/server to the root .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const projectId = 'test-project-123';
  const authorId = 'user_alice';
  const teammateId = 'user_bob';

  console.log('1️⃣ Seeding project teammates (Alice & Bob)...');
  await supabase.from('project_teammates').upsert([
    { project_id: projectId, user_id: authorId, role: 'owner' },
    { project_id: projectId, user_id: teammateId, role: 'member' }
  ]);
  console.log('✅ Teammates seeded.');

  console.log('\n2️⃣ Creating a Merge Request as Alice...');
  const proposeRes = await fetch('http://localhost:4000/api/merge/propose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      authorId,
      commitMessage: 'Test Consensus Merge 🚀',
      diffPayload: 'console.log("Hello Hackathon");',
      filesChanged: ['src/index.js'],
      githubOwner: 'hackathon-accelerator', 
      githubRepo: 'test-repo' // Will fail GitHub API, but we want to see it reach that point
    })
  });
  
  const proposal = await proposeRes.json();
  if (!proposeRes.ok) throw new Error(`Propose failed: ${JSON.stringify(proposal)}`);
  console.log('✅ Proposal created:', proposal.id);

  console.log('\n3️⃣ Alice votes Approve...');
  const vote1Res = await fetch('http://localhost:4000/api/merge/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: proposal.id, userId: authorId, decision: 'approve' })
  });
  const vote1 = await vote1Res.json();
  console.log('✅ Alice vote response:', vote1.consensus ? 'CONSENSUS HIT' : 'Pending...');

  console.log('\n4️⃣ Bob votes Approve (Should trigger GitHub push)...');
  const vote2Res = await fetch('http://localhost:4000/api/merge/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: proposal.id, userId: teammateId, decision: 'approve' })
  });
  
  const vote2 = await vote2Res.json();
  console.log('✅ Final Outcome:', vote2);
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
