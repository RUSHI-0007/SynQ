import { createClerkClient } from '@clerk/backend';
import { env } from '../config/env';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

async function run() {
  try {
    const res = await clerkClient.users.getUserOauthAccessToken('user_id', 'oauth_github');
    console.log(res);
  } catch (err: any) {
    console.error(err);
  }
}

run();
