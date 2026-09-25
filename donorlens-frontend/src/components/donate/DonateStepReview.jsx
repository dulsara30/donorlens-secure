import { formatCurrency } from '../../features/payments/helpers';

export default function DonateStepReview({ finalAmount, donorInfo, campaign }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Review Your Donation</h2>
      <p className="text-sm text-slate-500 mb-8">Please confirm your details before proceeding to payment.</p>

      {/* Amount highlight banner */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-6 text-white text-center">
        <p className="text-teal-100 text-sm font-medium mb-1">Donation Amount</p>
        <p className="text-4xl font-bold">{formatCurrency(finalAmount)}</p>
        {campaign && (
          <p className="text-teal-100 text-xs mt-2 truncate">For: {campaign.title}</p>
        )}
      </div>

      {/* Donor details summary */}
      <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Donor Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-slate-500">Name</span>
          <span className="font-medium text-slate-800 text-right">
            {donorInfo.firstName} {donorInfo.lastName}
          </span>

          <span className="text-slate-500">Email</span>
          <span className="font-medium text-slate-800 text-right truncate">{donorInfo.email}</span>

          <span className="text-slate-500">Phone</span>
          <span className="font-medium text-slate-800 text-right">{donorInfo.phone}</span>

          <span className="text-slate-500">Address</span>
          <span className="font-medium text-slate-800 text-right">{donorInfo.address}</span>

          <span className="text-slate-500">City</span>
          <span className="font-medium text-slate-800 text-right">{donorInfo.city}</span>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-400 mb-2">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          SSL Secured
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Powered by PayHere
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          100% to Cause
        </div>
      </div>
    </div>
  );
}
