import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PayHereHiddenForm } from '../components/PaymentForm';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import DonateStepIndicator from '../../../components/donate/DonateStepIndicator';
import DonateStepAmount    from '../../../components/donate/DonateStepAmount';
import DonateStepDetails   from '../../../components/donate/DonateStepDetails';
import DonateStepReview    from '../../../components/donate/DonateStepReview';
import { getSingleCampaignApi } from '../../campaigns/api';
import api from '../../../lib/axios';

export default function DonatePage() {
  const { id: campaignId } = useParams();
  const formRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [campaign, setCampaign]       = useState(null);

  // Step 1 – amount
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount]     = useState('');
  const [useCustom, setUseCustom]           = useState(false);

  // Step 2 – donor info
  const [donorInfo, setDonorInfo] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address: '', city: '',
  });

  const [errors, setErrors]         = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  const finalAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount;

  // Fetch campaign title
  useEffect(() => {
    if (!campaignId) return;
    getSingleCampaignApi(campaignId)
      .then((res) => setCampaign(res?.data || null))
      .catch(console.error);
  }, [campaignId]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (finalAmount < 50) {
      setErrors({ amount: 'Minimum donation amount is LKR 50' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const e = {};
    if (!donorInfo.firstName.trim()) e.firstName = 'First name is required';
    if (!donorInfo.lastName.trim())  e.lastName  = 'Last name is required';
    if (!donorInfo.email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(donorInfo.email)) e.email = 'Enter a valid email';
    if (!donorInfo.phone.trim())     e.phone    = 'Phone number is required';
    if (!donorInfo.address.trim())   e.address  = 'Address is required';
    if (!donorInfo.city.trim())      e.city     = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step navigation ─────────────────────────────────────────────────────────
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handlePrevStep = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    setErrors({});
  };

  const handleProceedToPayment = () => {
    setIsSubmitting(true);
    setSubmissionError('');
    api.post('/payment/checkout', { campaignId, amount: finalAmount })
      .then(({ data }) => setCheckout(data))
      .catch((error) => {
        setSubmissionError(
          error.response?.data?.message || 'Unable to start your payment. Please try again.',
        );
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    if (checkout && formRef.current) formRef.current.submit();
  }, [checkout]);

  const updateDonorInfo = (field, value) => {
    setDonorInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
      <Header />

      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Back link */}
          <Link
            to={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-8 no-underline group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Campaign
          </Link>

          {/* Page title */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-teal-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Secure Donation
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Make a Difference</h1>
            {campaign && (
              <p className="text-slate-500 text-base">
                Supporting: <span className="font-semibold text-teal-700">{campaign.title}</span>
              </p>
            )}
          </div>

          {/* Step indicator */}
          <DonateStepIndicator currentStep={currentStep} />

          {/* Step card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden animate-slide-in-up">

            {currentStep === 1 && (
              <DonateStepAmount
                selectedAmount={selectedAmount}
                setSelectedAmount={setSelectedAmount}
                customAmount={customAmount}
                setCustomAmount={setCustomAmount}
                useCustom={useCustom}
                setUseCustom={setUseCustom}
                finalAmount={finalAmount}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {currentStep === 2 && (
              <DonateStepDetails
                donorInfo={donorInfo}
                updateDonorInfo={updateDonorInfo}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <DonateStepReview
                finalAmount={finalAmount}
                donorInfo={donorInfo}
                campaign={campaign}
              />
            )}

            {/* Navigation buttons */}
            <div className={`px-8 pb-8 flex gap-3 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all duration-200"
                >
                  ← Back
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  id={`step-${currentStep}-next`}
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 shadow-md shadow-teal-200 hover:shadow-lg hover:shadow-teal-300 transition-all duration-200"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  id="proceed-to-payment"
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-10 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Proceed to Payment
                    </>
                  )}
                </button>
              )}
            </div>
            {submissionError && (
              <p role="alert" className="px-8 pb-6 text-sm text-red-600">
                {submissionError}
              </p>
            )}
          </div>

          {/* Bottom legal note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            By proceeding, you agree to our{' '}
            <Link to="/terms-privacy" className="text-teal-600 hover:underline no-underline">
              Terms & Privacy Policy
            </Link>.
            {' '}You will be redirected to PayHere's secure payment gateway.
          </p>
        </div>
      </main>

      {/* Hidden PayHere form – submitted programmatically on step 3 */}
      <PayHereHiddenForm
        formRef={formRef}
        checkout={checkout}
        firstName={donorInfo.firstName}
        lastName={donorInfo.lastName}
        email={donorInfo.email}
        phone={donorInfo.phone}
        address={donorInfo.address}
        city={donorInfo.city}
      />

      <Footer />
    </div>
  );
}
