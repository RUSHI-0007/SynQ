import { createClerkClient } from '@clerk/backend';
import { env } from './apps/server/src/config/env';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

async function check() {
  const users = await clerkClient.users.getUserList();
  if (users.data.length === 0) return console.log("No users found");
  
  const user = users.data[0];
  console.log("Checking user:", user.id);
  
  const tokens = await clerkClient.users.getUserOauthAccessToken(user.id, 'oauth_github');
  console.log("Token data:", JSON.stringify(tokens.data, null, 2));
}

check().catch(console.error);
