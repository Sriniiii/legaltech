import { Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TokenExpired() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="p-3 bg-amber-500/10 rounded-full w-fit mx-auto border border-amber-500/20">
          <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Link Expired</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The secure access token in your link has expired. For security, invitations are only valid for 7 days.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-start gap-2 text-left border">
          <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            Please request the landlord to reissue a new invitation from their dashboard. This will generate a fresh token.
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
