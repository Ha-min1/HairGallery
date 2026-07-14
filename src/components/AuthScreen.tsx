import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { User as UserType, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onBackToLanding: () => void;
  lang?: 'ko' | 'en';
}

export default function AuthScreen({ onLoginSuccess, onBackToLanding, lang = 'ko' }: AuthScreenProps) {
  const isKo = lang === 'ko';

  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState<string>('');

  // Google Login flow step: complete profile (phone number request)
  const [isGoogleStep, setIsGoogleStep] = useState<boolean>(false);
  const [googleUserTemp, setGoogleUserTemp] = useState<{ id: string; email: string; name: string } | null>(null);
  const [googlePhone, setGooglePhone] = useState<string>('');

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(isKo ? '이메일과 비밀번호를 모두 입력해주시기 바랍니다.' : 'Please provide both email and password.');
      return;
    }

    if (isRegisterMode && !name) {
      setError(isKo ? '고객님의 이름을 입력해주세요.' : 'Please provide your name.');
      return;
    }

    // Special quick role assignment for demo purposes: admin@hairgallery.com is ADMIN
    const resolvedRole: UserRole = email.toLowerCase() === 'admin@hairgallery.com' ? 'ADMIN' : role;

    const dummyUser: UserType = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      name: isRegisterMode ? name : (resolvedRole === 'ADMIN' ? (isKo ? '엘레나 로스토바 원장' : 'Elena Rostova') : name || (isKo ? '소중한 고객' : 'Valued Guest')),
      role: resolvedRole,
      phone: isRegisterMode ? phone : (resolvedRole === 'ADMIN' ? '010-9844-1234' : '010-1234-5678'),
      provider: 'credentials',
      createdAt: new Date().toISOString()
    };

    onLoginSuccess(dummyUser);
  };

  const handleGoogleLoginStart = () => {
    setError('');
    // Prompt Google sign-in details
    // Mocking an official Google popup success, then directing to profile completeness if first login
    const randomNamesKo = ['이지원', '박태양', '최민주', '김하늘'];
    const randomNamesEn = ['Isabella Vance', 'Liam Brody', 'Sienna Hayes', 'Julian Frost'];
    const chosenName = isKo 
      ? randomNamesKo[Math.floor(Math.random() * randomNamesKo.length)]
      : randomNamesEn[Math.floor(Math.random() * randomNamesEn.length)];
    const simulatedEmail = `${chosenName === '이지원' ? 'jiwon.lee' : 'google.user' + Math.floor(Math.random() * 100)}@gmail.com`;

    setGoogleUserTemp({
      id: 'u-g-' + Math.random().toString(36).substr(2, 9),
      email: simulatedEmail,
      name: chosenName
    });
    
    // Switch to profile-completion step to prompt for Phone number
    setIsGoogleStep(true);
  };

  const handleGoogleProfileCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePhone) {
      setError(isKo ? '실시간 스케줄 예약과 알림 발송을 위해 휴대폰 연락처가 꼭 필요합니다.' : 'A contact phone number is required to complete your reservation profile.');
      return;
    }

    if (!googleUserTemp) return;

    const finalGoogleUser: UserType = {
      id: googleUserTemp.id,
      email: googleUserTemp.email,
      name: googleUserTemp.name,
      role: 'USER',
      phone: googlePhone,
      provider: 'google',
      createdAt: new Date().toISOString()
    };

    onLoginSuccess(finalGoogleUser);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FBFBFA] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Artworks */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-100 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-200/50 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded border border-stone-200 shadow-xl relative animate-fadeIn">
        
        {/* Close/Back button */}
        <button
          onClick={onBackToLanding}
          className="absolute top-4 right-4 text-[10px] font-mono font-bold text-stone-400 hover:text-[#1A1A1A] transition-colors cursor-pointer"
        >
          {isKo ? '✕ 닫기' : '✕ CLOSE'}
        </button>

        {/* Section 1: Google Profile Completion Prompt */}
        {isGoogleStep ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded text-xs font-semibold text-[#BFA181] mb-3 border border-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isKo ? '구글 계정이 안전하게 연동되었습니다' : 'Google Account Connected'}</span>
              </div>
              <h2 className="font-serif text-2xl font-normal text-stone-900">
                {isKo ? '예약 필수 프로필 작성' : 'Complete Your Profile'}
              </h2>
              <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed font-light">
                {isKo ? (
                  <>
                    환영합니다, <span className="font-bold text-[#1A1A1A]">{googleUserTemp?.name}</span>님! 실시간 스케줄 관리 및 시술 예약 완료 확인 문자를 받기 위해 휴대폰 전화번호를 입력해주십시오.
                  </>
                ) : (
                  <>
                    Welcome, <span className="font-bold text-stone-800">{googleUserTemp?.name}</span>! For reservation tracking and confirmation messages, we require a mobile phone number.
                  </>
                )}
              </p>
            </div>

            <form onSubmit={handleGoogleProfileCompleteSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                  {isKo ? '휴대폰 연락처 번호 *' : 'Contact Phone Number *'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone-400" />
                  <input
                    type="tel"
                    value={googlePhone}
                    onChange={(e) => setGooglePhone(e.target.value)}
                    placeholder={isKo ? '010-1234-5678' : '+1 (555) 000-0000'}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-stone-200 hover:border-stone-400 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 font-light">
                  {isKo ? '※ 작성하신 연락처로 시술 알림 및 승인 현황을 실시간 문자로 발송해 드립니다.' : 'We will send appointment alerts and status updates to this number.'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1A1A1A] hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-widest rounded shadow-md transition-all duration-200 cursor-pointer"
              >
                <span>{isKo ? '프로필 설정 완료 및 로그인' : 'Finalize Log In'}</span>
                <ArrowRight className="h-4 w-4 text-[#BFA181]" />
              </button>
            </form>

            <button
              onClick={() => {
                setIsGoogleStep(false);
                setGoogleUserTemp(null);
                setGooglePhone('');
              }}
              className="w-full text-center text-xs text-stone-400 hover:text-stone-700 transition-colors cursor-pointer font-bold"
            >
              {isKo ? '취소하고 뒤로 가기' : 'Cancel & Back to login'}
            </button>
          </div>
        ) : (
          /* Section 2: Standard Login / Registration */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="font-mono text-[9px] tracking-widest text-[#BFA181] font-bold uppercase block">
                {isKo ? '더 헤어 갤러리 멤버쉽' : 'THE GALLERY GATEWAY'}
              </span>
              <h2 className="font-serif text-2xl font-normal text-stone-900">
                {isRegisterMode ? (isKo ? '신규 게스트 계정 등록' : 'Create Guest Account') : (isKo ? '웰컴백! 로그인' : 'Welcome Back')}
              </h2>
              <p className="text-xs text-stone-400 font-light max-w-sm mx-auto leading-relaxed">
                {isRegisterMode
                  ? (isKo ? '갤러리 서클 멤버에 등록하고 손쉬운 시술 예약, 비스포크 헤어 케어 기록 서비스를 누려보세요.' : 'Join our circle to schedule bespoke styling sessions and track custom recipes.')
                  : (isKo ? '로그인하여 예정된 헤어 예약 스케줄을 변경하고 과거 스타일 히스토리를 확인하세요.' : 'Log in to manage upcoming reservations and access past service files.')}
              </p>
            </div>

            {/* Standard Login Buttons / Tabs */}
            <div className="grid grid-cols-2 gap-1 border border-stone-100 p-0.5 rounded bg-stone-100/50">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                }}
                className={`py-2 text-xs font-bold uppercase rounded tracking-wider transition-all duration-200 cursor-pointer ${
                  !isRegisterMode ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {isKo ? '로그인' : 'Sign In'}
              </button>
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setError('');
                }}
                className={`py-2 text-xs font-bold uppercase rounded tracking-wider transition-all duration-200 cursor-pointer ${
                  isRegisterMode ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {isKo ? '신규 회원가입' : 'Register'}
              </button>
            </div>

            {/* Google Authentication (Simulated) */}
            <div>
              <button
                onClick={handleGoogleLoginStart}
                className="w-full flex items-center justify-center gap-3 py-3 border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 rounded text-stone-700 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm cursor-pointer"
                id="google-login-btn"
              >
                {/* Custom Google SVG */}
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{isKo ? '구글 계정으로 연동 로그인' : 'Continue with Google'}</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest text-stone-400 bg-white px-3">
                  <span>{isKo ? '또는 일반 가입 이메일 로그인' : 'Or credentials'}</span>
                </div>
              </div>
            </div>

            {/* Email/Password Credentials Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {isRegisterMode && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                    {isKo ? '고객 성함 *' : 'Your Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isKo ? '홍길동' : 'Genevieve Dupre'}
                      required={isRegisterMode}
                      className="w-full pl-11 pr-4 py-2.5 border border-stone-200 hover:border-stone-400 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                  {isKo ? '이메일 주소 *' : 'Email Address *'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-2.5 border border-stone-200 hover:border-stone-400 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                  />
                </div>
              </div>

              {isRegisterMode && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                    {isKo ? '휴대폰 연락처 번호 *' : 'Mobile Phone Number *'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isKo ? '010-1234-5678' : '+1 (555) 000-0000'}
                      required={isRegisterMode}
                      className="w-full pl-11 pr-4 py-2.5 border border-stone-200 hover:border-stone-400 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                  {isKo ? '비밀번호 *' : 'Secure Password *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-4 py-2.5 border border-stone-200 hover:border-stone-400 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                  />
                </div>
              </div>

              {isRegisterMode && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                    {isKo ? '가상 계정 역할 지정 (데모 시뮬레이션용)' : 'Account Role (Demo Selection)'}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full py-2.5 px-3 border border-stone-200 hover:border-stone-400 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all cursor-pointer font-bold"
                  >
                    <option value="USER">{isKo ? '일반 단골 고객 권한 (스케줄 예약)' : 'Standard Client Profile'}</option>
                    <option value="ADMIN">{isKo ? '엘레나 원장 권한 (관리자 전체보기)' : 'Elena - Salon Owner (Admin View)'}</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1A1A1A] hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-widest rounded shadow-md transition-all duration-200 cursor-pointer"
                id="submit-auth-btn"
              >
                <span>{isRegisterMode ? (isKo ? '계정 가입 완료하기' : 'Complete Registration') : (isKo ? '안전 로그인하기' : 'Secure Sign In')}</span>
                <ArrowRight className="h-4 w-4 text-[#BFA181]" />
              </button>
            </form>

            <div className="text-center pt-3 border-t border-stone-100">
              <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                {isKo ? '원클릭 빠른 가상 테스트 계정:' : 'Quick Demo Accounts:'} <br />
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@hairgallery.com');
                    setPassword('password123');
                    setIsRegisterMode(false);
                  }}
                  className="text-[#BFA181] font-bold hover:underline"
                >
                  {isKo ? '엘레나 원장 (관리자 권한)' : 'Elena (Admin / Salon Owner)'}
                </button>
                {' • '}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('client.clara@gmail.com');
                    setPassword('password123');
                    setName(isKo ? '김선영' : 'Clara Mercer');
                    setIsRegisterMode(false);
                  }}
                  className="text-stone-500 font-bold hover:underline ml-1"
                >
                  {isKo ? '김선영 (고객 회원 권한)' : 'Clara (Regular Client)'}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
