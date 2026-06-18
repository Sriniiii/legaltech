import { HelpCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TokenNotFound() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto border border-red-500/20">
          <HelpCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invalid Link</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The secure access link is invalid or could not be found. It may be malformed or already deactivated.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-start gap-2 text-left border">
          <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            Verify the exact URL you copied from your email invitation. Make sure no characters are missing from the end.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
