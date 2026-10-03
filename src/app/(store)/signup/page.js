import SignupForm from './SignupForm';
import { safeNext } from '@/lib/safe-next';

export const metadata = {
  title: 'Create an account',
  robots: { index: false, follow: false },
};

export default function SignupPage({ searchParams }) {
  const next = safeNext(searchParams?.next, '/account');

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Save your delivery details, keep your order history and track every parcel.
        </p>

        <div className="mt-6">
          <SignupForm next={next} />
        </div>

        <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          We only use your number to confirm orders on WhatsApp. No spam, and you can
          keep ordering as a guest if you prefer.
        </p>
      </div>
    </div>
  );
}
