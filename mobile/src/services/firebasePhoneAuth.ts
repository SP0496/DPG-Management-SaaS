import {
  getAuth,
  getIdToken,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
  verifyPhoneNumber,
} from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { isValidIndianMobile, isValidOtp } from '../utils/validation';

export type PhoneConfirmationHandle = FirebaseAuthTypes.ConfirmationResult;

function getFirebaseAuthInstance(): FirebaseAuthTypes.Module {
  try {
    return getAuth();
  } catch {
    throw new Error(
      'Firebase Phone Authentication is unavailable in this runtime. Build the Android development client with google-services.json configured.'
    );
  }
}

export function formatIndianPhoneE164(phone10Digits: string): string {
  const digits = phone10Digits.replace(/\D/g, '');
  if (!isValidIndianMobile(digits)) {
    throw new Error('Enter a valid 10-digit Indian mobile number starting with 6-9.');
  }
  return `+91${digits}`;
}

export function mapFirebasePhoneError(error: unknown): string {
  const errObj = error as { code?: string; message?: string } | null;
  const code = errObj?.code ?? '';

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid Indian mobile number. Please verify the 10 digits and try again.';
    case 'auth/missing-phone-number':
      return 'Please enter your +91 mobile number.';
    case 'auth/too-many-requests':
      return 'Too many OTP attempts from this device. Please wait a few minutes and try again.';
    case 'auth/quota-exceeded':
      return 'SMS OTP quota exceeded temporarily. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'Invalid 6-digit OTP code. Please check the SMS and retry.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'Your OTP session has expired. Tap Resend OTP to receive a fresh code.';
    case 'auth/network-request-failed':
      return 'Network error while reaching Firebase Authentication. Check your internet connection.';
    case 'auth/app-not-authorized':
    case 'auth/missing-client-identifier':
      return 'Android app SHA-1 / SHA-256 or Play Integrity configuration is missing in Firebase.';
    default:
      if (errObj?.message && !errObj.message.includes('Native module')) {
        return errObj.message;
      }
      return 'Unable to complete Firebase mobile verification. Please try again.';
  }
}

export async function sendFirebasePhoneOtp(
  phone10Digits: string,
  forceResend = false
): Promise<PhoneConfirmationHandle> {
  const e164Phone = formatIndianPhoneE164(phone10Digits);
  const authInstance = getFirebaseAuthInstance();
  try {
    if (!forceResend) {
      return await signInWithPhoneNumber(authInstance, e164Phone);
    }

    const snapshot = await verifyPhoneNumber(authInstance, e164Phone, 60, true);
    if (snapshot?.error) {
      throw snapshot.error;
    }
    const verificationId = snapshot.verificationId;
    return {
      verificationId,
      confirm: async (verificationCode: string) => {
        const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
        return signInWithCredential(authInstance, credential);
      },
    };
  } catch (error) {
    throw new Error(mapFirebasePhoneError(error));
  }
}

export async function confirmFirebaseOtpAndGetIdToken(
  confirmation: PhoneConfirmationHandle | null,
  otp: string
): Promise<string> {
  if (!confirmation) {
    throw new Error('OTP session expired or not initialized. Request a new OTP.');
  }
  if (!isValidOtp(otp)) {
    throw new Error('Enter the valid 6-digit numeric OTP sent to your mobile.');
  }
  try {
    const credential = await confirmation.confirm(otp.trim());
    const authInstance = getFirebaseAuthInstance();
    const firebaseUser = credential?.user ?? authInstance.currentUser;
    if (!firebaseUser) {
      throw new Error('Firebase verification did not yield an authenticated user session.');
    }
    const idToken = await getIdToken(firebaseUser, true);
    if (!idToken) {
      throw new Error('Unable to retrieve Firebase ID token after verification.');
    }
    return idToken;
  } catch (error) {
    throw new Error(mapFirebasePhoneError(error));
  }
}

export async function signOutFirebaseAuth(): Promise<void> {
  try {
    const instance = getFirebaseAuthInstance();
    if (instance.currentUser) {
      await signOut(instance);
    }
  } catch {
    // Ignore cleanup signout failures in non-native environments
  }
}
