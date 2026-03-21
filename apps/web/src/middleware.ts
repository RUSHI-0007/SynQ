import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes under (auth) group that require a valid Clerk session
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
]);

export default clerkMiddleware();

export const config = {
  runtime: 'nodejs',
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
