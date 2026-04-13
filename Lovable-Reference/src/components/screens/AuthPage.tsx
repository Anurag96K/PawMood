import React, { useState } from "react";
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  ArrowLeft,
  Check,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AuthView = "login" | "signup" | "forgotPassword";

interface AuthPageProps {
  onAuthenticated: () => void;
  onNewSignup?: () => void;
}

export function AuthPage({ onAuthenticated, onNewSignup }: AuthPageProps) {
  const [view, setView] = useState<AuthView>("login");
  const { isAuthenticated } = useAuth();

  // Auto-redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  return (
    <div className="min-h-full bg-background flex flex-col">
      {view === "login" && (
        <LoginView
          onSignUp={() => setView("signup")}
          onForgotPassword={() => setView("forgotPassword")}
          onSuccess={onAuthenticated}
        />
      )}
      {view === "signup" && (
        <SignUpView
          onLogin={() => setView("login")}
          onSuccess={() => {
            onNewSignup?.();
            onAuthenticated();
          }}
        />
      )}
      {view === "forgotPassword" && (
        <ForgotPasswordView
          onBack={() => setView("login")}
        />
      )}
    </div>
  );
}

// Login View
function LoginView({ 
  onSignUp, 
  onForgotPassword,
  onSuccess 
}: { 
  onSignUp: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const isEmail = identifier.includes("@");
  const identifierIcon = isEmail ? Mail : Phone;

  const handleLogin = async () => {
    setError("");
    
    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!isEmail) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    const { error: signInError } = await signIn(identifier, password);
    
    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Please verify your email before signing in");
      } else {
        setError(signInError.message);
      }
      setIsLoading(false);
      return;
    }
    
    toast.success("Welcome back!");
    setIsLoading(false);
    onSuccess();
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-10 pb-6">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">🐾</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Welcome Back!</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Sign in to continue to PetMood</p>
      </div>

      {/* Form */}
      <div className="space-y-3 mb-4">
        {/* Email Input */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
          <div className="relative">
            {React.createElement(identifierIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" })}
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-10 pl-10 pr-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-10 pl-10 pr-10 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-destructive text-center mb-3">{error}</p>
      )}

      {/* Forgot Password */}
      <button
        onClick={onForgotPassword}
        className="text-xs text-primary font-medium mb-4 self-end"
      >
        Forgot Password?
      </button>

      {/* Login Button */}
      <Button onClick={handleLogin} disabled={isLoading} className="w-full h-10 text-sm">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Social Login */}
      <div className="space-y-2 mb-6">
        <Button variant="outline" className="w-full h-10 text-sm" disabled>
          <span className="text-base mr-1.5">🍎</span>
          Continue with Apple
        </Button>
        <Button variant="outline" className="w-full h-10 text-sm" disabled>
          <span className="text-base mr-1.5">G</span>
          Continue with Google
        </Button>
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={onSignUp} className="text-primary font-semibold">
          Sign Up
        </button>
      </p>
    </div>
  );
}

// Sign Up View
function SignUpView({ 
  onLogin, 
  onSuccess 
}: { 
  onLogin: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signUp } = useAuth();

  const isValidEmail = email.includes("@") && email.includes(".");
  const isValidPassword = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const isValidDOB = dateOfBirth.length > 0;

  const canSubmit = isValidEmail && 
                    isValidPassword && 
                    passwordsMatch && 
                    isValidDOB && 
                    agreeToTerms;

  const handleSignUp = async () => {
    setError("");
    
    if (!canSubmit) {
      setError("Please fill in all fields correctly");
      return;
    }
    
    setIsLoading(true);

    const { error: signUpError } = await signUp(email, password, {
      date_of_birth: dateOfBirth,
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("This email is already registered. Please sign in.");
      } else {
        setError(signUpError.message);
      }
      setIsLoading(false);
      return;
    }

    toast.success("Account created successfully!");
    setIsLoading(false);
    onSuccess();
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-8 pb-6 overflow-y-auto">
      {/* Header */}
      <button
        onClick={onLogin}
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-3 hover:bg-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-foreground" />
      </button>

      <h1 className="text-xl font-bold text-foreground mb-0.5">Create Account</h1>
      <p className="text-xs text-muted-foreground mb-4">Join PetMood and start analyzing your pet's mood!</p>

      {/* Form */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-10 pl-10 pr-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {email && !isValidEmail && (
            <p className="text-[10px] text-destructive mt-0.5">Please enter a valid email</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Date of Birth</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full h-10 pl-10 pr-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full h-10 pl-10 pr-10 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && !isValidPassword && (
            <p className="text-[10px] text-destructive mt-0.5">Password must be at least 8 characters</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full h-10 pl-10 pr-10 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-[10px] text-destructive mt-0.5">Passwords do not match</p>
          )}
        </div>
      </div>

      {/* Terms Agreement */}
      <label className="flex items-start gap-2 mb-4 cursor-pointer">
        <button
          type="button"
          onClick={() => setAgreeToTerms(!agreeToTerms)}
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border-2",
            agreeToTerms ? "bg-primary border-primary" : "border-border"
          )}
        >
          {agreeToTerms && <Check className="w-3 h-3 text-primary-foreground" />}
        </button>
        <span className="text-xs text-muted-foreground">
          I agree to the <span className="text-primary">Terms of Service</span> and{" "}
          <span className="text-primary">Privacy Policy</span>
        </span>
      </label>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-destructive text-center mb-3">{error}</p>
      )}

      {/* Sign Up Button */}
      <Button 
        onClick={handleSignUp} 
        disabled={!canSubmit || isLoading} 
        className="w-full h-10 text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Login Link */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        Already have an account?{" "}
        <button onClick={onLogin} className="text-primary font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
}

// Forgot Password View
function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async () => {
    setError("");
    
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    const { error: resetError } = await resetPassword(email);
    
    if (resetError) {
      setError(resetError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setSent(true);
    toast.success("Password reset email sent!");
  };

  if (sent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Check your email</h2>
        <p className="text-xs text-muted-foreground text-center mb-6">
          We've sent a password reset link to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
        <Button onClick={onBack} className="w-full max-w-xs h-10 text-sm">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 pt-8 pb-6">
      {/* Header */}
      <button
        onClick={onBack}
        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-4 hover:bg-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-foreground" />
      </button>

      <h1 className="text-xl font-bold text-foreground mb-0.5">Forgot Password?</h1>
      <p className="text-xs text-muted-foreground mb-4">
        No worries! Enter your email and we'll send you a reset link.
      </p>

      {/* Input */}
      <div className="mb-4">
        <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full h-10 pl-10 pr-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-destructive text-center mb-3">{error}</p>
      )}

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit} 
        disabled={isLoading || !email} 
        className="w-full h-10 text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      {/* Back to Login */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        Remember your password?{" "}
        <button onClick={onBack} className="text-primary font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
}
